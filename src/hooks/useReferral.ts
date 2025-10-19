import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

export type EarningsPoint = { t: number; usd: number };
export type ReferralHistoryItem = {
  id: string;
  username: string;
  date: number;
  status: 'joined' | 'active' | 'refunded';
  commissionUsd: number;
};

function computeTierByCount(count: number) {
  // thresholds inspired by Home.tsx example
  if (count >= 31) return { tier: 3, rate: 30, level: 'Gold' };
  if (count >= 16) return { tier: 2, rate: 28, level: 'Silver' };
  if (count >= 6) return { tier: 2, rate: 25, level: 'Silver' };
  return { tier: 1, rate: 20, level: 'Starter' };
}

export function useReferral() {
  const { user } = useUser();
  const [activeReferrals, setActiveReferrals] = useState(0);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [level, setLevel] = useState<'Starter' | 'Silver' | 'Gold'>('Starter');
  const [tier, setTier] = useState<number>(1);
  const [rate, setRate] = useState<number>(20);

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

  // Subscribe to all users, derive referred users and commissions
  useEffect(() => {
    if (!user) return;
    const unsub = onValue(ref(db, 'users'), (snap) => {
      const all = (snap.val() || {}) as Record<string, any>;
      const referredEntries = Object.entries(all).filter(([uid, u]) => (u?.profile?.referralCode || '').toUpperCase() === referralCode);

      const count = referredEntries.length;
      setActiveReferrals(count);

      // Determine level/tier/rate
      const { tier: t, rate: r, level: lv } = computeTierByCount(count);
      setTier(t);
      setRate(r);
      setLevel(lv as 'Starter' | 'Silver' | 'Gold');

      // Build history and compute total commission
      let total = 0;
      const rows: ReferralHistoryItem[] = referredEntries.map(([rid, u]) => {
        const name = u?.profile?.name || 'User';
        const createdAt = u?.createdAt || 0;
        const orders = Object.values(u?.orders || {}) as any[];
        const validOrders = orders.filter((o) => (o?.status || 'completed') !== 'refunded');
        const totalUsd = validOrders.reduce((sum, o) => sum + (o?.priceInUsd || 0), 0);
        const commissionUsd = Number(((totalUsd * r) / 100).toFixed(2));
        total += commissionUsd;
        const status: 'joined' | 'active' | 'refunded' = validOrders.length > 0 ? 'active' : 'joined';
        return { id: rid, username: name, date: createdAt, status, commissionUsd };
      });

      rows.sort((a, b) => b.date - a.date);
      setHistory(rows);
      setTotalEarnings(Number(total.toFixed(2)));
    });
    return () => unsub();
  }, [user?.id, referralCode]);

  return { referralCode, referralLink, totalEarnings, level, tier, rate, activeReferrals, history };
}