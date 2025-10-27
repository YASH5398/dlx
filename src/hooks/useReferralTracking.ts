import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { 
  trackReferralClick, 
  trackReferralSignup, 
  trackReferralPurchase,
  getReferralStats,
  getReferralUsers,
  extractReferralCode,
  isValidReferralCode
} from '../utils/referralTracking';

export interface ReferralStats {
  impressions: number;
  clicks: number;
  joins: number;
  conversionRate: number;
  totalEarnings: number;
  lastUpdated: any;
}

export interface ReferralUser {
  id: string;
  name: string;
  email: string;
  joinedAt: any;
  status: 'active' | 'inactive';
  commissionEarned: number;
  totalSpent: number;
}

export function useReferralTracking() {
  const { user } = useUser();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);
  const [stats, setStats] = useState<ReferralStats>({
    impressions: 0,
    clicks: 0,
    joins: 0,
    conversionRate: 0,
    totalEarnings: 0,
    lastUpdated: null
  });
  const [referralUsers, setReferralUsers] = useState<ReferralUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract referral code from URL on mount
  useEffect(() => {
    const url = window.location.href;
    const code = extractReferralCode(url);
    setReferralCode(code);
    
    if (code) {
      validateReferralCode(code);
    } else {
      setLoading(false);
    }
  }, []);

  // Validate referral code
  const validateReferralCode = async (code: string) => {
    try {
      const isValid = await isValidReferralCode(code);
      setIsValidCode(isValid);
      
      if (isValid) {
        // Track the click
        await trackReferralClick(code, {
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          utmSource: new URLSearchParams(window.location.search).get('utm_source') || undefined,
          utmMedium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
          utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined
        });
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setIsValidCode(false);
    } finally {
      setLoading(false);
    }
  };

  // Load affiliate stats
  useEffect(() => {
    if (!user?.id) return;

    const loadStats = async () => {
      try {
        const affiliateStats = await getReferralStats(user.id);
        setStats(affiliateStats);
      } catch (error) {
        console.error('Error loading affiliate stats:', error);
      }
    };

    loadStats();
  }, [user?.id]);

  // Load referral users
  useEffect(() => {
    if (!user?.id) return;

    const loadReferralUsers = async () => {
      try {
        const users = await getReferralUsers(user.id);
        setReferralUsers(users as ReferralUser[]);
      } catch (error) {
        console.error('Error loading referral users:', error);
      }
    };

    loadReferralUsers();
  }, [user?.id]);

  // Track signup
  const trackSignup = async (userId: string, userEmail: string, userName: string) => {
    if (!referralCode || !isValidCode) return;

    try {
      await trackReferralSignup(referralCode, userId, userEmail, userName);
    } catch (error) {
      console.error('Error tracking signup:', error);
    }
  };

  // Track purchase
  const trackPurchase = async (userId: string, orderId: string, amount: number, productName: string) => {
    if (!referralCode || !isValidCode) return;

    try {
      await trackReferralPurchase(referralCode, userId, orderId, amount, productName);
    } catch (error) {
      console.error('Error tracking purchase:', error);
    }
  };

  return {
    referralCode,
    isValidCode,
    stats,
    referralUsers,
    loading,
    trackSignup,
    trackPurchase
  };
}
