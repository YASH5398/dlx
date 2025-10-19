import React, { useState } from 'react';
import { useReferral } from '../../hooks/useReferral';

export default function Referrals() {
  const { referralLink, referralCode, totalEarnings, level, activeReferrals, history, rate } = useReferral() as any;
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Join DigiLinex', text: 'Sign up with my referral link', url: referralLink });
        setShared(true);
        setTimeout(() => setShared(false), 1500);
      } else {
        await copy();
      }
    } catch {}
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="rounded-xl p-5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/15">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold heading-gradient">Referrals</h2>
            <p className="text-sm text-gray-300">Earn {rate}% commissions from your referrals. Level: {level}</p>
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="card space-y-3">
        <h3 className="text-sm font-medium text-white/90">Your Referral Link</h3>
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-3 items-center">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-xs text-gray-300">{`Code: ${referralCode}`}</p>
            <p className="font-mono text-white/90 break-all">{referralLink}</p>
          </div>
          <button onClick={copy} className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#0070f3] to-[#00d4ff] text-white shadow-[0_0_16px_rgba(0,212,255,0.25)]">
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={share} className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition">
            {shared ? 'Shared!' : 'Share'}
          </button>
        </div>
      </div>

      {/* Referral Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="stat-card-v2">
          <div className="stat-icon bg-gradient-to-br from-emerald-500 to-teal-600">👥</div>
          <div>
            <p className="text-sm text-gray-300">Total Referrals</p>
            <p className="text-xl font-semibold">{activeReferrals}</p>
          </div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-icon bg-gradient-to-br from-cyan-500 to-blue-600">💵</div>
          <div>
            <p className="text-sm text-gray-300">Total Commission</p>
            <p className="text-xl font-semibold">${totalEarnings.toFixed(2)}</p>
          </div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-icon bg-gradient-to-br from-indigo-500 to-purple-600">🏆</div>
          <div>
            <p className="text-sm text-gray-300">Current Level</p>
            <p className="text-xl font-semibold">{level}</p>
          </div>
        </div>
      </div>

      {/* Referral History Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/90">Referral History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-300">
                <th className="px-4 py-2">Username</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Commission Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">No referrals yet</td>
                </tr>
              )}
              {history.map((row: any) => (
                <tr key={row.id} className="hover:bg-white/5">
                  <td className="px-4 py-2 text-white/90">{row.username}</td>
                  <td className="px-4 py-2 text-gray-300">{row.date ? new Date(row.date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${row.status === 'active' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-gray-200 border border-white/15'}`}>
                      {row.status === 'active' ? 'Active' : 'Joined'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-white">${row.commissionUsd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}