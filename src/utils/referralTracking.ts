import { doc, updateDoc, increment, serverTimestamp, getDoc, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { firestore } from '../firebase';
import { getRankInfo } from './rankSystem';
import { WalletService } from '../services/walletService';

export interface ReferralClick {
  id: string;
  affiliateId: string;
  timestamp: any;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface ReferralSignup {
  id: string;
  affiliateId: string;
  userId: string;
  timestamp: any;
  userEmail: string;
  userName: string;
}

export interface ReferralPurchase {
  id: string;
  affiliateId: string;
  userId: string;
  orderId: string;
  amount: number;
  commission: number;
  timestamp: any;
  productName: string;
  currency: 'DLX' | 'USDT' | 'INR';
  level1Commission: number;
  level2Commission: number;
  level1AffiliateId?: string;
  level2AffiliateId?: string;
}

/**
 * Track a referral link click
 */
export async function trackReferralClick(
  affiliateId: string,
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }
): Promise<void> {
  try {
    // Update affiliate stats
    const affiliateRef = doc(firestore, 'users', affiliateId);
    await updateDoc(affiliateRef, {
      'affiliateStats.clicks': increment(1),
      'affiliateStats.lastUpdated': serverTimestamp()
    });

    // Log the click event
    const clickData: ReferralClick = {
      id: `${affiliateId}_${Date.now()}`,
      affiliateId,
      timestamp: serverTimestamp(),
      ...metadata
    };

    await setDoc(doc(firestore, 'referralClicks', clickData.id), clickData);

    // Update impressions (if this is a new session)
    const sessionKey = `referral_impression_${affiliateId}`;
    const lastImpression = localStorage.getItem(sessionKey);
    const now = Date.now();
    
    if (!lastImpression || (now - parseInt(lastImpression)) > 24 * 60 * 60 * 1000) { // 24 hours
      await updateDoc(affiliateRef, {
        'affiliateStats.impressions': increment(1)
      });
      localStorage.setItem(sessionKey, now.toString());
    }

    console.log('Referral click tracked:', affiliateId);
  } catch (error) {
    console.error('Error tracking referral click:', error);
  }
}

/**
 * Process join bonus for referrers
 */
export async function processJoinBonus(
  userId: string,
  level1AffiliateId: string,
  level2AffiliateId?: string
): Promise<void> {
  try {
    const batch = writeBatch(firestore);
    
    // Level 1 referrer gets +10 DLX
    const level1Ref = doc(firestore, 'users', level1AffiliateId);
    batch.update(level1Ref, {
      'wallet.miningBalance': increment(10),
      'joinBonus.level1': increment(10),
      'joinBonus.total': increment(10),
      'joinBonus.lastUpdated': serverTimestamp()
    });
    
    // Level 2 referrer gets +5 DLX (if exists)
    if (level2AffiliateId) {
      const level2Ref = doc(firestore, 'users', level2AffiliateId);
      batch.update(level2Ref, {
        'wallet.miningBalance': increment(5),
        'joinBonus.level2': increment(5),
        'joinBonus.total': increment(5),
        'joinBonus.lastUpdated': serverTimestamp()
      });
    }
    
    // Log join bonus transactions
    const level1TransactionRef = doc(collection(firestore, 'joinBonusTransactions'));
    batch.set(level1TransactionRef, {
      userId: level1AffiliateId,
      newUserId: userId,
      amount: 10,
      type: 'level1',
      timestamp: serverTimestamp(),
      description: 'Level 1 join bonus - new user signup'
    });
    
    if (level2AffiliateId) {
      const level2TransactionRef = doc(collection(firestore, 'joinBonusTransactions'));
      batch.set(level2TransactionRef, {
        userId: level2AffiliateId,
        newUserId: userId,
        amount: 5,
        type: 'level2',
        timestamp: serverTimestamp(),
        description: 'Level 2 join bonus - new user signup'
      });
    }
    
    await batch.commit();
    console.log('Join bonus processed:', { 
      level1AffiliateId, 
      level2AffiliateId, 
      level1Bonus: 10, 
      level2Bonus: level2AffiliateId ? 5 : 0 
    });
  } catch (error) {
    console.error('Error processing join bonus:', error);
    throw error;
  }
}

/**
 * Track a referral signup with join bonus
 */
export async function trackReferralSignup(
  affiliateId: string,
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> {
  try {
    // Update affiliate stats
    const affiliateRef = doc(firestore, 'users', affiliateId);
    await updateDoc(affiliateRef, {
      'affiliateStats.joins': increment(1),
      'affiliateStats.lastUpdated': serverTimestamp()
    });

    // Calculate conversion rate
    const affiliateDoc = await getDoc(affiliateRef);
    if (affiliateDoc.exists()) {
      const data = affiliateDoc.data();
      const clicks = data.affiliateStats?.clicks || 0;
      const joins = (data.affiliateStats?.joins || 0) + 1;
      const conversionRate = clicks > 0 ? (joins / clicks) * 100 : 0;

      await updateDoc(affiliateRef, {
        'affiliateStats.conversionRate': conversionRate
      });
    }

    // Log the signup event
    const signupData: ReferralSignup = {
      id: `${affiliateId}_${userId}_${Date.now()}`,
      affiliateId,
      userId,
      timestamp: serverTimestamp(),
      userEmail,
      userName
    };

    await setDoc(doc(firestore, 'referralSignups', signupData.id), signupData);

    // Update user's referrer info
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      referrerCode: affiliateId,
      referredBy: affiliateId,
      referredAt: serverTimestamp()
    });

    // Process join bonus for referrers
    const { level1AffiliateId, level2AffiliateId } = await getReferralChain(userId);
    if (level1AffiliateId) {
      await processJoinBonus(userId, level1AffiliateId, level2AffiliateId || undefined);
    }

    console.log('Referral signup tracked with join bonus:', { affiliateId, userId });
  } catch (error) {
    console.error('Error tracking referral signup:', error);
  }
}

