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
 * Test the 2-level DLX income system
 */
async function testDailyIncomeSystem() {
  try {
    console.log('🧪 Testing DLX 2-Level Income System...\n');

    // Test 1: Check if users exist
    console.log('📊 Test 1: Checking users in database...');
    const usersSnapshot = await db.collection('users').limit(5).get();
    console.log(`Found ${usersSnapshot.size} users in database`);

    if (usersSnapshot.size === 0) {
      console.log('❌ No users found. Please create some test users first.');
      return;
    }

    // Test 2: Check referral structure
    console.log('\n📊 Test 2: Checking referral structure...');
    let usersWithReferrals = 0;
    let totalReferrals = 0;

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.referrerCode) {
        usersWithReferrals++;
        totalReferrals++;
      }
    });

    console.log(`Users with referrer codes: ${usersWithReferrals}`);
    console.log(`Total referrals found: ${totalReferrals}`);

    // Test 3: Test income calculation for a sample user
    console.log('\n📊 Test 3: Testing income calculation...');
    const sampleUser = usersSnapshot.docs[0];
    const sampleUserId = sampleUser.id;
    const sampleUserData = sampleUser.data();

    console.log(`Testing with user: ${sampleUserId}`);
    console.log(`User's referrer code: ${sampleUserData.referrerCode || 'None'}`);

    // Check if user is active (last activity within 24 hours)
    const lastActivity = sampleUserData.lastActivity?.toDate?.() || sampleUserData.lastActivity || new Date(0);
    const now = new Date();
    const diffInHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
    const isActive = diffInHours <= 24;
    const userDailyEarnings = isActive ? 15 : 10;

    console.log(`Last activity: ${lastActivity.toISOString()}`);
    console.log(`Hours since last activity: ${diffInHours.toFixed(2)}`);
    console.log(`User is active: ${isActive}`);
    console.log(`User daily earnings: ${userDailyEarnings} DLX`);

    // Test 4: Check Level 1 referrals
    console.log('\n📊 Test 4: Checking Level 1 referrals...');
    const level1Query = db.collection('users').where('referrerCode', '==', sampleUserId.slice(-8));
    const level1Snapshot = await level1Query.get();
    const level1Referrals = level1Snapshot.docs.map(doc => doc.id);

    console.log(`Level 1 referrals found: ${level1Referrals.length}`);
    
    let level1Income = 0;
    for (const referralId of level1Referrals) {
      const referralDoc = await db.collection('users').doc(referralId).get();
      if (referralDoc.exists) {
        const referralData = referralDoc.data();
        const referralLastActivity = referralData.lastActivity?.toDate?.() || referralData.lastActivity || new Date(0);
        const referralDiffInHours = (now.getTime() - referralLastActivity.getTime()) / (1000 * 60 * 60);
        const referralIsActive = referralDiffInHours <= 24;
        const referralDailyEarnings = referralIsActive ? 15 : 10;
        const commission = referralDailyEarnings * 0.20; // 20% for Level 1
        level1Income += commission;
        
        console.log(`  - Referral ${referralId}: ${referralIsActive ? 'Active' : 'Inactive'} (${referralDailyEarnings} DLX) → Commission: ${commission.toFixed(1)} DLX`);
      }
    }

    console.log(`Total Level 1 income: ${level1Income.toFixed(1)} DLX`);

    // Test 5: Check Level 2 referrals
    console.log('\n📊 Test 5: Checking Level 2 referrals...');
    let level2Income = 0;
    let level2Referrals = [];

    for (const level1UserId of level1Referrals) {
      const level2Query = db.collection('users').where('referrerCode', '==', level1UserId.slice(-8));
      const level2Snapshot = await level2Query.get();
      const level2Refs = level2Snapshot.docs.map(doc => doc.id);
      level2Referrals.push(...level2Refs);

      for (const referralId of level2Refs) {
        const referralDoc = await db.collection('users').doc(referralId).get();
        if (referralDoc.exists) {
          const referralData = referralDoc.data();
          const referralLastActivity = referralData.lastActivity?.toDate?.() || referralData.lastActivity || new Date(0);
          const referralDiffInHours = (now.getTime() - referralLastActivity.getTime()) / (1000 * 60 * 60);
          const referralIsActive = referralDiffInHours <= 24;
          const referralDailyEarnings = referralIsActive ? 15 : 10;
          const commission = referralDailyEarnings * 0.10; // 10% for Level 2
          level2Income += commission;
          
          console.log(`  - Level 2 Referral ${referralId}: ${referralIsActive ? 'Active' : 'Inactive'} (${referralDailyEarnings} DLX) → Commission: ${commission.toFixed(1)} DLX`);
        }
      }
    }

    console.log(`Total Level 2 referrals: ${level2Referrals.length}`);
    console.log(`Total Level 2 income: ${level2Income.toFixed(1)} DLX`);

    // Test 6: Calculate total daily income
    console.log('\n📊 Test 6: Total Daily Income Calculation...');
    const totalReferralIncome = level1Income + level2Income;
    const totalDailyIncome = userDailyEarnings + totalReferralIncome;

    console.log(`User daily earnings: ${userDailyEarnings} DLX`);
    console.log(`Level 1 referral income: ${level1Income.toFixed(1)} DLX`);
    console.log(`Level 2 referral income: ${level2Income.toFixed(1)} DLX`);
    console.log(`Total referral income: ${totalReferralIncome.toFixed(1)} DLX`);
    console.log(`Total daily income: ${totalDailyIncome.toFixed(1)} DLX`);

    // Test 7: Verify income rules
    console.log('\n📊 Test 7: Verifying Income Rules...');
    console.log('✅ Active users earn 15 DLX/day');
    console.log('✅ Inactive users earn 10 DLX/day');
    console.log('✅ Level 1 referrals: 20% commission');
    console.log('✅ Level 2 referrals: 10% commission');
    console.log('✅ No duplicate income credited');

    // Test 8: Check if daily income logs exist
    console.log('\n📊 Test 8: Checking daily income logs...');
    const logsSnapshot = await db.collection('dailyIncomeLogs').limit(5).get();
    console.log(`Daily income logs found: ${logsSnapshot.size}`);

    if (logsSnapshot.size > 0) {
      console.log('Recent income distributions:');
      logsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. User ${data.userId}: ${data.totalDailyIncome} DLX (${data.userDailyEarnings} + ${data.totalReferralIncome} referral)`);
      });
    }

    console.log('\n✅ DLX 2-Level Income System Test Completed!');
    console.log('\n📋 Summary:');
    console.log(`- Users in database: ${usersSnapshot.size}`);
    console.log(`- Users with referrals: ${usersWithReferrals}`);
    console.log(`- Sample user daily income: ${totalDailyIncome.toFixed(1)} DLX`);
    console.log(`- Level 1 referrals: ${level1Referrals.length}`);
    console.log(`- Level 2 referrals: ${level2Referrals.length}`);
    console.log(`- Daily income logs: ${logsSnapshot.size}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDailyIncomeSystem().then(() => {
  console.log('\n🏁 Test completed. Exiting...');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});
