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
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 shadow-lg border border-gray-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Referrals</h2>
            <p className="text-sm text-gray-400 mt-1">Earn <span className="font-semibold text-blue-400">{rate}%</span> commissions from your referrals. Current Level: <span className="font-semibold text-blue-400">{level}</span></p>
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-gray-800/50 rounded-2xl p-6 shadow-lg border border-gray-700/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Your Referral Link</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 bg-gray-900/50 rounded-xl p-4 border border-gray-600/50 w-full">
            <p className="text-sm text-gray-400 mb-1">Referral Code: <span className="font-mono text-blue-400">{referralCode}</span></p>
            <p className="font-mono text-sm text-white break-all">{referralLink}</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={copy}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-blue-500/20"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={share}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 text-white font-medium transition-all duration-200"
            >
              {shared ? 'Shared!' : 'Share'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-2xl p-5 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xl">👥</div>
            <div>
              <p className="text-sm text-gray-400">Total Referrals</p>
              <p className="text-2xl font-semibold text-white">{activeReferrals}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-2xl p-5 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xl">💵</div>
            <div>
              <p className="text-sm text-gray-400">Total Commission</p>
              <p className="text-2xl font-semibold text-white">${totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-2xl p-5 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xl">🏆</div>
            <div>
              <p className="text-sm text-gray-400">Current Level</p>
              <p className="text-2xl font-semibold text-white">{level}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral History Section */}
      <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white">Referral History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700/50">
                <th className="px-6 py-3 font-medium">Username</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Commission Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No referrals yet</td>
                </tr>
              )}
              {history.map((row: any) => (
                <tr key={row.id} className="hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-6 py-4 text-white">{row.username}</td>
                  <td className="px-6 py-4 text-gray-400">{row.date ? new Date(row.date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        row.status === 'active'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-gray-600/10 text-gray-300 border border-gray-600/20'
                      }`}
                    >
                      {row.status === 'active' ? 'Active' : 'Joined'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-white">${row.commissionUsd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}