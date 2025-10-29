import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, updateDoc, onSnapshot, collection, query, where, orderBy, limit, getDocs, serverTimestamp, addDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { UserPlusIcon, ShoppingCartIcon, CurrencyDollarIcon, ChartBarIcon, WalletIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { firestore } from '../firebase.ts';
import { useUser } from '../context/UserContext';
import { useAffiliateStatus } from '../hooks/useAffiliateStatus';
import AffiliateApplicationFlow from '../components/AffiliateApplicationFlow';
import AffiliateAnalytics from '../components/AffiliateAnalytics';
import { useForm, FormProvider } from 'react-hook-form';
import { RANK_DEFINITIONS, getRankInfo } from '../utils/rankSystem';
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


const affiliateService = {
  async getStats(userId: string): Promise<AffiliateStats> {
    const docRef = doc(firestore, 'affiliates', userId);
    const docSnap = await getDoc(docRef);
    const data: any = docSnap.exists() ? docSnap.data() : {};
    return {
      impressions: typeof data.impressions === 'number' ? data.impressions : 0,
      clicks: typeof data.clicks === 'number' ? data.clicks : 0,
      joins: typeof data.joins === 'number' ? data.joins : 0,
      conversionRate: typeof data.conversionRate === 'number' ? data.conversionRate : 0,
      totalEarnings: typeof data.totalEarnings === 'number' ? data.totalEarnings : 0,
      lastUpdated: data.lastUpdated || null,
    };
  },
};

const CONTENT = {
  headline: 'Become a DigiLinex Affiliate Partner & Earn Passive Income!',
  intro: {
    description: 'Join the DigiLinex Affiliate Program and earn 30–40% commission by promoting our premium digital products, including software, courses, templates, and eBooks. Perfect for bloggers, content creators, entrepreneurs, and social media influencers looking to generate passive income with ease.',
    cta: 'Join Now',
  },
  howItWorks: [
    {
      icon: UserPlusIcon,
      title: 'Sign Up',
      description: 'Register as an affiliate and receive a unique referral link to start promoting.',
    },
    {
      icon: LinkIcon,
      title: 'Share Your Link',
      description: 'Promote your link through social media, blogs, newsletters, YouTube, or your website.',
    },
    {
      icon: ShoppingCartIcon,
      title: 'User Registration & Purchase',
      description: 'Your referral link tracks clicks and purchases using a 30-day cookie.',
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Earn Commission',
      description: 'Earn 30–40% commission per sale, automatically credited to your Affiliate Wallet.',
    },
    {
      icon: ChartBarIcon,
      title: 'Monitor Performance',
      description: 'Track clicks, referrals, sales, and earnings in real-time via your affiliate dashboard.',
    },
    {
      icon: WalletIcon,
      title: 'Withdraw Earnings',
      description: 'Cash out your earnings via INR bank transfer or USDT crypto wallet.',
    },
  ],
  tracking: {
    title: 'How Tracking & Earnings Work',
    description: 'Each affiliate receives a unique Affiliate ID and referral link. When a user clicks your link, a 30-day tracking cookie is set. If they make a purchase within this period, the sale is attributed to your ID. Commissions (30–40%) are calculated based on the product price and updated in real-time on your dashboard.',
  },
  benefits: [
    'Earn passive income with zero upfront cost.',
    'Access premium digital products (software, courses, templates, eBooks) to promote.',
    'Real-time performance tracking with a transparent dashboard.',
    'Flexible payout options: INR bank transfer or USDT crypto wallet.',
    'Dedicated support team to assist with promotion strategies.',
    'Exclusive access to promotional materials and campaigns.',
  ],
  terms: [
    'Use honest and ethical marketing practices; no spam or misleading promotions.',
    'Commissions are paid only for verified, non-refunded purchases.',
    'Minimum withdrawal limit: ₹5,000 INR or equivalent in USDT.',
    'DigiLinex reserves the right to suspend accounts violating program rules.',
  ],
  faq: [
    {
      question: 'How do I join the DigiLinex Affiliate Program?',
      answer: 'Sign up with your email and name to receive a unique referral link. Start promoting immediately!',
    },
    {
      question: 'How long does commission tracking last?',
      answer: 'We use a 30-day cookie to track clicks and purchases linked to your referral ID.',
    },
    {
      question: 'When can I withdraw my earnings?',
      answer: 'Withdrawals are available once you reach the minimum threshold of ₹5,000 INR or equivalent in USDT, processed monthly.',
    },
    {
      question: 'What products can I promote?',
      answer: 'Promote our premium digital products, including software, online courses, templates, and eBooks.',
    },
    {
      question: 'Is there any cost to join?',
      answer: 'No, joining the DigiLinex Affiliate Program is completely free!',
    },
  ],
};

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

// Generate commission rates from rank system
const COMMISSION_RATES: CommissionRate[] = Object.entries(RANK_DEFINITIONS).map(([key, rankInfo]) => ({
  rank: rankInfo.name,
  rate: rankInfo.commission,
  color: rankInfo.color.replace('bg-', 'from-').replace('-500', '-500 to-' + rankInfo.color.split('-')[1] + '-600')
}));

// Affiliate Registration Form Component
interface AffiliateRegistrationFormProps {
  onComplete: () => void;
}

interface RegistrationFormData {
  fullName: string;
  email: string;
  phone: string;
  interestedServices: string[];
  description: string;
  termsAgreed: boolean;
}

const AffiliateRegistrationForm: React.FC<AffiliateRegistrationFormProps> = ({ onComplete }) => {
  const { user } = useUser();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const methods = useForm<RegistrationFormData>({
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: '',
      interestedServices: [],
      description: '',
      termsAgreed: false
    },
    mode: 'onChange'
  });

  // Load services from Firebase
  useEffect(() => {
    const loadServices = async () => {
      try {
        const servicesSnapshot = await getDocs(collection(firestore, 'services'));
        const servicesData = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setServices(servicesData.filter((service: any) => service.isActive));
      } catch (error) {
        console.error('Error loading services:', error);
      }
    };
    loadServices();
  }, []);

  const onSubmit = async (data: RegistrationFormData) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Save affiliate application to Firestore
      await addDoc(collection(firestore, 'affiliateApplications'), {
        userId: user.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        interestedServices: data.interestedServices,
        description: data.description,
        status: 'pending',
        createdAt: serverTimestamp(),
        userRank: (user as any).rank || 'starter'
      });

      // Update user document
      await updateDoc(doc(firestore, 'users', user.id), {
        affiliatePartner: false,
        affiliateStatus: 'under_review',
        affiliateJoinedAt: serverTimestamp(),
        affiliateAppliedAt: serverTimestamp(),
        affiliateProcessing: true,
        affiliateProcessingStartedAt: serverTimestamp()
      });

      toast.success('Application submitted successfully! You will be approved within 30 minutes.');
      onComplete();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ToastContainer />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Join Our Affiliate Program</h1>
          <p className="text-xl text-slate-400 mb-6">Earn 30-40% commission on every referral</p>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-2 mb-8">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <p className="text-slate-400">Step {currentStep} of {totalSteps}</p>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
              <CardContent className="p-8">
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Personal Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                        <Input
                          {...methods.register('fullName', { required: 'Full name is required' })}
                          placeholder="Enter your full name"
                          className="bg-slate-700/50 border-slate-600 text-white"
                        />
                        {methods.formState.errors.fullName && (
                          <p className="mt-1 text-sm text-red-400">{methods.formState.errors.fullName.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address *</label>
                        <Input
                          type="email"
                          {...methods.register('email', { 
                            required: 'Email is required',
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: 'Invalid email format'
                            }
                          })}
                          placeholder="you@example.com"
                          className="bg-slate-700/50 border-slate-600 text-white"
                        />
                        {methods.formState.errors.email && (
                          <p className="mt-1 text-sm text-red-400">{methods.formState.errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number *</label>
                      <Input
                        {...methods.register('phone', { 
                          required: 'Phone number is required',
                          pattern: {
                            value: /^\d{10}$/,
                            message: 'Phone must be 10 digits'
                          }
                        })}
                        placeholder="1234567890"
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                      {methods.formState.errors.phone && (
                        <p className="mt-1 text-sm text-red-400">{methods.formState.errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Services Selection */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Interested Services</h2>
                    <p className="text-slate-400 mb-6">Select the services you're interested in promoting</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            methods.watch('interestedServices')?.includes(service.id)
                              ? 'border-purple-500 bg-purple-500/10'
                              : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                          }`}
                          onClick={() => {
                            const currentServices = methods.getValues('interestedServices') || [];
                            const isSelected = currentServices.includes(service.id);
                            const newServices = isSelected
                              ? currentServices.filter(id => id !== service.id)
                              : [...currentServices, service.id];
                            methods.setValue('interestedServices', newServices);
                          }}
                        >
                          <div className="text-2xl mb-2">{service.icon}</div>
                          <h3 className="font-semibold text-white mb-1">{service.title}</h3>
                          <p className="text-sm text-slate-400 mb-2">{service.description}</p>
                          <p className="text-sm font-medium text-purple-400">{service.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Additional Information */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Additional Information</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">What best describes you? *</label>
                      <select
                        {...methods.register('description', { required: 'Please select an option' })}
                        className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select an option</option>
                        <option value="content-creator">Content Creator</option>
                        <option value="blogger">Blogger</option>
                        <option value="influencer">Social Media Influencer</option>
                        <option value="entrepreneur">Entrepreneur</option>
                        <option value="marketer">Digital Marketer</option>
                        <option value="other">Other</option>
                      </select>
                      {methods.formState.errors.description && (
                        <p className="mt-1 text-sm text-red-400">{methods.formState.errors.description.message}</p>
                      )}
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        {...methods.register('termsAgreed', { required: 'You must agree to the terms' })}
                        className="mt-1 w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                      />
                      <label className="text-sm text-slate-300">
                        I agree to the{' '}
                        <a href="/terms" className="text-purple-400 hover:text-purple-300 underline">
                          Terms and Conditions
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                    {methods.formState.errors.termsAgreed && (
                      <p className="text-sm text-red-400">{methods.formState.errors.termsAgreed.message}</p>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  
                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {loading ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </FormProvider>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">High Commission</h3>
              <p className="text-slate-400 text-sm">Earn 30-40% commission on every sale</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-time Tracking</h3>
              <p className="text-slate-400 text-sm">Monitor your performance in real-time</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Easy Sharing</h3>
              <p className="text-slate-400 text-sm">Get your unique referral link instantly</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const AffiliateProgramInfo: React.FC = () => {
  const [isApplicationFlowOpen, setIsApplicationFlowOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();
  const { canJoinAffiliate, canReapply, affiliateStatus, loading } = useAffiliateStatus();
  
  // State for full affiliate program interface
  const [stats, setStats] = useState<AffiliateStats>({
    impressions: 0,
    clicks: 0,
    joins: 0,
    conversionRate: 0,
    totalEarnings: 0,
    lastUpdated: null
  });
  const [userRank, setUserRank] = useState<string>('starter');
  const [userCommissionRate, setUserCommissionRate] = useState<number>(20);
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

  const handleApplicationComplete = () => {
    setIsApplicationFlowOpen(false);
    // Redirect to affiliate program dashboard after successful application
    navigate('/affiliate-program');
  };

  // Load affiliate stats and user rank
  useEffect(() => {
    if (!user?.id || !affiliateStatus.isApproved) return;

    const unsubscribe = onSnapshot(doc(firestore, 'users', user.id), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const affiliateStats = data.affiliateStats || {};
        
        // Update affiliate stats
        setStats({
          impressions: affiliateStats.impressions || 0,
          clicks: affiliateStats.clicks || 0,
          joins: affiliateStats.joins || 0,
          conversionRate: affiliateStats.conversionRate || 0,
          totalEarnings: affiliateStats.totalEarnings || 0,
          lastUpdated: affiliateStats.lastUpdated
        });
        
        // Update user rank and commission rate
        const currentRank = data.rank || 'starter';
        const rankInfo = getRankInfo(currentRank);
        setUserRank(currentRank);
        setUserCommissionRate(rankInfo.commission);
        
        setCustomLink(data.customReferralLink || '');
        setLoadingStats(false);
      }
    });

    return () => unsubscribe();
  }, [user?.id, affiliateStatus.isApproved]);

  // Load referral users
  useEffect(() => {
    if (!user?.id || !affiliateStatus.isApproved) return;

    const loadReferralUsers = async () => {
      try {
        // Query for users with referrerCode field (new format)
        const referrerCodeQuery = query(
          collection(firestore, 'users'),
          where('referrerCode', '==', user.id.slice(-8)),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        
        // Query for users with referredBy field (old format)
        const referredByQuery = query(
          collection(firestore, 'users'),
          where('referredBy', '==', user.id.slice(-8)),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        
        const [referrerCodeSnapshot, referredBySnapshot] = await Promise.all([
          getDocs(referrerCodeQuery),
          getDocs(referredByQuery)
        ]);
        
        // Combine results and remove duplicates
        const allUsers = new Map();
        
        // Add users from referrerCode query
        referrerCodeSnapshot.docs.forEach(doc => {
          const data = doc.data();
          allUsers.set(doc.id, {
            id: doc.id,
            name: data.name || 'Unknown',
            email: data.email || '',
            joinedAt: data.createdAt,
            status: data.status === 'active' ? 'active' : 'inactive',
            commissionEarned: data.commissionEarned || 0,
            totalSpent: data.totalSpent || 0
          });
        });
        
        // Add users from referredBy query
        referredBySnapshot.docs.forEach(doc => {
          const data = doc.data();
          allUsers.set(doc.id, {
            id: doc.id,
            name: data.name || 'Unknown',
            email: data.email || '',
            joinedAt: data.createdAt,
            status: data.status === 'active' ? 'active' : 'inactive',
            commissionEarned: data.commissionEarned || 0,
            totalSpent: data.totalSpent || 0
          });
        });
        
        const users = Array.from(allUsers.values());
        users.sort((a, b) => b.joinedAt?.getTime?.() - a.joinedAt?.getTime?.());
        
        setReferralUsers(users);
      } catch (error) {
        console.error('Error loading referral users:', error);
        setReferralUsers([]);
      }
    };

    loadReferralUsers();
  }, [user?.id, affiliateStatus.isApproved]);

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

  // Show full affiliate program interface for non-approved users
  if (!affiliateStatus.isApproved) {
    return <AffiliateRegistrationForm onComplete={handleApplicationComplete} />;
  }

  // Show full affiliate dashboard for approved users
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
          </CardContent>
        </Card>

        {/* Commission Rate Section */}
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Your Commission Rate
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your current commission rate based on your rank
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {userCommissionRate}%
              </div>
              <div className="text-lg text-slate-300">
                {getRankInfo(userRank).name}
              </div>
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

};

export default AffiliateProgramInfo;