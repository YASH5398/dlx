import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useReferral } from '../hooks/useReferral';
import { useAffiliateApproval } from '../hooks/useAffiliateApproval';
import { firestore } from '../firebase';
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <h1 className="text-2xl font-semibold mb-4">Affiliate Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">Your affiliate account is pending approval.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => navigate('/affiliate-program')} 
                className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all duration-300 focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 w-full sm:w-auto"
                aria-label="Apply to affiliate program"
              >
                Apply to Program
              </button>
              <Link 
                to="/affiliate-program/info" 
                className="px-5 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 text-center w-full sm:w-auto"
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <CheckBadgeIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-semibold">Affiliate Dashboard</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Track your referrals, earnings, and manage your link effortlessly.</p>
        </div>

        {/* Referral Link Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <h2 className="text-lg font-medium">Referral Link</h2>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="flex-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 text-sm"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                placeholder="your-custom-link"
                aria-label="Custom referral slug"
              />
              <button 
                onClick={saveSlug} 
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 w-full sm:w-auto"
                disabled={saving}
                aria-label="Save referral link"
              >
                {saving ? 'Saving...' : 'Save Link'}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <code className="flex-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 text-sm font-mono break-all">
                {referralLink}
              </code>
              <button 
                onClick={copyLink} 
                className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2 transition-all duration-300 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 w-full sm:w-auto"
                aria-label="Copy referral link"
              >
                <ClipboardDocumentIcon className="w-4 h-4" /> Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Use lowercase letters, numbers, and dashes. 3–32 characters. Must be unique.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Clicks" value={clicks} icon={<ChartBarIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />} />
          <StatCard label="Invites Sent" value={invitesSent} icon={<UsersIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />} />
          <StatCard label="Users Joined" value={usersJoined} icon={<CheckBadgeIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />} />
          <StatCard label="Active Referrals" value={activeReferrals} icon={<UsersIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />} />
        </div>

        {/* Earnings and Tier */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <WalletIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              <h3 className="text-lg font-medium">Total Earnings</h3>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-indigo-600 dark:text-indigo-400">${totalEarnings.toFixed(2)}</div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">Commission from completed orders.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 lg:col-span-2 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <ChartBarIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              <h3 className="text-lg font-medium">Level & Commission Rate</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm">
                Level: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{level}</span>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm">
                Tier: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{tier}</span>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm">
                Rate: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{rate}%</span>
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">Rate adjusts based on verified referrals.</p>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <UsersIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-lg font-medium">Referral & Commission History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
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
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
      <div className="text-sm text-gray-300">{label}</div>
      <div className="text-2xl font-bold">{Number(value || 0)}</div>
    </div>
  );
}