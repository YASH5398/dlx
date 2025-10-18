import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { COMMISSION_TIERS } from '../utils/constants';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

export type EarningsPoint = { t: number; usd: number };

export function useReferral() {
  const { user } = useUser();
  const [orderTotalUsd, setOrderTotalUsd] = useState(0);
  const [activeReferrals, setActiveReferrals] = useState(0);
  const [earningsHistory, setEarningsHistory] = useState<EarningsPoint[]>([]);

  useEffect(() => {
    if (!user) return;
    const ordersRef = ref(db, `users/${user.id}/orders`);
    const unsub = onValue(ordersRef, (snap) => {
      const val = snap.val() || {};
      const values = Object.values(val) as any[];
      const total = values.reduce((sum: number, anyOrder: any) => sum + (anyOrder.priceInUsd || 0), 0);
      setOrderTotalUsd(total);
      // Basic earnings history: last 8 orders mapped to points
      const points = values
        .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
        .slice(-8)
        .map((o, i) => ({ t: i, usd: o.priceInUsd || 0 }));
      setEarningsHistory(points);
    });
    return () => unsub();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const refNode = ref(db, `users/${user.id}/referrals/total`);
    const unsub = onValue(refNode, (snap) => {
      const val = snap.val();
      setActiveReferrals(typeof val === 'number' ? val : 0);
    });
    return () => unsub();
  }, [user?.id]);

  const referralLink = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://digilinex.com';
    return `${base}/?r=${user?.id ?? 'guest'}`;
  }, [user?.id]);

  const commissionRate = COMMISSION_TIERS[0].rate; // simplified tier 1

  const totalEarnings = useMemo(() => {
    return orderTotalUsd * (commissionRate / 100);
  }, [orderTotalUsd, commissionRate]);

  const tier = 1; // Placeholder tier calculation

  return { referralLink, totalEarnings, tier, commissionRate, activeReferrals, earningsHistory };
}