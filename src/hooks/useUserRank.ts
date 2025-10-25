import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getRankInfo, getRankDisplayName, RANK_DEFINITIONS } from '../utils/rankSystem';

export interface UserRankInfo {
  rank: string;
  rankInfo: ReturnType<typeof getRankInfo>;
  displayName: string;
  commissionPercentage: number;
  isEligibleForCommission: boolean;
  color: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
}

export function useUserRank() {
  const { user } = useUser();
  const [userRank, setUserRank] = useState<string>('starter');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setUserRank('starter');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const userDoc = doc(firestore, 'users', user.id);
    const unsubscribe = onSnapshot(
      userDoc,
      (snapshot) => {
        try {
          const data = snapshot.data();
          const rank = data?.rank || data?.currentRank || 'starter';
          setUserRank(rank);
          setIsLoading(false);
        } catch (err) {
          console.error('Error fetching user rank:', err);
          setError('Failed to fetch user rank');
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Error in user rank subscription:', err);
        setError('Failed to subscribe to user rank updates');
        setIsLoading(false);
      }
    );

    return () => {
      try {
        unsubscribe();
      } catch (err) {
        console.error('Error unsubscribing from user rank:', err);
      }
    };
  }, [user?.id]);

  const rankInfo = getRankInfo(userRank);
  const displayName = getRankDisplayName(userRank);
  const isEligibleForCommission = rankInfo.commission > 0;

  const userRankInfo: UserRankInfo = {
    rank: userRank,
    rankInfo,
    displayName,
    commissionPercentage: rankInfo.commission,
    isEligibleForCommission,
    color: rankInfo.color,
    textColor: rankInfo.textColor,
    borderColor: rankInfo.borderColor,
    bgColor: rankInfo.bgColor
  };

  return {
    userRankInfo,
    isLoading,
    error,
    // Helper functions
    getRankBadgeClasses: () => `${rankInfo.bgColor} ${rankInfo.borderColor} ${rankInfo.textColor}`,
    getCommissionPercentage: () => rankInfo.commission,
    isEligibleForCommission: () => rankInfo.commission > 0,
    getDisplayName: () => displayName,
    getAllRanks: () => Object.entries(RANK_DEFINITIONS).map(([key, info]) => ({ key, info }))
  };
}

export default useUserRank;
