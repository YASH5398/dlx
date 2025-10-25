import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  getServiceRequests, 
  getServiceRequest,
  processPayment,
  sendChatMessage,
  submitInquiry,
  getChatMessages,
  type ServiceRequest,
  type ChatMessage,
  type Inquiry
} from '../../utils/serviceRequestsAPI';
import { useUser } from '../../context/UserContext';
import { useWallet } from '../../hooks/useWallet';
import { firestore } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  ShoppingBagIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PaperAirplaneIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  SparklesIcon,
  ChartBarIcon,
  BellIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Types
type Status = 'paid' | 'pending' | 'failed' | 'refunded';
type OrderStatus = 'processing' | 'completed' | 'cancelled';
type OrderType = 'Service' | 'Digital' | 'Subscription';

interface OrderItem {
  id: string;
  title: string;
  priceInUsd: number;
  priceInInr: number;
  status: Status;
  orderStatus?: OrderStatus;
  type?: OrderType;
  purchaseDate?: string;
  method?: 'USDT' | 'DLX' | 'Card' | 'Bank' | 'UPI' | 'INR';
  transactionId?: string;
  buyer?: string;
  downloadUrl?: string | null;
  features?: string[];
  steps?: string[];
  updates?: { date?: string; message: string }[];
  release?: {
    expectedTime?: string;
    website?: string;
    panelLink?: string;
    adminEmail?: string;
    adminPassword?: string;
  };
  chatId?: string | null;
  serviceRequestId?: string;
  adminProposal?: any;
  deliverables?: any;
  notifications?: any[];
}

interface OrdersEnhancedProps {}

