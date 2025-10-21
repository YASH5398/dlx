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
    return rows.reduce((acc: { clicks: number; referrals: number; sales: number; earnings: number }, a) => ({
      clicks: acc.clicks + (a.clicks ?? 0),
      referrals: acc.referrals + (a.referrals ?? 0),
      sales: acc.sales + (a.sales ?? 0),
      earnings: acc.earnings + (a.earnings ?? 0),
    }), { clicks: 0, referrals: 0, sales: 0, earnings: 0 });
  }, [rows]);

  const toggleApproval = async (id?: string, approved?: boolean) => {
    if (!id) return;
    await updateDoc(doc(firestore, 'affiliates', id), { approved: !approved, updatedAt: Date.now() });
  };

  const cards = [
    { 
      label: 'Total Clicks', 
      value: totals.clicks, 
      icon: (
        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2z" />
        </svg>
      ),
      gradient: 'from-blue-600/10 to-blue-900/10'
    },
    { 
      label: 'Total Referrals', 
      value: totals.referrals, 
      icon: (
        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 1.714a5.002 5.002 0 0110.288 0" />
        </svg>
      ),
      gradient: 'from-green-600/10 to-green-900/10'
    },
    { 
      label: 'Total Sales', 
      value: totals.sales, 
      icon: (
        <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: 'from-yellow-600/10 to-yellow-900/10'
    },
    { 
      label: 'Total Earnings', 
      value: `$${totals.earnings.toFixed(2)}`, 
      icon: (
        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-purple-600/10 to-purple-900/10'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight">Affiliate Management</h1>
          <p className="text-gray-400 mt-2">Monitor and manage affiliate performance metrics</p>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {cards.map((c) => (
            <div
              key={c.label}
              className={`relative rounded-2xl bg-gradient-to-br ${c.gradient} border border-gray-800/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 font-semibold uppercase tracking-wider">{c.label}</div>
                  <div className="text-3xl font-bold mt-1">{c.value}</div>
                </div>
                <div className="opacity-60">{c.icon}</div>
              </div>
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gray-900/50 opacity-0 hover:opacity-10 transition-opacity duration-300"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Affiliate Applications Table */}
        <div className="rounded-2xl bg-gray-900/50 border border-gray-800/50 p-6 shadow-xl backdrop-blur-sm">
          <h2 className="text-2xl font-semibold mb-6">Affiliate Applications</h2>
          {rows.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No affiliate applications found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm uppercase tracking-wider">
                    <th className="py-3 px-4">Affiliate</th>
                    <th className="py-3 px-4">Clicks</th>
                    <th className="py-3 px-4">Referrals</th>
                    <th className="py-3 px-4">Sales</th>
                    <th className="py-3 px-4">Earnings</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr
                      key={a.id}
                      className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors duration-200"
                    >
                      <td className="py-4 px-4 font-medium">{a.slug || a.ownerId || 'Affiliate'}</td>
                      <td className="py-4 px-4">{a.clicks || 0}</td>
                      <td className="py-4 px-4">{a.referrals || 0}</td>
                      <td className="py-4 px-4">{a.sales || 0}</td>
                      <td className="py-4 px-4">${(a.earnings || 0).toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            a.approved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {a.approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => toggleApproval(a.id, a.approved)}
                          className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                            a.approved
                              ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-600/30'
                              : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-600/30'
                          }`}
                        >
                          {a.approved ? 'Unapprove' : 'Approve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}