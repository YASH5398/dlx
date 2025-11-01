import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getUserDailyIncomeStats, calculateUserDailyIncome } from '../utils/dailyIncomeCalculator';
import type { DailyIncomeCalculation } from '../utils/dailyIncomeCalculator';

export interface DailyIncomeStats {
  today: DailyIncomeCalculation | null;
  last7Days: DailyIncomeCalculation[];
  totalReferralIncome: number;
  level1Referrals: number;
  loading: boolean;
  error: string | null;
}

export function useDailyIncome() {
  const { user } = useUser();
  const [stats, setStats] = useState<DailyIncomeStats>({
    today: null,
    last7Days: [],
    totalReferralIncome: 0,
    level1Referrals: 0,
    loading: true,
    error: null
  });

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    loadDailyIncomeStats();
  }, [user?.id]);

  const loadDailyIncomeStats = async () => {
    if (!user?.id) return;

    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));
      const incomeStats = await getUserDailyIncomeStats(user.id);
      
      setStats({
        ...incomeStats,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading daily income stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load income stats'
      }));
    }
  };

  const refreshStats = async () => {
    if (!user?.id) return;

    try {
      setRefreshing(true);
      await loadDailyIncomeStats();
    } finally {
      setRefreshing(false);
    }
  };

  const calculateTodayIncome = async (): Promise<DailyIncomeCalculation | null> => {
    if (!user?.id) return null;

    try {
      return await calculateUserDailyIncome(user.id);
    } catch (error) {
      console.error('Error calculating today income:', error);
      return null;
    }
  };

  const getTotalEarnings = () => {
    if (!stats.today) return 0;
    return stats.today.totalDailyIncome;
  };

  const getLevel1Earnings = () => {
    if (!stats.today) return 0;
    return stats.today.referralIncome.level1Income;
  };

  const getLevel2Earnings = () => {
    return 0;
  };

  const getUserEarnings = () => {
    if (!stats.today) return 0;
    return stats.today.userDailyEarnings;
  };

  const getTotalReferralEarnings = () => {
    if (!stats.today) return 0;
    return stats.today.referralIncome.totalReferralIncome;
  };

  const getActiveReferralsCount = () => {
    return {
      level1: stats.level1Referrals,
      level2: 0,
      total: stats.level1Referrals
    };
  };

  const getWeeklyEarnings = () => {
    return stats.last7Days.reduce((total, day) => total + day.totalDailyIncome, 0);
  };

  const getWeeklyReferralEarnings = () => {
    return stats.last7Days.reduce((total, day) => total + day.referralIncome.totalReferralIncome, 0);
  };

  const getWeeklyUserEarnings = () => {
    return stats.last7Days.reduce((total, day) => total + day.userDailyEarnings, 0);
  };

  return {
    stats,
    refreshing,
    refreshStats,
    calculateTodayIncome,
    getTotalEarnings,
    getLevel1Earnings,
    getLevel2Earnings,
    getUserEarnings,
    getTotalReferralEarnings,
    getActiveReferralsCount,
    getWeeklyEarnings,
    getWeeklyReferralEarnings,
    getWeeklyUserEarnings
  };
}
