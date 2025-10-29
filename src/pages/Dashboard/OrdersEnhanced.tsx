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
import jsPDF from 'jspdf';
import { useUser } from '../../context/UserContext';
import { useWallet } from '../../hooks/useWallet';
import { firestore } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, runTransaction } from 'firebase/firestore';
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
  productLink?: string | null;
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
  const [activeTab, setActiveTab] = useState<'services' | 'digital'>('services');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutProposal, setCheckoutProposal] = useState<any>(null);
  const [realTimeWallet, setRealTimeWallet] = useState({
    mainUsdt: 0,
    purchaseUsdt: 0,
    miningUsdt: 0
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
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
  // Removed UTR submission per new requirement
  
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
    totalFundUsed: 0,
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
            productLink: d?.productLink ?? null,
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

  // Fetch real-time wallet balances
  useEffect(() => {
    if (!user?.id) return;

    const walletRef = doc(firestore, 'wallets', user.id);
    const unsub = onSnapshot(walletRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const usdt = data.usdt || {};
        setRealTimeWallet({
          mainUsdt: Number(usdt.mainUsdt || 0),
          purchaseUsdt: Number(usdt.purchaseUsdt || 0),
          miningUsdt: Number(usdt.miningUsdt || 0)
        });
      }
    });

    return () => unsub();
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
    const totalFundUsed = orders
      .filter(o => o.status === 'paid')
      .reduce((sum, o) => sum + o.priceInUsd, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'paid').length;

    setAnalytics({
      totalOrders: orders.length,
      serviceOrders,
      digitalOrders,
      totalFundUsed,
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

  // Unread chat counter for floating button
  const unreadChat = useMemo(() => chatMessages.filter(m => m.senderType !== 'user' && !m.read).length, [chatMessages]);

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
            <button 
              onClick={() => window.open(order.downloadUrl!, '_blank')}
              className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 border border-purple-500/30 hover:border-purple-500/50 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200"
              title="Download Link"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
          )}
          
          {order.productLink && (
            <button 
              onClick={() => window.open(order.productLink!, '_blank')}
              className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-500/50 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200"
              title="Product Link"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
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

  // Handle payment initiation (open checkout modal)
  const handlePaymentInit = () => {
    if (!selectedOrder || !user) return;
    const linkedRequest = serviceRequests.find((r) => r.id === (selectedOrder.serviceRequestId || selectedOrder.id));
    const proposal: any = linkedRequest?.adminProposal || selectedOrder.adminProposal;
    if (!linkedRequest || !proposal) return;

    setCheckoutProposal({ proposal, linkedRequest });
    setShowCheckoutModal(true);
  };

  // Handle actual payment processing
  const handlePayment = async () => {
    if (!checkoutProposal || !user) return;
    const { proposal, linkedRequest } = checkoutProposal;

    try {
      setSaving(true);

      // Get real-time wallet balances
      const mainUsdtBalance = realTimeWallet.mainUsdt;
      const purchaseUsdtBalance = realTimeWallet.purchaseUsdt;
      const totalAvailable = Number((mainUsdtBalance + purchaseUsdtBalance).toFixed(2));
      const totalRequired = Number(proposal.totalPrice || 0);

      // Check if total balance is sufficient
      if (totalAvailable < totalRequired) {
        setShowCheckoutModal(false);
        setShowInsufficientFunds(true);
        return;
      }

      // Use the same logic as Digital Products - 50/50 split with fallback
      const walletRef = doc(firestore, 'wallets', user.id);
      
      await runTransaction(firestore, async (tx) => {
        const walletSnap = await tx.get(walletRef);
        if (!walletSnap.exists()) {
          throw new Error("Wallet not found. Please set up your wallet first.");
        }
        const w = walletSnap.data() as any;

        // Dynamic split: prefer 50/50, fall back to whatever is available in purchase wallet, rest from main
        const mainWallet = Number(w?.usdt?.mainUsdt || 0);
        const purchaseWallet = Number(w?.usdt?.purchaseUsdt || 0);
        const totalAvailable = Number((mainWallet + purchaseWallet).toFixed(2));
        
        if (totalAvailable < totalRequired) {
          throw new Error("Not enough balance across wallets. Please deposit funds to continue.");
        }
        
        const idealPurchase = Number((totalRequired / 2).toFixed(2));
        const idealMain = Number((totalRequired - idealPurchase).toFixed(2));
        const mainDeficit = Math.max(0, idealMain - mainWallet);
        const takeFromPurchase = Math.min(purchaseWallet, Number((idealPurchase + mainDeficit).toFixed(2)));
        const takeFromMain = Number((totalRequired - takeFromPurchase).toFixed(2));
        
        tx.update(walletRef, {
          "usdt.mainUsdt": Number((mainWallet - takeFromMain).toFixed(2)),
          "usdt.purchaseUsdt": Number((purchaseWallet - takeFromPurchase).toFixed(2)),
          walletUpdatedAt: new Date()
        });
      });

      // Update service request with payment
      await processPayment(linkedRequest.id!, {
        method: 'wallet',
        amount: totalRequired,
        currency: proposal.currency || 'USD',
        walletSplit: { 
          mainWallet: Number((totalRequired - Math.min(totalRequired / 2, purchaseUsdtBalance)).toFixed(2)), 
          purchaseWallet: Math.min(totalRequired / 2, purchaseUsdtBalance) 
        }
      });

      await loadServiceRequests();
      setShowCheckoutModal(false);
      setCheckoutProposal(null);
      setShowSuccessPopup(true);
    } catch (error: any) {
      console.error('Failed to process payment:', error);
      if (error?.message?.includes("Not enough balance")) {
        setShowCheckoutModal(false);
        setShowInsufficientFunds(true);
      } else {
        alert('Failed to process payment. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Invoice generation for Service Orders
  const handleDownloadServiceInvoice = async () => {
    if (!selectedOrder) return;
    const linkedRequest = serviceRequests.find((r) => r.id === (selectedOrder.serviceRequestId || selectedOrder.id));
    if (!linkedRequest) return;
    // Generate branded image invoice using Canvas
    const width = 1000;
    const height = 1400;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0b1437');
    grad.addColorStop(1, '#0a0f25');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Header bar
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(0, 0, width, 140);

    // Logo circle
    ctx.beginPath();
    ctx.arc(90, 70, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#083344';
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 26px Inter, Arial';
    ctx.fillText('DLX', 65, 79);

    // Brand text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Inter, Arial';
    ctx.fillText('Digi Linex', 150, 85);
    ctx.font = '16px Inter, Arial';
    ctx.fillText('Invoice', width - 170, 85);

    // Card container
    const cardX = 60;
    const cardY = 200;
    const cardW = width - 120;
    const cardH = 950;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Title
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 28px Inter, Arial';
    ctx.fillText('Payment Receipt', cardX + 30, cardY + 50);

    // Paid badge
    ctx.fillStyle = '#10b981';
    ctx.fillRect(cardX + cardW - 180, cardY + 20, 120, 36);
    ctx.fillStyle = '#052e2b';
    ctx.font = 'bold 18px Inter, Arial';
    ctx.fillText('PAID ✓', cardX + cardW - 150, cardY + 45);

    // Detail rows
    const addRow = (label: string, value: string, y: number) => {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px Inter, Arial';
      ctx.fillText(label, cardX + 30, y);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '18px Inter, Arial';
      ctx.fillText(value, cardX + 260, y);
    };

    const paidAmount = (linkedRequest?.payment?.amount ?? selectedOrder.priceInUsd) as number;
    const paidAt = (linkedRequest?.payment?.reviewedAt as any)?.toDate?.() || new Date();
    const split = linkedRequest?.payment?.walletSplit as any;
    const method = split
      ? `Main $${Number(split.mainWallet || 0).toFixed(2)} + Purchase $${Number(split.purchaseWallet || 0).toFixed(2)}`
      : 'Wallet';

    let yy = cardY + 110;
    addRow('Order ID', selectedOrder.id, yy); yy += 40;
    addRow('Service Name', linkedRequest.serviceTitle || selectedOrder.title, yy); yy += 40;
    addRow('User Name', user?.name || 'User', yy); yy += 40;
    addRow('User Email', (user as any)?.email || '', yy); yy += 40;
    addRow('Payment Amount', `$${Number(paidAmount || 0).toFixed(2)}`, yy); yy += 40;
    addRow('Date of Payment', paidAt.toLocaleString(), yy); yy += 40;
    addRow('Payment Method', method, yy); yy += 60;

    // Footer
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Inter, Arial';
    ctx.fillText('Generated automatically by Digi Linex System', cardX + 30, cardY + cardH - 30);

    // Save PNG
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `invoice_${selectedOrder.id}.png`;
    link.click();
  };

  // Invoice generation for Digital Product Orders
  const handleDownloadDigitalInvoice = async () => {
    if (!selectedOrder) return;
    
    // Generate branded image invoice using Canvas
    const width = 1000;
    const height = 1400;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0b1437');
    grad.addColorStop(1, '#0a0f25');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Header bar
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(0, 0, width, 140);

    // Logo circle
    ctx.beginPath();
    ctx.arc(90, 70, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#083344';
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 26px Inter, Arial';
    ctx.fillText('DLX', 65, 79);

    // Brand text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Inter, Arial';
    ctx.fillText('Digi Linex', 150, 85);
    ctx.font = '16px Inter, Arial';
    ctx.fillText('Invoice', width - 170, 85);

    // Card container
    const cardX = 60;
    const cardY = 200;
    const cardW = width - 120;
    const cardH = 950;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Title
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 28px Inter, Arial';
    ctx.fillText('Payment Receipt', cardX + 30, cardY + 50);

    // Paid badge
    ctx.fillStyle = '#10b981';
    ctx.fillRect(cardX + cardW - 180, cardY + 20, 120, 36);
    ctx.fillStyle = '#052e2b';
    ctx.font = 'bold 18px Inter, Arial';
    ctx.fillText('PAID ✓', cardX + cardW - 150, cardY + 45);

    // Detail rows
    const addRow = (label: string, value: string, y: number) => {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px Inter, Arial';
      ctx.fillText(label, cardX + 30, y);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '18px Inter, Arial';
      ctx.fillText(value, cardX + 260, y);
    };

    const paidAmount = selectedOrder.priceInUsd;
    const paidAt = new Date(selectedOrder.purchaseDate || Date.now());
    const method = selectedOrder.method || 'Wallet';

    let yy = cardY + 110;
    addRow('Order ID', selectedOrder.id, yy); yy += 40;
    addRow('Product Name', selectedOrder.title, yy); yy += 40;
    addRow('User Name', user?.name || 'User', yy); yy += 40;
    addRow('User Email', (user as any)?.email || '', yy); yy += 40;
    addRow('Payment Amount', `$${Number(paidAmount || 0).toFixed(2)}`, yy); yy += 40;
    addRow('Date of Payment', paidAt.toLocaleString(), yy); yy += 40;
    addRow('Payment Method', method, yy); yy += 60;

    // Footer
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Inter, Arial';
    ctx.fillText('Generated automatically by Digi Linex System', cardX + 30, cardY + cardH - 30);

    // Save PNG
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `invoice_${selectedOrder.id}.png`;
    link.click();
  };

  // Unified invoice download handler
  const handleDownloadInvoice = async () => {
    if (!selectedOrder) return;
    
    if (selectedOrder.type === 'Service') {
      await handleDownloadServiceInvoice();
    } else {
      await handleDownloadDigitalInvoice();
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!selectedOrder || !user || !newMessage.trim()) return;
    const linkedRequest = serviceRequests.find((r) => r.id === (selectedOrder.serviceRequestId || selectedOrder.id));
    if (!linkedRequest) return;
    
    try {
      setSaving(true);
      await sendChatMessage(
        linkedRequest.id!,
        user.id,
        user.name || 'User',
        'user',
        newMessage
      );
      
      setNewMessage('');
      await loadChatMessages(linkedRequest.id!);
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
    const linkedRequest = serviceRequests.find((r) => r.id === (selectedOrder.serviceRequestId || selectedOrder.id));
    if (!linkedRequest) return;
    
    try {
      setSaving(true);
      await submitInquiry(
        linkedRequest.id!,
        user?.id || linkedRequest.userId,
        user?.name || linkedRequest.userName || 'User',
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

  // Load chat messages when Service order is selected
  useEffect(() => {
    if (!selectedOrder || selectedOrder.type !== 'Service') return;
    const linkedRequest = serviceRequests.find((r) => r.id === (selectedOrder.serviceRequestId || selectedOrder.id));
    if (linkedRequest?.id) {
      loadChatMessages(linkedRequest.id);
    } else if (selectedOrder.chatId) {
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
          <div className="text-2xl font-bold text-emerald-400">${analytics.totalFundUsed.toFixed(2)}</div>
          <div className="text-sm text-gray-400">Fund Used</div>
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.35s ease-out forwards;
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
              className="transform transition-all duration-300 hover:scale-105 animate-fadeInUp"
              style={{
                animationDelay: `${index * 100}ms`
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

        {/* All Modals and Overlays */}
        <>
          {/* Order Details Modal - Modern Card Layout */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn">
              <div className="relative w-full h-full overflow-hidden flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 animate-slideUp">
                {/* Sticky Header - Fullscreen */}
                <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 border-b border-white/10 backdrop-blur-xl flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-colors"
                      aria-label="Back"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Back</span>
                    </button>
                    <div>
                      <h2 className="text-lg md:text-2xl font-bold tracking-tight">
                        {selectedOrder.type === 'Service' ? 'Service Order Details' : 'Digital Product Order Details'}
                      </h2>
                      <p className="text-[11px] md:text-xs text-gray-400">
                        Order ID: <span className="font-mono">{selectedOrder.transactionId || selectedOrder.id}</span>
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <StatusBadge status={selectedOrder.status} orderStatus={selectedOrder.orderStatus} />
                  </div>
                </div>

                {/* Body - Fullscreen scrollable */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
                  {/* Conditional rendering based on order type */}
                  {selectedOrder.type === 'Service' ? (
                    // 🧩 SERVICE ORDER LAYOUT
                    <>
                      {/* Service Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(() => {
                          const linkedRequest = serviceRequests.find((r) => r.id === (selectedOrder.serviceRequestId || selectedOrder.id));
                          const ServiceStatusBadge = () => {
                            const status = (linkedRequest?.status || '').toString();
                            const map: Record<string, { label: string; cls: string }> = {
                              pending: { label: 'Pending', cls: 'bg-amber-500/15 text-amber-300 border-amber-400/30' },
                              proposal_sent: { label: 'In Review', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30' },
                              awaiting_payment: { label: 'Awaiting Payment', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30' },
                              payment_review: { label: 'Payment Review', cls: 'bg-sky-500/15 text-sky-300 border-sky-400/30' },
                              processing: { label: 'Processing', cls: 'bg-blue-500/15 text-blue-300 border-blue-400/30' },
                              in_progress: { label: 'In Progress', cls: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30' },
                              completed: { label: 'Completed', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' },
                              cancelled: { label: 'Cancelled', cls: 'bg-rose-500/15 text-rose-300 border-rose-400/30' }
                            };
                            const cfg = map[status] || { label: '—', cls: 'bg-gray-500/15 text-gray-300 border-gray-400/30' };
                            return <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${cfg.cls}`}>{cfg.label}</span>;
                          };
                          return (
                            <>
                              <div className="rounded-xl p-4 bg-white/5 border border-white/10 shadow-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="font-semibold">Service Information</h3>
                                  <ServiceStatusBadge />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                  <div className="space-y-1">
                                    <p className="text-gray-400">Service Name</p>
                                    <p className="text-white font-medium">{linkedRequest?.serviceTitle || selectedOrder.title}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-gray-400">Order ID</p>
                                    <p className="text-white font-mono bg-black/30 border border-white/10 px-2 py-1 rounded-lg">{selectedOrder.transactionId || selectedOrder.id}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-gray-400">Order Date</p>
                                    <p className="text-gray-300">{new Date(selectedOrder.purchaseDate || 0).toLocaleString()}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-gray-400">Payment Status</p>
                                    <div><StatusBadge status={selectedOrder.status} orderStatus={selectedOrder.orderStatus} /></div>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-xl p-4 bg-white/5 border border-white/10 shadow-lg">
                                <h3 className="font-semibold mb-3">Payment & Invoice</h3>
                                <div className="space-y-3">
                                  {(() => {
                                    const proposal = linkedRequest?.adminProposal || selectedOrder.adminProposal;
                                    if (proposal) {
                                      const isPaid = !!linkedRequest?.payment && (linkedRequest.payment as any).status === 'approved';
                                      const deliveryDuration = proposal.deliveryDuration;
                                      const deliveryText = deliveryDuration ? `up to ${deliveryDuration.value} ${deliveryDuration.unit}` : 'TBD';
                                      
                                      return (
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-400">Amount</span>
                                            <span className="text-white font-semibold">{proposal.currency} {proposal.totalPrice}</span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-400">Delivery Time</span>
                                            <span className="text-gray-300 text-sm">{deliveryText}</span>
                                          </div>
                                          {!isPaid ? (
                                            <div className="space-y-3">
                                              <button
                                                onClick={handlePaymentInit}
                                                disabled={saving}
                                                className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed"
                                              >
                                                Pay Now
                                              </button>
                                              <button
                                                onClick={handleDownloadInvoice}
                                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
                                              >
                                                <ArrowDownTrayIcon className="w-4 h-4" />
                                                Download Invoice
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="space-y-3">
                                              <div className="text-xs text-emerald-300">Payment Done • Under Processing</div>
                                              <div className="text-xs text-gray-400">Your payment has been received. Our team will start working on your project shortly.</div>
                                              <button
                                                onClick={handleDownloadInvoice}
                                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
                                              >
                                                <ArrowDownTrayIcon className="w-4 h-4" />
                                                Download Invoice
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-400">Amount</span>
                                            <span className="font-semibold text-emerald-400">${selectedOrder.priceInUsd.toFixed(2)}</span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-400">Payment Method</span>
                                            <span className="text-sm text-gray-300">{selectedOrder.method || 'N/A'}</span>
                                          </div>
                                          <button
                                            onClick={handleDownloadInvoice}
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
                                          >
                                            <ArrowDownTrayIcon className="w-4 h-4" />
                                            Download Invoice
                                          </button>
                                        </div>
                                      );
                                    }
                                  })()}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    // 💾 DIGITAL PRODUCT ORDER LAYOUT (Original Simple Layout)
                    <>
                      {/* Digital Product Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-xl p-4 bg-white/5 border border-white/10 shadow-lg">
                          <h3 className="font-semibold mb-3">Product Information</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                              <p className="text-gray-400">Product Name</p>
                              <p className="text-white font-medium">{selectedOrder.title}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-400">Order ID</p>
                              <p className="text-white font-mono bg-black/30 border border-white/10 px-2 py-1 rounded-lg">{selectedOrder.transactionId || selectedOrder.id}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-400">Order Date</p>
                              <p className="text-gray-300">{new Date(selectedOrder.purchaseDate || 0).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-400">Payment Status</p>
                              <div><StatusBadge status={selectedOrder.status} orderStatus={selectedOrder.orderStatus} /></div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl p-4 bg-white/5 border border-white/10 shadow-lg">
                          <h3 className="font-semibold mb-3">Payment & Invoice</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">Amount</span>
                              <span className="font-semibold text-emerald-400">${selectedOrder.priceInUsd.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">Payment Method</span>
                              <span className="text-sm text-gray-300">{selectedOrder.method || 'N/A'}</span>
                            </div>
                            <button
                              onClick={handleDownloadInvoice}
                              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                              Download Invoice
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Digital Product Downloads */}
                      {(selectedOrder.productLink || selectedOrder.downloadUrl) && (
                        <div className="rounded-xl p-4 bg-white/5 border border-white/10 shadow-lg">
                          <h3 className="font-semibold mb-3">Downloads</h3>
                          <div className="space-y-3">
                            {selectedOrder.productLink && (
                              <a
                                href={selectedOrder.productLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors"
                              >
                                <DocumentArrowDownIcon className="w-4 h-4" />
                                Product Link
                              </a>
                            )}
                            {selectedOrder.downloadUrl && (
                              <a
                                href={selectedOrder.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg text-sm font-medium hover:bg-purple-600/30 transition-colors"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Download Files
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Service-specific sections - Only show for Service orders */}
                  {selectedOrder.type === 'Service' && (
                    <>
                      {/* Progress Timeline - Only show if not paid */}
                      {selectedOrder.status !== 'paid' && selectedOrder.orderStatus !== 'completed' && (
                        <div className="rounded-xl p-4 bg-white/5 border border-white/10 shadow-lg">
                          <h3 className="font-semibold mb-3">Order Progress</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600/80 rounded-full flex items-center justify-center shadow">
                                <CheckCircleIcon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium">Order Placed</div>
                                <div className="text-xs text-gray-400">
                                  {new Date(selectedOrder.purchaseDate || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow ${
                                (selectedOrder.status as Status) === 'paid' ? 'bg-emerald-600/80' : 'bg-gray-600/70'
                              }`}>
                                <CreditCardIcon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium">Payment {(selectedOrder.status as Status) === 'paid' ? 'Completed' : 'Pending'}</div>
                                <div className="text-xs text-gray-400">
                                  {(selectedOrder.status as Status) === 'paid' ? 'Payment received' : 'Awaiting payment'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow ${
                                (selectedOrder.orderStatus as OrderStatus) === 'completed' ? 'bg-emerald-600/80' : 'bg-gray-600/70'
                              }`}>
                                <CheckCircleIcon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium">
                                  {(selectedOrder.orderStatus as OrderStatus) === 'completed' ? 'Order Completed' : 'Processing'}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {(selectedOrder.orderStatus as OrderStatus) === 'completed' ? 'Ready for delivery' : 'Work in progress'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Proposal Section - Only show if not paid */}
                      {(() => {
                        const linkedRequest = serviceRequests.find((r) => r.id === (selectedOrder.serviceRequestId || selectedOrder.id));
                        const proposal = linkedRequest?.adminProposal || selectedOrder.adminProposal;
                        const isPaid = selectedOrder.status === 'paid' || selectedOrder.orderStatus === 'completed';
                        
                        if (!proposal || isPaid) return null;
                        return (
                        <div className="rounded-xl p-4 bg-white/5 border border-white/10 shadow-lg">
                          <h3 className="font-semibold mb-3">Proposal</h3>
                            <div className="space-y-3 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">Total Price</span>
                                <span className="text-white font-semibold">{proposal.currency} {proposal.totalPrice}</span>
                              </div>
                              {proposal.description && (
                                <div className="text-gray-300 leading-relaxed">{proposal.description}</div>
                              )}
                              {proposal.estimatedDelivery && (
                                <div className="flex items-center gap-2 text-gray-300">
                                  <CalendarIcon className="w-4 h-4" />
                                  Estimated Delivery: {proposal.estimatedDelivery}
                                </div>
                              )}
                              {proposal.lineItems?.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs text-gray-400 mb-1">Line Items</div>
                                  <div className="space-y-2">
                                    {proposal.lineItems.map((li: any) => (
                                      <div key={li.id} className="flex items-center justify-between bg-black/30 border border-white/10 rounded p-2">
                                        <div className="text-gray-300">{li.name}</div>
                                        <div className="text-gray-400 text-xs">{li.quantity} x {li.unitPrice}</div>
                                        <div className="text-gray-200 font-medium">{li.totalPrice}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Project Delivery Section - Show only after payment */}
                      {(() => {
                        const isPaid = selectedOrder.status === 'paid' || selectedOrder.orderStatus === 'completed';
                        const linkedRequest = serviceRequests.find((r) => r.id === (selectedOrder.serviceRequestId || selectedOrder.id));
                        const deliverables = selectedOrder.deliverables || linkedRequest?.deliverables;
                        
                        if (!isPaid) return null;
                        
                        return (
                          <div className="rounded-xl p-4 bg-white/5 border border-white/10 shadow-lg">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                <SparklesIcon className="w-4 h-4 text-white" />
                              </div>
                              <h3 className="font-semibold text-lg">🧩 Project Delivery Details</h3>
                            </div>
                            
                            <div className="space-y-4">
                              {/* Website Link */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-lg">
                                <div className="w-8 h-8 bg-blue-600/80 rounded-lg flex items-center justify-center shadow flex-shrink-0">
                                  <DocumentArrowDownIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white mb-1">Website Link</div>
                                  {deliverables?.websiteLink ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                      <a 
                                        href={deliverables.websiteLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-sm break-all underline"
                                      >
                                        {deliverables.websiteLink}
                                      </a>
                                      <button
                                        onClick={() => copyToClipboard(deliverables.websiteLink)}
                                        className="text-gray-400 hover:text-gray-300 text-xs self-start sm:self-center"
                                        title="Copy link"
                                      >
                                        📋
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">Not submitted yet.</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Admin Panel Link */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-lg">
                                <div className="w-8 h-8 bg-purple-600/80 rounded-lg flex items-center justify-center shadow flex-shrink-0">
                                  <DocumentArrowDownIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white mb-1">Admin Panel Link</div>
                                  {deliverables?.adminPanelLink ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                      <a 
                                        href={deliverables.adminPanelLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-sm break-all underline"
                                      >
                                        {deliverables.adminPanelLink}
                                      </a>
                                      <button
                                        onClick={() => copyToClipboard(deliverables.adminPanelLink)}
                                        className="text-gray-400 hover:text-gray-300 text-xs self-start sm:self-center"
                                        title="Copy link"
                                      >
                                        📋
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">Not submitted yet.</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Admin Email */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-lg">
                                <div className="w-8 h-8 bg-green-600/80 rounded-lg flex items-center justify-center shadow flex-shrink-0">
                                  <CreditCardIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white mb-1">Admin Email</div>
                                  {deliverables?.username ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                      <span className="text-gray-300 text-sm">{deliverables.username}</span>
                                      <button
                                        onClick={() => copyToClipboard(deliverables.username)}
                                        className="text-gray-400 hover:text-gray-300 text-xs self-start sm:self-center"
                                        title="Copy username"
                                      >
                                        📋
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">Not submitted yet.</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Admin Password */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-lg">
                                <div className="w-8 h-8 bg-orange-600/80 rounded-lg flex items-center justify-center shadow flex-shrink-0">
                                  <CreditCardIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white mb-1">Admin Password</div>
                                  {deliverables?.password ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                      <span className="text-gray-300 text-sm font-mono">
                                        {showPassword ? deliverables.password : '******'}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => setShowPassword(!showPassword)}
                                          className="text-blue-400 hover:text-blue-300 text-xs underline"
                                        >
                                          {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                        <button
                                          onClick={() => copyToClipboard(deliverables.password)}
                                          className="text-gray-400 hover:text-gray-300 text-xs"
                                          title="Copy password"
                                        >
                                          📋
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">Not submitted yet.</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Additional Notes */}
                              {deliverables?.notes && (
                                <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
                                  <div className="text-sm font-medium text-white mb-2">Additional Notes</div>
                                  <div className="text-gray-300 text-sm">{deliverables.notes}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                      {/* Inquiry Section - Only show if not paid */}
                      {selectedOrder.status !== 'paid' && selectedOrder.orderStatus !== 'completed' && (
                        <div className="rounded-xl p-4 bg-white/5 border border-white/10 shadow-lg">
                          <h3 className="font-semibold mb-3">Submit Inquiry</h3>
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
                              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed"
                            >
                              {saving ? 'Submitting...' : 'Submit Inquiry'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
        )}

          {/* Service Checkout Modal */}
          {showCheckoutModal && checkoutProposal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700/50 rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-700/50 px-6 py-5 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CreditCardIcon className="w-6 h-6 text-blue-400" />
                    Service Payment
                  </h2>
                  <button
                    onClick={() => { setShowCheckoutModal(false); setCheckoutProposal(null); }}
                    className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Service Info */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">Service Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Service:</span>
                      <span className="text-white">{checkoutProposal.proposal.description || 'Custom Service'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-emerald-400 font-semibold">
                        {checkoutProposal.proposal.currency} {checkoutProposal.proposal.totalPrice}
                      </span>
                    </div>
                    {checkoutProposal.proposal.deliveryDuration && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Delivery:</span>
                        <span className="text-gray-300">
                          up to {checkoutProposal.proposal.deliveryDuration.value} {checkoutProposal.proposal.deliveryDuration.unit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Wallet Balances */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">Wallet Balances</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Main Wallet (USDT):</span>
                      <span className="text-blue-400">${realTimeWallet.mainUsdt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Purchase Wallet (USDT):</span>
                      <span className="text-purple-400">${realTimeWallet.purchaseUsdt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mining Wallet (USDT):</span>
                      <span className="text-orange-400">${realTimeWallet.miningUsdt.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-700/50 pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300 font-medium">Total Available:</span>
                        <span className="text-emerald-400 font-semibold">
                          ${(realTimeWallet.mainUsdt + realTimeWallet.purchaseUsdt).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Split Info */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">Payment Split</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Split Payment (50% each):</span>
                      <span className="text-gray-300">
                        {checkoutProposal.proposal.currency} {(checkoutProposal.proposal.totalPrice / 2).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      * If Purchase Wallet has insufficient funds, the remaining amount will be deducted from Main Wallet
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-800/50 border-t border-gray-700/50 px-6 py-5 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  onClick={() => { setShowCheckoutModal(false); setCheckoutProposal(null); }}
                  className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-all duration-300 font-semibold"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

          {/* Success Popup */}
          {showSuccessPopup && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700/50 rounded-xl max-w-md w-full">
              <div className="p-6 space-y-4 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">✅ Payment Successful!</h3>
                <p className="text-gray-300 text-sm">
                  Your service order has been submitted. You can track its progress in the Orders section.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowSuccessPopup(false);
                      // Ensure details remain open and prominent
                      if (selectedOrder) {
                        setSelectedOrder({ ...selectedOrder });
                      }
                    }}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          {/* Floating Chat Button with Unread Indicator - Only for Service Orders */}
          {selectedOrder && selectedOrder.type === 'Service' && (
            <button
            onClick={() => setShowChatOverlay(true)}
            className="fixed bottom-6 right-6 z-50 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-xl w-14 h-14 flex items-center justify-center transition-transform active:scale-95"
            title="Chat with Developer"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            {unreadChat > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] grid place-items-center border border-white/20">
                {unreadChat > 9 ? '9+' : unreadChat}
              </span>
            )}
          </button>
        )}

          {/* WhatsApp-style Chat Overlay - Only for Service Orders */}
          {showChatOverlay && selectedOrder && selectedOrder.type === 'Service' && (() => {
          const linkedRequest = serviceRequests.find((r) => r.id === (selectedOrder.serviceRequestId || selectedOrder.id));
          if (!linkedRequest) return null;
          return (
            <div className="fixed inset-0 z-50 bg-[#0b141a] text-white flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 bg-[#202c33] border-b border-black/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">DL</div>
                  <div>
                    <div className="font-semibold">Digi Linex Support</div>
                    <div className="text-xs text-gray-300">Online</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowChatOverlay(false)}
                  className="px-3 py-1.5 bg-white/10 rounded-lg hover:bg-white/15"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4 bg-[url('https://i.imgur.com/jW5G4Gv.png')] bg-cover bg-center">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">No messages yet</div>
                ) : (
                  chatMessages.map((m) => (
                    <div key={m.id} className={`mb-2 flex ${m.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${m.senderType === 'user' ? 'bg-[#005c4b]' : 'bg-[#202c33]'} max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-md`}>
                        <div>{m.message}</div>
                        <div className="text-[10px] text-gray-300 mt-1 text-right">
                          {(m.createdAt as any)?.toDate?.()?.toLocaleTimeString?.() || ''}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 bg-[#202c33] flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message"
                  className="flex-1 bg-[#2a3942] border border-black/20 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={saving || !newMessage.trim()}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          );
        })()}

          {/* Insufficient Funds Modal */}
          {showInsufficientFunds && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700/50 rounded-xl max-w-md w-full">
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-white">Insufficient Balance</h3>
                <p className="text-gray-300 text-sm">You don\'t have enough funds to complete this payment. Please add funds to your wallets and try again.</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowInsufficientFunds(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      </div>
    </div>
  );
}