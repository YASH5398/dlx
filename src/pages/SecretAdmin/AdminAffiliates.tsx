import React, { useEffect, useMemo, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';

interface AffiliateDoc {
  id?: string;
  approved?: boolean;
  clicks?: number;
  referrals?: number;
  sales?: number;
  earnings?: number;
  invitesSent?: number;
  slug?: string;
  ownerId?: string;
}

export default function AdminAffiliates() {
  const [rows, setRows] = useState<AffiliateDoc[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, 'affiliates'), (snap) => {
      setRows(snap.docs.map((d) => ({ ...(d.data() as AffiliateDoc), id: d.id })));
    }, (err) => console.error('Failed to stream affiliates:', err));
    return () => { try { unsub(); } catch {} };
  }, []);

  const totals = useMemo(() => {
    return rows.reduce((acc, a) => ({
      clicks: acc.clicks + Number(a.clicks || 0),
      referrals: acc.referrals + Number(a.referrals || 0),
      sales: acc.sales + Number(a.sales || 0),
      earnings: acc.earnings + Number(a.earnings || 0),
    }), { clicks: 0, referrals: 0, sales: 0, earnings: 0 });
  }, [rows]);

  const toggleApproval = async (id?: string, approved?: boolean) => {
    if (!id) return;
    await updateDoc(doc(firestore, 'affiliates', id), { approved: !approved, updatedAt: Date.now() });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
          <div className="text-xs text-gray-400">Total Clicks</div>
          <div className="text-2xl font-bold">{totals.clicks}</div>
        </div>
        <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
          <div className="text-xs text-gray-400">Total Referrals</div>
          <div className="text-2xl font-bold">{totals.referrals}</div>
        </div>
        <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
          <div className="text-xs text-gray-400">Total Sales</div>
          <div className="text-2xl font-bold">{totals.sales}</div>
        </div>
        <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
          <div className="text-xs text-gray-400">Total Earnings (USD)</div>
          <div className="text-2xl font-bold">${totals.earnings.toFixed(2)}</div>
        </div>
      </div>

      <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
        <div className="text-lg font-semibold mb-3">Affiliate Applications</div>
        <div className="space-y-2">
          {rows.map((a) => (
            <div key={a.id} className="rounded-lg bg-white/5 border border-white/10 p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{a.slug || a.ownerId || 'Affiliate'}</div>
                <div className="text-xs text-gray-400">Clicks: {a.clicks || 0} • Referrals: {a.referrals || 0} • Sales: {a.sales || 0}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${a.approved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{a.approved ? 'Approved' : 'Pending'}</span>
                <button onClick={() => toggleApproval(a.id, a.approved)} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20">
                  {a.approved ? 'Unapprove' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-sm text-gray-400">No affiliate applications found.</div>
          )}
        </div>
      </div>
    </div>
  );
}