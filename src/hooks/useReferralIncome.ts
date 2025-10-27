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
  level2Income: {
    dlx: number;
    usdt: number;
    inr: number;
    total: number;
  };
  joinBonus: {
    level1: number;
    level2: number;
    total: number;
  };
  totalIncome: {
    dlx: number;
    usdt: number;
    inr: number;
    total: number;
  };
  level1Referrals: number;
  level2Referrals: number;
  lastUpdated: Date | null;
}

export function useReferralIncome() {
  const { user } = useUser();
  const [incomeData, setIncomeData] = useState<ReferralIncomeData>({
    level1Income: { dlx: 0, usdt: 0, inr: 0, total: 0 },
    level2Income: { dlx: 0, usdt: 0, inr: 0, total: 0 },
    joinBonus: { level1: 0, level2: 0, total: 0 },
    totalIncome: { dlx: 0, usdt: 0, inr: 0, total: 0 },
    level1Referrals: 0,
    level2Referrals: 0,
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
          level2Income: {
            ...prev.level2Income,
            dlx: referralIncome.level2 || 0
          },
          joinBonus: {
            level1: joinBonus.level1 || 0,
            level2: joinBonus.level2 || 0,
            total: joinBonus.total || 0
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
          },
          level2Income: {
            ...prev.level2Income,
            usdt: usdt.referrallevel2 || 0,
            inr: inr.referrallevel2 || 0
          }
        }));
      }
    });

    // Get referral counts
    const getReferralCounts = async () => {
      try {
        // Level 1 referrals (direct referrals)
        const level1Query = query(
          collection(firestore, 'users'),
          where('referredBy', '==', userId)
        );
        const level1Snapshot = await getDocs(level1Query);
        
        // Level 2 referrals (referrals of referrals)
        const level2UserIds: string[] = [];
        level1Snapshot.forEach(doc => {
          level2UserIds.push(doc.id);
        });
        
        let level2Count = 0;
        if (level2UserIds.length > 0) {
          const level2Query = query(
            collection(firestore, 'users'),
            where('referredBy', 'in', level2UserIds)
          );
          const level2Snapshot = await getDocs(level2Query);
          level2Count = level2Snapshot.size;
        }
        
        setIncomeData(prev => ({
          ...prev,
          level1Referrals: level1Snapshot.size,
          level2Referrals: level2Count
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
      const level2Total = prev.level2Income.dlx + prev.level2Income.usdt + prev.level2Income.inr;
      const joinBonusTotal = prev.joinBonus.level1 + prev.joinBonus.level2;
      const totalIncome = level1Total + level2Total + joinBonusTotal;
      
      return {
        ...prev,
        level1Income: {
          ...prev.level1Income,
          total: level1Total
        },
        level2Income: {
          ...prev.level2Income,
          total: level2Total
        },
        joinBonus: {
          ...prev.joinBonus,
          total: joinBonusTotal
        },
        totalIncome: {
          dlx: prev.level1Income.dlx + prev.level2Income.dlx + prev.joinBonus.total,
          usdt: prev.level1Income.usdt + prev.level2Income.usdt,
          inr: prev.level1Income.inr + prev.level2Income.inr,
          total: totalIncome
        }
      };
    });
  }, [incomeData.level1Income.dlx, incomeData.level1Income.usdt, incomeData.level1Income.inr, 
      incomeData.level2Income.dlx, incomeData.level2Income.usdt, incomeData.level2Income.inr,
      incomeData.joinBonus.level1, incomeData.joinBonus.level2]);

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

  const getLevel2Earnings = (currency: 'DLX' | 'USDT' | 'INR' = 'DLX') => {
    return incomeData.level2Income[currency.toLowerCase() as keyof typeof incomeData.level2Income];
  };

  const getJoinBonus = (level: 'level1' | 'level2' | 'total' = 'total') => {
    return incomeData.joinBonus[level];
  };

  const getActiveReferralsCount = () => {
    return {
      level1: incomeData.level1Referrals,
      level2: incomeData.level2Referrals,
      total: incomeData.level1Referrals + incomeData.level2Referrals
    };
  };

  return {
    incomeData,
    loading,
    formatCurrency,
    getTotalEarnings,
    getLevel1Earnings,
    getLevel2Earnings,
    getJoinBonus,
    getActiveReferralsCount
  };
}
