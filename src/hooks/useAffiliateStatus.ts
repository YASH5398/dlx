import { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { getRankInfo } from '../utils/rankSystem';

interface AffiliateStatus {
  isPartner: boolean;
  isApproved: boolean;
  isPending: boolean;
  commissionRate: number;
  totalEarnings: number;
  referralCount: number;
}

export function useAffiliateStatus() {
  const { user } = useUser();
  const [affiliateStatus, setAffiliateStatus] = useState<AffiliateStatus>({
    isPartner: false,
    isApproved: false,
    isPending: false,
    commissionRate: 0,
    totalEarnings: 0,
    referralCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(firestore, 'users', user.id), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const rankInfo = getRankInfo(data.rank || 'starter');
        
        setAffiliateStatus({
          isPartner: data.affiliateApproved || false,
          isApproved: data.affiliateApproved || false,
          isPending: data.affiliateStatus === 'pending',
          commissionRate: rankInfo.commission,
          totalEarnings: data.affiliateEarnings || 0,
          referralCount: data.affiliateReferrals || 0
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const joinAffiliateProgram = async () => {
    if (!user?.id) return false;

    try {
      await updateDoc(doc(firestore, 'users', user.id), {
        affiliateJoinedAt: new Date(),
        affiliateStatus: 'pending'
      });
      return true;
    } catch (error) {
      console.error('Error joining affiliate program:', error);
      return false;
    }
  };

  const getAffiliateBadgeText = () => {
    if (affiliateStatus.isApproved) return 'Affiliate Partner ✅';
    if (affiliateStatus.isPending) return 'Affiliate Partner ⏳';
    return null;
  };

  const getAffiliateStatusText = () => {
    if (affiliateStatus.isApproved) return '✅ Approved';
    if (affiliateStatus.isPending) return '⏳ Pending Approval';
    return '❌ Not Joined';
  };

  return {
    affiliateStatus,
    loading,
    joinAffiliateProgram,
    getAffiliateBadgeText,
    getAffiliateStatusText
  };
}
