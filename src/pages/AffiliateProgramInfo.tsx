import React, { useEffect, useState } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { UserPlusIcon, LinkIcon, ShoppingCartIcon, CurrencyDollarIcon, ChartBarIcon, WalletIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const validators = {
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ''),
};

// Mock Firebase service for fetching affiliate stats
const affiliateService = {
  async getStats(userId: string): Promise<AffiliateStats> {
    const db = getFirestore();
    const docRef = doc(db, 'affiliates', userId);
    const docSnap = await getDoc(docRef);
    const data: any = docSnap.exists() ? docSnap.data() : {};
    return {
      clicks: typeof data.clicks === 'number' ? data.clicks : 0,
      referrals: typeof data.referrals === 'number' ? data.referrals : 0,
      sales: typeof data.sales === 'number' ? data.sales : 0,
      earnings: typeof data.earnings === 'number' ? data.earnings : 0,
    };
  },
  async joinProgram(data: { email: string; fullName: string }) {
    await new Promise((r) => setTimeout(r, 900));
    return { success: true, referralLink: `https://digilinex.com/ref/${data.email.split('@')[0]}` };
  },
};

// Content configuration for easy updates
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
  clicks: number;
  referrals: number;
  sales: number;
  earnings: number;
}

interface FormData {
  email: string;
  fullName: string;
}

const AffiliateProgramInfo: React.FC = () => {
  const [stats, setStats] = useState<AffiliateStats>({ clicks: 0, referrals: 0, sales: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate fetching stats for a logged-in user
    affiliateService.getStats('mock-user-id').then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const methods = useForm<FormData>({
    defaultValues: { email: '', fullName: '' },
    mode: 'onChange',
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await affiliateService.joinProgram(data);
      if (res.success) {
        toast.success(`Success! Your referral link: ${res.referralLink}`, {
          position: 'top-right',
          autoClose: 5000,
          theme: 'dark',
        });
        setIsModalOpen(false);
        methods.reset();
        navigate('/affiliate-program'); // Redirect after successful join
      } else {
        toast.error('Failed to join the program. Please try again.', {
          position: 'top-right',
          autoClose: 3500,
          theme: 'dark',
        });
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.', {
        position: 'top-right',
        autoClose: 3500,
        theme: 'dark',
      });
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white px-4 py-12 sm:py-16 lg:py-20">
      <ToastContainer />
      <div className="max-w-6xl mx-auto">
        {/* Headline Section */}
        <header className="text-center mb-16 relative">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative z-10"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">
              {CONTENT.headline}
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto">
              {CONTENT.intro.description}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-8 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:from-cyan-500 hover:to-blue-600 focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
            >
              {CONTENT.intro.cta}
            </button>
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/10 to-transparent rounded-full blur-3xl opacity-50" />
        </header>

        {/* Join Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-gray-900/90 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-700/50"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Join the Affiliate Program</h2>
                <FormProvider {...methods}>
                  <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        {...methods.register('fullName', { required: 'Full name is required' })}
                        placeholder="Enter your full name"
                        className="bg-gray-800/50"
                      />
                      {methods.formState.errors.fullName && (
                        <p className="mt-1 text-sm text-red-400">{methods.formState.errors.fullName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...methods.register('email', {
                          required: 'Email is required',
                          validate: (v) => validators.email(v) || 'Invalid email format',
                        })}
                        placeholder="you@example.com"
                        className="bg-gray-800/50"
                      />
                      {methods.formState.errors.email && (
                        <p className="mt-1 text-sm text-red-400">{methods.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-3 rounded-lg bg-gray-700/50 text-gray-200 hover:bg-gray-600/70 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-600 transition-all duration-200"
                      >
                        Join Now
                      </button>
                    </div>
                  </form>
                </FormProvider>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Preview */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-20"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-white">Your Affiliate Dashboard</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Clicks', value: stats.clicks, color: 'from-cyan-400 to-cyan-600' },
              { label: 'Referrals', value: stats.referrals, color: 'from-blue-400 to-blue-600' },
              { label: 'Sales', value: stats.sales, color: 'from-green-400 to-green-600' },
              { label: 'Earnings', value: `₹${stats.earnings.toLocaleString()}`, color: 'from-purple-400 to-purple-600' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gray-900/70 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-md`}>
                  <ChartBarIcon className="text-white w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-white">{stat.label}</h3>
                <p className="text-2xl font-bold text-cyan-300">{loading ? '...' : stat.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-20"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-white">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CONTENT.howItWorks.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gray-900/70 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <step.icon className="text-4xl text-cyan-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-blue-100">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tracking & System Flow Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-20"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-white">{CONTENT.tracking.title}</h2>
          <div className="bg-gray-900/70 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 sm:p-8 shadow-lg">
            <p className="text-blue-100 mb-6">{CONTENT.tracking.description}</p>
            <button
              onClick={() => window.open('/dashboard', '_blank')}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold hover:from-cyan-500 hover:to-blue-600 focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
            >
              View Dashboard Demo
            </button>
          </div>
        </motion.section>

        {/* Benefits Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-20"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-white">Why Join DigiLinex?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {CONTENT.benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-start gap-4 bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{index + 1}</span>
                </div>
                <p className="text-blue-100">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Terms & Conditions Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-20"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-white">Terms & Conditions</h2>
          <div className="bg-gray-900/70 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 sm:p-8 shadow-lg">
            <ul className="list-disc list-inside text-blue-100 space-y-3">
              {CONTENT.terms.map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ul>
            <button
              onClick={() => window.open('/terms', '_blank')}
              className="mt-6 inline-block text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
            >
              Read Full Terms
            </button>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-20"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {CONTENT.faq.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Ready to Start Earning?</h2>
          <button
            onClick={() => navigate('/affiliate-program')}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:from-emerald-500 hover:to-green-600 focus:ring-2 focus:ring-emerald-400 transition-all duration-300"
          >
            Get Your Affiliate Link
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-200 mb-2">
    {children}
  </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input
    {...props}
    className={`w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200 ${className || ''}`}
  />
);

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-900/70 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex justify-between items-center text-left"
      >
        <span className="text-lg font-medium text-white">{question}</span>
        <QuestionMarkCircleIcon className={`w-6 h-6 text-cyan-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="px-5 pb-5 text-blue-100"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AffiliateProgramInfo;