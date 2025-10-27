import 'dotenv/config';
import admin from 'firebase-admin';

// Firebase Admin SDK initialization
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

const db = admin.firestore();

/**
 * Set up test referral relationships
 */
async function setupTestReferrals() {
  try {
    console.log('🔧 Setting up test referral relationships...\n');

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

    if (users.length < 3) {
      console.log('❌ Need at least 3 users to set up referral relationships');
      return;
    }

    console.log(`Found ${users.length} users`);

    // Set up referral chain: User1 -> User2 -> User3
    const user1 = users[0];
    const user2 = users[1];
    const user3 = users[2];

    // Update user1 to have a referral code (last 8 chars of their ID)
    const user1RefCode = user1.id.slice(-8);
    await db.collection('users').doc(user1.id).update({
      referralCode: user1RefCode,
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ User1 (${user1.id}) set as referrer with code: ${user1RefCode}`);

    // Update user2 to be referred by user1
    await db.collection('users').doc(user2.id).update({
      referrerCode: user1RefCode,
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ User2 (${user2.id}) referred by User1`);

    // Update user3 to be referred by user2
    const user2RefCode = user2.id.slice(-8);
    await db.collection('users').doc(user3.id).update({
      referrerCode: user2RefCode,
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ User3 (${user3.id}) referred by User2`);

    // If we have more users, set up additional Level 1 referrals for user1
    if (users.length >= 4) {
      for (let i = 3; i < Math.min(users.length, 6); i++) {
        const user = users[i];
        await db.collection('users').doc(user.id).update({
          referrerCode: user1RefCode,
          lastActivity: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ User${i + 1} (${user.id}) referred by User1`);
      }
    }

    // Set up some users as inactive (last activity more than 24 hours ago)
    const inactiveTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    if (users.length >= 5) {
      await db.collection('users').doc(users[4].id).update({
        lastActivity: admin.firestore.Timestamp.fromDate(inactiveTime)
      });
      console.log(`✅ User5 (${users[4].id}) set as inactive`);
    }

    console.log('\n🎉 Test referral relationships set up successfully!');
    console.log('\n📋 Referral Chain:');
    console.log(`User1 (${user1.id.slice(-8)}) - Referrer`);
    console.log(`  └── User2 (${user2.id.slice(-8)}) - Level 1 referral`);
    console.log(`      └── User3 (${user3.id.slice(-8)}) - Level 2 referral`);
    
    if (users.length >= 4) {
      console.log(`  └── User4+ - Additional Level 1 referrals`);
    }

  } catch (error) {
    console.error('❌ Error setting up test referrals:', error);
  }
}

// Run the setup
setupTestReferrals().then(() => {
  console.log('\n🏁 Setup completed. Exiting...');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Setup crashed:', error);
  process.exit(1);
});
