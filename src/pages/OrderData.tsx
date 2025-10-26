import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase';
import { collection, query, where, getDocs, orderBy, addDoc } from 'firebase/firestore';
import { 
  ShoppingCartIcon, 
  ArrowDownTrayIcon, 
  CheckCircleIcon, 
  ClockIcon,
  CircleStackIcon,
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface DatabaseOrder {
  id: string;
  user_id: string;
  database_id: string;
  category: string;
  package_name: string;
  contacts_count: number;
  price: number;
  status: string;
  ordered_at: string;
  file_url: string;
}

interface SoftwareOrder {
  id: string;
  user_id: string;
  software_id: string;
  status: string;
  subscribed_at: string;
}

interface DatabaseRequest {
  id: string;
  user_id: string;
  category: string;
  contacts_count: number;
  description: string;
  status: 'pending' | 'accepted' | 'rejected';
  price?: number;
  requested_at: string;
  admin_notes?: string;
}

const categories = [
  'Business', 'Education', 'Healthcare', 'E-commerce', 'Finance', 'Real Estate',
  'Technology/IT', 'Startups', 'Restaurants & Food', 'Travel & Tourism', 'Automotive',
  'Fashion & Apparel', 'Beauty & Cosmetics', 'Fitness & Gym', 'Legal Services',
  'Event Management', 'Marketing Agencies', 'NGOs / Social Causes', 'Logistics / Transport',
  'Manufacturing', 'Agriculture', 'Retail Stores', 'Hotels & Resorts', 'Digital Services',
  'Entertainment / Media', 'Influencers / Bloggers', 'Photography / Videography',
  'Education Tutors / Coaching', 'Home Services', 'Pet Services / Veterinary',
  'Sports & Recreation', 'Freelancers / Consultants'
];

export default function OrderData() {
  const { user } = useUser();
  const [databaseOrders, setDatabaseOrders] = useState<DatabaseOrder[]>([]);
  const [softwareOrders, setSoftwareOrders] = useState<SoftwareOrder[]>([]);
  const [databaseRequests, setDatabaseRequests] = useState<DatabaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'databases' | 'software' | 'requests'>('all');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestCategory, setRequestCategory] = useState('');
  const [requestContacts, setRequestContacts] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch database orders
      const dbOrdersQuery = query(
        collection(firestore, 'database_orders'),
        where('user_id', '==', user.uid),
        orderBy('ordered_at', 'desc')
      );
      const dbOrdersSnapshot = await getDocs(dbOrdersQuery);
      const dbOrders = dbOrdersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DatabaseOrder[];

      // Fetch software orders
      const swOrdersQuery = query(
        collection(firestore, 'software_orders'),
        where('user_id', '==', user.uid),
        orderBy('subscribed_at', 'desc')
      );
      const swOrdersSnapshot = await getDocs(swOrdersQuery);
      const swOrders = swOrdersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SoftwareOrder[];

      // Fetch database requests
      const requestsQuery = query(
        collection(firestore, 'data_requests'),
        where('user_id', '==', user.uid),
        orderBy('requested_at', 'desc')
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requests = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DatabaseRequest[];

      setDatabaseOrders(dbOrders);
      setSoftwareOrders(swOrders);
      setDatabaseRequests(requests);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Set sample data for demo
      setDatabaseOrders([
        {
          id: '1',
          user_id: user?.uid || '',
          database_id: 'business-small-001',
          category: 'business',
          package_name: 'Small - 1k contacts',
          contacts_count: 1000,
          price: 750,
          status: 'completed',
          ordered_at: '2025-01-20T10:00:00Z',
          file_url: 'https://example.com/business-small-001.csv'
        }
      ]);
      setSoftwareOrders([
        {
          id: '1',
          user_id: user?.uid || '',
          software_id: 'marketing-software',
          status: 'active',
          subscribed_at: '2025-01-15T09:00:00Z'
        }
      ]);
      setDatabaseRequests([
        {
          id: '1',
          user_id: user?.uid || '',
          category: 'Healthcare',
          contacts_count: 3000,
          description: 'Need latest healthcare contacts for medical practice',
          status: 'pending',
          requested_at: '2025-01-25T10:00:00Z'
        },
        {
          id: '2',
          user_id: user?.uid || '',
          category: 'Technology/IT',
          contacts_count: 5000,
          description: 'IT companies and professionals for software sales',
          status: 'accepted',
          price: 2500,
          requested_at: '2025-01-23T14:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!user || !requestCategory || !requestContacts) return;

    setSubmittingRequest(true);
    try {
      const requestData = {
        user_id: user.uid,
        category: requestCategory,
        contacts_count: parseInt(requestContacts),
        description: requestDescription,
        status: 'pending',
        requested_at: new Date().toISOString()
      };

      await addDoc(collection(firestore, 'data_requests'), requestData);
      
      // Add to local state
      const newRequest: DatabaseRequest = {
        id: Date.now().toString(),
        ...requestData
      };
      setDatabaseRequests(prev => [newRequest, ...prev]);
      
      // Reset form
      setRequestCategory('');
      setRequestContacts('');
      setRequestDescription('');
      setShowRequestForm(false);
      
      alert('Request submitted successfully! We\'ll review it and get back to you.');
    } catch (error) {
      console.error('Failed to submit request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    // In a real app, this would trigger the actual download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'active': return 'text-blue-400 bg-blue-400/20';
      case 'pending': return 'text-orange-400 bg-orange-400/20';
      case 'accepted': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'cancelled': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = () => {
    if (filter === 'databases') return databaseOrders;
    if (filter === 'software') return softwareOrders;
    if (filter === 'requests') return databaseRequests;
    return [...databaseOrders, ...softwareOrders];
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-400 bg-orange-400/20';
      case 'accepted': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading your orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
              Order Data
            </h1>
            <p className="text-xl text-gray-300">
              View and manage your purchased databases, software subscriptions, and custom requests
            </p>
          </div>
          <button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
          >
            <PlusIcon className="w-5 h-5" />
            Request Custom Database
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-blue-400 mb-2">{databaseOrders.length}</div>
            <div className="text-gray-400">Database Orders</div>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-purple-400 mb-2">{softwareOrders.length}</div>
            <div className="text-gray-400">Software Subscriptions</div>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-orange-400 mb-2">{databaseRequests.length}</div>
            <div className="text-gray-400">Custom Requests</div>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {databaseOrders.reduce((sum, order) => sum + order.contacts_count, 0).toLocaleString()}
            </div>
            <div className="text-gray-400">Total Contacts</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              filter === 'all'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilter('databases')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              filter === 'databases'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            Databases
          </button>
          <button
            onClick={() => setFilter('software')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              filter === 'software'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            Software
          </button>
          <button
            onClick={() => setFilter('requests')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              filter === 'requests'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            Custom Requests
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders().length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No orders found</h3>
              <p className="text-gray-400">You haven't made any purchases yet.</p>
            </div>
          ) : (
            filteredOrders().map((order) => {
              const isDatabaseOrder = 'package_name' in order;
              const isSoftwareOrder = 'software_id' in order;
              const isRequest = 'category' in order && 'contacts_count' in order && !('package_name' in order);
              
              return (
                <div
                  key={order.id}
                  className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isDatabaseOrder 
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                          : isSoftwareOrder
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                          : 'bg-gradient-to-br from-orange-500 to-red-500'
                      }`}>
                        {isDatabaseOrder ? (
                          <CircleStackIcon className="w-6 h-6 text-white" />
                        ) : isSoftwareOrder ? (
                          <ChartBarIcon className="w-6 h-6 text-white" />
                        ) : (
                          <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {isDatabaseOrder 
                            ? (order as DatabaseOrder).package_name 
                            : isSoftwareOrder
                            ? 'Marketing Software'
                            : `Custom Request - ${(order as DatabaseRequest).category}`
                          }
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {isDatabaseOrder 
                            ? `Category: ${(order as DatabaseOrder).category}` 
                            : isSoftwareOrder
                            ? 'Campaign Management Tool'
                            : `${(order as DatabaseRequest).contacts_count.toLocaleString()} contacts`
                          }
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isRequest 
                        ? getRequestStatusColor((order as DatabaseRequest).status)
                        : getStatusColor((order as DatabaseOrder | SoftwareOrder).status)
                    }`}>
                      {isRequest 
                        ? (order as DatabaseRequest).status
                        : (order as DatabaseOrder | SoftwareOrder).status
                      }
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Date</div>
                      <div className="text-white font-medium">
                        {formatDate(
                          isDatabaseOrder 
                            ? (order as DatabaseOrder).ordered_at 
                            : isSoftwareOrder
                            ? (order as SoftwareOrder).subscribed_at
                            : (order as DatabaseRequest).requested_at
                        )}
                      </div>
                    </div>
                    
                    {isDatabaseOrder && (
                      <>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Contacts</div>
                          <div className="text-white font-medium">
                            {(order as DatabaseOrder).contacts_count.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Price</div>
                          <div className="text-white font-medium">
                            ₹{(order as DatabaseOrder).price.toLocaleString()}
                          </div>
                        </div>
                      </>
                    )}

                    {isRequest && (
                      <>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Description</div>
                          <div className="text-white font-medium text-sm">
                            {(order as DatabaseRequest).description || 'No description provided'}
                          </div>
                        </div>
                        {(order as DatabaseRequest).price && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Price</div>
                            <div className="text-white font-medium">
                              ₹{(order as DatabaseRequest).price?.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {isDatabaseOrder && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleDownload(
                          (order as DatabaseOrder).file_url, 
                          `${(order as DatabaseOrder).package_name}.csv`
                        )}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Download CSV
                      </button>
                      <button
                        onClick={() => handleDownload(
                          (order as DatabaseOrder).file_url, 
                          `${(order as DatabaseOrder).package_name}.xlsx`
                        )}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Download Excel
                      </button>
                    </div>
                  )}

                  {isSoftwareOrder && (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="font-medium">Active Subscription</span>
                    </div>
                  )}

                  {isRequest && (order as DatabaseRequest).status === 'accepted' && (order as DatabaseRequest).price && (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="font-medium">Ready for Payment - ₹{(order as DatabaseRequest).price.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Request Form Modal */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Request Custom Database</h3>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={requestCategory}
                    onChange={(e) => setRequestCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    style={{ colorScheme: 'dark' }}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Contacts <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={requestContacts}
                    onChange={(e) => setRequestContacts(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., 5000"
                    min="100"
                    max="100000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description / Extra Details
                  </label>
                  <textarea
                    value={requestDescription}
                    onChange={(e) => setRequestDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Describe your specific requirements, target audience, or any special needs..."
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <SparklesIcon className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-400 font-semibold">How it works</span>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• We'll review your request within 24-48 hours</li>
                    <li>• If approved, we'll provide a custom price quote</li>
                    <li>• You can then decide to proceed with payment</li>
                    <li>• Database will be delivered within 3-5 business days</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-8">
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={submittingRequest || !requestCategory || !requestContacts}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                >
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
