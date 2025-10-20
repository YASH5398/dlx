import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';

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

  useEffect(() => {
    if (!user?.id) return;

    const refDoc = doc(firestore, 'referrals', user.id);
    const unsubRefDoc = onSnapshot(refDoc, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        setActiveReferrals(Number(data.activeReferrals || 0));
        setTotalEarnings(Number(data.totalEarningsUsd || 0));
        const t = Number(data.tier || 1);
        const r = Number(data.rate || 20);
        const lv = (data.level || 'Starter') as 'Starter' | 'Silver' | 'Gold';
        setTier(t);
        setRate(r);
        setLevel(lv);
        const hist = (data.history || []) as ReferralHistoryItem[];
        setHistory(Array.isArray(hist) ? hist.map((h) => ({ ...h, commissionUsd: Number(h.commissionUsd || 0), date: Number(h.date || 0) })) : []);
      }
    });

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

    return () => {
      try { unsubRefDoc(); } catch {}
      try { unsubOrders(); } catch {}
    };
  }, [user?.id, referralCode]);

  return { referralCode, referralLink, totalEarnings, level, tier, rate, activeReferrals, history };
}