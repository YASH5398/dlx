import React, { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
// import { useWallet } from '../../hooks/useWallet';
import { useReferral } from '../../hooks/useReferral';
import { firestore } from '../../firebase';
import { collection, query, where, onSnapshot, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import ServiceRequestModal from '../../components/ServiceRequestModal';
import TopEarnersWidget from '../../components/TopEarnersWidget';
import { getRankInfo, getRankDisplayName } from '../../utils/rankSystem';
import { useUserRank } from '../../hooks/useUserRank';
import { useAffiliateStatus } from '../../hooks/useAffiliateStatus';
import AffiliateJoinModal from '../../components/AffiliateJoinModal';
import AffiliateCongratulationsModal from '../../components/AffiliateCongratulationsModal';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Share2, Crown, Sparkles } from 'lucide-react';

import type { ServiceItem } from '../../utils/services';
import { restoreDefaultServiceForms } from '../../utils/services';
import { DEFAULT_SERVICE_FORMS } from '../../utils/serviceFormDefaults';

// Service interface
interface Service {
  id: string;
  name: string;
  description: string;
  startingPrice: string;
  icon: string;
  gradient: string;
  features: string[];
  category: string;
}

interface StaticService {
  id: string;
  name: string;
  description: string;
  startingPrice: string;
  icon: React.ReactNode;
  gradient: string;
  features: string[];
  category: string;
}

export default function DashboardHome() {
  const { user } = useUser();
  // const { wallet } = useWallet();
  const { totalEarnings, activeReferrals, tier, loading: referralsLoading } = useReferral();
  const { userRankInfo } = useUserRank();
  const { affiliateStatus, joinAffiliateProgram, getAffiliateBadgeText, getAffiliateStatusText } = useAffiliateStatus();
  const navigate = useNavigate();
  const [ordersCount, setOrdersCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [affiliateJoinModalOpen, setAffiliateJoinModalOpen] = useState(false);
  const [affiliateCongratulationsModalOpen, setAffiliateCongratulationsModalOpen] = useState(false);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);

  // Real-time wallet subscription for dashboard balances
  const [usdtTotal, setUsdtTotal] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalEarningsComprehensive, setTotalEarningsComprehensive] = useState(0);

  // Check for first-time user and show affiliate modal
  useEffect(() => {
    if (user && !affiliateStatus.isPartner) {
      // Check if this is a first-time user (no previous visits)
      const hasVisitedBefore = localStorage.getItem('dlx_user_visited');
      if (!hasVisitedBefore) {
        setShowFirstTimeModal(true);
        localStorage.setItem('dlx_user_visited', 'true');
      }
    }
  }, [user, affiliateStatus.isPartner]);

  // Show congratulations modal when affiliate gets approved
  useEffect(() => {
    if (affiliateStatus.isApproved && affiliateStatus.isPartner) {
      setAffiliateCongratulationsModalOpen(true);
    }
  }, [affiliateStatus.isApproved, affiliateStatus.isPartner]);

  const handleJoinAffiliate = async () => {
    const success = await joinAffiliateProgram();
    if (success) {
      setAffiliateJoinModalOpen(false);
      setShowFirstTimeModal(false);
      // Show success toast or notification
    }
  };
  const [inrMain, setInrMain] = useState(0);
  // Real-time wallet data fetching - SYNCED WITH WALLET PAGE
  useEffect(() => {
    if (!user?.id) {
      setWalletLoading(false);
      return;
    }
    
    setWalletLoading(true);
    const userDoc = doc(firestore, 'users', user.id);
    const unsub = onSnapshot(userDoc, (snap) => {
      try {
        if (!snap.exists()) {
          console.warn('User document does not exist');
          setUsdtTotal(0);
          setInrMain(0);
          setWalletLoading(false);
          return;
        }

        const data = snap.data() as any || {};
        const w = data.wallet || {};
        const main = Number(w.main || 0);
        const purchase = Number(w.purchase || 0);
        
        // USDT Balance: Combined main + purchase (same as wallet page)
        setUsdtTotal(main + purchase);
        
        // INR Balance: From main wallet (same as wallet page)
        setInrMain(main);
        
        setWalletLoading(false);
        console.log('Dashboard wallet data updated:', { main, purchase, usdtTotal: main + purchase, inrMain: main });
      } catch (error) {
        console.error('Error processing wallet data:', error);
        setUsdtTotal(0);
        setInrMain(0);
        setWalletLoading(false);
      }
    }, (err) => {
      console.error('Dashboard wallet stream failed:', err);
      setUsdtTotal(0);
      setInrMain(0);
      setWalletLoading(false);
    });
    return () => { try { unsub(); } catch {} };
  }, [user?.id]);

  // Fetch total spent amount from orders for level progress
  useEffect(() => {
    if (!user?.id) return;
    
    const ordersQuery = query(
      collection(firestore, 'orders'),
      where('userId', '==', user.id),
      where('status', '==', 'paid')
    );
    
    const unsub = onSnapshot(ordersQuery, (snap) => {
      let totalSpentAmount = 0;
      let totalEarningsAmount = 0;
      
      snap.forEach((doc) => {
        const data = doc.data() as any;
        const amount = Number(data.amountUsd || data.priceInUsd || 0);
        totalSpentAmount += amount;
        
        // Add commission earnings if this user is an affiliate
        if (data.affiliateId === user.id) {
          const commission = amount * 0.25; // 25% commission rate
          totalEarningsAmount += commission;
        }
      });
      
      setTotalSpent(totalSpentAmount);
      
      // Calculate comprehensive total earnings (referral earnings + commission earnings)
      const comprehensiveTotal = (totalEarnings || 0) + totalEarningsAmount;
      setTotalEarningsComprehensive(comprehensiveTotal);
      
      console.log('Total spent and earnings updated:', { 
        totalSpent: totalSpentAmount, 
        totalEarnings: comprehensiveTotal 
      });
    }, (err) => {
      console.error('Orders stream failed:', err);
      setTotalSpent(0);
      setTotalEarningsComprehensive(0);
    });
    
    return () => { try { unsub(); } catch {} };
  }, [user?.id, totalEarnings]);

  // Ensure required Firestore docs exist for this user
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { doc, getDoc, setDoc } = await import('firebase/firestore');
        const uref = doc(firestore, 'users', user.id);
        const usnap = await getDoc(uref);
        if (!usnap.exists()) {
          await setDoc(uref, {
            name: user.name || 'User',
            email: user.email || '',
            referralCount: 0,
            totalEarningsUsd: 0,
            joinedAt: Date.now(),
          });
        } else {
          const d: any = usnap.data() || {};
          const needsPatch = d.name == null || d.email == null || d.joinedAt == null;
          if (needsPatch) {
            await setDoc(
              uref,
              {
                name: d.name ?? user.name ?? 'User',
                email: d.email ?? user.email ?? '',
                joinedAt: d.joinedAt ?? Date.now(),
              },
              { merge: true }
            );
          }
        }
      } catch {}
    })();
  }, [user?.id]);

  // Load services directly from Firestore, map fields, and clean extras
  const gradientForCategory = (cat?: string) => {
    const c = (cat || '').toLowerCase();
    if (c === 'web development') return 'from-purple-500 to-pink-600';
    if (c === 'crypto' || c === 'blockchain') return 'from-blue-500 to-cyan-600';
    if (c === 'marketing') return 'from-teal-500 to-green-600';
    if (c === 'media') return 'from-red-500 to-pink-600';
    if (c === 'ai') return 'from-cyan-500 to-teal-600';
    if (c === 'mlm') return 'from-pink-500 to-rose-600';
    if (c === 'mobile') return 'from-blue-500 to-indigo-600';
    if (c === 'automation') return 'from-emerald-500 to-green-600';
    if (c === 'bot') return 'from-sky-500 to-blue-600';
    if (c === 'security') return 'from-red-500 to-orange-600';
    return 'from-cyan-500 to-blue-600';
  };

  const getDefaultFeatures = (serviceId: string, category?: string) => {
    const featuresMap: Record<string, string[]> = {
      'token': ['Smart Contract Development', 'Token Economics Design', 'Audit & Security'],
      'website': ['Custom Design', 'Responsive Layout', 'SEO Optimization'],
      'chatbot': ['AI Integration', 'Multi-platform Support', 'Natural Language Processing'],
      'mlm': ['Compensation Plans', 'Genealogy System', 'E-wallet Integration'],
      'mobile': ['Cross-platform Development', 'Native Performance', 'App Store Optimization'],
      'automation': ['Process Automation', 'Workflow Design', 'Integration Services'],
      'telegram': ['Custom Commands', 'API Integration', 'User Management'],
      'audit': ['Smart Contract Audit', 'Security Assessment', 'Vulnerability Testing'],
      'landing-page': ['Custom Layout Design', 'Responsive Web Development', 'Hosting & Deployment'],
      'ecommerce-store': ['Shopify / WooCommerce Setup', 'Payment Gateway Integration', 'Product Upload & Basic SEO'],
      'tradingview-indicator': ['Custom Indicator / Strategy', 'Backtesting & Alerts', 'Easy Integration'],
      'social-media-management': ['Monthly Content Plan', 'Post Scheduling & Templates', 'Engagement & Analytics Report'],
      'seo-services': ['Website Audit', 'On-page Optimization', 'Keyword Recommendations'],
      'digital-marketing-campaigns': ['Ads Setup & Targeting', 'Creative Design & Copywriting', 'Analytics & Performance Report'],
      'video-editing': ['Video Cutting & Editing', 'Transitions & Effects', 'Final Render in Multiple Formats'],
      'daily-thumbnails': ['Custom Thumbnail Design', '30/60 Days Delivery', 'High CTR Focused'],
      'email-marketing-setup': ['Mailchimp / SendGrid Setup', 'Workflow Automation', 'Email Template Design'],
      'whatsapp-marketing-software': ['Hidden WhatsApp Automation', 'No API / Zero Cost per Message', 'Easy Setup & Installation Guide'],
    };
    
    return featuresMap[serviceId] || ['Professional Service', 'Quality Assurance', '24/7 Support'];
  };

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(firestore, 'services'));
        const items: ServiceItem[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          items.push({
            id: d.id,
            name: data.title ?? data.name ?? '',
            description: data.description ?? '',
            startingPrice: data.price ?? data.startingPrice ?? '',
            icon: String(data.icon ?? '✨'),
            gradient: gradientForCategory(data.category),
            features: Array.isArray(data.features) ? data.features : getDefaultFeatures(d.id, data.category),
            category: data.category ?? 'General',
          });
        });
        // If Firestore has no services, use static fallback
        setServices(items.length ? items : staticServices);

        // Restore missing service form configs (idempotent)
        await restoreDefaultServiceForms(DEFAULT_SERVICE_FORMS);

        const allowedIds = new Set([
          'token',
          'website',
          'chatbot',
          'mlm',
          'mobile',
          'automation',
          'telegram',
          'audit',
          'landing-page',
          'ecommerce-store',
          'tradingview-indicator',
          'social-media-management',
          'seo-services',
          'digital-marketing-campaigns',
          'video-editing',
          'daily-thumbnails',
          'email-marketing-setup',
          'whatsapp-marketing-software',
        ]);

        if (snap.size > allowedIds.size) {
          const deletions: Promise<any>[] = [];
          snap.forEach((d) => {
            if (!allowedIds.has(d.id)) {
              deletions.push(deleteDoc(doc(firestore, 'services', d.id)));
            }
          });
          if (deletions.length) {
            await Promise.all(deletions);
            const snap2 = await getDocs(collection(firestore, 'services'));
            const items2: ServiceItem[] = [];
            snap2.forEach((d2) => {
              const data2 = d2.data() as any;
              items2.push({
                id: d2.id,
                name: data2.title ?? data2.name ?? '',
                description: data2.description ?? '',
                startingPrice: data2.price ?? data2.startingPrice ?? '',
                icon: String(data2.icon ?? '✨'),
                gradient: gradientForCategory(data2.category),
                features: Array.isArray(data2.features) ? data2.features : getDefaultFeatures(d2.id, data2.category),
                category: data2.category ?? 'General',
              });
            });
            setServices(items2.length ? items2 : staticServices);
          }
        }
      } catch (e) {
        console.warn('Failed to load services from Firestore', e);
        // In case of error, still show static fallback
        setServices(staticServices);
      }
    };
    load();
  }, []);

  // Fallback static list (used if backend is empty)
  const DEFAULT_SERVICES_BASE: Omit<ServiceItem, 'gradient' | 'features'>[] = [
    { id: 'token', name: 'Crypto Token Creation', description: 'Launch your own cryptocurrency with smart contracts, custom tokenomics, and secure blockchain integration.', startingPrice: '$2,999', icon: '🪙', category: 'Crypto' },
    { id: 'chatbot', name: 'Chatbot Development', description: 'AI-powered chatbots for customer service, lead generation, and automated support systems.', startingPrice: '$999', icon: '💬', category: 'ai' },
    { id: 'mlm', name: 'MLM Plan Development', description: 'Complete MLM software with multiple compensation plans, genealogy tree, and commission tracking.', startingPrice: '$350', icon: '📊', category: 'mlm' },
    { id: 'mobile', name: 'Mobile App Development', description: 'Native and cross-platform mobile applications with modern UI/UX and high performance.', startingPrice: '$250', icon: '📱', category: 'mobile' },
    { id: 'automation', name: 'Business Automation', description: 'Automate your business processes and workflows with custom integration and smart automation.', startingPrice: '$1,999', icon: '⚙️', category: 'automation' },
    { id: 'telegram', name: 'Telegram Bot', description: 'Custom Telegram bots with advanced features, payment integration, and user management.', startingPrice: '$799', icon: '🤖', category: 'bot' },
    { id: 'audit', name: 'Crypto Audit', description: 'Comprehensive smart contract security audits with vulnerability assessment and detailed reports.', startingPrice: '$2,499', icon: '🔍', category: 'security' },
    { id: 'landing-page', name: 'Landing Page Creation', description: 'Create a responsive and high-converting landing page with custom design, layout, and hosting-ready setup.', startingPrice: '$45 / ₹4,000', icon: '🎨', category: 'Web Development' },
    { id: 'ecommerce-store', name: 'E-commerce Store Setup', description: 'Launch a full-featured e-commerce store with payment integration, product setup, and basic SEO optimization.', startingPrice: '$190 / ₹16,000', icon: '🛒', category: 'Web Development' },
    { id: 'tradingview-indicator', name: 'TradingView Custom Indicator / Strategy', description: 'Get your personalized TradingView indicator or strategy with alerts and backtesting for automated trading.', startingPrice: '$30 / ₹2,500', icon: '📈', category: 'Crypto' },
    { id: 'social-media-management', name: 'Social Media Management', description: 'Full monthly social media management with content creation, post scheduling, and engagement tracking.', startingPrice: '$20 / ₹1,700 per month', icon: '📱', category: 'Marketing' },
    { id: 'seo-services', name: 'SEO Services', description: 'Optimize your website for better search engine visibility with technical and on-page SEO improvements.', startingPrice: '$50 / ₹4,200', icon: '🔍', category: 'Marketing' },
    { id: 'digital-marketing-campaigns', name: 'Digital Marketing Campaigns', description: 'Setup and manage FB/IG/Google Ads campaigns with creatives, targeting, and performance tracking.', startingPrice: '$20 / ₹1,700', icon: '📊', category: 'Marketing' },
    { id: 'video-editing', name: 'Video Editing Service', description: 'Professional video editing for YouTube, Reels, or promotional content with high-quality output.', startingPrice: '$15 / ₹1,300', icon: '🎬', category: 'Media' },
    { id: 'daily-thumbnails', name: 'Daily Thumbnails Service', description: 'Custom thumbnail creation daily for your YouTube videos or content platform for 30/60 days.', startingPrice: '$5 / ₹450 per thumbnail', icon: '🖼️', category: 'Media' },
    { id: 'email-marketing-setup', name: 'Automated Email Marketing Setup', description: 'Setup automated email campaigns with workflows, templates, and integrations for better engagement.', startingPrice: '$30 / ₹2,500', icon: '📧', category: 'Marketing' },
    { id: 'whatsapp-marketing-software', name: 'WhatsApp Marketing Hidden Software', description: 'Get a cost-effective WhatsApp marketing software without API cost, fully automated for campaigns.', startingPrice: '$30 / ₹2,500', icon: '💬', category: 'Marketing' },
    { id: 'website', name: 'Website Development', description: 'Custom, responsive website with modern design and SEO optimization.', startingPrice: '$1,499', icon: '🖥️', category: 'Web Development' },
  ];

  const staticServices: ServiceItem[] = DEFAULT_SERVICES_BASE.map((s) => ({
    ...s,
    gradient: gradientForCategory(s.category),
    features: getDefaultFeatures(s.id, s.category),
  }));

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (!user?.id) return;
    const q = query(collection(firestore, 'orders'), where('userId', '==', user.id));
    const unsub = onSnapshot(q, (snap) => {
      setOrdersCount(snap.size);
    });
    return () => { try { unsub(); } catch {} };
  }, [user?.id]);

  // Compute progress towards next level based on total spent amount
  useEffect(() => {
    const r = activeReferrals || 0;
    const spent = totalSpent || 0; // Use actual total spent amount

    // Rank progression thresholds based on total spent amount
    const rankThresholds = {
      'starter': { minSpending: 0, minReferrals: 0 },
      'dlx-associate': { minSpending: 400, minReferrals: 5 }, // $400 spent → DLX Associate
      'dlx-executive': { minSpending: 2000, minReferrals: 15 }, // $2000 spent → DLX Executive  
      'dlx-director': { minSpending: 10000, minReferrals: 30 }, // $10000 spent → DLX Director
      'dlx-president': { minSpending: 50000, minReferrals: 50 } // $50000 spent → DLX President
    };

    // Determine current rank based on spending
    let currentRank = 'starter';
    let nextRank = 'dlx-associate';
    let nextThreshold = rankThresholds['dlx-associate'];

    if (spent >= rankThresholds['dlx-president'].minSpending && r >= rankThresholds['dlx-president'].minReferrals) {
      currentRank = 'dlx-president';
      setProgress(100);
      return;
    } else if (spent >= rankThresholds['dlx-director'].minSpending && r >= rankThresholds['dlx-director'].minReferrals) {
      currentRank = 'dlx-director';
      nextRank = 'dlx-president';
      nextThreshold = rankThresholds['dlx-president'];
    } else if (spent >= rankThresholds['dlx-executive'].minSpending && r >= rankThresholds['dlx-executive'].minReferrals) {
      currentRank = 'dlx-executive';
      nextRank = 'dlx-director';
      nextThreshold = rankThresholds['dlx-director'];
    } else if (spent >= rankThresholds['dlx-associate'].minSpending && r >= rankThresholds['dlx-associate'].minReferrals) {
      currentRank = 'dlx-associate';
      nextRank = 'dlx-executive';
      nextThreshold = rankThresholds['dlx-executive'];
    }

    // Calculate progress towards next rank
    const currentThreshold = rankThresholds[currentRank as keyof typeof rankThresholds];
    const spendingProgress = Math.min(1, spent / nextThreshold.minSpending);
    const referralProgress = Math.min(1, r / nextThreshold.minReferrals);
    
    // Progress is based on both spending and referrals (both must be met)
    const pct = Math.min(100, Math.min(spendingProgress, referralProgress) * 100);
    setProgress(Number(pct.toFixed(1)));
    
    console.log('Level progress updated:', { 
      currentRank, 
      nextRank, 
      spent, 
      referrals: r, 
      progress: pct 
    });
  }, [activeReferrals, totalSpent, tier]);

  const levelLabel = tier === 1 ? 'Starter' : tier === 2 ? 'Silver' : 'Gold';

  // Map Firestore service ids to default form names used in DEFAULT_SERVICE_FORMS
  const DEFAULT_FORM_NAME_BY_ID: Record<string, string> = {
    token: 'Crypto Token Creation',
    website: 'Website Development',
    chatbot: 'Chatbot Development',
    mlm: 'MLM Plan Development',
    mobile: 'Mobile App Development',
    automation: 'Business Automation',
    telegram: 'Telegram Bot',
    audit: 'Crypto Audit',
    'landing-page': 'Landing Page Creation',
    'ecommerce-store': 'E-commerce Store Setup',
    'tradingview-indicator': 'TradingView Custom Indicator / Strategy',
    'social-media-management': 'Social Media Management',
    'seo-services': 'SEO Services',
    'digital-marketing-campaigns': 'Digital Marketing Campaigns',
    'video-editing': 'Video Editing Service',
    'daily-thumbnails': 'Daily Thumbnails Service',
    'email-marketing-setup': 'Automated Email Marketing Setup',
    'whatsapp-marketing-software': 'WhatsApp Marketing Hidden Software',
  };

  const handleGetService = (serviceId: string) => {
    const svc = services.find((s) => s.id === serviceId);
    const fallbackName = svc?.name || '';
    const mappedName = DEFAULT_FORM_NAME_BY_ID[serviceId] ?? fallbackName;
    setSelectedService(mappedName);
    setModalOpen(true);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-600/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-600/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          
          {/* Welcome Header */}
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                  <span className="text-slate-200">Welcome back, </span>
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    {user?.name || 'User'}
                  </span>
                  <span className="inline-block ml-2">👋</span>
                </h1>
                <p className="text-slate-400 text-base sm:text-lg">
                  Here's your <span className="font-semibold text-cyan-400">Digilinex</span> dashboard overview
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className={`px-3 py-2 rounded-xl backdrop-blur-sm shadow-lg border ${userRankInfo.bgColor} ${userRankInfo.borderColor}`}>
                  <p className="text-xs text-slate-400 mb-0.5">Current Rank</p>
                  <p className={`text-sm sm:text-lg font-bold ${userRankInfo.textColor}`}>
                    {userRankInfo.displayName}
                  </p>
                </div>
                {getAffiliateBadgeText() && (
                  <div className="px-3 py-2 rounded-xl backdrop-blur-sm shadow-lg border border-green-500/50 bg-green-500/10">
                    <p className="text-xs text-green-400 mb-0.5">Affiliate Status</p>
                    <p className="text-sm sm:text-lg font-bold text-green-400">
                      {getAffiliateBadgeText()}
                    </p>
                  </div>
                )}
                {!affiliateStatus.isPartner && (
                  <Button
                    onClick={() => navigate('/affiliate-program')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                  >
                    <Crown className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Join Affiliate</span>
                    <span className="sm:hidden">Join</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            
            {/* Earnings Card (USD from referrals) */}
            <div className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-cyan-500/20 hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700/50 hover:border-cyan-500/50">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                    <span className="text-2xl">💎</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                    USD
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">Total Earnings</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  ${Number(totalEarningsComprehensive || 0).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-2">Referral + Commission Earnings</p>
              </div>
              <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
            </div>


            {/* USDT Balance Card */}
            <div className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-emerald-500/20 hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700/50 hover:border-emerald-500/50">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                    <span className="text-2xl">💵</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                    USDT
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">USDT Balance</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  {walletLoading ? 'Loading...' : `$${Number(usdtTotal || 0).toFixed(2)}`}
                </p>
                <p className="text-xs text-slate-500 mt-2">Available in Wallet</p>
              </div>
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-600"></div>
            </div>
            {/* INR Balance Card */}
            <div className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-orange-500/20 hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700/50 hover:border-orange-500/50">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/50">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold">
                    INR
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">INR Balance</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  {walletLoading ? 'Loading...' : `₹${Number(inrMain || 0).toFixed(2)}`}
                </p>
                <p className="text-xs text-slate-500 mt-2">Available in Wallet</p>
              </div>
              <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-600"></div>
            </div>

            {/* Active Referrals Card */}
            <div className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-purple-500/20 hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700/50 hover:border-purple-500/50">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                    Live
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">Active Referrals</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {referralsLoading ? 'Loading...' : (activeReferrals || 0)}
                </p>
                <p className="text-xs text-slate-500 mt-2">Total Referrals • Orders: {ordersCount}</p>
              </div>
              <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
            </div>

            {/* Affiliate Status Card */}
            <div className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-green-500/20 hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700/50 hover:border-green-500/50">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/50">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-semibold">
                    {affiliateStatus.isApproved ? 'Active' : affiliateStatus.isPending ? 'Pending' : 'Inactive'}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">Affiliate Partner</h3>
                <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {getAffiliateStatusText()}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Commission: {userRankInfo.commissionPercentage}% • Earnings: ${affiliateStatus.totalEarnings.toFixed(2)}
                </p>
              </div>
              <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
            </div>
          </div>

          {/* Level Progress Card */}
          <div className="mb-8">
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-200">Level Progress</h3>
                    <p className="text-sm text-slate-400">
                      Complete more referrals or sell services to level up
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {progress.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500">Progress</p>
                </div>
              </div>
              <div className="relative">
                <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden shadow-inner border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden shadow-lg shadow-indigo-500/50"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Earners Widget */}
          <div className="mb-8">
            <TopEarnersWidget />
          </div>

          {/* Affiliate Partner CTA */}
          <div className="mb-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl shadow-2xl border border-emerald-500/50">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_50%)] animate-pulse"></div>
              </div>
              
              <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                  
                  {/* Icon Section */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border-2 border-white/30">
                      <span className="text-5xl sm:text-6xl">🤝</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 text-center lg:text-left">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                      Become an Affiliate Partner
                    </h2>
                    <div className="space-y-2 mb-4">
                      <p className="text-white/95 text-base sm:text-lg font-medium">
                        🎯 Earn <span className="font-bold text-yellow-300">30-40% commission</span> on each sale!
                      </p>
                      <p className="text-white/90 text-sm sm:text-base">
                        💰 Sell digital services worth <span className="font-semibold">$400/month</span> (just 3 clients)
                      </p>
                      <p className="text-white/90 text-sm sm:text-base">
                        💵 Easily make <span className="font-bold text-yellow-300">$400-$500 monthly</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                        <span className="text-lg">✅</span>
                        <span className="text-white text-sm font-medium">High Commission</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                        <span className="text-lg">⚡</span>
                        <span className="text-white text-sm font-medium">Fast Payouts</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                        <span className="text-lg">🎁</span>
                        <span className="text-white text-sm font-medium">Bonus Rewards</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => navigate('/affiliate-program')}
                      className="group relative px-8 py-4 bg-white text-emerald-600 rounded-xl font-bold text-lg shadow-2xl hover:shadow-emerald-400/50 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Join Now
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    </button>
                  </div>

                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-300/10 rounded-full blur-3xl"></div>
            </div>
          </div>

          {/* Services Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-200 mb-1">
                  Our Services
                </h2>
                <p className="text-slate-400 text-sm sm:text-base">
                  Browse and request premium digital services
                </p>
              </div>
              
              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-sm"
                  />
                </div>
                
                {/* Category Filter */}
                <div className="w-full sm:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-sm"
                  >
                    <option value="All">All Categories</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Media">Media</option>
                    <option value="blockchain">Blockchain</option>
                    <option value="ai">AI</option>
                    <option value="mlm">MLM</option>
                    <option value="mobile">Mobile</option>
                    <option value="automation">Automation</option>
                    <option value="bot">Bot</option>
                    <option value="security">Security</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700/50 hover:border-cyan-500/50 hover:-translate-y-1"
                >
                  {/* Gradient Overlay on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  <div className="relative p-4 sm:p-6">
                    {/* Icon */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-2xl sm:text-3xl shadow-lg mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      {service.icon}
                    </div>
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                      <span className="px-2 py-1 text-xs font-semibold bg-slate-700/60 backdrop-blur-sm text-slate-300 rounded-full border border-slate-600/50">
                        {service.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-slate-200 mb-2 leading-tight">
                      {service.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4 line-clamp-3 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Price */}
                    <div className="mb-3 sm:mb-4">
                      <p className="text-xs text-slate-500 mb-1">Starting at</p>
                      <p className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent`}>
                        {service.startingPrice}
                      </p>
                    </div>

                    {/* Commission Info - Only for Affiliates */}
                    {affiliateStatus.isApproved && (
                      <div className="mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                        <div className="text-center">
                          <p className="text-xs text-slate-400 mb-1">Your Commission</p>
                          <p className={`text-lg sm:text-2xl font-bold ${userRankInfo.textColor}`}>
                            {userRankInfo.commissionPercentage}%
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Share Button for Affiliates */}
                    {affiliateStatus.isApproved && (
                      <div className="mb-3 sm:mb-4">
                        <Button
                          onClick={() => {
                            const referralLink = `${window.location.origin}/signup?ref=${user?.id}`;
                            navigator.clipboard.writeText(referralLink);
                            // Show success toast
                          }}
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                        >
                          <Share2 className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Share & Earn {userRankInfo.commissionPercentage}%</span>
                          <span className="sm:hidden">Share & Earn</span>
                        </Button>
                      </div>
                    )}

                    {/* Features */}
                    <ul className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
                      {(service.features ?? []).slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleGetService(service.id)}
                      className={`w-full py-2 sm:py-3 rounded-xl bg-gradient-to-r ${service.gradient} text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base`}
                    >
                      Get Service
                    </button>
                  </div>

                  {/* Bottom Accent Line */}
                  <div className={`h-1 bg-gradient-to-r ${service.gradient}`}></div>
                </div>
              ))}
            </div>

            {/* No Results Message */}
            {filteredServices.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 flex items-center justify-center">
                  <span className="text-5xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-200 mb-2">
                  No services found
                </h3>
                <p className="text-slate-400">
                  Try adjusting your search terms
                </p>
              </div>
            )}

            {/* Promotional Banner */}
            <div className="mt-16 p-8 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-2xl">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-200 mb-4">
                  Explore More High-Value Services
                </h3>
                <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                  Discover our premium offerings including Crypto Token Creation, Landing Pages, E-commerce Setup, 
                  and advanced automation solutions. Transform your business with our expert services.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <span className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
                    🪙 Crypto Token Creation
                  </span>
                  <span className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                    🎨 Landing Pages
                  </span>
                  <span className="px-4 py-2 bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
                    🛒 E-commerce Setup
                  </span>
                  <span className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded-full border border-orange-500/30">
                    📈 TradingView Indicators
                  </span>
                  <span className="px-4 py-2 bg-pink-500/20 text-pink-300 rounded-full border border-pink-500/30">
                    📱 Social Media Management
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Service Request Modal */}
      {selectedService && (
        <ServiceRequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          serviceName={selectedService}
        />
      )}

      {/* Affiliate Join Modal */}
      <AffiliateJoinModal
        isOpen={affiliateJoinModalOpen}
        onClose={() => setAffiliateJoinModalOpen(false)}
        onJoin={handleJoinAffiliate}
        isFirstTime={false}
      />

      {/* First Time User Modal */}
      <AffiliateJoinModal
        isOpen={showFirstTimeModal}
        onClose={() => setShowFirstTimeModal(false)}
        onJoin={handleJoinAffiliate}
        isFirstTime={true}
      />

      {/* Congratulations Modal */}
      <AffiliateCongratulationsModal
        isOpen={affiliateCongratulationsModalOpen}
        onClose={() => setAffiliateCongratulationsModalOpen(false)}
        commissionRate={userRankInfo.commissionPercentage}
      />

      {/* Add custom animation keyframes to your global CSS or Tailwind config */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
}
