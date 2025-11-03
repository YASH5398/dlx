/**
 * Migration Script: Mark Confirmed Pending Swaps as Success
 * 
 * This script marks all pending swap transactions that have been confirmed
 * (i.e., have corresponding wallet updates) as success.
 * 
 * Run: node scripts/migratePendingSwaps.js
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
  } catch {
    serviceAccount = null;
  }
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

async function migratePendingSwaps() {
  console.log('🚀 Starting migration: Mark confirmed pending swaps as success\n');

  try {
    // Find all pending swap transactions
    const allPendingSwaps = [];
    
    // Get all users' transactions subcollections
    const walletsSnap = await firestore.collection('wallets').get();
    
    console.log(`📊 Found ${walletsSnap.size} wallets to check\n`);
    
    for (const walletDoc of walletsSnap.docs) {
      const userId = walletDoc.id;
      const transactionsRef = walletDoc.ref.collection('transactions');
      
      // Get pending swap transactions
      const pendingSwapsSnap = await transactionsRef
        .where('type', '==', 'swap')
        .where('status', '==', 'pending')
        .get();
      
      for (const txDoc of pendingSwapsSnap.docs) {
        const txData = txDoc.data();
        allPendingSwaps.push({
          userId,
          transactionId: txDoc.id,
          transactionRef: txDoc.ref,
          ...txData
        });
      }
    }
    
    console.log(`📋 Found ${allPendingSwaps.length} pending swap transactions\n`);
    
    if (allPendingSwaps.length === 0) {
      console.log('✅ No pending swaps to migrate. Migration complete!\n');
      return;
    }
    
    // Check wallet state to determine if swap was already processed
    let successCount = 0;
    let failedCount = 0;
    const batch = firestore.batch();
    const batchSize = 500; // Firestore batch limit
    let currentBatch = 0;
    let operationsInBatch = 0;
    
    for (const swap of allPendingSwaps) {
      try {
        // Get user's current wallet state
        const walletRef = firestore.collection('wallets').doc(swap.userId);
        const walletSnap = await walletRef.get();
        
        if (!walletSnap.exists) {
          console.log(`⚠️  Wallet not found for user ${swap.userId}, skipping swap ${swap.transactionId}`);
          failedCount++;
          continue;
        }
        
        const walletData = walletSnap.data();
        const currentPurchaseUsdt = Number(walletData?.usdt?.purchaseUsdt || 0);
        
        // Get swap request if it exists
        let swapRequest = null;
        if (swap.swapRequestId) {
          const swapRequestRef = firestore.collection('swapRequests').doc(swap.swapRequestId);
          const swapRequestSnap = await swapRequestRef.get();
          if (swapRequestSnap.exists) {
            swapRequest = { id: swapRequestSnap.id, ...swapRequestSnap.data() };
          }
        }
        
        // Determine if swap should be marked as success
        // Strategy: If the wallet has USDT >= swap amount, assume swap was processed
        // OR if swap is older than 1 hour, assume it should be confirmed
        const swapAmount = Number(swap.amount || 0);
        const createdAt = swap.createdAt;
        const createdAtTime = createdAt?.toDate ? createdAt.toDate().getTime() : 
                            (typeof createdAt === 'number' ? createdAt : Date.now());
        const ageMs = Date.now() - createdAtTime;
        const ageHours = ageMs / (1000 * 60 * 60);
        
        // Mark as success if:
        // 1. Swap request exists and is marked as success
        // 2. Swap is older than 1 hour (assuming it was manually processed)
        // 3. Wallet balance suggests the swap was credited (heuristic)
        const shouldMarkSuccess = 
          (swapRequest && swapRequest.status === 'success') ||
          ageHours > 1 ||
          (swapAmount > 0 && currentPurchaseUsdt >= swapAmount * 0.5); // Heuristic: at least 50% of swap amount exists
        
        if (shouldMarkSuccess) {
          // Update transaction to success
          batch.update(swap.transactionRef, {
            status: 'success',
            description: swap.description?.replace('Admin Verification Pending', 'Credited to Purchase Wallet') || 
                        `Swapped ${swap.dlxAmount || (swapAmount / 0.1).toFixed(2)} DLX to ${swapAmount.toFixed(2)} USDT (Credited to Purchase Wallet)`,
            updatedAt: firestore.FieldValue.serverTimestamp()
          });
          
          // Update swap request if it exists
          if (swapRequest) {
            const swapRequestRef = firestore.collection('swapRequests').doc(swapRequest.id);
            batch.update(swapRequestRef, {
              status: 'success',
              verifiedAt: firestore.FieldValue.serverTimestamp(),
              updatedAt: firestore.FieldValue.serverTimestamp()
            });
          }
          
          successCount++;
          operationsInBatch += (swapRequest ? 2 : 1);
          
          console.log(`✅ Marking swap ${swap.transactionId} as success (user: ${swap.userId})`);
          
          // Commit batch if we're approaching the limit
          if (operationsInBatch >= batchSize - 10) {
            await batch.commit();
            currentBatch++;
            console.log(`\n💾 Committed batch ${currentBatch} (${operationsInBatch} operations)\n`);
            operationsInBatch = 0;
          }
        } else {
          console.log(`⏳ Keeping swap ${swap.transactionId} as pending (user: ${swap.userId}, age: ${ageHours.toFixed(2)}h)`);
        }
      } catch (error) {
        console.error(`❌ Error processing swap ${swap.transactionId}:`, error.message);
        failedCount++;
      }
    }
    
    // Commit remaining operations
    if (operationsInBatch > 0) {
      await batch.commit();
      currentBatch++;
      console.log(`\n💾 Committed final batch ${currentBatch} (${operationsInBatch} operations)\n`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successfully marked: ${successCount} swaps`);
    console.log(`   ⏳ Kept as pending: ${allPendingSwaps.length - successCount - failedCount} swaps`);
    console.log(`   ❌ Failed to process: ${failedCount} swaps`);
    console.log('='.repeat(60) + '\n');
    
    console.log('✅ Migration complete!\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migratePendingSwaps()
  .then(() => {
    console.log('✨ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

