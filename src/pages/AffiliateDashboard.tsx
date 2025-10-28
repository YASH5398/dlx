import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useReferral } from '../hooks/useReferral';
import { useAffiliateApproval } from '../hooks/useAffiliateApproval';
import { firestore } from '../firebase.ts';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClipboardDocumentIcon, LinkIcon, CheckBadgeIcon, ChartBarIcon, UsersIcon, WalletIcon } from '@heroicons/react/24/outline';

export default function AffiliateDashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { approved, affiliate } = useAffiliateApproval();
  const { referralCode, totalEarnings, level, tier, rate, activeReferrals, history } = useReferral();
  const [customSlug, setCustomSlug] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCustomSlug(affiliate?.slug || '');
  }, [affiliate?.slug]);

  const referralLink = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://digilinex.com';
    const slug = customSlug || referralCode;
    return `${base}/signup?ref=${slug}`;
  }, [customSlug, referralCode]);

  const clicks = Number(affiliate?.clicks || 0);
  const invitesSent = Number(affiliate?.invitesSent || history.length || 0);
  const usersJoined = history.filter((h) => h.status === 'joined').length;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const validateSlug = (value: string) => {
    const v = (value || '').trim().toLowerCase();
    if (!v) return 'Slug is required';
    if (v.length < 3 || v.length > 32) return 'Use 3–32 characters';
    if (!/^[a-z0-9-]+$/.test(v)) return 'Only lowercase letters, numbers and dashes allowed';
    return null;
  };

  const saveSlug = async () => {
    if (!user?.id) return;
    const err = validateSlug(customSlug);
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const col = collection(firestore, 'affiliates');
      const q = query(col, where('slug', '==', customSlug));
      const snap = await getDocs(q);
      const taken = snap.docs.some((d) => d.id !== user.id);
      if (taken) {
        toast.error('This link is already taken');
        setSaving(false);
        return;
      }
      const docRef = doc(firestore, 'affiliates', user.id);
      await setDoc(docRef, { slug: customSlug, ownerId: user.id, updatedAt: Date.now() }, { merge: true });
      toast.success('Referral link updated');
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'Failed to update link');
    } finally {
      setSaving(false);
    }
  };

  if (!approved) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white font-inter">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <h1 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Affiliate Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">Your affiliate account is pending approval.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/affiliate-program')} 
                className="px-4 sm:px-5 py-3 sm:py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all duration-300 focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 w-full text-center"
                aria-label="Apply to affiliate program"
              >
                Apply to Program
              </button>
              <Link 
                to="/affiliate-program/info" 
                className="px-4 sm:px-5 py-3 sm:py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 text-center w-full"
                aria-label="Learn more about affiliate program"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white font-inter">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <CheckBadgeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold">Affiliate Dashboard</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Track your referrals, earnings, and manage your link effortlessly.</p>
        </div>

        {/* Referral Link Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-medium">Referral Link</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col gap-3">
              <input
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 text-sm"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                placeholder="your-custom-link"
                aria-label="Custom referral slug"
              />
              <button 
                onClick={saveSlug} 
                className="w-full px-4 sm:px-5 py-2.5 sm:py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 text-center"
                disabled={saving}
                aria-label="Save referral link"
              >
                {saving ? 'Saving...' : 'Save Link'}
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <code className="w-full px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-mono break-all">
                {referralLink}
              </code>
              <button 
                onClick={copyLink} 
                className="w-full px-4 sm:px-5 py-2.5 sm:py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center gap-2 transition-all duration-300 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                aria-label="Copy referral link"
              >
                <ClipboardDocumentIcon className="w-4 h-4 flex-shrink-0" /> 
                <span>Copy Link</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Use lowercase letters, numbers, and dashes. 3–32 characters. Must be unique.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <StatCard label="Clicks" value={clicks} icon={<ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400" />} />
          <StatCard label="Invites Sent" value={invitesSent} icon={<UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400" />} />
          <StatCard label="Users Joined" value={usersJoined} icon={<CheckBadgeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400" />} />
          <StatCard label="Active Referrals" value={activeReferrals} icon={<UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400" />} />
        </div>

        {/* Earnings and Tier */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <WalletIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-medium">Total Earnings</h3>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-indigo-600 dark:text-indigo-400">${totalEarnings.toFixed(2)}</div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 sm:mt-2">Commission from completed orders.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 lg:col-span-2 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-medium">Level & Commission Rate</h3>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-1.5 text-xs sm:text-sm">
                Level: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{level}</span>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-1.5 text-xs sm:text-sm">
                Tier: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{tier}</span>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-1.5 text-xs sm:text-sm">
                Rate: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{rate}%</span>
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 sm:mt-2">Rate adjusts based on verified referrals.</p>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-medium">Referral & Commission History</h3>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="px-4 sm:px-0">
              {/* Mobile Card Layout */}
              <div className="block sm:hidden space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{h.username}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                        {h.date ? new Date(h.date).toLocaleDateString() : ''}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        h.status === 'joined' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        h.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {h.status}
                      </span>
                      <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        ${h.commissionUsd.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                    No referral history yet.
                  </div>
                )}
              </div>
              
              {/* Desktop Table Layout */}
              <table className="hidden sm:table min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 px-3 font-medium">User</th>
                    <th className="py-2 px-3 font-medium">Date</th>
                    <th className="py-2 px-3 font-medium">Status</th>
                    <th className="py-2 px-3 font-medium">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="py-2 px-3">{h.username}</td>
                      <td className="py-2 px-3">{h.date ? new Date(h.date).toLocaleString() : ''}</td>
                      <td className="py-2 px-3 capitalize">{h.status}</td>
                      <td className="py-2 px-3">${h.commissionUsd.toFixed(2)}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">No referral history yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">{label}</div>
      </div>
      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{Number(value || 0)}</div>
    </div>
  );
}