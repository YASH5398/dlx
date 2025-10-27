import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { UserPlusIcon, LinkIcon, ShoppingCartIcon, CurrencyDollarIcon, ChartBarIcon, WalletIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { firestore } from '../firebase.ts';
import { useUser } from '../context/UserContext';
import { useAffiliateStatus } from '../hooks/useAffiliateStatus';

const validators = {
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ''),
};

const affiliateService = {
  async getStats(userId: string): Promise<AffiliateStats> {
    const docRef = doc(firestore, 'affiliates', userId);
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();
  const { canJoinAffiliate, canReapply, affiliateStatus } = useAffiliateStatus();

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
          theme: 'colored',
        });
        setIsModalOpen(false);
        methods.reset();
        navigate('/affiliate-program');
      } else {
        toast.error('Failed to join the program. Please try again.', {
          position: 'top-right',
          autoClose: 3500,
          theme: 'colored',
        });
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.', {
        position: 'top-right',
        autoClose: 3500,
        theme: 'colored',
      });
    }
  };

  // Show different content based on affiliate status
  if (user && affiliateStatus.isApproved) {
    return (
      <section className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 text-white px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-5xl">✅</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              You're Already an Affiliate Partner!
            </h1>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Congratulations! You're already part of our affiliate program. Access your dashboard to start earning commissions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/affiliate-dashboard')}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                View Dashboard
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3 rounded-full bg-white/10 border border-white/20 text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (user && affiliateStatus.isPending) {
    return (
      <section className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 text-white px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <span className="text-5xl">⏳</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Application Under Review
            </h1>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Your affiliate application is currently being reviewed. We'll notify you via email once it's approved.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 text-white px-4 py-12 sm:py-16 lg:py-20">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">
        {/* Headline Section */}
        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              {CONTENT.headline}
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto">
              {CONTENT.intro.description}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold text-lg shadow-md hover:shadow-lg hover:from-pink-600 hover:to-purple-600 focus:ring-2 focus:ring-pink-400 transition-all duration-300"
            >
              {canReapply() ? 'Reapply to Affiliate Program' : CONTENT.intro.cta}
            </button>
          </motion.div>
        </header>

        {/* Join Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-indigo-950/90 rounded-xl p-8 max-w-md w-full shadow-xl border border-indigo-500/30"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Join the Affiliate Program</h2>
                <FormProvider {...methods}>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        {...methods.register('fullName', { required: 'Full name is required' })}
                        placeholder="Enter your full name"
                        className="bg-indigo-800/50"
                      />
                      {methods.formState.errors.fullName && (
                        <p className="mt-1 text-sm text-pink-400">{methods.formState.errors.fullName.message}</p>
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
                        className="bg-indigo-800/50"
                      />
                      {methods.formState.errors.email && (
                        <p className="mt-1 text-sm text-pink-400">{methods.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2 rounded-lg bg-indigo-700/50 text-indigo-200 hover:bg-indigo-600/70 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={methods.handleSubmit(onSubmit)}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
                      >
                        Join Now
                      </button>
                    </div>
                  </div>
                </FormProvider>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How It Works Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
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
                className="bg-indigo-950/50 border border-indigo-500/30 rounded-xl p-6 flex flex-col items-center text-center shadow-md hover:shadow-lg transition-all duration-300"
              >
                <step.icon className="text-4xl text-pink-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-indigo-100">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tracking & System Flow Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-20"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-white">{CONTENT.tracking.title}</h2>
          <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-xl p-6 sm:p-8 shadow-md">
            <p className="text-indigo-100 mb-6">{CONTENT.tracking.description}</p>
            <button
              onClick={() => window.open('/dashboard', '_blank')}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:from-pink-600 hover:to-purple-600 focus:ring-2 focus:ring-pink-400 transition-all duration-300"
            >
              View Dashboard Demo
            </button>
          </div>
        </motion.section>

        {/* Benefits Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
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
                className="flex items-start gap-4 bg-indigo-950/50 border border-indigo-500/30 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{index + 1}</span>
                </div>
                <p className="text-indigo-100">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Terms & Conditions Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-20"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-white">Terms & Conditions</h2>
          <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-xl p-6 sm:p-8 shadow-md">
            <ul className="list-disc list-inside text-indigo-100 space-y-3">
              {CONTENT.terms.map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ul>
            <button
              onClick={() => window.open('/terms', '_blank')}
              className="mt-6 inline-block text-pink-400 hover:text-pink-300 transition-colors duration-200"
            >
              Read Full Terms
            </button>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Ready to Start Earning?</h2>
          <button
            onClick={() => navigate('/affiliate-program')}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold text-lg shadow-md hover:shadow-lg hover:from-pink-600 hover:to-purple-600 focus:ring-2 focus:ring-pink-400 transition-all duration-300"
          >
            Get Your Affiliate Link
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-indigo-200 mb-2">
    {children}
  </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input
    {...props}
    className={`w-full px-4 py-3 rounded-lg bg-indigo-800/50 border border-indigo-500/30 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 ${className || ''}`}
  />
);

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex justify-between items-center text-left"
      >
        <span className="text-lg font-medium text-white">{question}</span>
        <QuestionMarkCircleIcon className={`w-6 h-6 text-pink-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="px-5 pb-5 text-indigo-100"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AffiliateProgramInfo;