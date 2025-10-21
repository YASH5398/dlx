import React, { useEffect, useMemo, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface ReferralDoc { totalEarningsUsd?: number; activeReferrals?: number; history?: any[] }

export default function AdminReferrals() {
  const [rows, setRows] = useState<ReferralDoc[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, 'referrals'), (snap) => {
      setRows(snap.docs.map((d) => (d.data() as ReferralDoc) || {}));
    }, (err) => console.error('Failed to stream referrals:', err));
    return () => { try { unsub(); } catch {} };
  }, []);

  const totalEarnings = useMemo(() => rows.reduce((s, r) => s + Number(r.totalEarningsUsd || 0), 0), [rows]);
  const totalActiveRefs = useMemo(() => rows.reduce((s, r) => s + Number(r.activeReferrals || 0), 0), [rows]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
          <div className="text-xs text-gray-400">Active Referrals</div>
          <div className="text-2xl font-bold">{totalActiveRefs}</div>
        </div>
        <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
          <div className="text-xs text-gray-400">Total Earnings (USD)</div>
          <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
        </div>
      </div>
      <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
        <div className="text-lg font-semibold mb-3">Recent Referral Activity</div>
        <div className="space-y-2">
          {rows.flatMap((r) => (Array.isArray(r.history) ? r.history : [])).slice(0, 20).map((h: any, idx: number) => (
            <div key={idx} className="rounded-lg bg-white/5 border border-white/10 p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{h.username || 'User'}</div>
                <div className="text-xs text-gray-400">{h.status || 'joined'} • {h.date ? new Date(Number(h.date)).toLocaleString() : ''}</div>
              </div>
              <div className="text-emerald-400 font-bold">${Number(h.commissionUsd || 0).toFixed(2)}</div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-sm text-gray-400">No referral data found.</div>
          )}
        </div>
      </div>
    </div>
  );
}