export default function OrdersEnhanced({}: OrdersEnhancedProps) {
  const { user } = useUser();
  const { wallet } = useWallet();
  const mainUsdt = (wallet as any)?.mainUsdt || 0;
  const purchaseUsdt = (wallet as any)?.purchaseUsdt || 0;
  
  // State management
  const [activeTab, setActiveTab] = useState<'services' | 'digital' | 'all'>('all');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Filters and search
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Chat & payment state
  const [newMessage, setNewMessage] = useState('');
  const [newInquiry, setNewInquiry] = useState({
    type: 'question' as 'question' | 'concern' | 'request',
    message: ''
  });
  
  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    method: 'wallet' as 'wallet' | 'upi',
    walletSplit: { mainWallet: 0, purchaseWallet: 0 },
    upiDetails: { upiId: 'digilinex@ibl', transactionId: '', utr: '' }
  });

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    serviceOrders: 0,
    digitalOrders: 0,
    totalEarnings: 0,
    pendingOrders: 0,
    completedOrders: 0
  });

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch orders from Firestore
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    const q = query(collection(firestore, 'orders'), where('userId', '==', user.id));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: OrderItem[] = [];
        snap.forEach((docSnap) => {
          const d: any = docSnap.data();
          const ts = d?.timestamp?.toMillis?.() ?? (typeof d?.timestamp === 'number' ? d.timestamp : Date.now());
          const priceInUsd = Number(d?.amountUsd ?? d?.priceInUsd ?? 0);
          const priceInInr = Number(d?.amountInr ?? d?.priceInr ?? 0);
          const statusRaw = String(d?.status ?? 'Completed');
          const status: Status = statusRaw.toLowerCase() === 'completed' ? 'paid' : 
            statusRaw.toLowerCase() === 'refunded' ? 'refunded' :
            statusRaw.toLowerCase() === 'pending' ? 'pending' :
            statusRaw.toLowerCase() === 'failed' ? 'failed' : 'paid';
          const orderStatus: OrderStatus = status === 'paid' ? 'completed' : 'processing';

          list.push({
            id: docSnap.id,
            title: d?.productTitle ?? d?.title ?? 'Order',
            priceInUsd,
            priceInInr,
            status,
            orderStatus,
            type: (d?.type as any) ?? 'Digital',
            purchaseDate: new Date(ts).toISOString(),
            method: d?.paymentMode ?? d?.method,
            transactionId: d?.transactionId,
            buyer: d?.buyer ?? (d?.userId === user.id ? 'You' : d?.userName),
            downloadUrl: d?.downloadUrl ?? null,
            features: d?.features ?? [],
            steps: d?.steps ?? [],
            updates: d?.updates ?? [],
            release: d?.release ?? undefined,
            chatId: d?.chatId ?? null,
            serviceRequestId: d?.serviceRequestId,
            adminProposal: d?.adminProposal,
            deliverables: d?.deliverables,
            notifications: d?.notifications ?? []
          });
        });
        
        list.sort((a, b) => new Date(b.purchaseDate || 0).getTime() - new Date(a.purchaseDate || 0).getTime());
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to stream orders:', err);
        setLoading(false);
      }
    );

    return () => { try { unsub(); } catch {} };
  }, [user]);

  // Fetch service requests
  useEffect(() => {
    if (user) {
      loadServiceRequests();
    }
  }, [user]);

  const loadServiceRequests = async () => {
    if (!user) return;
    
    try {
      const data = await getServiceRequests(user.id);
      setServiceRequests(data);
    } catch (error) {
      console.error('Failed to load service requests:', error);
    }
  };

  // Calculate analytics
  useEffect(() => {
    const serviceOrders = orders.filter(o => o.type === 'Service').length;
    const digitalOrders = orders.filter(o => o.type === 'Digital').length;
    const totalEarnings = orders
      .filter(o => o.status === 'paid')
      .reduce((sum, o) => sum + o.priceInUsd, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'paid').length;

    setAnalytics({
      totalOrders: orders.length,
      serviceOrders,
      digitalOrders,
      totalEarnings,
      pendingOrders,
      completedOrders
    });

    // Calculate notifications
    const allNotifications = orders.flatMap(order => order.notifications || []);
    const unreadNotifications = allNotifications.filter(n => !n.read);
    setNotifications(allNotifications);
    setUnreadCount(unreadNotifications.length);
  }, [orders]);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Tab filter
    if (activeTab === 'services') {
      filtered = filtered.filter(o => o.type === 'Service');
    } else if (activeTab === 'digital') {
      filtered = filtered.filter(o => o.type === 'Digital');
    }

    // Status filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }
    if (orderStatusFilter !== 'all') {
      filtered = filtered.filter(o => o.orderStatus === orderStatusFilter);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(o => 
        o.title.toLowerCase().includes(searchLower) ||
        o.id.toLowerCase().includes(searchLower) ||
        o.type?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.purchaseDate || 0).getTime() - new Date(b.purchaseDate || 0).getTime();
          break;
        case 'amount':
          comparison = a.priceInUsd - b.priceInUsd;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [orders, activeTab, statusFilter, orderStatusFilter, search, sortBy, sortOrder]);

  // Status badge component
  const StatusBadge = ({ status, orderStatus }: { status: Status; orderStatus?: OrderStatus }) => {
    const getStatusConfig = () => {
      if (status === 'paid') {
        return { 
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          icon: CheckCircleIcon,
          text: orderStatus === 'completed' ? 'Completed' : 'Paid'
        };
      }
      if (status === 'pending') {
        return { 
          color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
          icon: ClockIcon,
          text: 'Pending'
        };
      }
      if (status === 'failed') {
        return { 
          color: 'bg-red-500/20 text-red-300 border-red-500/50',
          icon: XCircleIcon,
          text: 'Failed'
        };
      }
      if (status === 'refunded') {
        return { 
          color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
          icon: ArrowPathIcon,
          text: 'Refunded'
        };
      }
      return { 
        color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
        icon: ClockIcon,
        text: 'Unknown'
      };
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </div>
    );
  };

  // Order card component
  const OrderCard = ({ order }: { order: OrderItem }) => {
    const hasNotifications = order.notifications && order.notifications.length > 0;
    const isOverdue = order.status === 'pending' && 
      new Date(order.purchaseDate || 0).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000;

    return (
      <div className={`group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/20 ${
        selectedOrder?.id === order.id ? 'ring-2 ring-blue-500/50 border-blue-500/50' : ''
      }`}>
        {/* Notification indicator */}
        {hasNotifications && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
        
        {/* Overdue indicator */}
        {isOverdue && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-orange-500 rounded-full" />
        )}

        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                {order.type === 'Service' ? (
                  <SparklesIcon className="w-4 h-4 text-white" />
                ) : (
                  <ShoppingBagIcon className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                  {order.title}
                </h3>
                <p className="text-sm text-gray-400">#{order.id.slice(0, 8)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={order.status} orderStatus={order.orderStatus} />
              <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                {order.type}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Amount</span>
            <span className="font-semibold text-emerald-400">
              ${order.priceInUsd.toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Payment</span>
            <span className="text-sm text-gray-300">{order.method || 'N/A'}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Date</span>
            <span className="text-sm text-gray-300">
              {new Date(order.purchaseDate || 0).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedOrder(order)}
            className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-500/50 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <EyeIcon className="w-4 h-4" />
            View Details
          </button>
          
          {order.chatId && (
            <button className="bg-green-600/20 hover:bg-green-600/30 text-green-300 hover:text-green-200 border border-green-500/30 hover:border-green-500/50 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
            </button>
          )}
          
          {order.downloadUrl && (
            <button className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 border border-purple-500/30 hover:border-purple-500/50 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200">
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Load chat messages
  const loadChatMessages = async (requestId: string) => {
    try {
      const messages = await getChatMessages(requestId);
      setChatMessages(messages);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!selectedOrder || !user) return;
    
    try {
      setSaving(true);
      
      if (paymentForm.method === 'wallet') {
        await processPayment(selectedOrder.id, {
          method: 'wallet',
          amount: selectedOrder.priceInUsd,
          currency: 'USD',
          walletSplit: paymentForm.walletSplit
        });
      } else {
        await processPayment(selectedOrder.id, {
          method: 'upi',
          amount: selectedOrder.priceInUsd,
          currency: 'USD',
          upiDetails: paymentForm.upiDetails
        });
      }
      
      await loadServiceRequests();
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!selectedOrder || !user || !newMessage.trim()) return;
    
    try {
      setSaving(true);
      await sendChatMessage(
        selectedOrder.id,
        user.id,
        user.name || 'User',
        'user',
        newMessage
      );
      
      setNewMessage('');
      await loadChatMessages(selectedOrder.id);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle submit inquiry
  const handleSubmitInquiry = async () => {
    if (!selectedOrder || !newInquiry.message.trim()) return;
    
    try {
      setSaving(true);
      await submitInquiry(
        selectedOrder.id,
        selectedOrder.buyer || user?.id || '',
        user?.name || 'User',
        newInquiry.type,
        newInquiry.message
      );
      
      setNewInquiry({ type: 'question', message: '' });
      await loadServiceRequests();
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      alert('Failed to submit inquiry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Load chat messages when order is selected
  useEffect(() => {
    if (selectedOrder?.chatId) {
      loadChatMessages(selectedOrder.chatId);
    }
  }, [selectedOrder]);

  // Analytics widget
  const AnalyticsWidget = () => (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <ChartBarIcon className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Order Analytics</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{analytics.totalOrders}</div>
          <div className="text-sm text-gray-400">Total Orders</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{analytics.serviceOrders}</div>
          <div className="text-sm text-gray-400">Services</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{analytics.digitalOrders}</div>
          <div className="text-sm text-gray-400">Digital</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">${analytics.totalEarnings.toFixed(2)}</div>
          <div className="text-sm text-gray-400">Earnings</div>
        </div>
      </div>
    </div>
  );

  // Quick filter tabs
  const QuickFilterTabs = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => {
          setStatusFilter('all');
          setOrderStatusFilter('all');
          setSearch('');
        }}
        className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700/50 hover:border-gray-600/50 rounded-lg text-sm font-medium transition-all duration-200"
      >
        All Orders
      </button>
      <button
        onClick={() => {
          setStatusFilter('paid');
          setOrderStatusFilter('completed');
        }}
        className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg text-sm font-medium transition-all duration-200"
      >
        Recently Completed
      </button>
      <button
        onClick={() => {
          setStatusFilter('pending');
          setOrderStatusFilter('processing');
        }}
        className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 hover:text-yellow-200 border border-yellow-500/30 hover:border-yellow-500/50 rounded-lg text-sm font-medium transition-all duration-200"
      >
        Pending Approval
      </button>
      <button
        onClick={() => {
          setSortBy('amount');
          setSortOrder('desc');
        }}
        className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-sm font-medium transition-all duration-200"
      >
        High Value Orders
      </button>
    </div>
  );

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
                <div>
                  <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-700 rounded w-24 mb-3"></div>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <div className="h-3 bg-gray-700 rounded w-16"></div>
              <div className="h-3 bg-gray-700 rounded w-20"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-700 rounded w-20"></div>
              <div className="h-3 bg-gray-700 rounded w-16"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-700 rounded w-12"></div>
              <div className="h-3 bg-gray-700 rounded w-24"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-8 bg-gray-700 rounded"></div>
            <div className="w-8 h-8 bg-gray-700 rounded"></div>
            <div className="w-8 h-8 bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <div className="h-8 bg-gray-800 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-800 rounded w-64 animate-pulse"></div>
            </div>
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Orders</h1>
            <p className="text-gray-400">Manage your service and digital product orders</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            {/* Notification Bell */}
            {unreadCount > 0 && (
              <div className="relative">
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 border border-red-500/30 hover:border-red-500/50 rounded-lg text-sm font-medium transition-all duration-200">
                  <BellIcon className="w-4 h-4" />
                  Notifications
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {unreadCount}
                  </span>
                </button>
              </div>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700/50 hover:border-gray-600/50 rounded-lg text-sm font-medium transition-all duration-200"
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Analytics Widget */}
        <AnalyticsWidget />

        {/* Quick Filter Tabs */}
        <QuickFilterTabs />

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 bg-gray-800/30 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'services'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Services ({analytics.serviceOrders})
          </button>
          <button
            onClick={() => setActiveTab('digital')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'digital'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Digital Products ({analytics.digitalOrders})
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search orders..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Order Status</label>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                >
                  <option value="all">All Order Status</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortOrder(order as any);
                  }}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="amount-desc">Amount (Highest)</option>
                  <option value="amount-asc">Amount (Lowest)</option>
                  <option value="status-asc">Status (A-Z)</option>
                  <option value="status-desc">Status (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order, index) => (
            <div
              key={order.id}
              className="transform transition-all duration-300 hover:scale-105"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              <OrderCard order={order} />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBagIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {search || statusFilter !== 'all' || orderStatusFilter !== 'all'
                ? 'Try adjusting your filters to see more orders.'
                : 'You haven\'t placed any orders yet.'}
            </p>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700/50 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Order Details</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-3">Order Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Order ID:</span>
                          <span className="text-white">#{selectedOrder.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Type:</span>
                          <span className="text-white">{selectedOrder.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Amount:</span>
                          <span className="text-emerald-400 font-semibold">${selectedOrder.priceInUsd.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Payment Method:</span>
                          <span className="text-white">{selectedOrder.method || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Date:</span>
                          <span className="text-white">
                            {new Date(selectedOrder.purchaseDate || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-3">Status</h3>
                      <div className="space-y-3">
                        <StatusBadge status={selectedOrder.status} orderStatus={selectedOrder.orderStatus} />
                        {selectedOrder.downloadUrl && (
                          <a
                            href={selectedOrder.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg text-sm font-medium hover:bg-purple-600/30 transition-colors"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Download Files
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Timeline */}
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3">Order Progress</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <CheckCircleIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Order Placed</div>
                          <div className="text-xs text-gray-400">
                            {new Date(selectedOrder.purchaseDate || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedOrder.status === 'paid' ? 'bg-emerald-600' : 'bg-gray-600'
                        }`}>
                          <CreditCardIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Payment {selectedOrder.status === 'paid' ? 'Completed' : 'Pending'}</div>
                          <div className="text-xs text-gray-400">
                            {selectedOrder.status === 'paid' ? 'Payment received' : 'Awaiting payment'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedOrder.orderStatus === 'completed' ? 'bg-emerald-600' : 'bg-gray-600'
                        }`}>
                          <CheckCircleIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {selectedOrder.orderStatus === 'completed' ? 'Order Completed' : 'Processing'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {selectedOrder.orderStatus === 'completed' ? 'Ready for delivery' : 'Work in progress'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deliverables */}
                  {selectedOrder.deliverables && (
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-3">Deliverables</h3>
                      <div className="space-y-3">
                        {selectedOrder.deliverables.websiteLink && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                              <DocumentArrowDownIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">Website</div>
                              <a 
                                href={selectedOrder.deliverables.websiteLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-xs"
                              >
                                {selectedOrder.deliverables.websiteLink}
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {selectedOrder.deliverables.adminPanelLink && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                              <DocumentArrowDownIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">Admin Panel</div>
                              <a 
                                href={selectedOrder.deliverables.adminPanelLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-xs"
                              >
                                {selectedOrder.deliverables.adminPanelLink}
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {selectedOrder.deliverables.credentials && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                              <CreditCardIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">Credentials</div>
                              <div className="text-xs text-gray-400">
                                Username: {selectedOrder.deliverables.credentials.username}
                              </div>
                              <div className="text-xs text-gray-400">
                                Password: {selectedOrder.deliverables.credentials.password}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Chat Section */}
                  {selectedOrder.chatId && (
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-3">Chat with Support</h3>
                      <div className="space-y-4">
                        <div className="h-48 overflow-y-auto bg-gray-900/50 rounded-lg p-3">
                          {chatMessages.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
                              <ChatBubbleLeftRightIcon className="w-8 h-8 mx-auto mb-2" />
                              <p>No messages yet. Start a conversation!</p>
                            </div>
                          ) : (
                            chatMessages.map((message) => (
                              <div key={message.id} className={`mb-3 ${message.senderType === 'user' ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block p-3 rounded-lg max-w-xs ${
                                  message.senderType === 'user' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-700 text-gray-200'
                                }`}>
                                  <div className="text-xs font-medium mb-1">{message.senderName}</div>
                                  <div>{message.message}</div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                            placeholder="Type a message..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={saving || !newMessage.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                          >
                            <PaperAirplaneIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inquiry Section */}
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3">Submit Inquiry</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Inquiry Type</label>
                        <select
                          value={newInquiry.type}
                          onChange={(e) => setNewInquiry(prev => ({ ...prev, type: e.target.value as any }))}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                        >
                          <option value="question">Question</option>
                          <option value="concern">Concern</option>
                          <option value="request">Request</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                        <textarea
                          value={newInquiry.message}
                          onChange={(e) => setNewInquiry(prev => ({ ...prev, message: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                          rows={3}
                          placeholder="Enter your inquiry..."
                        />
                      </div>
                      
                      <button
                        onClick={handleSubmitInquiry}
                        disabled={saving || !newInquiry.message.trim()}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        {saving ? 'Submitting...' : 'Submit Inquiry'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}