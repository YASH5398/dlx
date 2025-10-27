import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { useAffiliateStatus } from '../hooks/useAffiliateStatus';
import { firestore } from '../firebase';
import AffiliateAnalytics from '../components/AffiliateAnalytics';
import { doc, updateDoc, onSnapshot, collection, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Crown, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Users, 
  DollarSign,
  ExternalLink,
  RefreshCw,
  Copy,
  Share2,
  BarChart3,
  PieChart,
  Eye,
  MousePointer,
  UserPlus,
  Calendar,
  Star,
  AlertCircle,
  Settings,
  Link as LinkIcon,
  Edit3,
  Save,
  X,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AffiliateStats {
  impressions: number;
  clicks: number;
  joins: number;
  conversionRate: number;
  totalEarnings: number;
  lastUpdated: any;
}

interface ReferralUser {
  id: string;
  name: string;
  email: string;
  joinedAt: any;
  status: 'active' | 'inactive';
  commissionEarned: number;
  totalSpent: number;
}

interface CommissionRate {
  rank: string;
  rate: number;
  color: string;
}

const COMMISSION_RATES: CommissionRate[] = [
  { rank: 'Starter', rate: 30, color: 'from-gray-500 to-gray-600' },
  { rank: 'Bronze', rate: 32, color: 'from-orange-500 to-orange-600' },
  { rank: 'Silver', rate: 35, color: 'from-gray-400 to-gray-500' },
  { rank: 'Gold', rate: 38, color: 'from-yellow-500 to-yellow-600' },
  { rank: 'Platinum', rate: 40, color: 'from-purple-500 to-purple-600' },
];

export default function AffiliateProgram() {
  const { user } = useUser();
  const { affiliateStatus, loading } = useAffiliateStatus();
  const [stats, setStats] = useState<AffiliateStats>({
    impressions: 0,
    clicks: 0,
    joins: 0,
    conversionRate: 0,
    totalEarnings: 0,
    lastUpdated: null
  });
  const [referralUsers, setReferralUsers] = useState<ReferralUser[]>([]);
  const [customLink, setCustomLink] = useState('');
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [tempLink, setTempLink] = useState('');
  const [canEditLink, setCanEditLink] = useState(true);
  const [timeUntilEdit, setTimeUntilEdit] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Generate referral link
  const referralLink = useMemo(() => {
    if (!user?.id) return '';
    const baseUrl = window.location.origin;
    const linkId = customLink || user.id.slice(-8);
    return `${baseUrl}/signup?ref=${linkId}`;
  }, [user?.id, customLink]);

  // Load affiliate stats
  useEffect(() => {
    if (!user?.id || !affiliateStatus.isApproved) return;

    const unsubscribe = onSnapshot(doc(firestore, 'users', user.id), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const affiliateStats = data.affiliateStats || {};
        setStats({
          impressions: affiliateStats.impressions || 0,
          clicks: affiliateStats.clicks || 0,
          joins: affiliateStats.joins || 0,
          conversionRate: affiliateStats.conversionRate || 0,
          totalEarnings: affiliateStats.totalEarnings || 0,
          lastUpdated: affiliateStats.lastUpdated
        });
        setCustomLink(data.customReferralLink || '');
        setLoadingStats(false);
      }
    });

    return () => unsubscribe();
  }, [user?.id, affiliateStatus.isApproved]);

  // Load referral users
  useEffect(() => {
    if (!user?.id || !affiliateStatus.isApproved) return;

    const unsubscribe = onSnapshot(
      query(
        collection(firestore, 'users'),
        where('referrerCode', '==', user.id.slice(-8)),
        orderBy('createdAt', 'desc'),
        limit(50)
      ),
      (snapshot) => {
        const users: ReferralUser[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unknown',
            email: data.email || '',
            joinedAt: data.createdAt,
            status: data.status === 'active' ? 'active' : 'inactive',
            commissionEarned: data.commissionEarned || 0,
            totalSpent: data.totalSpent || 0
          };
        });
        setReferralUsers(users);
      }
    );

    return () => unsubscribe();
  }, [user?.id, affiliateStatus.isApproved]);

  // Check if user can edit referral link (once every 7 days)
  useEffect(() => {
    if (!user?.id) return;

    const checkEditPermission = async () => {
      const userDoc = await getDocs(query(collection(firestore, 'users'), where('__name__', '==', user.id)));
      if (userDoc.docs.length > 0) {
        const data = userDoc.docs[0].data();
        const lastEdit = data.lastReferralLinkEdit;
        if (lastEdit) {
          const lastEditTime = lastEdit.toDate ? lastEdit.toDate() : new Date(lastEdit);
          const now = new Date();
          const timeDiff = now.getTime() - lastEditTime.getTime();
          const daysDiff = timeDiff / (1000 * 3600 * 24);
          
          if (daysDiff < 7) {
            setCanEditLink(false);
            const remainingTime = (7 - daysDiff) * 24 * 60 * 60 * 1000; // Convert to milliseconds
            setTimeUntilEdit(remainingTime);
          }
        }
      }
    };

    checkEditPermission();
  }, [user?.id]);

  // Countdown timer for link editing
  useEffect(() => {
    if (!canEditLink && timeUntilEdit > 0) {
      const timer = setInterval(() => {
        setTimeUntilEdit(prev => {
          if (prev <= 1000) {
            setCanEditLink(true);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [canEditLink, timeUntilEdit]);

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join DigiLinex',
          text: 'Join me on DigiLinex and start earning!',
          url: referralLink
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      copyReferralLink();
    }
  };

  const handleEditLink = () => {
    setTempLink(customLink);
    setIsEditingLink(true);
  };

  const handleSaveLink = async () => {
    if (!user?.id || !tempLink.trim()) return;

    try {
      const userRef = doc(firestore, 'users', user.id);
      await updateDoc(userRef, {
        customReferralLink: tempLink.trim(),
        lastReferralLinkEdit: serverTimestamp()
      });
      
      setCustomLink(tempLink.trim());
      setIsEditingLink(false);
      setCanEditLink(false);
      setTimeUntilEdit(7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
      toast.success('Referral link updated successfully!');
    } catch (error) {
      toast.error('Failed to update referral link');
    }
  };

  const handleCancelEdit = () => {
    setTempLink('');
    setIsEditingLink(false);
  };

  const formatTimeRemaining = (milliseconds: number) => {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Loading affiliate program...</p>
        </div>
      </div>
    );
  }

  if (!affiliateStatus.isApproved) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Affiliate Program Access Required
              </CardTitle>
              <CardDescription className="text-slate-300">
                {affiliateStatus.isPending 
                  ? '⏳ Under Review (Please wait up to 30 min) - Your application is being processed.'
                  : 'You need to be an approved affiliate partner to access this page.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {!affiliateStatus.isPending && (
                <Button
                  onClick={() => window.location.href = '/affiliate-program/info'}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Apply for Affiliate Program
                </Button>
              )}
              {affiliateStatus.isPending && (
                <div className="text-center">
                  <div className="text-lg text-slate-300 mb-4">
                    Your application is under review. You'll be automatically approved within 30 minutes.
                  </div>
                  <Button
                    onClick={() => window.location.href = '/dashboard'}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Affiliate Dashboard</h1>
              <p className="text-slate-400">Track your referrals and earnings in real-time</p>
            </div>
          </div>
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            <CheckCircle className="w-4 h-4 mr-2" />
            Affiliate Partner ✅
          </Badge>
        </div>

        {/* Analytics Dashboard */}
        <AffiliateAnalytics
          data={{
            impressions: stats.impressions,
            clicks: stats.clicks,
            joins: stats.joins,
            conversionRate: stats.conversionRate,
            totalEarnings: stats.totalEarnings,
            period: analyticsPeriod
          }}
          period={analyticsPeriod}
          onPeriodChange={setAnalyticsPeriod}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-slate-400">Impressions</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.impressions}</div>
              <p className="text-xs text-slate-500">Link views</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <MousePointer className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-400">Clicks</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.clicks}</div>
              <p className="text-xs text-slate-500">Link clicks</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-slate-400">Signups</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.joins}</div>
              <p className="text-xs text-slate-500">New users</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-slate-400">Earnings</span>
              </div>
              <div className="text-2xl font-bold text-white">${stats.totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-slate-500">Total commission</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Section */}
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription className="text-slate-400">
              Share this link to earn commissions on every signup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                value={referralLink}
                readOnly
                className="flex-1 bg-slate-700/50 border-slate-600 text-white"
              />
              <Button
                onClick={copyReferralLink}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                onClick={shareReferralLink}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Custom Link Editor */}
            <div className="border-t border-slate-700/50 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Custom Link</h3>
                {canEditLink ? (
                  <Button
                    onClick={handleEditLink}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="text-xs text-slate-500">
                    Can edit in {formatTimeRemaining(timeUntilEdit)}
                  </div>
                )}
              </div>

              {isEditingLink ? (
                <div className="flex gap-3">
                  <Input
                    value={tempLink}
                    onChange={(e) => setTempLink(e.target.value)}
                    placeholder="Enter custom link (3-32 characters)"
                    className="flex-1 bg-slate-700/50 border-slate-600 text-white"
                  />
                  <Button
                    onClick={handleSaveLink}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-slate-400">
                  Current: <span className="text-white font-mono">{customLink || 'Auto-generated'}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Commission Rate Section */}
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Commission Rates
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your commission rate depends on your current rank
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-sm text-slate-400 mb-2">Your Current Rate</div>
              <div className="text-3xl font-bold text-blue-400">
                {affiliateStatus.commissionRate}%
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {COMMISSION_RATES.map((rate) => (
                <div
                  key={rate.rank}
                  className={`p-4 rounded-lg border-2 ${
                    rate.rate === affiliateStatus.commissionRate
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-700/30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${rate.color} mb-2`}></div>
                  <div className="text-sm font-semibold text-white">{rate.rank}</div>
                  <div className="text-lg font-bold text-slate-300">{rate.rate}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Referral History
            </CardTitle>
            <CardDescription className="text-slate-400">
              Track all users who joined through your referral link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referralUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400">User</th>
                      <th className="text-left py-3 px-4 text-slate-400">Joined</th>
                      <th className="text-left py-3 px-4 text-slate-400">Status</th>
                      <th className="text-left py-3 px-4 text-slate-400">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-white">{user.name}</div>
                            <div className="text-slate-400 text-xs">{user.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {user.joinedAt ? new Date(user.joinedAt.toDate ? user.joinedAt.toDate() : user.joinedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              user.status === 'active'
                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                : 'bg-red-500/20 text-red-300 border-red-500/30'
                            }
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-green-400 font-medium">
                          ${user.commissionEarned.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No referrals yet</p>
                <p className="text-slate-500 text-sm">Start sharing your link to earn commissions!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
