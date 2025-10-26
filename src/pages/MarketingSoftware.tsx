import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { WalletService } from '../services/walletService';
import { 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ClockIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  SparklesIcon,
  FireIcon,
  StarIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SoftwareTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  currency: string;
  status: 'available' | 'coming-soon';
  features: string[];
  freeTrial?: {
    contacts: number;
    description: string;
  };
  gradient: string;
  color: string;
}

const softwareTools: SoftwareTool[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Marketing Software',
    description: 'Send unlimited WhatsApp messages to your contacts with advanced analytics and automation',
    icon: '💬',
    price: 6,
    currency: '$',
    status: 'available',
    features: [
      'Unlimited WhatsApp messages',
      'Advanced analytics dashboard',
      'Message templates',
      'Contact management',
      'Automated campaigns',
      'Delivery tracking'
    ],
    freeTrial: {
      contacts: 200,
      description: '200 free database contacts for testing'
    },
    gradient: 'from-green-500 to-emerald-500',
    color: 'green'
  },
  {
    id: 'telegram',
    name: 'Telegram Marketing Software',
    description: 'Powerful Telegram marketing tools for reaching your audience effectively',
    icon: '📱',
    price: 6,
    currency: '$',
    status: 'coming-soon',
    features: [
      'Telegram bot integration',
      'Channel management',
      'Bulk messaging',
      'User analytics',
      'Automated responses',
      'Campaign scheduling'
    ],
    gradient: 'from-blue-500 to-cyan-500',
    color: 'blue'
  },
  {
    id: 'facebook',
    name: 'Facebook Marketing Software',
    description: 'Comprehensive Facebook marketing suite for businesses and influencers',
    icon: '📘',
    price: 6,
    currency: '$',
    status: 'coming-soon',
    features: [
      'Facebook page management',
      'Post scheduling',
      'Audience insights',
      'Ad campaign tools',
      'Engagement tracking',
      'Content optimization'
    ],
    gradient: 'from-blue-600 to-indigo-600',
    color: 'blue'
  }
];

