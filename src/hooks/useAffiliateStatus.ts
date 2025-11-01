import { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { doc, updateDoc, onSnapshot, addDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { getRankInfo } from '../utils/rankSystem';

interface AffiliateStatus {
  isPartner: boolean;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  hasApplied: boolean;
  commissionRate: number;
  totalEarnings: number;
  referralCount: number;
  joinedAt?: Date;
  approvedAt?: Date;
  status: 'not_joined' | 'under_review' | 'approved' | 'rejected';
}

export function useAffiliateStatus() {
  const { user } = useUser();
  const [affiliateStatus, setAffiliateStatus] = useState<AffiliateStatus>({
    isPartner: false,
    isApproved: false,
    isPending: false,
    isRejected: false,
    hasApplied: false,
    commissionRate: 0,
    totalEarnings: 0,
    referralCount: 0,
    status: 'not_joined'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(firestore, 'users', user.id), (doc) => {
      try {
        if (doc.exists()) {
          const data = doc.data();
          const rankInfo = getRankInfo(data.rank || 'starter');
          
          const isApproved = data.affiliateApproved || false;
          const isUnderReview = data.affiliateStatus === 'under_review';
          const isPending = data.affiliateStatus === 'pending' || isUnderReview;
          const isRejected = data.affiliateStatus === 'rejected';
          const hasApplied = data.affiliateJoinedAt || data.affiliateStatus;
          
          let status: 'not_joined' | 'under_review' | 'approved' | 'rejected' = 'not_joined';
          if (isApproved) status = 'approved';
          else if (isUnderReview) status = 'under_review';
          else if (isRejected) status = 'rejected';
          else if (hasApplied) status = 'under_review';
          
          setAffiliateStatus({
            isPartner: isApproved,
            isApproved,
            isPending,
            isRejected,
            hasApplied: !!hasApplied,
            commissionRate: rankInfo.commission,
            totalEarnings: data.affiliateEarnings || 0,
            referralCount: data.affiliateReferrals || 0,
            joinedAt: data.affiliateJoinedAt?.toDate?.() || data.affiliateJoinedAt,
            approvedAt: data.affiliateApprovedAt?.toDate?.() || data.affiliateApprovedAt,
            status
          });
          
          console.log('useAffiliateStatus: User data updated:', {
            isPartner: isApproved,
            isApproved,
            isPending,
            isRejected,
            hasApplied: !!hasApplied,
            commissionRate: rankInfo.commission,
            totalEarnings: data.affiliateEarnings || 0,
            referralCount: data.affiliateReferrals || 0,
            status,
            rank: data.rank || 'starter'
          });
        } else {
          console.warn('useAffiliateStatus: User document does not exist for user:', user.id);
          setAffiliateStatus({
            isPartner: false,
            isApproved: false,
            isPending: false,
            isRejected: false,
            hasApplied: false,
            commissionRate: 0,
            totalEarnings: 0,
            referralCount: 0,
            status: 'not_joined'
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('useAffiliateStatus: Error processing user data:', error);
        setLoading(false);
      }
    }, (err) => {
      console.error('useAffiliateStatus: User document stream failed:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const joinAffiliateProgram = async () => {
    if (!user?.id) return false;

    try {
      // Create application document (manual user action only)
      await addDoc(collection(firestore, 'affiliateApplications'), {
        userId: user.id,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Mark user as under review; do NOT set partner yet
      await updateDoc(doc(firestore, 'users', user.id), {
        affiliatePartner: false,
        affiliateStatus: 'under_review',
        affiliateAppliedAt: serverTimestamp(),
        affiliateProcessing: true,
        affiliateProcessingStartedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Error joining affiliate program:', error);
      return false;
    }
  };

  // Auto-approve after 30 minutes if still under review
  useEffect(() => {
    (async () => {
      try {
        if (!user?.id) return;
        const userRef = doc(firestore, 'users', user.id);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;
        const data = snap.data() as any;
        const status: string = data.affiliateStatus || 'not_joined';
        const startedAt = data.affiliateProcessingStartedAt?.toDate?.() || null;
        if (!startedAt) return;
        const thirtyMinMs = 30 * 60 * 1000;
        const due = Date.now() - startedAt.getTime() >= thirtyMinMs;
        if (due && (status === 'under_review' || status === 'pending')) {
          await updateDoc(userRef, {
            affiliateStatus: 'approved',
            affiliateApproved: true,
            affiliatePartner: true,
            affiliateApprovedAt: serverTimestamp(),
            affiliateProcessing: false,
            affiliateProcessingCompletedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error('Auto-approve check failed:', err);
      }
    })();
  }, [user?.id]);

  const getAffiliateBadgeText = () => {
    if (affiliateStatus.isApproved) return 'Affiliate Partner ✅';
    if (affiliateStatus.isPending) return 'Affiliate Partner ⏳';
    if (affiliateStatus.isRejected) return 'Affiliate Partner ❌';
    return null;
  };

  const getAffiliateStatusText = () => {
    if (affiliateStatus.isApproved) return 'Affiliate Partner ✅';
    if (affiliateStatus.isPending) return '⏳ Under Review (Please wait up to 30 min)';
    if (affiliateStatus.isRejected) return '❌ Rejected';
    return '❌ Not Joined';
  };

  const getAffiliateStatusColor = () => {
    if (affiliateStatus.isApproved) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (affiliateStatus.isPending) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (affiliateStatus.isRejected) return 'text-red-400 bg-red-500/10 border-red-500/30';
    return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  };

  const canJoinAffiliate = () => {
    return !affiliateStatus.hasApplied && !affiliateStatus.isApproved;
  };

  const canReapply = () => {
    return affiliateStatus.isRejected;
  };

  return {
    affiliateStatus,
    loading,
    joinAffiliateProgram,
    getAffiliateBadgeText,
    getAffiliateStatusText,
    getAffiliateStatusColor,
    canJoinAffiliate,
    canReapply
  };
}
