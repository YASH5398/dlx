import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Crown, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Users, 
  DollarSign,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useAffiliateStatus } from '../hooks/useAffiliateStatus';
import { useNavigate } from 'react-router-dom';

interface AffiliateStatusCardProps {
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

export default function AffiliateStatusCard({ 
  className = '', 
  showActions = true, 
  compact = false 
}: AffiliateStatusCardProps) {
  const { 
    affiliateStatus, 
    loading, 
    getAffiliateBadgeText, 
    getAffiliateStatusText, 
    getAffiliateStatusColor,
    canJoinAffiliate,
    canReapply,
    joinAffiliateProgram
  } = useAffiliateStatus();
  const navigate = useNavigate();

  const handleJoinAffiliate = async () => {
    const success = await joinAffiliateProgram();
    if (success) {
      // Show success toast or notification
      console.log('Successfully joined affiliate program');
    }
  };

  const handleReapply = () => {
    navigate('/affiliate-program');
  };

  const getStatusIcon = () => {
    if (affiliateStatus.isApproved) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (affiliateStatus.isPending) return <Clock className="w-5 h-5 text-yellow-500" />;
    if (affiliateStatus.isRejected) return <XCircle className="w-5 h-5 text-red-500" />;
    return <Crown className="w-5 h-5 text-gray-500" />;
  };

  const getStatusDescription = () => {
    if (affiliateStatus.isApproved) {
      return `Earning ${affiliateStatus.commissionRate}% commission on referrals`;
    }
    if (affiliateStatus.isPending) {
      return 'Your application is under review. We\'ll notify you soon!';
    }
    if (affiliateStatus.isRejected) {
      return 'Your application was not approved. You can reapply anytime.';
    }
    return 'Join our affiliate program and start earning commissions';
  };

  if (loading) {
    return (
      <Card className={`bg-slate-800/40 backdrop-blur-sm border-slate-700/50 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
            <span className="ml-2 text-slate-400">Loading affiliate status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`group relative bg-slate-800/40 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 ${className}`}>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/10 to-slate-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-200">
                Affiliate Partner
              </CardTitle>
              <CardDescription className="text-sm text-slate-400">
                {getStatusDescription()}
              </CardDescription>
            </div>
          </div>
          <Badge className={`px-3 py-1 rounded-full text-xs font-semibold border ${getAffiliateStatusColor()}`}>
            {getAffiliateStatusText()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {affiliateStatus.isApproved && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-400">Commission Rate</span>
                </div>
                <div className="text-lg font-bold text-green-400">
                  {affiliateStatus.commissionRate}%
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400">Total Earnings</span>
                </div>
                <div className="text-lg font-bold text-blue-400">
                  ${affiliateStatus.totalEarnings.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Referral Stats */}
            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-300">Referral Performance</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {affiliateStatus.referralCount} referrals
              </div>
            </div>

            {/* Action Buttons */}
            {showActions && (
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate('/affiliate-dashboard')}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Dashboard
                </Button>
                <Button
                  onClick={() => navigate('/affiliate-dashboard')}
                  variant="outline"
                  className="px-4 py-2 bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-slate-300 font-semibold rounded-lg"
                >
                  Share Link
                </Button>
              </div>
            )}
          </div>
        )}

        {affiliateStatus.isPending && (
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">Application Under Review</span>
              </div>
              <p className="text-sm text-yellow-300">
                We're reviewing your application. You'll receive an email notification once approved.
              </p>
            </div>

            {showActions && (
              <div className="text-center">
                <Button
                  onClick={() => navigate('/affiliate-program/info')}
                  variant="outline"
                  className="px-6 py-2 bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-slate-300 font-semibold rounded-lg"
                >
                  Learn More
                </Button>
              </div>
            )}
          </div>
        )}

        {affiliateStatus.isRejected && (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm font-semibold text-red-400">Application Not Approved</span>
              </div>
              <p className="text-sm text-red-300">
                Your application was not approved this time. You can reapply anytime.
              </p>
            </div>

            {showActions && (
              <div className="flex gap-2">
                <Button
                  onClick={handleReapply}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reapply Now
                </Button>
                <Button
                  onClick={() => navigate('/affiliate-program/info')}
                  variant="outline"
                  className="px-4 py-2 bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-slate-300 font-semibold rounded-lg"
                >
                  Learn More
                </Button>
              </div>
            )}
          </div>
        )}

        {!affiliateStatus.hasApplied && !affiliateStatus.isApproved && (
          <div className="space-y-4">
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-200 mb-2">
                  Join Our Affiliate Program
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Earn 30-40% commission on every referral. Start building your passive income today!
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    No upfront costs
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Real-time tracking
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Weekly payouts
                  </span>
                </div>
              </div>
            </div>

            {showActions && (
              <div className="flex gap-2">
                <Button
                  onClick={handleJoinAffiliate}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Join Now
                </Button>
                <Button
                  onClick={() => navigate('/affiliate-program/info')}
                  variant="outline"
                  className="px-4 py-2 bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-slate-300 font-semibold rounded-lg"
                >
                  Learn More
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
