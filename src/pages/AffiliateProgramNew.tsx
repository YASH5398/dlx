import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase';
import { doc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { 
  User, 
  Phone, 
  Mail, 
  Package, 
  Briefcase, 
  CheckCircle, 
  Clock,
  Sparkles,
  Crown,
  Gift,
  ArrowRight,
  X
} from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  price?: string;
  category?: string;
  icon?: string;
  isActive?: boolean;
}

interface AffiliateFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  interestedProducts: string[];
  userType: string;
}

const USER_TYPES = [
  'Freelancer',
  'Digital Marketer', 
  'Influencer',
  'Business Owner',
  'Student',
  'Content Creator',
  'Entrepreneur',
  'Other'
];

export default function AffiliateProgramNew() {
  const { user } = useUser();
  const [formData, setFormData] = useState<AffiliateFormData>({
    fullName: '',
    phoneNumber: '',
    email: '',
    interestedProducts: [],
    userType: ''
  });
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errors, setErrors] = useState<Partial<AffiliateFormData>>({});

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const servicesSnapshot = await getDocs(collection(firestore, 'services'));
      const servicesData: Service[] = [];
      
      servicesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isActive !== false) {
          servicesData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            price: data.price,
            category: data.category,
            icon: data.icon,
            isActive: data.isActive
          });
        }
      });
      
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AffiliateFormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.interestedProducts.length === 0) {
      newErrors.interestedProducts = ['Please select at least one product/service'];
    }

    if (!formData.userType) {
      newErrors.userType = 'Please select what best describes you';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof AffiliateFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      interestedProducts: prev.interestedProducts.includes(serviceId)
        ? prev.interestedProducts.filter(id => id !== serviceId)
        : [...prev.interestedProducts, serviceId]
    }));
    if (errors.interestedProducts) {
      setErrors(prev => ({ ...prev, interestedProducts: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      alert('Please log in to join the affiliate program');
      return;
    }

    try {
      setSubmitting(true);
      
      // Update user document with affiliate application
      await updateDoc(doc(firestore, 'users', user.id), {
        affiliateApplication: {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          interestedProducts: formData.interestedProducts,
          userType: formData.userType,
          submittedAt: serverTimestamp()
        },
        affiliateStatus: 'pending',
        affiliateJoinedAt: serverTimestamp()
      });

      setShowConfirmation(true);
      
      // Auto-approve after 8 minutes (480 seconds)
      setTimeout(async () => {
        try {
          await updateDoc(doc(firestore, 'users', user.id), {
            affiliateStatus: 'approved',
            affiliateApproved: true,
            affiliateSince: serverTimestamp(),
            affiliateApprovedAt: serverTimestamp()
          });
          setShowConfirmation(false);
          setShowSuccessPopup(true);
        } catch (error) {
          console.error('Error auto-approving affiliate:', error);
        }
      }, 8 * 60 * 1000); // 8 minutes

    } catch (error) {
      console.error('Error submitting affiliate application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading affiliate program...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-6 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 rounded-full backdrop-blur-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Crown className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-300 text-sm font-medium">Join Our Affiliate Program</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Become a
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {" "}DigiLinex Partner
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Join our exclusive affiliate program and earn up to 30% commission on every referral. 
            Start earning today with our innovative digital services and products.
          </p>
        </motion.div>

        {/* Main Form */}
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.fullName ? 'border-red-500' : 'border-white/20'
                  } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="mt-2 text-sm text-red-400">{errors.fullName}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.phoneNumber ? 'border-red-500' : 'border-white/20'
                  } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phoneNumber && (
                  <p className="mt-2 text-sm text-red-400">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email ID *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.email ? 'border-red-500' : 'border-white/20'
                  } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Interested Products/Services */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Package className="w-4 h-4 inline mr-2" />
                  Interested Products/Services *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((service) => (
                    <motion.button
                      key={service.id}
                      type="button"
                      onClick={() => handleServiceToggle(service.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        formData.interestedProducts.includes(service.id)
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                          : 'border-white/20 bg-white/5 text-gray-300 hover:border-cyan-400 hover:bg-cyan-500/5'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{service.icon || '📦'}</span>
                          <div>
                            <div className="font-medium">{service.title}</div>
                            {service.price && (
                              <div className="text-sm text-gray-400">{service.price}</div>
                            )}
                          </div>
                        </div>
                        {formData.interestedProducts.includes(service.id) && (
                          <CheckCircle className="w-5 h-5 text-cyan-400" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
                {errors.interestedProducts && (
                  <p className="mt-2 text-sm text-red-400">{errors.interestedProducts}</p>
                )}
              </div>

              {/* User Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  What best describes you? *
                </label>
                <select
                  value={formData.userType}
                  onChange={(e) => handleInputChange('userType', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    errors.userType ? 'border-red-500' : 'border-white/20'
                  } text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200`}
                >
                  <option value="" disabled>Select your role</option>
                  {USER_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-gray-800">
                      {type}
                    </option>
                  ))}
                </select>
                {errors.userType && (
                  <p className="mt-2 text-sm text-red-400">{errors.userType}</p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-2xl relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5" />
                      Become Affiliate
                    </>
                  )}
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600"
                  initial={{ x: '100%' }}
                  whileHover={{ x: submitting ? '100%' : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <motion.div
                className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Clock className="w-8 h-8 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                Thank You!
              </h3>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                Please wait for 5–30 minutes while we process your affiliate request. 
                You'll receive a confirmation once approved.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-cyan-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Processing your application...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-green-800 to-emerald-900 border border-green-500 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {/* Confetti Effect */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    initial={{ 
                      x: '50%', 
                      y: '50%', 
                      scale: 0,
                      rotate: 0
                    }}
                    animate={{ 
                      x: `${50 + (Math.random() - 0.5) * 200}%`, 
                      y: `${50 + (Math.random() - 0.5) * 200}%`, 
                      scale: [0, 1, 0],
                      rotate: 360
                    }}
                    transition={{ 
                      duration: 2,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>
              
              <motion.div
                className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <Crown className="w-10 h-10 text-white" />
              </motion.div>
              
              <motion.h3
                className="text-3xl font-bold text-white mb-4 relative z-10"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                🎉 Congratulations!
              </motion.h3>
              
              <motion.p
                className="text-green-200 mb-6 leading-relaxed relative z-10"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                You are now an official DigiLinex Affiliate Partner. 
                Start earning commissions by sharing our services!
              </motion.p>
              
              <motion.button
                onClick={() => setShowSuccessPopup(false)}
                className="px-6 py-3 bg-white/20 border border-white/30 text-white rounded-xl font-medium hover:bg-white/30 transition-all duration-200 relative z-10"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
