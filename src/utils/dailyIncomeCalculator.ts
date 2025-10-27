import { firestore } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';

export interface UserActivityStatus {
  userId: string;
  isActive: boolean;
  lastActivity: Date;
  dailyEarnings: number;
}

export interface ReferralIncome {
  level1Income: number;
  level2Income: number;
  totalReferralIncome: number;
  level1Referrals: number;
  level2Referrals: number;
}

export interface DailyIncomeCalculation {
  userId: string;
  userDailyEarnings: number;
  referralIncome: ReferralIncome;
  totalDailyIncome: number;
  timestamp: Date;
}

/**
 * Check if a user is active based on their last activity
 * Active: Last activity within 24 hours
 * Inactive: Last activity more than 24 hours ago
 */
export function isUserActive(lastActivity: Date): boolean {
  const now = new Date();
  const diffInHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 24;
}

/**
 * Calculate daily DLX earnings for a user based on activity status
 */
export function calculateUserDailyEarnings(isActive: boolean): number {
  return isActive ? 15 : 10; // Active: 15 DLX, Inactive: 10 DLX
}

/**
 * Calculate referral commission based on level and referral's daily earnings
 */
export function calculateReferralCommission(
  referralDailyEarnings: number, 
  level: 1 | 2
): number {
  const commissionRate = level === 1 ? 0.20 : 0.10; // Level 1: 20%, Level 2: 10%
  return referralDailyEarnings * commissionRate;
}

/**
 * Get all users and their activity status
 */
export async function getAllUsersActivityStatus(): Promise<UserActivityStatus[]> {
  try {
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    const users: UserActivityStatus[] = [];

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
export async function getUserReferralChain(userId: string): Promise<{
  level1Referrals: string[];
  level2Referrals: string[];
}> {
  try {
    // Get Level 1 referrals (direct referrals)
    const level1Query = query(
      collection(firestore, 'users'),
      where('referrerCode', '==', userId.slice(-8)) // Assuming referral code is last 8 chars of user ID
    );
    const level1Snapshot = await getDocs(level1Query);
    const level1Referrals = level1Snapshot.docs.map(doc => doc.id);

    // Get Level 2 referrals (referrals of Level 1 referrals)
    const level2Referrals: string[] = [];
    for (const level1UserId of level1Referrals) {
      const level2Query = query(
        collection(firestore, 'users'),
        where('referrerCode', '==', level1UserId.slice(-8))
      );
      const level2Snapshot = await getDocs(level2Query);
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
export async function calculateUserDailyIncome(userId: string): Promise<DailyIncomeCalculation> {
  try {
    // Get user's activity status
    const userDoc = await getDocs(query(collection(firestore, 'users'), where('__name__', '==', userId)));
    if (userDoc.empty) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userDoc.docs[0].data();
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

    const referralIncome: ReferralIncome = {
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
export async function distributeDailyIncome(): Promise<void> {
  try {
    console.log('Starting daily income distribution...');
    
    const allUsers = await getAllUsersActivityStatus();
    const batch = writeBatch(firestore);
    let processedCount = 0;

    for (const user of allUsers) {
      try {
        const incomeCalculation = await calculateUserDailyIncome(user.userId);
        
        // Update user's DLX balance
        const userRef = doc(firestore, 'users', user.userId);
        
        // Update mining balance with user's daily earnings
        batch.update(userRef, {
          'wallet.miningBalance': increment(incomeCalculation.userDailyEarnings),
          lastDailyIncome: serverTimestamp(),
          lastDailyIncomeAmount: incomeCalculation.userDailyEarnings
        });

        // Update referral DLX if there's referral income
        if (incomeCalculation.referralIncome.totalReferralIncome > 0) {
          batch.update(userRef, {
            totalReferralDLX: increment(incomeCalculation.referralIncome.totalReferralIncome),
            lastReferralIncome: serverTimestamp(),
            lastReferralIncomeAmount: incomeCalculation.referralIncome.totalReferralIncome,
            level1ReferralIncome: increment(incomeCalculation.referralIncome.level1Income),
            level2ReferralIncome: increment(incomeCalculation.referralIncome.level2Income)
          });
        }

        // Log the income distribution
        const incomeLogRef = doc(collection(firestore, 'dailyIncomeLogs'));
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
          timestamp: serverTimestamp()
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

/**
 * Get daily income statistics for a user
 */
export async function getUserDailyIncomeStats(userId: string): Promise<{
  today: DailyIncomeCalculation | null;
  last7Days: DailyIncomeCalculation[];
  totalReferralIncome: number;
  level1Referrals: number;
  level2Referrals: number;
}> {
  try {
    // Get today's income calculation
    const todayIncome = await calculateUserDailyIncome(userId);

    // Get last 7 days income logs
    const incomeLogsQuery = query(
      collection(firestore, 'dailyIncomeLogs'),
      where('userId', '==', userId)
    );
    const incomeLogsSnapshot = await getDocs(incomeLogsQuery);
    
    const last7Days: DailyIncomeCalculation[] = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    incomeLogsSnapshot.forEach((doc) => {
      const data = doc.data();
      const logDate = data.timestamp?.toDate?.() || new Date(0);
      
      if (logDate >= sevenDaysAgo) {
        last7Days.push({
          userId: data.userId,
          userDailyEarnings: data.userDailyEarnings || 0,
          referralIncome: {
            level1Income: data.level1Income || 0,
            level2Income: data.level2Income || 0,
            totalReferralIncome: data.totalReferralIncome || 0,
            level1Referrals: data.level1Referrals || 0,
            level2Referrals: data.level2Referrals || 0
          },
          totalDailyIncome: data.totalDailyIncome || 0,
          timestamp: logDate
        });
      }
    });

    // Sort by date (newest first)
    last7Days.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Calculate totals
    const totalReferralIncome = last7Days.reduce((sum, day) => sum + day.referralIncome.totalReferralIncome, 0);
    const level1Referrals = todayIncome.referralIncome.level1Referrals;
    const level2Referrals = todayIncome.referralIncome.level2Referrals;

    return {
      today: todayIncome,
      last7Days,
      totalReferralIncome,
      level1Referrals,
      level2Referrals
    };
  } catch (error) {
    console.error('Error getting user daily income stats:', error);
    return {
      today: null,
      last7Days: [],
      totalReferralIncome: 0,
      level1Referrals: 0,
      level2Referrals: 0
    };
  }
}
