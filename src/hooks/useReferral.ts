import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase.ts';
import { collection, doc, onSnapshot, query, where, getDocs } from 'firebase/firestore';

export type EarningsPoint = { t: number; usd: number };
export type ReferralHistoryItem = {
  id: string;
  username: string;
  date: number;
  status: 'joined' | 'active' | 'refunded';
  commissionUsd: number;
};

function computeTierByCount(count: number) {
  if (count >= 31) return { tier: 3, rate: 30, level: 'Gold' };
  if (count >= 16) return { tier: 2, rate: 28, level: 'Silver' };
  if (count >= 6) return { tier: 2, rate: 25, level: 'Silver' };
  return { tier: 1, rate: 20, level: 'Starter' };
}

export function useReferral() {
  const { user } = useUser();
  const [activeReferrals, setActiveReferrals] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [level, setLevel] = useState<'Starter' | 'Silver' | 'Gold'>('Starter');
  const [tier, setTier] = useState<number>(1);
  const [rate, setRate] = useState<number>(20);
  const [loading, setLoading] = useState(true);

  const referralCode = useMemo(() => {
    const uid = user?.id;
    if (!uid) return 'DLX0000';
    const suffix = uid.slice(-4).toUpperCase();
    return `DLX${suffix}`;
  }, [user?.id]);

  const referralLink = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://digilinex.com';
    return `${base}/signup?ref=${referralCode}`;
  }, [referralCode]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // First, try to get data from user document (primary source)
    const userDoc = doc(firestore, 'users', user.id);
    const unsubUserDoc = onSnapshot(userDoc, (snap) => {
      try {
        if (snap.exists()) {
          const data = snap.data() as any;
          console.log('useReferral: User document data:', data);
          
          // Use user document as primary source
          setActiveReferrals(Number(data.activeReferrals || 0));
          setReferralCount(Number(data.referralCount || 0));
          setTotalEarnings(Number(data.totalEarningsUsd || 0));
          
          // Calculate tier and rate based on active referrals
          const activeCount = Number(data.activeReferrals || 0);
          const { tier: t, rate: r, level: lv } = computeTierByCount(activeCount);
          setTier(t);
          setRate(r);
          setLevel(lv as 'Starter' | 'Silver' | 'Gold');
          
          console.log('useReferral: User data updated:', { 
            activeReferrals: data.activeReferrals, 
            referralCount: data.referralCount, 
            totalEarnings: data.totalEarningsUsd,
            tier: t,
            rate: r,
            level: lv
          });
        } else {
          console.warn('useReferral: User document does not exist for user:', user.id);
          setActiveReferrals(0);
          setReferralCount(0);
          setTotalEarnings(0);
          setTier(1);
          setRate(20);
          setLevel('Starter');
        }
        setLoading(false);
      } catch (error) {
        console.error('useReferral: Error processing user data:', error);
        setLoading(false);
      }
    }, (err) => {
      console.error('useReferral: User document stream failed:', err);
      setLoading(false);
    });

    // Query orders to count active referrals and calculate earnings
    const ordersQ = query(collection(firestore, 'orders'), where('affiliateId', '==', user.id));
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      const rows: ReferralHistoryItem[] = [];
      const userIds = new Set<string>();
      let totalEarnings = 0;
      
      snap.forEach((docSnap) => {
        const d = docSnap.data() as any;
        const status: 'joined' | 'active' | 'refunded' = (d.status === 'Completed' || d.status === 'paid') ? 'active' : 'joined';
        const commissionUsd = Number(((Number(d.amountUsd || 0) * 0.7)).toFixed(2));
        totalEarnings += status === 'active' ? commissionUsd : 0;
        const ts = d.timestamp?.toMillis ? d.timestamp.toMillis() : Number(d.timestamp || 0);
        rows.push({ id: docSnap.id, username: d.userName || 'User', date: ts, status, commissionUsd });
        if (d.userId) userIds.add(String(d.userId));
      });
      
      rows.sort((a, b) => b.date - a.date);
      const activeCount = userIds.size;
      
      // Update state with calculated values
      setActiveReferrals(activeCount);
      setTotalEarnings(Number(totalEarnings.toFixed(2)));
      setHistory(rows);
      
      // Calculate tier and rate based on active referrals
      const { tier: t, rate: r, level: lv } = computeTierByCount(activeCount);
      setTier(t);
      setRate(r);
      setLevel(lv as 'Starter' | 'Silver' | 'Gold');
      
      console.log('useReferral: Orders data updated:', { 
        activeReferrals: activeCount, 
        totalEarnings: totalEarnings,
        tier: t,
        rate: r,
        level: lv,
        historyCount: rows.length
      });
    });

    // Query users collection to count total referrals by referrerCode field
    // We'll get the referral code from the user document stream above
    let unsubReferrals: (() => void) | null = null;
    
    // Set up a listener for the user document to get the referral code
    const userDocListener = onSnapshot(userDoc, (snap) => {
      if (snap.exists()) {
        const userData = snap.data() as any;
        const userReferralCode = userData?.referralCode;
        
        if (userReferralCode && !unsubReferrals) {
          const referralsQuery = query(
            collection(firestore, 'users'),
            where('referrerCode', '==', userReferralCode)
          );
          unsubReferrals = onSnapshot(referralsQuery, (referralsSnap) => {
            const totalReferrals = referralsSnap.size;
            setReferralCount(totalReferrals);
            
            console.log('useReferral: Referrals count updated:', { 
              totalReferrals,
              referralCode: userReferralCode
            });
          });
        }
      }
    });

    return () => {
      try { unsubUserDoc(); } catch {}
      try { unsubOrders(); } catch {}
      try { unsubReferrals?.(); } catch {}
      try { userDocListener(); } catch {}
    };
  }, [user?.id, referralCode]);

  return { referralCode, referralLink, totalEarnings, level, tier, rate, activeReferrals, referralCount, history, loading };
}