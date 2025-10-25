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
    const refDoc = doc(firestore, 'referrals', user.id);
    const unsubRefDoc = onSnapshot(refDoc, (snap) => {
      try {
        if (snap.exists()) {
          const data = snap.data() as any;
          setActiveReferrals(Number(data.activeReferrals || 0));
          setReferralCount(Number(data.referralCount || 0));
          setTotalEarnings(Number(data.totalEarningsUsd || 0));
          const t = Number(data.tier || 1);
          const r = Number(data.rate || 20);
          const lv = (data.level || 'Starter') as 'Starter' | 'Silver' | 'Gold';
          setTier(t);
          setRate(r);
          setLevel(lv);
          const hist = (data.history || []) as ReferralHistoryItem[];
          setHistory(Array.isArray(hist) ? hist.map((h) => ({ ...h, commissionUsd: Number(h.commissionUsd || 0), date: Number(h.date || 0) })) : []);
          console.log('Referral data updated:', { activeReferrals: data.activeReferrals, referralCount: data.referralCount, totalEarnings: data.totalEarningsUsd });
        } else {
          console.warn('Referral document does not exist');
          setActiveReferrals(0);
          setReferralCount(0);
          setTotalEarnings(0);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error processing referral data:', error);
        setLoading(false);
      }
    }, (err) => {
      console.error('Referral document stream failed:', err);
      setLoading(false);
    });

    // Query orders to count active referrals (users who made purchases)
    const ordersQ = query(collection(firestore, 'orders'), where('affiliateId', '==', user.id));
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      const rows: ReferralHistoryItem[] = [];
      const userIds = new Set<string>();
      let total = 0;
      snap.forEach((docSnap) => {
        const d = docSnap.data() as any;
        const status: 'joined' | 'active' | 'refunded' = (d.status === 'Completed') ? 'active' : 'joined';
        const commissionUsd = Number(((Number(d.amountUsd || 0) * 0.7)).toFixed(2));
        total += status === 'active' ? commissionUsd : 0;
        const ts = d.timestamp?.toMillis ? d.timestamp.toMillis() : Number(d.timestamp || 0);
        rows.push({ id: docSnap.id, username: d.userName || 'User', date: ts, status, commissionUsd });
        if (d.userId) userIds.add(String(d.userId));
      });
      rows.sort((a, b) => b.date - a.date);
      const count = userIds.size;
      setActiveReferrals(count);
      const { tier: t, rate: r, level: lv } = computeTierByCount(count);
      setTier(t);
      setRate(r);
      setLevel(lv as 'Starter' | 'Silver' | 'Gold');
      setHistory(rows);
      setTotalEarnings(Number(total.toFixed(2)));
    });

    // Query users collection to count referrals by referredBy field
    const referralsQuery = query(
      collection(firestore, 'users'),
      where('referredBy', '==', user.id)
    );
    const unsubReferrals = onSnapshot(referralsQuery, (snap) => {
      const referredUserIds = new Set<string>();
      snap.forEach((docSnap) => {
        referredUserIds.add(docSnap.id);
      });

      // Count active referrals by checking orders in parallel
      if (referredUserIds.size === 0) {
        setActiveReferrals(0);
        return;
      }

      // Use Promise.all for parallel queries instead of sequential await
      const activeCountPromises = Array.from(referredUserIds).map(async (userId) => {
        try {
          const userOrdersQuery = query(
            collection(firestore, 'orders'),
            where('userId', '==', userId),
            where('status', '==', 'paid')
          );
          const userOrdersSnap = await getDocs(userOrdersQuery);
          return !userOrdersSnap.empty ? 1 : 0;
        } catch (error) {
          console.error(`Error checking orders for user ${userId}:`, error);
          return 0;
        }
      });

      Promise.all(activeCountPromises)
        .then((counts) => {
          const activeCount = counts.reduce((sum: number, count: number) => sum + count, 0);
          setActiveReferrals(activeCount);
        })
        .catch((error) => {
          console.error('Error counting active referrals:', error);
          setActiveReferrals(0);
        });
    });

    return () => {
      try { unsubRefDoc(); } catch {}
      try { unsubOrders(); } catch {}
      try { unsubReferrals(); } catch {}
    };
  }, [user?.id, referralCode]);

  return { referralCode, referralLink, totalEarnings, level, tier, rate, activeReferrals, referralCount, history, loading };
}