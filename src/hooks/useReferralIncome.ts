import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useUser } from '../context/UserContext';

export interface ReferralIncomeData {
  level1Income: {
    dlx: number;
    usdt: number;
    inr: number;
    total: number;
  };
  joinBonus: {
    level1: number;
    total: number;
  };
  totalIncome: {
    dlx: number;
    usdt: number;
    inr: number;
    total: number;
  };
  level1Referrals: number;
  lastUpdated: Date | null;
}

export function useReferralIncome() {
  const { user } = useUser();
  const [incomeData, setIncomeData] = useState<ReferralIncomeData>({
    level1Income: { dlx: 0, usdt: 0, inr: 0, total: 0 },
    joinBonus: { level1: 0, total: 0 },
    totalIncome: { dlx: 0, usdt: 0, inr: 0, total: 0 },
    level1Referrals: 0,
    lastUpdated: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const userId = user.id;
    
    // Listen to user document for DLX referral income
    const userDocRef = doc(firestore, 'users', userId);
    const unsubscribeUser = onSnapshot(userDocRef, (userSnap) => {
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const referralIncome = userData.referralIncome || {};
        const joinBonus = userData.joinBonus || {};
        
        setIncomeData(prev => ({
          ...prev,
          level1Income: {
            ...prev.level1Income,
            dlx: referralIncome.level1 || 0
          },
          joinBonus: {
            level1: joinBonus.level1 || 0,
            total: (joinBonus.total || joinBonus.level1 || 0)
          },
          lastUpdated: referralIncome.lastUpdated?.toDate?.() || null
        }));
      }
    });

    // Listen to wallet document for USDT/INR referral income
    const walletDocRef = doc(firestore, 'wallets', userId);
    const unsubscribeWallet = onSnapshot(walletDocRef, (walletSnap) => {
      if (walletSnap.exists()) {
        const walletData = walletSnap.data();
        const usdt = walletData.usdt || {};
        const inr = walletData.inr || {};
        
        setIncomeData(prev => ({
          ...prev,
          level1Income: {
            ...prev.level1Income,
            usdt: usdt.referrallevel1 || 0,
            inr: inr.referrallevel1 || 0
          }
        }));
      }
    });

    // Get referral counts (Level 1 only)
    const getReferralCounts = async () => {
      try {
        // Resolve user's referralCode for accurate Level-1 queries
        const meSnap = await getDocs(query(collection(firestore, 'users'), where('__name__', '==', userId)));
        const meData: any = meSnap.empty ? {} : (meSnap.docs[0].data() as any);
        const myReferralCode = meData?.referralCode || userId;

        // Level 1 referrals (direct referrals) - query both referrerCode and referredBy
        const referrerCodeQuery = query(
          collection(firestore, 'users'),
          where('referrerCode', '==', myReferralCode)
        );
        const referredByQuery = query(
          collection(firestore, 'users'),
          where('referredBy', '==', userId)
        );
        
        const [referrerCodeSnapshot, referredBySnapshot] = await Promise.all([
          getDocs(referrerCodeQuery),
          getDocs(referredByQuery)
        ]);
        
        // Combine and deduplicate level 1 referrals
        const level1UserIds = new Set<string>();
        referrerCodeSnapshot.docs.forEach(doc => level1UserIds.add(doc.id));
        referredBySnapshot.docs.forEach(doc => level1UserIds.add(doc.id));
        
        const level1Count = level1UserIds.size;

        console.log(`useReferralIncome: Referral counts for user ${userId}`, {
          level1ReferrerCode: referrerCodeSnapshot.size,
          level1ReferredBy: referredBySnapshot.size,
          level1Total: level1Count
        });

        setIncomeData(prev => ({
          ...prev,
          level1Referrals: level1Count,
          
        }));
      } catch (error) {
        console.error('Error getting referral counts:', error);
      }
    };

    getReferralCounts();
    setLoading(false);

    return () => {
      unsubscribeUser();
      unsubscribeWallet();
    };
  }, [user?.id]);

  // Calculate totals whenever income data changes
  useEffect(() => {
    setIncomeData(prev => {
      const level1Total = prev.level1Income.dlx + prev.level1Income.usdt + prev.level1Income.inr;
      const joinBonusTotal = prev.joinBonus.level1;
      const totalIncome = level1Total + joinBonusTotal;
      
      return {
        ...prev,
        level1Income: {
          ...prev.level1Income,
          total: level1Total
        },
        joinBonus: {
          ...prev.joinBonus,
          total: joinBonusTotal
        },
        totalIncome: {
          dlx: prev.level1Income.dlx + prev.joinBonus.total,
          usdt: prev.level1Income.usdt,
          inr: prev.level1Income.inr,
          total: totalIncome
        }
      };
    });
  }, [incomeData.level1Income.dlx, incomeData.level1Income.usdt, incomeData.level1Income.inr,
      incomeData.joinBonus.level1]);

  const formatCurrency = (amount: number, currency: 'DLX' | 'USDT' | 'INR') => {
    const symbol = currency === 'DLX' ? 'DLX' : currency === 'USDT' ? '$' : '₹';
    return `${symbol}${amount.toFixed(2)}`;
  };

  const getTotalEarnings = (currency: 'DLX' | 'USDT' | 'INR' = 'DLX') => {
    return incomeData.totalIncome[currency.toLowerCase() as keyof typeof incomeData.totalIncome];
  };

  const getLevel1Earnings = (currency: 'DLX' | 'USDT' | 'INR' = 'DLX') => {
    return incomeData.level1Income[currency.toLowerCase() as keyof typeof incomeData.level1Income];
  };

  const getJoinBonus = (level: 'level1' | 'total' = 'total') => {
    return incomeData.joinBonus[level];
  };

  const getActiveReferralsCount = () => {
    return {
      level1: incomeData.level1Referrals,
      total: incomeData.level1Referrals
    };
  };

    return {
      incomeData,
      loading,
      formatCurrency,
      getTotalEarnings,
      getLevel1Earnings,
      getJoinBonus,
      getActiveReferralsCount
    };
}