/**
 * Calculate 2-level commission structure based on rank
 */
export function calculate2LevelCommission(
  amount: number,
  level1Rank: string,
  currency: 'DLX' | 'USDT' | 'INR' = 'DLX'
): {
  level1Commission: number;
  level2Commission: number;
  level1Percentage: number;
  level2Percentage: number;
} {
  // Get rank-based commission percentages
  const rankInfo = getRankInfo(level1Rank);
  const level1Percentage = rankInfo.commission;
  
  // Level 2 gets 15% of Level 1's commission
  const level2Percentage = 15;
  
  // Calculate commissions
  const level1Commission = (amount * level1Percentage) / 100;
  const level2Commission = (level1Commission * level2Percentage) / 100;
  
  return {
    level1Commission,
    level2Commission,
    level1Percentage,
    level2Percentage
  };
}

/**
 * Get referral chain for 2-level commissions
 */
export async function getReferralChain(userId: string): Promise<{
  level1AffiliateId: string | null;
  level2AffiliateId: string | null;
}> {
  try {
    // Get user's referrer (Level 1)
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (!userDoc.exists()) {
      return { level1AffiliateId: null, level2AffiliateId: null };
    }
    
    const userData = userDoc.data();
    const level1AffiliateId = userData.referredBy || userData.referrerCode;
    
    if (!level1AffiliateId) {
      return { level1AffiliateId: null, level2AffiliateId: null };
    }
    
    // Get Level 1's referrer (Level 2)
    const level1Doc = await getDoc(doc(firestore, 'users', level1AffiliateId));
    if (!level1Doc.exists()) {
      return { level1AffiliateId, level2AffiliateId: null };
    }
    
    const level1Data = level1Doc.data();
    const level2AffiliateId = level1Data.referredBy || level1Data.referrerCode;
    
    return { level1AffiliateId, level2AffiliateId };
  } catch (error) {
    console.error('Error getting referral chain:', error);
    return { level1AffiliateId: null, level2AffiliateId: null };
  }
}

/**
 * Update wallet with multi-currency proportional payout
 */
export async function updateWalletWithCommission(
  userId: string,
  commission: number,
  currency: 'DLX' | 'USDT' | 'INR',
  commissionType: 'level1' | 'level2',
  orderId: string
): Promise<void> {
  try {
    const success = await WalletService.processReferralCommission(
      userId,
      commission,
      currency,
      commissionType,
      orderId
    );
    
    if (!success) {
      throw new Error('Failed to process referral commission');
    }
    
    console.log(`Updated ${commissionType} commission for user ${userId}: ${commission} ${currency}`);
  } catch (error) {
    console.error('Error updating wallet with commission:', error);
    throw error;
  }
}

/**
 * Track a referral purchase and calculate 2-level commission
 */
