import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../context/UserContext';
// import { useWallet } from '../../hooks/useWallet';
import { useReferral } from '../../hooks/useReferral';
import { firestore } from '../../firebase';
import { collection, query, where, onSnapshot, getDocs, doc, deleteDoc, addDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import ServiceRequestModal from '../../components/ServiceRequestModal';
import TopEarnersWidget from '../../components/TopEarnersWidget';
import { getRankInfo, getRankDisplayName } from '../../utils/rankSystem';
import { useUserRank } from '../../hooks/useUserRank';
import { useAffiliateStatus } from '../../hooks/useAffiliateStatus';
import { useAffiliateBannerVisibility } from '../../hooks/useAffiliateBannerVisibility';
import { useActiveServices } from '../../hooks/useServices';
import { useDigitalProducts } from '../../hooks/useDigitalProducts';
import AffiliateJoinModal from '../../components/AffiliateJoinModal';
import AffiliateCongratulationsModal from '../../components/AffiliateCongratulationsModal';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Share2, Crown, Sparkles, CheckCircle, TrendingUp, Package, ShoppingCart, ArrowRight, X, AlertCircle, DollarSign, Download, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';

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
  const { affiliateStatus, joinAffiliateProgram, getAffiliateBadgeText, getAffiliateStatusText, canJoinAffiliate, canReapply } = useAffiliateStatus();
  const { shouldHideBanners } = useAffiliateBannerVisibility();
  const navigate = useNavigate();
  const [ordersCount, setOrdersCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [affiliateJoinModalOpen, setAffiliateJoinModalOpen] = useState(false);
  const [affiliateCongratulationsModalOpen, setAffiliateCongratulationsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const { services: activeServices, loading: servicesLoading } = useActiveServices();
  const { products: digitalProducts, loading: productsLoading } = useDigitalProducts();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [currency, setCurrency] = useState<'USDT' | 'INR'>('USDT');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [purchaseOption, setPurchaseOption] = useState<'main_only' | 'split' | 'currency_choice'>('split');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showFailurePopup, setShowFailurePopup] = useState(false);

  // Popups persist until user action (no auto-hide)

  const [walletBalances, setWalletBalances] = useState<{
    mainUsdt: number;
    purchaseUsdt: number;
    mainInr: number;
    purchaseInr: number;
  }>({
    mainUsdt: 0,
    purchaseUsdt: 0,
    mainInr: 0,
    purchaseInr: 0,
  });

  // Banner slider state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const bannerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  // Banner data with high-quality professional images
  const banners = [
    {
      id: 1,
      title: "Our Services",
      subtitle: "Professional Development & Marketing Solutions",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2126&q=90",
      gradient: "from-blue-600 to-cyan-600",
      overlayGradient: "from-slate-900/70 to-slate-800/70",
      route: "scroll-to-services"
    },
    {
      id: 2,
      title: "Digital Products Store",
      subtitle: "Premium Digital Assets & Tools",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=90",
      gradient: "from-purple-600 to-pink-600",
      overlayGradient: "from-slate-900/70 to-slate-800/70",
      route: "/dashboard/digital-products"
    },
    {
      id: 3,
      title: "Join Our Affiliate Program",
      subtitle: "Earn 20%–45% Commission per Sale",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=90",
      gradient: "from-orange-600 to-red-600",
      overlayGradient: "from-slate-900/70 to-slate-800/70",
      route: "/affiliate-program"
    },
    {
      id: 4,
      title: "Database & Marketing Tools",
      subtitle: "Find Your Category & Get 50% Discount",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=90",
      gradient: "from-green-600 to-emerald-600",
      overlayGradient: "from-slate-900/70 to-slate-800/70",
      route: "/database-marketing/categories"
    },
    {
      id: 5,
      title: "Work With Us",
      subtitle: "We're Hiring (Remote Jobs Available)",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=90",
      gradient: "from-indigo-600 to-blue-600",
      overlayGradient: "from-slate-900/70 to-slate-800/70",
      route: "/work-with-us"
    }
  ];

  // Real-time wallet subscription for dashboard balances
  const [usdtTotal, setUsdtTotal] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalEarningsComprehensive, setTotalEarningsComprehensive] = useState(0);

  // Banner slider functions
  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToBanner = (index: number) => {
    setCurrentBannerIndex(index);
  };

  const handleBannerClick = (route: string) => {
    if (route === "scroll-to-services") {
      // Scroll to services section
      const servicesSection = document.getElementById('services-section');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(route);
    }
  };

  // Auto-play banner slider
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        nextBanner();
      }, 4000); // Change banner every 4 seconds
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying]);

  // Pause auto-play on hover
  const handleBannerHover = () => {
    setIsAutoPlaying(false);
  };

  const handleBannerLeave = () => {
    setIsAutoPlaying(true);
  };

  // Image loading handler
  const handleImageLoad = (bannerId: number) => {
    setLoadedImages(prev => new Set(prev).add(bannerId));
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextBanner();
    } else if (isRightSwipe) {
      prevBanner();
    }
  };

  // Removed automatic affiliate popup - users must manually join

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
      // Show success toast or notification
    }
  };
  const [inrMain, setInrMain] = useState(0);
  // Real-time wallet data fetching - CANONICAL WALLETS COLLECTION
  useEffect(() => {
    if (!user?.id) {
      setWalletLoading(false);
      return;
    }
    
    setWalletLoading(true);
    const walletDoc = doc(firestore, 'wallets', user.id);
    const unsub = onSnapshot(walletDoc, (snap) => {
      try {
        if (!snap.exists()) {
          console.warn('Dashboard: Wallet document does not exist for user:', user.id);
          console.warn('Dashboard: This may cause the $900 discrepancy. Creating wallet document...');
          
          // Try to create the wallet document if it doesn't exist
          const { setDoc, serverTimestamp } = require('firebase/firestore');
          setDoc(walletDoc, {
            usdt: { mainUsdt: 0, purchaseUsdt: 0 },
            inr: { mainInr: 0, purchaseInr: 0 },
            dlx: 0,
            walletUpdatedAt: serverTimestamp()
          }).then(() => {
            console.log('Dashboard: Wallet document created successfully');
          }).catch((err: any) => {
            console.error('Dashboard: Failed to create wallet document:', err);
          });
          
          setUsdtTotal(0);
          setInrMain(0);
          setWalletLoading(false);
          return;
        }

        const data = snap.data() as any || {};
        const usdt = data.usdt || {};
        const inr = data.inr || {};
        
        const mainUsdt = Number(usdt.mainUsdt || 0);
        const purchaseUsdt = Number(usdt.purchaseUsdt || 0);
        const mainInr = Number(inr.mainInr || 0);
        const purchaseInr = Number(inr.purchaseInr || 0);
        
        // USDT Balance: Combined main + purchase (canonical calculation)
        const usdtTotal = mainUsdt + purchaseUsdt;
        const inrTotal = mainInr + purchaseInr;
        
        setUsdtTotal(usdtTotal);
        setInrMain(inrTotal);
        
        // Update wallet balances for checkout
        setWalletBalances({
          mainUsdt,
          purchaseUsdt,
          mainInr,
          purchaseInr,
        });
        
        setWalletLoading(false);
        console.log('Dashboard: Wallet data updated (canonical):', { 
          mainUsdt, 
          purchaseUsdt, 
          usdtTotal,
          mainInr,
          purchaseInr,
          inrTotal,
          rawData: data
        });
      } catch (error) {
        console.error('Dashboard: Error processing wallet data:', error);
        setUsdtTotal(0);
        setInrMain(0);
        setWalletLoading(false);
      }
    }, (err) => {
      console.error('Dashboard: Wallet stream failed:', err);
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

  // Fetch additional earnings data from user document
  useEffect(() => {
    if (!user?.id) return;
    
    const userDoc = doc(firestore, 'users', user.id);
    const unsub = onSnapshot(userDoc, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        const totalEarningsFromUser = Number(data.totalEarningsUsd || 0);
        const referralEarningsFromUser = Number(data.referralEarnings || 0);
        
        // Use the referral hook's totalEarnings as primary source
        const comprehensiveTotal = totalEarnings + (totalEarningsFromUser - totalEarnings);
        setTotalEarningsComprehensive(comprehensiveTotal);
        
        console.log('Dashboard: User earnings data updated:', { 
          totalEarningsFromUser,
          referralEarningsFromUser,
          referralTotalEarnings: totalEarnings,
          comprehensiveTotal
        });
      }
    }, (err) => {
      console.error('Dashboard: User document stream failed:', err);
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
        // Use the new service management system for real-time updates
        if (activeServices.length > 0) {
          const items: ServiceItem[] = activeServices.map(service => ({
            id: service.id,
            name: service.title,
            description: service.description,
            startingPrice: service.price,
            icon: service.icon,
            gradient: gradientForCategory(service.category),
            features: service.features || getDefaultFeatures(service.id, service.category),
            category: service.category,
          }));
          setServices(items);
        } else {
          // Fallback to static services if no active services
          setServices(staticServices);
        }

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

        const snap = await getDocs(collection(firestore, 'services'));
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
  }, [activeServices]);

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

  // Limit services to 10 initially, show all if showAllServices is true
  const displayedServices = showAllServices ? filteredServices : filteredServices.slice(0, 10);
  
  // Limit digital products to 10 initially, show all if showAllProducts is true
  const displayedProducts = showAllProducts ? digitalProducts : digitalProducts.slice(0, 10);

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

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setShowProductModal(true);
    setPurchaseOption('split'); // Reset to default
    setCurrency('USDT'); // Reset to default
  };

  const doPurchase = async () => {
    if (!user || !selectedProduct) return;

    setProcessing(true);
    const walletRef = doc(firestore, "wallets", user.id);
    const ordersRef = collection(firestore, "orders");
    const productPrice = Number(selectedProduct.priceUsd ?? selectedProduct.price ?? 0);
    const commissionUsd = Number((productPrice * 0.7).toFixed(2));

    try {
      await runTransaction(firestore, async (tx) => {
        const walletSnap = await tx.get(walletRef);
        if (!walletSnap.exists()) {
          throw new Error("Wallet not found. Please set up your wallet first.");
        }
        const w = walletSnap.data() as any;

        // Determine payment amount and currency based on purchase option
        let paymentAmount: number;
        let currencyToUse: string;
        
        if (purchaseOption === "currency_choice") {
          currencyToUse = currency;
          paymentAmount = currency === "INR" ? Math.round(productPrice * 84) : productPrice; // USD_TO_INR = 84
        } else {
          currencyToUse = "USDT"; // Default to USDT for main_only and split options
          paymentAmount = productPrice;
        }

        // Check balance and deduct based on purchase option
        if (purchaseOption === "main_only") {
          // Pay from main wallet only
          if (currencyToUse === "USDT") {
            const mainWallet = Number(w?.usdt?.mainUsdt || 0);
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main wallet. Please deposit more funds.");
            }
            tx.update(walletRef, { 
              "usdt.mainUsdt": Number((mainWallet - paymentAmount).toFixed(2))
            });
          } else {
            const mainWallet = Number(w?.inr?.mainInr || 0);
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main wallet. Please deposit more funds.");
            }
            tx.update(walletRef, { 
              "inr.mainInr": mainWallet - paymentAmount
            });
          }
        } else if (purchaseOption === "split") {
          // Dynamic split: prefer 50/50, fall back to whatever is available in purchase wallet, rest from main
          if (currencyToUse === "USDT") {
            const mainWallet = Number(w?.usdt?.mainUsdt || 0);
            const purchaseWallet = Number(w?.usdt?.purchaseUsdt || 0);
            const totalAvailable = Number((mainWallet + purchaseWallet).toFixed(2));
            if (totalAvailable < paymentAmount) {
              throw new Error("Not enough balance across wallets. Please deposit funds to continue.");
            }
            const idealPurchase = Number((paymentAmount / 2).toFixed(2));
            const idealMain = Number((paymentAmount - idealPurchase).toFixed(2));
            const mainDeficit = Math.max(0, idealMain - mainWallet);
            const takeFromPurchase = Math.min(purchaseWallet, Number((idealPurchase + mainDeficit).toFixed(2)));
            const takeFromMain = Number((paymentAmount - takeFromPurchase).toFixed(2));
            tx.update(walletRef, {
              "usdt.mainUsdt": Number((mainWallet - takeFromMain).toFixed(2)),
              "usdt.purchaseUsdt": Number((purchaseWallet - takeFromPurchase).toFixed(2))
            });
          } else {
            const mainWallet = Number(w?.inr?.mainInr || 0);
            const purchaseWallet = Number(w?.inr?.purchaseInr || 0);
            const totalAvailable = mainWallet + purchaseWallet;
            if (totalAvailable < paymentAmount) {
              throw new Error("Not enough balance across wallets. Please deposit funds to continue.");
            }
            const idealPurchase = Math.floor(paymentAmount / 2);
            const idealMain = paymentAmount - idealPurchase;
            const mainDeficit = Math.max(0, idealMain - mainWallet);
            const takeFromPurchase = Math.min(purchaseWallet, idealPurchase + mainDeficit);
            const takeFromMain = paymentAmount - takeFromPurchase;
            tx.update(walletRef, {
              "inr.mainInr": mainWallet - takeFromMain,
              "inr.purchaseInr": purchaseWallet - takeFromPurchase
            });
          }
        } else if (purchaseOption === "currency_choice") {
          // Pay from main wallet with chosen currency
          if (currencyToUse === "USDT") {
            const mainWallet = Number(w?.usdt?.mainUsdt || 0);
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main wallet. Please deposit more funds.");
            }
            tx.update(walletRef, { 
              "usdt.mainUsdt": Number((mainWallet - paymentAmount).toFixed(2))
            });
          } else {
            const mainWallet = Number(w?.inr?.mainInr || 0);
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main wallet. Please deposit more funds.");
            }
            tx.update(walletRef, { 
              "inr.mainInr": mainWallet - paymentAmount
            });
          }
        }

        // Create order document with required fields (align with main section)
        const orderRef = doc(ordersRef);
        tx.set(orderRef, {
          userId: user.id,
          productId: selectedProduct.id,
          productName: selectedProduct.title,
          amountUsd: productPrice,
          productLink: selectedProduct.downloadUrl ?? selectedProduct.productLink ?? "",
          status: "Completed",
          purchaseOption: purchaseOption,
          currency: currencyToUse,
          timestamp: serverTimestamp(),
        });
      });

      setShowSuccessPopup(true);
      setShowProductModal(false);
      setSelectedProduct(null);
    } catch (e: any) {
      if (e?.message?.includes("Insufficient") || e?.message?.includes("balance")) {
        setShowFailurePopup(true);
      } else {
        setToast({ message: e?.message || "Payment failed. Please try again.", type: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setProcessing(false);
    }
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

        <div className="relative max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          
          {/* Welcome Header */}
          <div className="mb-8 sm:mb-12 px-4 sm:px-0">
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
                {canJoinAffiliate() && !shouldHideBanners && !affiliateStatus.isApproved && (
                  <Button
                    onClick={() => navigate('/affiliate-program')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                  >
                    <Crown className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Join Our Affiliate Program</span>
                    <span className="sm:hidden">Join Affiliate Program</span>
                  </Button>
                )}
                {canReapply() && !shouldHideBanners && !affiliateStatus.isApproved && (
                  <Button
                    onClick={() => navigate('/affiliate-program')}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                  >
                    <Crown className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Reapply</span>
                    <span className="sm:hidden">Reapply</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Banner Slider */}
          <div className="mb-8 sm:mb-12 px-0 sm:px-6 lg:px-8">
            <div 
              className="relative overflow-hidden rounded-none sm:rounded-2xl bg-slate-800/40 backdrop-blur-sm border-0 sm:border border-slate-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300"
              onMouseEnter={handleBannerHover}
              onMouseLeave={handleBannerLeave}
              style={{ margin: 0, padding: 0 }}
            >
              {/* Banner Container */}
              <div 
                ref={bannerRef}
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {banners.map((banner, index) => (
                  <div
                    key={banner.id}
                    className="w-full flex-shrink-0 cursor-pointer touch-manipulation"
                    onClick={() => handleBannerClick(banner.route)}
                    style={{ width: '100%' }}
                  >
                    <div className="relative h-48 sm:h-48 md:h-56 rounded-none sm:rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300" style={{ margin: 0, padding: 0 }}>
                      {/* Background Image - Full Size No Gaps */}
                      <div 
                        className={`absolute inset-0 transition-opacity duration-500 ${
                          loadedImages.has(banner.id) ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ 
                          backgroundImage: `url(${banner.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center center',
                          backgroundRepeat: 'no-repeat',
                          width: '100%',
                          height: '100%',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          margin: 0,
                          padding: 0
                        }}
                      />
                      
                      {/* Fallback Gradient Background */}
                      <div 
                        className={`absolute inset-0 bg-gradient-to-r ${banner.gradient} transition-opacity duration-500 ${
                          loadedImages.has(banner.id) ? 'opacity-0' : 'opacity-100'
                        }`}
                        style={{ 
                          width: '100%',
                          height: '100%',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          margin: 0,
                          padding: 0
                        }}
                      />
                      
                      {/* Dark Overlay for Text Readability */}
                      <div 
                        className={`absolute inset-0 bg-gradient-to-r ${banner.overlayGradient}`}
                        style={{ 
                          width: '100%',
                          height: '100%',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          margin: 0,
                          padding: 0
                        }}
                      />
                      
                      {/* Content - Positioned to avoid overlap with navigation */}
                      <div className="relative h-full flex flex-col sm:flex-row items-center justify-between px-6 sm:px-8 md:px-12 py-6 sm:py-8 z-10">
                        <div className="flex-1 w-full sm:w-auto">
                          <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r ${banner.gradient} bg-clip-text text-transparent leading-tight mb-3 drop-shadow-2xl`}>
                            {banner.title}
                          </h3>
                          <p className="text-white/95 text-sm sm:text-base md:text-lg font-medium leading-relaxed drop-shadow-lg max-w-md">
                            {banner.subtitle}
                          </p>
                        </div>
                        
                        {/* Action Button */}
                        <div className="flex items-center gap-3 mt-4 sm:mt-0">
                          <div className={`px-4 py-3 sm:px-6 sm:py-3 rounded-xl bg-gradient-to-r ${banner.gradient} text-white font-semibold text-sm sm:text-base group-hover:scale-105 transition-transform duration-200 whitespace-nowrap shadow-xl backdrop-blur-sm`}>
                            Explore Now
                          </div>
                          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-1 transition-transform duration-200 drop-shadow-lg" />
                        </div>
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Hidden Image for Preloading */}
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="hidden"
                        onLoad={() => handleImageLoad(banner.id)}
                        onError={() => handleImageLoad(banner.id)} // Still mark as loaded to show fallback
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows - Positioned outside image area */}
              <button
                onClick={prevBanner}
                className="absolute left-2 sm:-left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/95 hover:bg-slate-700/95 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 shadow-xl backdrop-blur-sm touch-manipulation border border-slate-600/50"
                aria-label="Previous banner"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <button
                onClick={nextBanner}
                className="absolute right-2 sm:-right-6 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/95 hover:bg-slate-700/95 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 shadow-xl backdrop-blur-sm touch-manipulation border border-slate-600/50"
                aria-label="Next banner"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Dots Indicator - Positioned below image area */}
              <div className="absolute bottom-4 sm:-bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 sm:gap-3">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToBanner(index)}
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-200 touch-manipulation ${
                      index === currentBannerIndex 
                        ? 'bg-slate-300 scale-125 shadow-lg' 
                        : 'bg-slate-500/60 hover:bg-slate-400/80 hover:scale-110'
                    }`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 px-4 sm:px-0">
            
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

          {/* Compact Affiliate Partner CTA - Only show for users who can join */}
          {canJoinAffiliate() && !shouldHideBanners && !affiliateStatus.isApproved && (
            <div className="mb-8">
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl border border-purple-500/30">
                {/* Animated Background */}
                <div className="absolute inset-0">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-2xl animate-pulse animation-delay-2000"></div>
                </div>
                
                <div className="relative p-6 sm:p-8">
                  <div className="flex flex-col lg:flex-row items-center gap-6">
                    {/* Icon & Header */}
                    <div className="flex-shrink-0 text-center lg:text-left">
                      <div className="w-16 h-16 mx-auto lg:mx-0 mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <Crown className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        Join Our Affiliate Program
                      </h2>
                      <p className="text-slate-300 text-sm sm:text-base">
                        Earn <span className="text-yellow-300 font-semibold">30-40% commission</span> on every sale
                      </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-300">30-40%</div>
                        <div className="text-xs text-slate-400">Commission</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cyan-300">$400+</div>
                        <div className="text-xs text-slate-400">Monthly</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-300">Instant</div>
                        <div className="text-xs text-slate-400">Payouts</div>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => navigate('/affiliate-program')}
                        className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          Join Now
                        </span>
                      </button>
                      <button
                        onClick={() => navigate('/affiliate-program/info')}
                        className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reapply CTA - Only show for rejected users */}
          {canReapply() && !shouldHideBanners && !affiliateStatus.isApproved && (
            <div className="mb-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 rounded-2xl shadow-2xl border border-orange-500/50">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_50%)] animate-pulse"></div>
              </div>
              
              <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                  
                  {/* Icon Section */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border-2 border-white/30">
                      <span className="text-5xl sm:text-6xl">🔄</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 text-center lg:text-left">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                      Reapply to Affiliate Program
                    </h2>
                    <div className="space-y-2 mb-4">
                      <p className="text-white/95 text-base sm:text-lg font-medium">
                        🎯 Your previous application wasn't approved, but you can reapply anytime!
                      </p>
                      <p className="text-white/90 text-sm sm:text-base">
                        💰 Earn <span className="font-semibold">30-40% commission</span> on every referral
                      </p>
                      <p className="text-white/90 text-sm sm:text-base">
                        💵 Build your passive income with our digital services
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                        <span className="text-lg">🔄</span>
                        <span className="text-white text-sm font-medium">Reapply Anytime</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                        <span className="text-lg">📈</span>
                        <span className="text-white text-sm font-medium">High Commission</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                        <span className="text-lg">⚡</span>
                        <span className="text-white text-sm font-medium">Fast Payouts</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => navigate('/affiliate-program')}
                      className="group relative px-8 py-4 bg-white text-orange-600 rounded-xl font-bold text-lg shadow-2xl hover:shadow-orange-400/50 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Reapply Now
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
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-300/10 rounded-full blur-3xl"></div>
            </div>
          </div>
          )}

          {/* Services Section */}
          <div id="services-section" className="mb-8 px-4 sm:px-0">
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
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              layout
            >
              <AnimatePresence mode="popLayout">
                {displayedServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.05,
                    layout: { duration: 0.3 }
                  }}
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
                </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* View All Button for Services */}
            {filteredServices.length > 10 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAllServices(!showAllServices)}
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <span>{showAllServices ? 'Show Less' : 'View All Services'}</span>
                  <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${showAllServices ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}

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

          </div>

          {/* Digital Products Section */}
          <div className="mb-8 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-200 mb-1">
                  Digital Products
                </h2>
                <p className="text-slate-400 text-sm sm:text-base">
                  Discover and purchase premium digital products
                </p>
              </div>
            </div>

            {/* Digital Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {displayedProducts.map((product) => (
                <div
                  key={product.id}
                  className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700/50 hover:border-purple-500/50 hover:-translate-y-1"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
                    {product.thumbnailUrl ? (
                      <img
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-purple-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 text-xs font-semibold bg-slate-700/60 backdrop-blur-sm text-slate-300 rounded-full border border-slate-600/50">
                        {product.category || 'Digital'}
                      </span>
                    </div>
                  </div>

                  <div className="relative p-4 sm:p-6">
                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-slate-200 mb-2 leading-tight line-clamp-2">
                      {product.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4 line-clamp-3 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Price */}
                    <div className="mb-3 sm:mb-4">
                      <p className="text-xs text-slate-500 mb-1">Price</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        ${product.priceUsd.toFixed(2)}
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
                            const referralLink = `${window.location.origin}/digital-products?ref=${user?.id}`;
                            navigator.clipboard.writeText(referralLink);
                            // Show success toast
                          }}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                        >
                          <Share2 className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Share & Earn {userRankInfo.commissionPercentage}%</span>
                          <span className="sm:hidden">Share & Earn</span>
                        </Button>
                      </div>
                    )}

                    {/* CTA Button */}
                    <button
                      onClick={() => handleProductClick(product)}
                      className="w-full py-2 sm:py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base"
                    >
                      <ShoppingCart className="w-4 h-4 inline mr-2" />
                      View Product
                    </button>
                  </div>

                  {/* Bottom Accent Line */}
                  <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                </div>
              ))}
            </div>

            {/* View All Button for Digital Products */}
            {digitalProducts.length > 10 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => navigate('/dashboard/digital-products')}
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <span>View All Digital Products</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* No Products Message */}
            {digitalProducts.length === 0 && !productsLoading && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 flex items-center justify-center">
                  <Package className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-200 mb-2">
                  No digital products available
                </h3>
                <p className="text-slate-400">
                  Check back later for new products
                </p>
              </div>
            )}

            {/* Loading State */}
            {productsLoading && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-semibold text-slate-200 mb-2">
                  Loading digital products...
                </h3>
              </div>
            )}
          </div>

          {/* Top Earners Widget */}
          <div className="mb-8">
            <TopEarnersWidget />
          </div>

          {/* Explore More High-Value Services */}
          <div className="mb-8">
            <div className="p-8 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-2xl">
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


      {/* Congratulations Modal */}
      <AffiliateCongratulationsModal
        isOpen={affiliateCongratulationsModalOpen}
        onClose={() => setAffiliateCongratulationsModalOpen(false)}
        commissionRate={userRankInfo.commissionPercentage}
      />

      {/* Product Checkout Modal */}
      <AnimatePresence>
        {showProductModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setShowProductModal(false); setSelectedProduct(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-purple-400" />
                  Checkout
                </h2>
                <button
                  onClick={() => { setShowProductModal(false); setSelectedProduct(null); }}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Product Info */}
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    {selectedProduct.thumbnailUrl ? (
                      <img
                        src={selectedProduct.thumbnailUrl}
                        alt={selectedProduct.title}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{selectedProduct.title}</h3>
                    <p className="text-slate-300 text-sm mb-3 line-clamp-2">{selectedProduct.description}</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-2xl font-bold text-green-400">${selectedProduct.priceUsd.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Purchase Options */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Payment Options</h4>
                  
                  {/* Purchase Option Selection */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800/70 transition-colors">
                      <input
                        type="radio"
                        name="purchaseOption"
                        value="split"
                        checked={purchaseOption === 'split'}
                        onChange={(e) => setPurchaseOption(e.target.value as any)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <div>
                        <div className="text-white font-medium">Split Payment (Recommended)</div>
                        <div className="text-slate-400 text-sm">50% from main wallet, 50% from purchase wallet</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800/70 transition-colors">
                      <input
                        type="radio"
                        name="purchaseOption"
                        value="main_only"
                        checked={purchaseOption === 'main_only'}
                        onChange={(e) => setPurchaseOption(e.target.value as any)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <div>
                        <div className="text-white font-medium">Main Wallet Only</div>
                        <div className="text-slate-400 text-sm">Pay from main wallet only</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800/70 transition-colors">
                      <input
                        type="radio"
                        name="purchaseOption"
                        value="currency_choice"
                        checked={purchaseOption === 'currency_choice'}
                        onChange={(e) => setPurchaseOption(e.target.value as any)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <div className="flex-1">
                        <div className="text-white font-medium">Choose Currency</div>
                        <div className="text-slate-400 text-sm">Pay in USDT or INR</div>
                        {purchaseOption === 'currency_choice' && (
                          <div className="mt-2 flex gap-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="currency"
                                value="USDT"
                                checked={currency === 'USDT'}
                                onChange={(e) => setCurrency(e.target.value as any)}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span className="text-sm text-slate-300">USDT</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="currency"
                                value="INR"
                                checked={currency === 'INR'}
                                onChange={(e) => setCurrency(e.target.value as any)}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span className="text-sm text-slate-300">INR</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Wallet Balances */}
                  <div className="bg-slate-800/30 rounded-xl p-4">
                    <h5 className="text-white font-medium mb-3">Wallet Balances</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400">USDT Main</div>
                        <div className="text-white font-semibold">${walletBalances.mainUsdt.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">USDT Purchase</div>
                        <div className="text-white font-semibold">${walletBalances.purchaseUsdt.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">INR Main</div>
                        <div className="text-white font-semibold">₹{walletBalances.mainInr.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">INR Purchase</div>
                        <div className="text-white font-semibold">₹{walletBalances.purchaseInr.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-800/50 border-t border-slate-700/50 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setShowProductModal(false); setSelectedProduct(null); }}
                  className="px-6 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-300 font-semibold text-white"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={doPurchase}
                  disabled={processing}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Complete Purchase
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-lg z-50 ${
            toast.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{toast.message}</span>
          </div>
        </motion.div>
      )}

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
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
      `}</style>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSuccessPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                🎉 Congratulations!
              </h3>
              <p className="text-slate-300 mb-6">
                Your product is ready.<br />
                You can view it in your Orders Section.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowSuccessPopup(false);
                    navigate('/dashboard/orders');
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Go to Orders
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Failure Popup */}
      <AnimatePresence>
        {showFailurePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowFailurePopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center"
              >
                <XCircle className="w-10 h-10 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                ⚠️ Insufficient Balance!
              </h3>
              <p className="text-slate-300 mb-6">
                Please deposit funds to complete your purchase.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFailurePopup(false)}
                  className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowFailurePopup(false);
                    navigate('/wallet');
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Go to Wallet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
