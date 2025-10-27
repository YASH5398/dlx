import 'dotenv/config';
import admin from 'firebase-admin';
// Import removed to avoid conflicts - using local implementations

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
 * Check if a user is active based on their last activity
 */
function isUserActive(lastActivity) {
  const now = new Date();
  const diffInHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 24;
}

/**
 * Calculate daily DLX earnings for a user based on activity status
 */
function calculateUserDailyEarnings(isActive) {
  return isActive ? 15 : 10; // Active: 15 DLX, Inactive: 10 DLX
}

/**
 * Calculate referral commission based on level and referral's daily earnings
 */
function calculateReferralCommission(referralDailyEarnings, level) {
  const commissionRate = level === 1 ? 0.20 : 0.10; // Level 1: 20%, Level 2: 10%
  return referralDailyEarnings * commissionRate;
}

/**
 * Get all users and their activity status
 */
async function getAllUsersActivityStatus() {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = [];

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const lastActivity = data.lastActivity?.toDate?.() || data.lastActivity || new Date(0);
      const isActive = isUserActive(lastActivity);
      const dailyEarnings = calculateUserDailyEarnings(isActive);

      users.push({
        userId: doc.id,
        isActive,
        lastActivity,
        dailyEarnings
      });
    });

    return users;
  } catch (error) {
    console.error('Error fetching users activity status:', error);
    return [];
  }
}

/**
 * Get referral chain for a user (Level 1 and Level 2 referrals)
 */
async function getUserReferralChain(userId) {
  try {
    // Get Level 1 referrals (direct referrals)
    const level1Query = db.collection('users').where('referrerCode', '==', userId.slice(-8));
    const level1Snapshot = await level1Query.get();
    const level1Referrals = level1Snapshot.docs.map(doc => doc.id);

    // Get Level 2 referrals (referrals of Level 1 referrals)
    const level2Referrals = [];
    for (const level1UserId of level1Referrals) {
      const level2Query = db.collection('users').where('referrerCode', '==', level1UserId.slice(-8));
      const level2Snapshot = await level2Query.get();
      level2Referrals.push(...level2Snapshot.docs.map(doc => doc.id));
    }

    return {
      level1Referrals,
      level2Referrals
    };
  } catch (error) {
    console.error('Error fetching referral chain:', error);
    return { level1Referrals: [], level2Referrals: [] };
  }
}

/**
 * Calculate daily income for a specific user including referral commissions
 */
async function calculateUserDailyIncome(userId) {
  try {
    // Get user's activity status
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userDoc.data();
    const lastActivity = userData.lastActivity?.toDate?.() || userData.lastActivity || new Date(0);
    const isUserActiveStatus = isUserActive(lastActivity);
    const userDailyEarnings = calculateUserDailyEarnings(isUserActiveStatus);

    // Get referral chain
    const { level1Referrals, level2Referrals } = await getUserReferralChain(userId);

    // Get activity status for all referrals
    const allUsers = await getAllUsersActivityStatus();
    const userMap = new Map(allUsers.map(user => [user.userId, user]));

    // Calculate Level 1 referral income
    let level1Income = 0;
    let activeLevel1Referrals = 0;
    for (const referralId of level1Referrals) {
      const referral = userMap.get(referralId);
      if (referral) {
        const commission = calculateReferralCommission(referral.dailyEarnings, 1);
        level1Income += commission;
        if (referral.isActive) activeLevel1Referrals++;
      }
    }

    // Calculate Level 2 referral income
    let level2Income = 0;
    let activeLevel2Referrals = 0;
    for (const referralId of level2Referrals) {
      const referral = userMap.get(referralId);
      if (referral) {
        const commission = calculateReferralCommission(referral.dailyEarnings, 2);
        level2Income += commission;
        if (referral.isActive) activeLevel2Referrals++;
      }
    }

    const referralIncome = {
      level1Income,
      level2Income,
      totalReferralIncome: level1Income + level2Income,
      level1Referrals: level1Referrals.length,
      level2Referrals: level2Referrals.length
    };

    const totalDailyIncome = userDailyEarnings + referralIncome.totalReferralIncome;

    return {
      userId,
      userDailyEarnings,
      referralIncome,
      totalDailyIncome,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error calculating daily income for user:', userId, error);
    throw error;
  }
}

/**
 * Distribute daily income to all users
 */
async function distributeDailyIncome() {
  try {
    console.log('Starting daily income distribution...');
    
    const allUsers = await getAllUsersActivityStatus();
    const batch = db.batch();
    let processedCount = 0;

    for (const user of allUsers) {
      try {
        const incomeCalculation = await calculateUserDailyIncome(user.userId);
        
        // Update user's DLX balance
        const userRef = db.collection('users').doc(user.userId);
        
        // Update mining balance with user's daily earnings
        batch.update(userRef, {
          'wallet.miningBalance': admin.firestore.FieldValue.increment(incomeCalculation.userDailyEarnings),
          lastDailyIncome: admin.firestore.FieldValue.serverTimestamp(),
          lastDailyIncomeAmount: incomeCalculation.userDailyEarnings
        });

        // Update referral DLX if there's referral income
        if (incomeCalculation.referralIncome.totalReferralIncome > 0) {
          batch.update(userRef, {
            totalReferralDLX: admin.firestore.FieldValue.increment(incomeCalculation.referralIncome.totalReferralIncome),
            lastReferralIncome: admin.firestore.FieldValue.serverTimestamp(),
            lastReferralIncomeAmount: incomeCalculation.referralIncome.totalReferralIncome,
            level1ReferralIncome: admin.firestore.FieldValue.increment(incomeCalculation.referralIncome.level1Income),
            level2ReferralIncome: admin.firestore.FieldValue.increment(incomeCalculation.referralIncome.level2Income)
          });
        }

        // Log the income distribution
        const incomeLogRef = db.collection('dailyIncomeLogs').doc();
        batch.set(incomeLogRef, {
          userId: user.userId,
          userDailyEarnings: incomeCalculation.userDailyEarnings,
          level1Income: incomeCalculation.referralIncome.level1Income,
          level2Income: incomeCalculation.referralIncome.level2Income,
          totalReferralIncome: incomeCalculation.referralIncome.totalReferralIncome,
          totalDailyIncome: incomeCalculation.totalDailyIncome,
          isActive: user.isActive,
          level1Referrals: incomeCalculation.referralIncome.level1Referrals,
          level2Referrals: incomeCalculation.referralIncome.level2Referrals,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        processedCount++;
        
        // Commit batch every 500 operations to avoid Firestore limits
        if (processedCount % 500 === 0) {
          await batch.commit();
          console.log(`Processed ${processedCount} users...`);
        }
      } catch (error) {
        console.error(`Error processing user ${user.userId}:`, error);
        // Continue with other users
      }
    }

    // Commit remaining operations
    if (processedCount % 500 !== 0) {
      await batch.commit();
    }

    console.log(`Daily income distribution completed. Processed ${processedCount} users.`);
  } catch (error) {
    console.error('Error in daily income distribution:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting DLX Daily Income Distribution...');
    console.log('⏰ Time:', new Date().toISOString());
    
    await distributeDailyIncome();
    
    console.log('✅ Daily income distribution completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Daily income distribution failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
