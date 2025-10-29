import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { firestore } from '../../firebase';
import { doc, getDoc, collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Copy, Share2, Users, DollarSign, Crown, RefreshCw } from 'lucide-react';

interface UserData {
  referralCode: string;
  referralCount: number;
  totalEarningsUsd: number;
  rank: string;
  name: string;
  email: string;
}

interface ReferralData {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: any;
  status: string;
  rank: string;
}

export default function Referrals() {
  const { user } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const referralLink = userData?.referralCode 
    ? `${window.location.origin}/signup?ref=${userData.referralCode}`
    : '';

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

  const refreshData = async () => {
    if (!user?.id) return;
    
    setRefreshing(true);
    try {
      // Fetch user data
      const userDoc = await getDoc(doc(firestore, 'users', user.id));
      let referralCode = 'DLX0000';
      if (userDoc.exists()) {
        const data = userDoc.data();
        referralCode = data.referralCode || 'DLX0000';
        setUserData({
          referralCode: referralCode,
          referralCount: data.referralCount || 0,
          totalEarningsUsd: data.totalEarningsUsd || 0,
          rank: data.rank || 'starter',
          name: data.name || 'User',
          email: data.email || ''
        });
      }

      // Fetch referrals using the user ID
      const referralsQuery = query(
        collection(firestore, 'users'),
        where('referredBy', '==', user.id)
      );
      
      const referralsSnapshot = await getDocs(referralsQuery);
      const referralsData: ReferralData[] = [];
      
      referralsSnapshot.forEach((doc) => {
        const data = doc.data();
        referralsData.push({
          id: doc.id,
          name: data.name || 'Unknown',
          email: data.email || '',
          phone: data.phone || '',
          createdAt: data.createdAt,
          status: data.status || 'inactive',
          rank: data.rank || 'starter'
        });
      });
      
      // Sort by creation date (newest first)
      referralsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setReferrals(referralsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribeReferrals: (() => void) | null = null;

    // Set up real-time listener for user data
    const userDocRef = doc(firestore, 'users', user.id);
    const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const userData = {
          referralCode: data.referralCode || 'DLX0000',
          referralCount: data.referralCount || 0,
          totalEarningsUsd: data.totalEarningsUsd || 0,
          rank: data.rank || 'starter',
          name: data.name || 'User',
          email: data.email || ''
        };
        setUserData(userData);

        // Set up referrals query using user ID
        if (!unsubscribeReferrals) {
          const referralsQuery = query(
            collection(firestore, 'users'),
            where('referredBy', '==', user.id)
          );
          
          unsubscribeReferrals = onSnapshot(referralsQuery, (snapshot) => {
            const referralsData: ReferralData[] = [];
            
            snapshot.forEach((doc) => {
              const data = doc.data();
              referralsData.push({
                id: doc.id,
                name: data.name || 'Unknown',
                email: data.email || '',
                phone: data.phone || '',
                createdAt: data.createdAt,
                status: data.status || 'inactive',
                rank: data.rank || 'starter'
              });
            });
            
            // Sort by creation date (newest first)
            referralsData.sort((a, b) => {
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
              return dateB.getTime() - dateA.getTime();
            });
            
            setReferrals(referralsData);
          }, (error) => {
            console.error('Error listening to referrals:', error);
          });
        }
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to user data:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeUser();
      if (unsubscribeReferrals) {
        unsubscribeReferrals();
      }
    };
  }, [user?.id]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—';
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '—';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'Active' },
      inactive: { bg: 'bg-gray-600/10', text: 'text-gray-300', border: 'border-gray-600/20', label: 'Inactive' },
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Pending' },
      banned: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Banned' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
        {config.label}
      </span>
    );
  };

  const getRankDisplay = (rank: string) => {
    const rankConfig = {
      starter: { label: 'Starter', color: 'text-blue-400' },
      silver: { label: 'Silver', color: 'text-gray-400' },
      gold: { label: 'Gold', color: 'text-yellow-400' },
      platinum: { label: 'Platinum', color: 'text-purple-400' }
    };
    
    const config = rankConfig[rank as keyof typeof rankConfig] || rankConfig.starter;
    return <span className={config.color}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading referral data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 shadow-lg border border-gray-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Referrals</h2>
            <p className="text-sm text-gray-400 mt-1">
              Track your referral performance and earnings. Current Level: <span className="font-semibold text-blue-400">{getRankDisplay(userData?.rank || 'starter')}</span>
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-gray-800/50 rounded-2xl p-6 shadow-lg border border-gray-700/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Copy className="h-5 w-5" />
          <span>Your Referral Link</span>
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 bg-gray-900/50 rounded-xl p-4 border border-gray-600/50 w-full">
            <p className="text-sm text-gray-400 mb-1">
              Referral Code: <span className="font-mono text-blue-400">{userData?.referralCode || 'DLX0000'}</span>
            </p>
            <p className="font-mono text-sm text-white break-all">{referralLink}</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={copy}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-blue-500/20 flex items-center justify-center space-x-2"
            >
              <Copy className="h-4 w-4" />
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={share}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 text-white font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Share2 className="h-4 w-4" />
              <span>{shared ? 'Shared!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-2xl p-5 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Referrals</p>
              <p className="text-2xl font-semibold text-white">{userData?.referralCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-2xl p-5 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Commission</p>
              <p className="text-2xl font-semibold text-white">${(userData?.totalEarningsUsd || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-2xl p-5 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Current Level</p>
              <p className="text-2xl font-semibold text-white">{getRankDisplay(userData?.rank || 'starter')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral History Section */}
      <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Referral History</span>
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {referrals.length} {referrals.length === 1 ? 'referral' : 'referrals'} found
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700/50">
                <th className="px-6 py-3 font-medium">Sr No</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Created At</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {referrals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Users className="h-8 w-8 text-gray-600" />
                      <span>No referrals found</span>
                      <p className="text-xs text-gray-600">Share your referral link to start earning!</p>
                    </div>
                  </td>
                </tr>
              )}
              {referrals.map((referral, index) => (
                <tr key={referral.id} className="hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                  <td className="px-6 py-4 text-white font-medium">{referral.name}</td>
                  <td className="px-6 py-4 text-gray-300">{referral.email || '—'}</td>
                  <td className="px-6 py-4 text-gray-300">{referral.phone || '—'}</td>
                  <td className="px-6 py-4 text-gray-400">{formatDate(referral.createdAt)}</td>
                  <td className="px-6 py-4">{getStatusBadge(referral.status)}</td>
                  <td className="px-6 py-4">{getRankDisplay(referral.rank)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}