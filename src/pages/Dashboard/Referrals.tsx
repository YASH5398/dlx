import React, { useState } from 'react';
import { useReferral } from '../../hooks/useReferral';

export default function Referrals() {
  const { referralLink, totalEarnings, tier } = useReferral();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold heading-gradient">Referral Tracking</h2>
        <p className="text-sm text-gray-300">Share your unique link and earn 20–30% commissions.</p>

        <div className="grid md:grid-cols-[1fr_auto] gap-3 items-center">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-xs text-gray-300">Your link</p>
            <p className="font-mono text-white/90 break-all">{referralLink}</p>
          </div>
          <button onClick={copy} className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#0070f3] to-[#00d4ff] text-white shadow-[0_0_16px_rgba(0,212,255,0.25)]">
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="stat-card-v2"><div className="stat-icon bg-gradient-to-br from-indigo-500 to-purple-600">🏆</div><div><p className="text-sm text-gray-300">Tier</p><p className="text-xl font-semibold">{tier}</p></div></div>
        <div className="stat-card-v2"><div className="stat-icon bg-gradient-to-br from-cyan-500 to-blue-600">💵</div><div><p className="text-sm text-gray-300">Total Earnings</p><p className="text-xl font-semibold">${totalEarnings.toFixed(2)}</p></div></div>
        <div className="stat-card-v2"><div className="stat-icon bg-gradient-to-br from-emerald-500 to-teal-600">👥</div><div><p className="text-sm text-gray-300">Active Referrals</p><p className="text-xl font-semibold">12</p></div></div>
      </div>
    </div>
  );
}