/**
 * Reject all pending/processing swaps and refund DLX if deducted.
 *
 * Safe behavior:
 * - Marks swap transactions (type: 'swap') with status in ['pending','processing'] as 'rejected'.
 * - If a related swap request exists, marks it 'failed'.
 * - Refunds DLX ONLY when a reliable flag is present: tx.deducted === true OR swapRequest.deducted === true.
 * - Uses Firestore transactions to ensure atomicity per swap.
 *
 * Run:
 *   node scripts/rejectPendingSwapsAndRefund.js
 */

require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin
let serviceAccount = null;
const saStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (saStr) {
  try {
    serviceAccount = JSON.parse(saStr);
    if (serviceAccount?.private_key?.includes('\\n')) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } catch {}
}

const credential = (serviceAccount && typeof serviceAccount.project_id === 'string')
  ? admin.credential.cert(serviceAccount)
  : admin.credential.applicationDefault();

if (!admin.apps.length) {
  admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id,
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://digilinex-a80a9-default-rtdb.firebaseio.com'
  });
}

const firestore = admin.firestore();

async function rejectPendingSwapsAndRefund() {
  console.log('🚀 Starting: Reject pending/processing swaps and refund DLX when deducted');

  const walletsSnap = await firestore.collection('wallets').get();
  console.log(`📦 Wallets to scan: ${walletsSnap.size}`);

  let processed = 0;
  let refunded = 0;
  let rejectedOnly = 0;
  let errors = 0;

  for (const walletDoc of walletsSnap.docs) {
    const userId = walletDoc.id;
    const txCol = walletDoc.ref.collection('transactions');

    const pendingSnap = await txCol
      .where('type', '==', 'swap')
      .where('status', 'in', ['pending', 'processing'])
      .get()
      .catch(async (e) => {
        // Some Firestore plans may not support 'in' queries; fallback to two queries
        const pending = await txCol.where('type', '==', 'swap').where('status', '==', 'pending').get();
        const processing = await txCol.where('type', '==', 'swap').where('status', '==', 'processing').get();
        return { docs: [...pending.docs, ...processing.docs] };
      });

    if (pendingSnap.empty) continue;

    for (const txDoc of pendingSnap.docs) {
      try {
        await firestore.runTransaction(async (tx) => {
          const freshTxDoc = await tx.get(txDoc.ref);
          if (!freshTxDoc.exists) return;
          const txData = freshTxDoc.data();

          if (txData.status !== 'pending' && txData.status !== 'processing') return;

          const swapAmountUsdt = Number(txData.amount || 0);
          const exchangeRate = 0.1;
          const dlxAmount = Number((txData.dlxAmount != null ? txData.dlxAmount : swapAmountUsdt / exchangeRate).toFixed(2));

          // Load swapRequest if available
          let swapRequestSnap = null;
          if (txData.swapRequestId) {
            swapRequestSnap = await tx.get(firestore.collection('swapRequests').doc(txData.swapRequestId));
          }

          const swapRequestData = swapRequestSnap?.exists ? swapRequestSnap.data() : null;

          const shouldRefund = Boolean(txData.deducted) || Boolean(swapRequestData?.deducted === true);

          // Update transaction -> rejected
          tx.update(txDoc.ref, {
            status: 'rejected',
            description: 'Swap auto-rejected during migration. ' + (shouldRefund ? `Refunded ${dlxAmount} DLX.` : 'No funds moved.'),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Update swap request -> failed
          if (swapRequestSnap?.exists && (swapRequestData.status === 'pending' || swapRequestData.status === 'processing')) {
            tx.update(swapRequestSnap.ref, {
              status: 'failed',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }

          if (shouldRefund) {
            // Refund DLX to user's mining balance
            const userRef = firestore.collection('users').doc(userId);
            const userSnap = await tx.get(userRef);
            if (userSnap.exists) {
              const userData = userSnap.data() || {};
              const currentDlx = Number(userData?.wallet?.miningBalance || 0);
              const newDlx = Number((currentDlx + dlxAmount).toFixed(2));
              tx.update(userRef, {
                'wallet.miningBalance': newDlx,
                'wallet.updatedAt': admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
        });

        processed++;
        if (txDoc.get('deducted') === true) refunded++; else rejectedOnly++;
        console.log(`✅ Rejected swap tx ${txDoc.id} for user ${userId}${txDoc.get('deducted') ? ' (refunded DLX)' : ''}`);
      } catch (err) {
        errors++;
        console.error(`❌ Failed rejecting swap tx ${txDoc.id} for user ${userId}:`, err.message);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log(`   Processed: ${processed}`);
  console.log(`   Refunded (flagged deducted): ${refunded}`);
  console.log(`   Rejected only: ${rejectedOnly}`);
  console.log(`   Errors: ${errors}`);
  console.log('='.repeat(60) + '\n');
}

rejectPendingSwapsAndRefund()
  .then(() => {
    console.log('✨ Done');
    process.exit(0);
  })
  .catch((e) => {
    console.error('💥 Script failed:', e);
    process.exit(1);
  });


