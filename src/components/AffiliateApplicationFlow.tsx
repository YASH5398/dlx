import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useUser } from '../context/UserContext';
import { useAffiliateStatus } from '../hooks/useAffiliateStatus';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/badge';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Crown, 
  TrendingUp,
  Users,
  DollarSign,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AffiliateApplicationFlowProps {
  onComplete?: () => void;
  onClose?: () => void;
}

export default function AffiliateApplicationFlow({ onComplete, onClose }: AffiliateApplicationFlowProps) {
  const { user } = useUser();
  const { affiliateStatus, joinAffiliateProgram } = useAffiliateStatus();
  const [currentStep, setCurrentStep] = useState<'apply' | 'processing' | 'approved' | 'error'>('apply');
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [processingComplete, setProcessingComplete] = useState(false);

  // Auto-approval timer
  useEffect(() => {
    if (currentStep === 'processing' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setProcessingComplete(true);
            handleAutoApproval();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentStep, timeRemaining]);

  const handleApply = async () => {
    if (!user?.id) return;

    try {
      setCurrentStep('processing');
      
      // Update user document with affiliate application
      const userRef = doc(firestore, 'users', user.id);
      await updateDoc(userRef, {
        affiliatePartner: false, // Will be set to true after approval
        affiliateStatus: 'under_review',
        affiliateJoinedAt: serverTimestamp(),
        affiliateAppliedAt: serverTimestamp(),
        affiliateProcessing: true,
        affiliateProcessingStartedAt: serverTimestamp()
      });

      toast.success('Application submitted successfully!');
      
      // Start the 30-minute processing timer
      setTimeRemaining(30 * 60);
    } catch (error) {
      console.error('Error applying for affiliate:', error);
      setCurrentStep('error');
      toast.error('Failed to submit application. Please try again.');
    }
  };

  const handleAutoApproval = async () => {
    if (!user?.id) return;

    try {
      const userRef = doc(firestore, 'users', user.id);
      await updateDoc(userRef, {
        affiliateStatus: 'approved',
        affiliateApproved: true,
        affiliatePartner: true, // Set to true after approval
        affiliateApprovedAt: serverTimestamp(),
        affiliateProcessing: false,
        affiliateProcessingCompletedAt: serverTimestamp(),
        // Generate referral link
        referralLink: `${window.location.origin}/signup?ref=${user.id.slice(-8)}`,
        // Initialize tracking stats
        affiliateStats: {
          impressions: 0,
          clicks: 0,
          joins: 0,
          conversionRate: 0,
          totalEarnings: 0,
          lastUpdated: serverTimestamp()
        }
      });

      setCurrentStep('approved');
      toast.success('🎉 Congratulations! You are now an Affiliate Partner!');
      
      if (onComplete) {
        setTimeout(() => onComplete(), 2000);
      }
    } catch (error) {
      console.error('Error auto-approving affiliate:', error);
      setCurrentStep('error');
      toast.error('Failed to complete approval. Please contact support.');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCommissionRate = () => {
    // Get commission rate based on user's rank
    const rank = (user as any)?.rank || 'starter';
    const rates: { [key: string]: number } = {
      'starter': 20,
      'dlx-associate': 25,
      'dlx-executive': 30,
      'dlx-director': 35,
      'dlx-president': 45
    };
    return rates[rank] || 20;
  };

  if (currentStep === 'apply') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 bg-transparent">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Join Our Affiliate Partner Program
              </CardTitle>
              <CardDescription className="text-slate-300 text-lg">
                Earn {getCommissionRate()}% commission on every referral!
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">High Commission</h3>
                    <p className="text-sm text-slate-400">{getCommissionRate()}% per sale</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Real-time Tracking</h3>
                    <p className="text-sm text-slate-400">Monitor your performance</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Easy Sharing</h3>
                    <p className="text-sm text-slate-400">Unique referral links</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Instant Approval</h3>
                    <p className="text-sm text-slate-400">Start earning in 30 minutes</p>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <h4 className="font-semibold text-white mb-2">Terms & Conditions</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Commission rate depends on your current rank</li>
                  <li>• Payments processed monthly</li>
                  <li>• Minimum withdrawal: ₹5,000</li>
                  <li>• 30-day tracking cookie for referrals</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApply}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Apply Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  if (currentStep === 'processing') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 bg-transparent">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Clock className="w-10 h-10 text-white animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Processing Your Application
              </CardTitle>
              <CardDescription className="text-slate-300">
                Your application is being processed. It may take up to 30 minutes for approval.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Timer */}
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-slate-400 text-sm">
                  Estimated time remaining
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((30 * 60 - timeRemaining) / (30 * 60)) * 100}%` }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </div>

              {/* Status */}
              <div className="text-center">
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                  <Clock className="w-4 h-4 mr-2" />
                  Processing
                </Badge>
              </div>

              {/* Info */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-sm text-slate-300 text-center">
                  We're reviewing your application and setting up your affiliate account. 
                  You'll be notified once approved!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  if (currentStep === 'approved') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 bg-transparent">
            <CardHeader className="text-center pb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <CardTitle className="text-2xl font-bold text-white">
                🎉 Congratulations!
              </CardTitle>
              <CardDescription className="text-slate-300">
                You are now an official Affiliate Partner!
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Success Message */}
              <div className="text-center">
                <p className="text-slate-300 mb-4">
                  Your affiliate account has been approved and is ready to use. 
                  Start sharing your referral link to earn commissions!
                </p>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Affiliate Partner
                </Badge>
              </div>

              {/* Next Steps */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <h4 className="font-semibold text-white mb-2">What's Next?</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Access your affiliate dashboard</li>
                  <li>• Get your unique referral link</li>
                  <li>• Start promoting and earning</li>
                  <li>• Track your performance in real-time</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    onClose?.();
                    window.location.href = '/affiliate-program';
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  if (currentStep === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 bg-transparent">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Application Failed
              </CardTitle>
              <CardDescription className="text-slate-300">
                There was an error processing your application.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-slate-300 mb-4">
                  We encountered an issue while processing your affiliate application. 
                  Please try again or contact support if the problem persists.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Close
                </Button>
                <Button
                  onClick={() => setCurrentStep('apply')}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return null;
}
