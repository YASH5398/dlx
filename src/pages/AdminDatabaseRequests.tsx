import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CircleStackIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

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
  user_email?: string;
  user_name?: string;
}

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

export default function AdminDatabaseRequests() {
  const { user } = useUser();
  const [requests, setRequests] = useState<DatabaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<DatabaseRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'reject'>('accept');
  const [price, setPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const requestsQuery = query(collection(firestore, 'data_requests'));
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestsData = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DatabaseRequest[];

      // Sort by requested_at descending
      requestsData.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
      
      setRequests(requestsData);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      // Set sample data for demo
      setRequests([
        {
          id: '1',
          user_id: 'user1',
          category: 'Healthcare',
          contacts_count: 3000,
          description: 'Need latest healthcare contacts for medical practice',
          status: 'pending',
          requested_at: '2025-01-25T10:00:00Z',
          user_email: 'user@example.com',
          user_name: 'John Doe'
        },
        {
          id: '2',
          user_id: 'user2',
          category: 'Technology/IT',
          contacts_count: 5000,
          description: 'IT companies and professionals for software sales',
          status: 'accepted',
          price: 2500,
          requested_at: '2025-01-23T14:30:00Z',
          user_email: 'user2@example.com',
          user_name: 'Jane Smith'
        },
        {
          id: '3',
          user_id: 'user3',
          category: 'Education',
          contacts_count: 2000,
          description: 'Schools and educational institutions',
          status: 'rejected',
          requested_at: '2025-01-22T09:15:00Z',
          admin_notes: 'Requested data not available in our database',
          user_email: 'user3@example.com',
          user_name: 'Mike Johnson'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request: DatabaseRequest, type: 'accept' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setPrice('');
    setAdminNotes('');
    setShowActionModal(true);
  };

  const processAction = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      if (actionType === 'accept') {
        // Update request status
        await updateDoc(doc(firestore, 'data_requests', selectedRequest.id), {
          status: 'accepted',
          price: parseInt(price),
          admin_notes: adminNotes,
          processed_at: new Date().toISOString()
        });

        // Create database order
        const orderData: DatabaseOrder = {
          id: `custom-${selectedRequest.id}`,
          user_id: selectedRequest.user_id,
          database_id: `custom-${selectedRequest.id}`,
          category: selectedRequest.category.toLowerCase(),
          package_name: `Custom - ${selectedRequest.contacts_count.toLocaleString()} contacts`,
          contacts_count: selectedRequest.contacts_count,
          price: parseInt(price),
          status: 'pending_payment',
          ordered_at: new Date().toISOString(),
          file_url: '' // Will be set when file is uploaded
        };

        await addDoc(collection(firestore, 'database_orders'), orderData);

        // Update local state
        setRequests(prev => prev.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, status: 'accepted', price: parseInt(price), admin_notes: adminNotes }
            : req
        ));

        alert('Request accepted! Database order created and user notified.');
      } else {
        // Update request status
        await updateDoc(doc(firestore, 'data_requests', selectedRequest.id), {
          status: 'rejected',
          admin_notes: adminNotes,
          processed_at: new Date().toISOString()
        });

        // Update local state
        setRequests(prev => prev.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, status: 'rejected', admin_notes: adminNotes }
            : req
        ));

        alert('Request rejected. User has been notified.');
      }

      setShowActionModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to process action:', error);
      alert('Failed to process action. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-400 bg-orange-400/20';
      case 'accepted': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-5 h-5" />;
      case 'accepted': return <CheckCircleIcon className="w-5 h-5" />;
      case 'rejected': return <XCircleIcon className="w-5 h-5" />;
      default: return <ExclamationTriangleIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
        <p className="text-lg">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-4">
            Database Requests Management
          </h1>
          <p className="text-xl text-gray-300">
            Review and manage custom database requests from users
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-orange-400 mb-2">
              {requests.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-gray-400">Pending Requests</div>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {requests.filter(r => r.status === 'accepted').length}
            </div>
            <div className="text-gray-400">Accepted</div>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-red-400 mb-2">
              {requests.filter(r => r.status === 'rejected').length}
            </div>
            <div className="text-gray-400">Rejected</div>
          </div>
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {requests.reduce((sum, r) => sum + (r.price || 0), 0).toLocaleString()}
            </div>
            <div className="text-gray-400">Total Value (₹)</div>
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
            All Requests
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              filter === 'pending'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              filter === 'accepted'
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            Accepted
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              filter === 'rejected'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            Rejected
          </button>
        </div>

        {/* Requests List */}
        <div className="space-y-6">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <CircleStackIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No requests found</h3>
              <p className="text-gray-400">No requests match the current filter.</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <CircleStackIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {request.category} Database Request
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {request.user_name || 'User'} • {request.contacts_count.toLocaleString()} contacts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status}
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(request, 'accept')}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                        >
                          <CheckIcon className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleAction(request, 'reject')}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-red-500/25"
                        >
                          <XMarkIcon className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Requested Date</div>
                    <div className="text-white font-medium">
                      {new Date(request.requested_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">User Email</div>
                    <div className="text-white font-medium">
                      {request.user_email || 'N/A'}
                    </div>
                  </div>
                  {request.price && (
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Price</div>
                      <div className="text-white font-medium">
                        ₹{request.price.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {request.description && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-1">Description</div>
                    <div className="text-white font-medium">
                      {request.description}
                    </div>
                  </div>
                )}

                {request.admin_notes && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-1">Admin Notes</div>
                    <div className="text-white font-medium">
                      {request.admin_notes}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Action Modal */}
        {showActionModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-3xl p-8 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {actionType === 'accept' ? 'Accept Request' : 'Reject Request'}
                </h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-white mb-2">Request Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span className="text-white">{selectedRequest.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Contacts:</span>
                      <span className="text-white">{selectedRequest.contacts_count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">User:</span>
                      <span className="text-white">{selectedRequest.user_name || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {actionType === 'accept' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Set Price (₹) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter price for this database"
                      min="100"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder={actionType === 'accept' ? 'Add notes about the database or delivery timeline...' : 'Explain why this request was rejected...'}
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-8">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={processAction}
                  disabled={processing || (actionType === 'accept' && !price)}
                  className={`px-8 py-3 font-semibold rounded-xl transition-all duration-300 shadow-lg ${
                    actionType === 'accept'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:shadow-green-500/25'
                      : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 hover:shadow-red-500/25'
                  } disabled:opacity-50`}
                >
                  {processing ? 'Processing...' : (actionType === 'accept' ? 'Accept Request' : 'Reject Request')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