export default function MarketingSoftware() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [purchasing, setPurchasing] = useState(false);

  // Fetch wallet balance
  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    if (!user) return;
    try {
      const balance = await WalletService.getWalletBalance(user.uid);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleToolClick = (toolId: string) => {
    const tool = softwareTools.find(t => t.id === toolId);
    if (tool?.status === 'available') {
      setSelectedTool(toolId);
      setShowPayment(true);
    }
  };

  const handlePurchase = async () => {
    if (!user || !selectedTool) return;

    setPurchasing(true);
    try {
      const tool = softwareTools.find(t => t.id === selectedTool);
      if (!tool) return;

      // Check wallet balance and process payment
      const purchaseResult = await WalletService.processPurchase(
        user.uid,
        tool.price,
        'software',
        tool.id,
        tool.name
      );

      if (!purchaseResult.success) {
        if (purchaseResult.error === 'Insufficient wallet balance') {
          alert('Insufficient wallet balance. Please add funds to your wallet.');
          setShowPayment(false);
          navigate('/wallet');
          return;
        }
        throw new Error(purchaseResult.error || 'Payment failed');
      }

      const orderData = {
        user_id: user.uid,
        software_id: tool.id,
        software_name: tool.name,
        price: tool.price,
        currency: tool.currency,
        status: 'active',
        subscribed_at: new Date().toISOString(),
        free_database_count: tool.freeTrial?.contacts || 0,
        payment_method: 'wallet',
        transaction_id: purchaseResult.transactionId
      };

      await addDoc(collection(firestore, 'software_orders'), orderData);
      
      // Update wallet balance display
      await fetchWalletBalance();
      
      // Show success and redirect to dashboard
      alert('Purchase successful! You now have access to the marketing software.');
      setShowPayment(false);
      setSelectedTool('');
      
      // Redirect to WhatsApp dashboard if WhatsApp was purchased
      if (selectedTool === 'whatsapp') {
        navigate('/database-marketing/whatsapp-dashboard');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
            Marketing Software Tools
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Powerful marketing automation tools to reach your audience across multiple platforms. 
            Choose from our available tools or explore upcoming features.
          </p>
        </div>

        {/* Software Tools Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {softwareTools.map((tool) => (
            <div
              key={tool.id}
              className={`group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 transition-all duration-500 ${
                tool.status === 'available'
                  ? 'cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25'
                  : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={() => handleToolClick(tool.id)}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`} />
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {tool.status === 'available' ? (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-semibold rounded-full border border-green-500/30">
                    Available
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-sm font-semibold rounded-full border border-gray-500/30">
                    Coming Soon
                  </span>
                )}
              </div>

              {/* Icon */}
              <div className="text-6xl mb-6">{tool.icon}</div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                  {tool.name}
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {tool.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {tool.currency}{tool.price}
                  </div>
                  <div className="text-gray-400 text-sm">One-time purchase</div>
                </div>

                {/* Free Trial Info */}
                {tool.freeTrial && (
                  <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <SparklesIcon className="w-5 h-5 text-blue-400" />
                      <span className="text-blue-400 font-semibold">Free Trial</span>
                    </div>
                    <p className="text-sm text-gray-300">{tool.freeTrial.description}</p>
                  </div>
                )}

                {/* Features */}
                <div className="space-y-2 mb-8">
                  {tool.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-400">
                      <CheckCircleIcon className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                  {tool.features.length > 4 && (
                    <div className="text-sm text-gray-500">
                      +{tool.features.length - 4} more features
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <div className="flex items-center justify-between">
                  {tool.status === 'available' ? (
                    <>
                      <span className="text-blue-400 font-semibold group-hover:text-blue-300 transition-colors duration-300">
                        Buy Now
                      </span>
                      <ArrowRightIcon className="w-5 h-5 text-blue-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all duration-300" />
                    </>
                  ) : (
                    <span className="text-gray-400 font-semibold">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>

              {/* Hover Effect */}
              {tool.status === 'available' && (
                <div className="absolute inset-0 rounded-3xl border border-transparent bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              )}
            </div>
          ))}
        </div>

        {/* Payment Modal */}
            {showPayment && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-gradient-to-br from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Complete Your Purchase</h3>
                <button
                  onClick={() => setShowPayment(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Order Summary */}
              {selectedTool && (
                <div className="bg-white/5 rounded-2xl p-6 mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Order Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Software:</span>
                      <span className="text-white">{softwareTools.find(t => t.id === selectedTool)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-white">
                        {softwareTools.find(t => t.id === selectedTool)?.currency}
                        {softwareTools.find(t => t.id === selectedTool)?.price}
                      </span>
                    </div>
                    {softwareTools.find(t => t.id === selectedTool)?.freeTrial && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Free Trial:</span>
                        <span className="text-green-400">
                          {softwareTools.find(t => t.id === selectedTool)?.freeTrial?.contacts} contacts
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold border-t border-white/20 pt-3">
                      <span className="text-white">Total:</span>
                      <span className="text-green-400">
                        {softwareTools.find(t => t.id === selectedTool)?.currency}
                        {softwareTools.find(t => t.id === selectedTool)?.price}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Choose Payment Method</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => setPaymentMethod('wallet')}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                      paymentMethod === 'wallet'
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                        : 'border-white/20 bg-white/5 text-white hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCardIcon className="w-6 h-6" />
                      <div className="text-left">
                        <div className="font-semibold">USDT/INR Wallet</div>
                        <div className="text-sm text-gray-400">Pay from your app wallet</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                      paymentMethod === 'razorpay'
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                        : 'border-white/20 bg-white/5 text-white hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCardIcon className="w-6 h-6" />
                      <div className="text-left">
                        <div className="font-semibold">Razorpay</div>
                        <div className="text-sm text-gray-400">Credit/Debit card, UPI, Net Banking</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={loading || !paymentMethod}
                  className="flex-1 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/25 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Complete Purchase'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