export async function trackReferralPurchase(
  affiliateId: string,
  userId: string,
  orderId: string,
  amount: number,
  productName: string,
  currency: 'DLX' | 'USDT' | 'INR' = 'DLX',
  commissionRate?: number
): Promise<void> {
  try {
    // Get referral chain
    const { level1AffiliateId, level2AffiliateId } = await getReferralChain(userId);
    
    if (!level1AffiliateId) {
      console.log('No referral chain found for user:', userId);
      return;
    }
    
    // Get Level 1 affiliate's rank
    const level1Doc = await getDoc(doc(firestore, 'users', level1AffiliateId));
    if (!level1Doc.exists()) {
      console.log('Level 1 affiliate not found:', level1AffiliateId);
      return;
    }
    
    const level1Data = level1Doc.data();
    const level1Rank = level1Data.rank || 'starter';
    
    // Calculate 2-level commissions
    const commissionData = calculate2LevelCommission(amount, level1Rank, currency);
    
    // Update Level 1 affiliate
    await updateWalletWithCommission(
      level1AffiliateId,
      commissionData.level1Commission,
      currency,
      'level1',
      orderId
    );
    
    // Update Level 2 affiliate if exists
    if (level2AffiliateId) {
      await updateWalletWithCommission(
        level2AffiliateId,
        commissionData.level2Commission,
        currency,
        'level2',
        orderId
      );
    }
    
    // Update affiliate stats
    const affiliateRef = doc(firestore, 'users', level1AffiliateId);
    await updateDoc(affiliateRef, {
      'affiliateStats.totalEarnings': increment(commissionData.level1Commission),
      'affiliateStats.lastUpdated': serverTimestamp()
    });
    
    // Log the purchase event
    const purchaseData: ReferralPurchase = {
      id: `${level1AffiliateId}_${orderId}_${Date.now()}`,
      affiliateId: level1AffiliateId,
      userId,
      orderId,
      amount,
      commission: commissionData.level1Commission,
      timestamp: serverTimestamp(),
      productName,
      currency,
      level1Commission: commissionData.level1Commission,
      level2Commission: commissionData.level2Commission,
      level1AffiliateId,
      level2AffiliateId: level2AffiliateId || undefined
    };

    await setDoc(doc(firestore, 'referralPurchases', purchaseData.id), purchaseData);

    console.log('2-Level referral purchase tracked:', { 
      level1AffiliateId, 
      level2AffiliateId, 
      level1Commission: commissionData.level1Commission,
      level2Commission: commissionData.level2Commission,
      currency
    });
  } catch (error) {
    console.error('Error tracking 2-level referral purchase:', error);
  }
}

/**
 * Get referral stats for an affiliate
 */
export async function getReferralStats(affiliateId: string) {
  try {
    const affiliateDoc = await getDoc(doc(firestore, 'users', affiliateId));
    if (!affiliateDoc.exists()) {
      throw new Error('Affiliate not found');
    }

    const data = affiliateDoc.data();
    return {
      impressions: data.affiliateStats?.impressions || 0,
      clicks: data.affiliateStats?.clicks || 0,
      joins: data.affiliateStats?.joins || 0,
      conversionRate: data.affiliateStats?.conversionRate || 0,
      totalEarnings: data.affiliateStats?.totalEarnings || 0,
      lastUpdated: data.affiliateStats?.lastUpdated
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      impressions: 0,
      clicks: 0,
      joins: 0,
      conversionRate: 0,
      totalEarnings: 0,
      lastUpdated: null
    };
  }
}

/**
 * Get referral users for an affiliate
 */
export async function getReferralUsers(affiliateId: string) {
  try {
    const q = query(
      collection(firestore, 'users'),
      where('referrerCode', '==', affiliateId),
      where('referredBy', '==', affiliateId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting referral users:', error);
    return [];
  }
}

/**
 * Initialize affiliate stats for a new affiliate
 */
export async function initializeAffiliateStats(affiliateId: string) {
  try {
    const affiliateRef = doc(firestore, 'users', affiliateId);
    await updateDoc(affiliateRef, {
      affiliateStats: {
        impressions: 0,
        clicks: 0,
        joins: 0,
        conversionRate: 0,
        totalEarnings: 0,
        lastUpdated: serverTimestamp()
      }
    });
  } catch (error) {
    console.error('Error initializing affiliate stats:', error);
  }
}

/**
 * Extract referral code from URL
 */
export function extractReferralCode(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('ref');
  } catch (error) {
    console.error('Error extracting referral code:', error);
    return null;
  }
}

/**
 * Check if a referral code is valid
 */
export async function isValidReferralCode(code: string): Promise<boolean> {
  try {
    const q = query(
      collection(firestore, 'users'),
      where('affiliateApproved', '==', true),
      where('referralCode', '==', code)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error validating referral code:', error);
    return false;
  }
}
