import React, { useEffect, useMemo, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';

interface ReferralRow {
  id: string;
  referredById: string;
  referredUserId: string;
  referredByLabel: string;
  referredUserLabel: string;
  earningsUsd: number;
  referralDate: number;
}

export default function AdminReferrals() {
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(firestore, 'orders'), orderBy('timestamp', 'desc') as any);
    const userCache: Record<string, string> = {};
    const getUserLabel = async (uid?: string) => {
      if (!uid) return 'Unknown';
      if (userCache[uid]) return userCache[uid];
      try {
        const uref = doc(firestore, 'users', uid);
        const snap = await getDoc(uref);
        const d: any = snap.exists() ? snap.data() : {};
        const label = d.email || d.name || d.displayName || uid;
        userCache[uid] = label;
        return label;
      } catch {
        return uid;
      }
    };
    const unsub = onSnapshot(q, async (snap) => {
      const list: ReferralRow[] = [];
      const promises: Promise<void>[] = [];
      snap.forEach((docSnap) => {
        const d: any = docSnap.data() || {};
        const affiliateId: string | undefined = d.affiliateId || d.referrerId || undefined;
        if (!affiliateId) return; // skip non-referral orders
        const userId: string | undefined = d.userId || d.uid || undefined;
        const amountUsd = Number(d.amountUsd || d.amount || 0);
        const earningsUsd = Number(((amountUsd * 0.7)).toFixed(2));
        const ts = d.timestamp?.toMillis ? d.timestamp.toMillis() : Number(d.timestamp || Date.now());
        const row: ReferralRow = {
          id: docSnap.id,
          referredById: affiliateId,
          referredUserId: String(userId || 'unknown'),
          referredByLabel: affiliateId,
          referredUserLabel: String(d.userName || 'User'),
          earningsUsd,
          referralDate: ts,
        };
        // hydrate labels lazily
        promises.push((async () => {
          row.referredByLabel = await getUserLabel(affiliateId);
          row.referredUserLabel = row.referredUserLabel || await getUserLabel(userId);
        })());
        list.push(row);
      });
      try { await Promise.all(promises); } catch {}
      setRows(list);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Failed to stream referrals (orders):', err);
      setError('Failed to load referral data');
      setLoading(false);
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  const totalEarnings = useMemo(() => rows.reduce((s, r) => s + Number(r.earningsUsd || 0), 0), [rows]);
  const totalReferralCount = useMemo(() => {
    const setIds = new Set(rows.map((r) => r.referredUserId));
    return setIds.size;
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
          <div className="text-xs text-gray-400">Total Referral Count</div>
          <div className="text-2xl font-bold">{totalReferralCount}</div>
        </div>
        <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
          <div className="text-xs text-gray-400">Total Earnings (USD)</div>
          <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
        </div>
        <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
          <div className="text-xs text-gray-400">Live Status</div>
          <div className="text-2xl font-bold">{loading ? 'Loading…' : (error ? 'Error' : 'Live')}</div>
        </div>
      </div>

      <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
        <div className="text-lg font-semibold mb-3">Referral Records</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="px-3 py-2">Referred By</th>
                <th className="px-3 py-2">Referred User</th>
                <th className="px-3 py-2">Earnings (USD)</th>
                <th className="px-3 py-2">Referral Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500">No referrals found.</td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="px-3 py-2 text-white">
                    <div className="font-medium">{r.referredByLabel}</div>
                    <div className="text-xs text-gray-400">UID: {r.referredById}</div>
                  </td>
                  <td className="px-3 py-2 text-white">
                    <div className="font-medium">{r.referredUserLabel}</div>
                    <div className="text-xs text-gray-400">UID: {r.referredUserId}</div>
                  </td>
                  <td className="px-3 py-2 text-emerald-400 font-bold">${Number(r.earningsUsd || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-gray-300">{r.referralDate ? new Date(r.referralDate).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}