import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WalletService } from '../services/walletService';
import {
  CircleStackIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  CreditCardIcon,
  ArrowLeftIcon,
  SparklesIcon,
  FireIcon,
  StarIcon,
  EyeIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface DatabasePackage {
  id: string;
  category: string;
  packageName: string;
  contactsCount: number;
  price: number;
  fileUrl: string;
  preview: Array<{
    name: string;
    email: string;
    phone: string;
    company: string;
  }>;
}

const categories = [
  { id: 'business', name: 'Business', icon: '🏢', description: 'Corporate contacts and business professionals' },
  { id: 'education', name: 'Education', icon: '🎓', description: 'Schools, colleges, and educational institutions' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', description: 'Doctors, hospitals, and healthcare professionals' },
  { id: 'ecommerce', name: 'E-commerce', icon: '🛒', description: 'Online stores and digital retailers' },
  { id: 'finance', name: 'Finance', icon: '💰', description: 'Banks, financial advisors, and insurance' },
  { id: 'real-estate', name: 'Real Estate', icon: '🏠', description: 'Real estate agents and property developers' },
  { id: 'technology', name: 'Technology/IT', icon: '💻', description: 'Tech companies and IT professionals' },
  { id: 'startups', name: 'Startups', icon: '🚀', description: 'Startup founders and entrepreneurs' },
  { id: 'restaurants', name: 'Restaurants & Food', icon: '🍽️', description: 'Restaurants, cafes, and food businesses' },
  { id: 'travel', name: 'Travel & Tourism', icon: '✈️', description: 'Travel agencies and hospitality' },
  { id: 'automotive', name: 'Automotive', icon: '🚗', description: 'Car dealers and automotive services' },
  { id: 'fashion', name: 'Fashion & Apparel', icon: '👗', description: 'Fashion brands and clothing stores' },
  { id: 'beauty', name: 'Beauty & Cosmetics', icon: '💄', description: 'Beauty salons and cosmetics brands' },
  { id: 'fitness', name: 'Fitness & Gym', icon: '💪', description: 'Gyms, trainers, and wellness centers' },
  { id: 'legal', name: 'Legal Services', icon: '⚖️', description: 'Lawyers, law firms, and legal consultants' },
  { id: 'events', name: 'Event Management', icon: '🎉', description: 'Event planners and party services' },
  { id: 'marketing', name: 'Marketing Agencies', icon: '📈', description: 'Digital marketing and advertising agencies' },
  { id: 'ngo', name: 'NGOs / Social Causes', icon: '🤝', description: 'Non-profits and social impact organizations' },
  { id: 'logistics', name: 'Logistics / Transport', icon: '🚚', description: 'Shipping and transportation companies' },
  { id: 'manufacturing', name: 'Manufacturing', icon: '🏭', description: 'Manufacturing and industrial businesses' },
  { id: 'agriculture', name: 'Agriculture', icon: '🌾', description: 'Farmers and agricultural suppliers' },
  { id: 'retail', name: 'Retail Stores', icon: '🏪', description: 'Physical stores and retail chains' },
  { id: 'hotels', name: 'Hotels & Resorts', icon: '🏨', description: 'Hotels, resorts, and hospitality' },
  { id: 'digital-services', name: 'Digital Services', icon: '💻', description: 'Web design and digital agencies' },
  { id: 'entertainment', name: 'Entertainment / Media', icon: '🎬', description: 'Media companies and content creators' },
  { id: 'influencers', name: 'Influencers / Bloggers', icon: '📱', description: 'Social media influencers and bloggers' },
  { id: 'photography', name: 'Photography / Videography', icon: '📸', description: 'Photographers and videographers' },
  { id: 'tutors', name: 'Education Tutors / Coaching', icon: '📚', description: 'Private tutors and coaching centers' },
  { id: 'home-services', name: 'Home Services', icon: '🔧', description: 'Plumbers, electricians, and home maintenance' },
  { id: 'pet-services', name: 'Pet Services / Veterinary', icon: '🐕', description: 'Veterinarians and pet care services' },
  { id: 'sports', name: 'Sports & Recreation', icon: '⚽', description: 'Sports clubs and recreational facilities' },
  { id: 'freelancers', name: 'Freelancers / Consultants', icon: '💼', description: 'Independent professionals and consultants' }
];

const packages = [
  { 
    name: 'Small', 
    contacts: 1000, 
    priceRange: '₹500-1000', 
    price: 750,
    features: ['1,000 contacts', 'Email addresses', 'Phone numbers', 'Basic company info'],
    popular: false
  },
  { 
    name: 'Medium', 
    contacts: 5000, 
    priceRange: '₹2000-4000', 
    price: 3000,
    features: ['5,000 contacts', 'Email addresses', 'Phone numbers', 'Company details', 'Industry classification'],
    popular: true
  },
  { 
    name: 'Large', 
    contacts: 10000, 
    priceRange: '₹5000+', 
    price: 5000,
    features: ['10,000+ contacts', 'Email addresses', 'Phone numbers', 'Full company profiles', 'Industry data', 'Revenue information'],
    popular: false
  }
];

export default function BuyDatabase() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [previewData, setPreviewData] = useState<DatabasePackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Get category from URL params
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  // Fetch wallet balance
  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    if (!user) return;
    try {
      const balance = await WalletService.getWalletBalance(user.id);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  // Generate sample preview data
  const generatePreviewData = (category: string, packageType: string) => {
    const sampleData = [
      { name: 'John Smith', email: 'john.smith@company.com', phone: '+91 98765 43210', company: 'Tech Corp' },
      { name: 'Sarah Johnson', email: 'sarah.j@business.com', phone: '+91 98765 43211', company: 'Business Inc' },
      { name: 'Mike Wilson', email: 'mike.w@enterprise.com', phone: '+91 98765 43212', company: 'Enterprise Ltd' },
      { name: 'Lisa Brown', email: 'lisa.b@startup.com', phone: '+91 98765 43213', company: 'Startup Co' },
      { name: 'David Lee', email: 'david.l@corp.com', phone: '+91 98765 43214', company: 'Corp Solutions' }
    ];

    const packageInfo = packages.find(p => p.name.toLowerCase() === packageType.toLowerCase());
    
    return {
      id: `${category}-${packageType}-${Date.now()}`,
      category,
      packageName: `${packageType} - ${packageInfo?.contacts || 1000} contacts`,
      contactsCount: packageInfo?.contacts || 1000,
      price: packageInfo?.price || 750,
      fileUrl: `https://example.com/database-${category}-${packageType}.csv`,
      preview: sampleData
    };
  };

  const handlePreview = () => {
    if (selectedCategory && selectedPackage) {
      const preview = generatePreviewData(selectedCategory, selectedPackage);
      setPreviewData(preview);
      setShowPreview(true);
    }
  };

  const handlePurchase = async () => {
    if (!user || !previewData) return;

    setPurchasing(true);
    try {
      // Check wallet balance and process payment
      const purchaseResult = await WalletService.processPurchase(
        user.id,
        previewData.price,
        'database',
        previewData.id,
        `${previewData.category} - ${previewData.packageName}`
      );

      if (!purchaseResult.success) {
        if (purchaseResult.error === 'Insufficient wallet balance') {
          setShowInsufficientFunds(true);
          return;
        }
        throw new Error(purchaseResult.error || 'Payment failed');
      }

      // Create order in Firebase
      const orderData = {
        user_id: user.id,
        database_id: previewData.id,
        category: selectedCategory,
        package_name: previewData.packageName,
        contacts_count: previewData.contactsCount,
        price: previewData.price,
        status: 'completed',
        ordered_at: new Date().toISOString(),
        file_url: previewData.fileUrl,
        transaction_id: purchaseResult.transactionId
      };

      await addDoc(collection(firestore, 'database_orders'), orderData);
      
      // Update wallet balance display
      await fetchWalletBalance();
      
      // Show success message
      alert('Purchase successful! You can now download your database from the Orders section.');
      setShowPayment(false);
      setShowPreview(false);
      setSelectedCategory('');
      setSelectedPackage('');
      setPreviewData(null);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const currentCategory = categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => navigate('/database-marketing')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300 mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Categories
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Buy Database
            </h1>
            <p className="text-xl text-gray-300">
              Purchase high-quality contact databases for your business needs
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Selected Category Display */}
          {currentCategory && (
            <div className="mb-12">
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-6xl">{currentCategory.icon}</div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{currentCategory.name}</h2>
                    <p className="text-gray-300 text-lg">{currentCategory.description}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                    <FireIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold">Fresh 2025 Data</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                    <StarIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold">High Quality</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
                    <SparklesIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold">Verified Contacts</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category Selection (if not selected) */}
          {!selectedCategory && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Select Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.slice(0, 12).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg border-white/20 bg-white/5 hover:border-blue-400 hover:bg-blue-500/10"
                  >
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <div className="font-semibold text-sm">{category.name}</div>
                  </button>
                ))}
              </div>
              <div className="text-center mt-6">
                <button
                  onClick={() => navigate('/database-marketing')}
                  className="text-blue-400 hover:text-blue-300 transition-colors duration-300"
                >
                  View All 30+ Categories →
                </button>
              </div>
            </div>
          )}

          {/* Package Selection */}
          {selectedCategory && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Choose Your Package</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {packages.map((pkg) => (
                  <div
                    key={pkg.name}
                    onClick={() => setSelectedPackage(pkg.name)}
                    className={`relative p-8 rounded-3xl border-2 transition-all duration-500 cursor-pointer hover:scale-105 hover:shadow-2xl ${
                      selectedPackage === pkg.name
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-2xl shadow-blue-500/25'
                        : 'border-white/20 bg-white/5 hover:border-blue-400 hover:bg-blue-500/10'
                    } ${pkg.popular ? 'ring-2 ring-orange-500/50' : ''}`}
                  >
                    {/* Popular Badge */}
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="px-4 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-full shadow-lg">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-4">{pkg.name}</h3>
                      <div className="text-5xl font-bold text-blue-400 mb-2">
                        {pkg.contacts.toLocaleString()}
                      </div>
                      <div className="text-gray-400 mb-6">contacts</div>
                      
                      <div className="text-3xl font-bold text-green-400 mb-6">
                        ₹{pkg.price.toLocaleString()}
                      </div>

                      {/* Features */}
                      <div className="space-y-3 mb-8">
                        {pkg.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                            <CheckIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        selectedPackage === pkg.name
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 text-white hover:bg-blue-500 hover:text-white'
                      }`}>
                        {selectedPackage === pkg.name ? 'Selected' : 'Select Package'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {selectedCategory && selectedPackage && (
            <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              >
                <EyeIcon className="w-5 h-5" />
                Preview Database
              </button>
              <button
                onClick={() => setShowPayment(true)}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/25"
              >
                <ShoppingCartIcon className="w-5 h-5" />
                Buy Now
              </button>
            </div>
          )}

          {/* Preview Modal */}
          {showPreview && previewData && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gradient-to-br from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Database Preview</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-6">
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-lg font-semibold text-blue-400 mb-2">Package Details</h4>
                      <p className="text-gray-300">Category: {selectedCategory}</p>
                      <p className="text-gray-300">Package: {previewData.packageName}</p>
                      <p className="text-gray-300">Contacts: {previewData.contactsCount.toLocaleString()}</p>
                      <p className="text-gray-300">Price: ₹{previewData.price}</p>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-green-400 mb-2">Sample Data</h4>
                      <p className="text-gray-300 text-sm">First 5 contacts preview:</p>
                    </div>
                  </div>

                  {/* Sample Data Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-2 text-blue-400">Name</th>
                          <th className="text-left py-2 text-blue-400">Email</th>
                          <th className="text-left py-2 text-blue-400">Phone</th>
                          <th className="text-left py-2 text-blue-400">Company</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.preview.map((contact, index) => (
                          <tr key={index} className="border-b border-white/10">
                            <td className="py-2 text-gray-300">{contact.name}</td>
                            <td className="py-2 text-gray-300">{contact.email}</td>
                            <td className="py-2 text-gray-300">{contact.phone}</td>
                            <td className="py-2 text-gray-300">{contact.company}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePurchase}
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/25 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Purchase Now'}
                  </button>
                </div>
              </div>
            </div>
          )}

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
                    ×
                  </button>
                </div>

                {/* Order Summary */}
                <div className="bg-white/5 rounded-2xl p-6 mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Order Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span className="text-white">{currentCategory?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Package:</span>
                      <span className="text-white">{selectedPackage} - {packages.find(p => p.name === selectedPackage)?.contacts.toLocaleString()} contacts</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-white">Total:</span>
                      <span className="text-green-400">₹{packages.find(p => p.name === selectedPackage)?.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Wallet Balance */}
                <div className="bg-white/5 rounded-2xl p-6 mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Wallet Balance</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Current Balance:</span>
                    <span className="text-2xl font-bold text-green-400">${walletBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400">Required Amount:</span>
                    <span className="text-xl font-semibold text-white">
                      ₹{packages.find(p => p.name === selectedPackage)?.price.toLocaleString()}
                    </span>
                  </div>
                  {walletBalance < (packages.find(p => p.name === selectedPackage)?.price || 0) && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <div className="flex items-center gap-2 text-red-300">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        <span className="font-semibold">Insufficient Balance</span>
                      </div>
                      <p className="text-red-300 text-sm mt-2">
                        You need to add funds to your wallet to complete this purchase.
                      </p>
                      <button
                        onClick={() => {
                          setShowPayment(false);
                          navigate('/wallet');
                        }}
                        className="mt-3 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors duration-300"
                      >
                        Go to Wallet
                      </button>
                    </div>
                  )}
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
                    disabled={purchasing || walletBalance < (packages.find(p => p.name === selectedPackage)?.price || 0)}
                    className="flex-1 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/25 disabled:opacity-50"
                  >
                    {purchasing ? 'Processing...' : 'Complete Purchase'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
