import React, { useEffect, useState, useRef } from 'react';
import { 
  getServiceRequests, 
  submitAdminProposal,
  reviewPayment,
  updateOrderStatus,
  releaseDeliverables,
  updateDeliveryDetails,
  sendChatMessage,
  submitInquiry,
  getChatMessages,
  type ServiceRequest,
  type ProposalLineItem,
  type ChatMessage,
  type Inquiry
} from '../../utils/serviceRequestsAPI';
import { useUser } from '../../context/UserContext';
import { useAdminSocket } from '../../context/AdminSocketContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  Search, 
  MessageSquare, 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Trash2,
  Send,
  User,
  Mail,
  Calendar,
  Copy,
  ChevronDown,
  ChevronUp,
  Filter,
  SortAsc,
  SortDesc,
  CreditCard,
  Download,
  Eye,
  RefreshCw,
  MoreHorizontal,
  Settings,
  Tag,
  Hash,
  X,
  Bell
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminServiceRequestsEnhancedProps {}

export default function AdminServiceRequestsEnhanced({}: AdminServiceRequestsEnhancedProps) {
  const { user } = useUser();
  const { notifications, isConnected } = useAdminSocket();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'actions'>('overview');
  const [supportType, setSupportType] = useState<'all' | 'service_requests' | 'tickets' | 'ai_chat' | 'live_chat'>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const detailsTopRef = useRef<HTMLDivElement>(null);

  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Proposal form
  const [proposalForm, setProposalForm] = useState({
    totalPrice: '',
    currency: 'USD' as 'USD' | 'INR',
    description: '',
    estimatedDelivery: '',
    deliveryDuration: { value: 5, unit: 'days' as 'days' | 'weeks' },
    lineItems: [] as ProposalLineItem[]
  });

  // Chat
  const [newMessage, setNewMessage] = useState('');
  const [newInquiry, setNewInquiry] = useState({
    type: 'question' as 'question' | 'concern' | 'request',
    message: ''
  });

  // Deliverables
  const [deliverables, setDeliverables] = useState({
    websiteLink: '',
    adminPanelLink: '',
    username: '',
    password: '',
    files: [] as string[],
    notes: ''
  });

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      loadChatMessages(selectedRequest.id!);
      
      // Load existing delivery details if they exist
      if (selectedRequest.deliverables) {
        setDeliverables({
          websiteLink: selectedRequest.deliverables.websiteLink || '',
          adminPanelLink: selectedRequest.deliverables.adminPanelLink || '',
          username: selectedRequest.deliverables.credentials?.username || '',
          password: selectedRequest.deliverables.credentials?.password || '',
          files: selectedRequest.deliverables.files || [],
          notes: selectedRequest.deliverables.notes || ''
        });
      } else {
        // Reset form if no delivery details exist
        setDeliverables({
          websiteLink: '',
          adminPanelLink: '',
          username: '',
          password: '',
          files: [],
          notes: ''
        });
      }
    }
  }, [selectedRequest]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (detailsTopRef.current) {
      detailsTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getServiceRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (requestId: string) => {
    try {
      const messages = await getChatMessages(requestId);
      setChatMessages(messages);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      toast.error('Failed to load chat messages.');
    }
  };

  const handleSubmitProposal = async () => {
    if (!selectedRequest || !user) return;
    try {
      setSaving(true);
      await submitAdminProposal(
        selectedRequest.id!,
        user.id,
        user.name,
        {
          totalPrice: Number(proposalForm.totalPrice),
          currency: proposalForm.currency,
          lineItems: proposalForm.lineItems,
          description: proposalForm.description,
          estimatedDelivery: proposalForm.estimatedDelivery,
          deliveryDuration: proposalForm.deliveryDuration
        }
      );
      setProposalForm({
        totalPrice: '',
        currency: 'USD',
        description: '',
        estimatedDelivery: '',
        deliveryDuration: { value: 5, unit: 'days' },
        lineItems: []
      });
      await loadRequests();
      await loadChatMessages(selectedRequest.id!);
      toast.success('Proposal submitted successfully!');
    } catch (error) {
      console.error('Failed to submit proposal:', error);
      toast.error('Failed to submit proposal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReviewPayment = async (action: 'approve' | 'reject', reason?: string) => {
    if (!selectedRequest || !user) return;
    try {
      setSaving(true);
      await reviewPayment(
        selectedRequest.id!,
        user.id,
        user.name,
        action,
        reason
      );
      await loadRequests();
      await loadChatMessages(selectedRequest.id!);
      toast.success(`Payment ${action}d successfully!`);
    } catch (error) {
      console.error('Failed to review payment:', error);
      toast.error('Failed to review payment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedRequest || !user) return;
    try {
      setSaving(true);
      await updateOrderStatus(
        selectedRequest.id!,
        user.id,
        user.name,
        status as any
      );
      await loadRequests();
      await loadChatMessages(selectedRequest.id!);
      toast.success(`Status updated to ${status}!`);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReleaseDeliverables = async () => {
    if (!selectedRequest || !user) return;
    try {
      setSaving(true);
      await updateDeliveryDetails(
        selectedRequest.id!,
        user.id,
        user.name,
        {
          websiteLink: deliverables.websiteLink,
          adminPanelLink: deliverables.adminPanelLink,
          credentials: {
            username: deliverables.username,
            password: deliverables.password
          },
          files: deliverables.files,
          notes: deliverables.notes
        }
      );
      
      // Don't clear the form - let admin see what they just saved
      await loadRequests();
      await loadChatMessages(selectedRequest.id!);
      toast.success(selectedRequest.deliverables ? 'Delivery details updated successfully!' : 'Delivery details sent successfully!');
    } catch (error) {
      console.error('Failed to update delivery details:', error);
      toast.error('Failed to update delivery details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRequest || !user || !newMessage.trim()) return;
    try {
      setSaving(true);
      await sendChatMessage(
        selectedRequest.id!,
        user.id,
        user.name,
        'admin',
        newMessage
      );
      setNewMessage('');
      await loadChatMessages(selectedRequest.id!);
      toast.success('Message sent!');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitInquiry = async () => {
    if (!selectedRequest || !newInquiry.message.trim()) return;
    try {
      setSaving(true);
      await submitInquiry(
        selectedRequest.id!,
        selectedRequest.userId,
        selectedRequest.userName,
        newInquiry.type,
        newInquiry.message
      );
      setNewInquiry({ type: 'question', message: '' });
      await loadRequests();
      toast.success('Inquiry submitted successfully!');
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectToUser = async () => {
    if (!selectedRequest || !user) return;
    try {
      setSaving(true);
      
      // Send a connection message to the user
      await sendChatMessage(
        selectedRequest.id!,
        user.id,
        user.name,
        'admin',
        `Admin ${user.name} has connected to help you with your request. How can I assist you?`
      );
      
      await loadChatMessages(selectedRequest.id!);
      toast.success('Connected to user successfully!');
    } catch (error) {
      console.error('Failed to connect to user:', error);
      toast.error('Failed to connect to user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addLineItem = () => {
    setProposalForm(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }]
    }));
  };

  const updateLineItem = (index: number, field: keyof ProposalLineItem, value: any) => {
    setProposalForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeLineItem = (index: number) => {
    setProposalForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Parse and format form details from requestDetails
  const parseFormDetails = (request: ServiceRequest) => {
    try {
      let formData: any = null;
      const requestData = request as any;
      
      // Try to get requestDetails (could be string or object)
      if (requestData.requestDetails) {
        const details = requestData.requestDetails;
        if (typeof details === 'string') {
          try {
            formData = JSON.parse(details);
          } catch {
            // If it's not valid JSON, treat as plain text
            return null;
          }
        } else if (typeof details === 'object' && details !== null) {
          formData = details;
        }
      }
      
      // If serviceDescription exists and looks like JSON, try parsing it
      if (!formData && requestData.serviceDescription) {
        const desc = requestData.serviceDescription;
        if (typeof desc === 'string' && desc.trim().startsWith('{')) {
          try {
            formData = JSON.parse(desc);
          } catch {
            return null;
          }
        }
      }

      if (!formData || typeof formData !== 'object') return null;

      // Check if it's the new flat format (direct answers object)
      // vs old nested format ({ answers: {...}, steps: [...] })
      let answers: Record<string, any> = {};
      let steps: any[] = [];
      
      if (formData.answers && typeof formData.answers === 'object') {
        // Old nested format: { answers: {...}, steps: [...] }
        answers = formData.answers || {};
        steps = formData.steps || [];
      } else {
        // New flat format: { emailPlatform: "Mailchimp", campaignType: "Newsletter", ... }
        // The entire formData IS the answers object
        answers = formData;
        steps = []; // No steps info available in flat format
      }
      
      // Build field label mapping from steps (if available)
      const fieldLabels: Record<string, string> = {};
      if (Array.isArray(steps) && steps.length > 0) {
        steps.forEach((step: any) => {
          if (step && step.fields && Array.isArray(step.fields)) {
            step.fields.forEach((field: any) => {
              if (field && field.name) {
                fieldLabels[field.name] = field.label || field.name;
              }
            });
          }
        });
      }

      // Format field names for display
      const formatFieldName = (key: string): string => {
        if (fieldLabels[key]) return fieldLabels[key];
        // Convert camelCase or snake_case to readable format
        return key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/_/g, ' ')
          .trim();
      };

      // Create formatted fields array, filtering out empty values
      const formattedFields: Array<{ label: string; value: any; key: string }> = [];
      
      Object.keys(answers).forEach(key => {
        const value = answers[key];
        // Skip null, undefined, empty string, empty array, or nested objects/arrays that are empty
        if (value !== null && 
            value !== undefined && 
            value !== '' && 
            !(Array.isArray(value) && value.length === 0) &&
            !(typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) {
          const label = formatFieldName(key);
          formattedFields.push({ label, value, key });
        }
      });

      return formattedFields.length > 0 ? formattedFields : null;
    } catch (error) {
      console.error('Error parsing form details:', error);
      return null;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      request.serviceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const requestDate = request.createdAt?.toDate ? request.createdAt.toDate() : new Date(request.createdAt as any);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
        case 'older':
          matchesDate = daysDiff > 30;
          break;
      }
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt as any);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
        comparison = dateA.getTime() - dateB.getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'name':
        comparison = a.userName.localeCompare(b.userName);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      proposal_sent: 'bg-blue-100 text-blue-800 border-blue-200',
      awaiting_payment: 'bg-orange-100 text-orange-800 border-orange-200',
      payment_review: 'bg-purple-100 text-purple-800 border-purple-200',
      processing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      in_progress: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-green-200 text-green-900 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Service Requests</h3>
          <p className="text-gray-600">Please wait while we fetch your data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Support Requests</h1>
              <p className="text-xs text-gray-600">{filteredRequests.length} requests</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Desktop Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Support Requests
              </h1>
              <p className="text-gray-600 text-lg mt-2">Manage all support requests, tickets, and AI interactions</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {isConnected ? 'Live updates' : 'Disconnected'}
              </div>
              {notifications.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <Bell className="w-4 h-4" />
                  {notifications.length} notifications
                </div>
              )}
              <Button
                onClick={loadRequests}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search by title, name, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 h-12"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 h-12">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 text-gray-900 rounded-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                    <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                    <SelectItem value="payment_review">Payment Review</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 h-12">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 text-gray-900 rounded-xl">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="older">Older</SelectItem>
                  </SelectContent>
                </Select>

                {/* Support Type Filter */}
                <Select value={supportType} onValueChange={(value: string) => setSupportType(value as 'all' | 'service_requests' | 'tickets' | 'ai_chat' | 'live_chat')}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 h-12">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 text-gray-900 rounded-xl">
                    <SelectItem value="all">All Support</SelectItem>
                    <SelectItem value="service_requests">Service Requests</SelectItem>
                    <SelectItem value="tickets">Support Tickets</SelectItem>
                    <SelectItem value="ai_chat">AI Chatbot</SelectItem>
                    <SelectItem value="live_chat">Live Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                </div>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <SelectTrigger className="w-32 bg-gray-50 border-gray-200 text-gray-900 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 text-gray-900">
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="gap-2"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Requests List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl lg:sticky lg:top-24">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 text-xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    Support Requests
                  </CardTitle>
                  <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50">
                    {filteredRequests.length}
                  </Badge>
                </div>
                <CardDescription className="text-gray-600 mt-2">
                  Select a request to view and manage details
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">No requests found</p>
                      <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
                    </div>
                  ) : (
                    filteredRequests.map((request) => (
                      <motion.div
                        key={request.id}
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all duration-300 ${
                            selectedRequest?.id === request.id 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-lg ring-2 ring-blue-200' 
                              : 'bg-white border-gray-200 hover:shadow-lg hover:border-blue-300 hover:bg-blue-50/30'
                          } rounded-xl`}
                          onClick={() => setSelectedRequest(request)}
                          role="button"
                          aria-label={`Select request: ${request.serviceTitle}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="font-semibold text-gray-900 text-base leading-tight">{request.serviceTitle}</h3>
                              <Badge className={`${getStatusColor(request.status)} text-xs font-medium`}>
                                {request.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="truncate">{request.userName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="truncate flex-1">{request.userEmail}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(request.userEmail);
                                  }}
                                  className="ml-1 p-1 h-6 w-6"
                                >
                                  <Copy className="w-3 h-3 text-gray-500" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="truncate">{request.serviceCategory}</span>
                              </div>
                              {request.adminProposal && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  <span className="font-medium text-green-700">
                                    {request.adminProposal.currency} {request.adminProposal.totalPrice}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>{request.createdAt?.toDate ? request.createdAt.toDate().toLocaleDateString() : new Date(request.createdAt as any).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRequest(request);
                                  setShowChatOverlay(true);
                                }}
                                className="gap-2 rounded-lg"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Chat
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Request Details and Actions */}
          {selectedRequest && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3"
            >
              <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-6" ref={detailsTopRef}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{selectedRequest.serviceTitle}</CardTitle>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(selectedRequest.status)} text-sm font-medium`}>
                          {selectedRequest.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-gray-500 text-sm">{selectedRequest.serviceCategory}</span>
                        <span className="text-gray-400 text-sm">
                          {selectedRequest.createdAt?.toDate ? selectedRequest.createdAt.toDate().toLocaleDateString() : new Date(selectedRequest.createdAt as any).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(null)}
                        className="lg:hidden"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Mobile Tabs (sticky, touch friendly) */}
                  <div className="lg:hidden sticky top-16 z-40 bg-white/90 backdrop-blur border-b border-gray-200 -mx-6 px-6">
                    <div className="grid grid-cols-3">
                      {[
                        { id: 'overview', label: 'Overview', icon: Eye },
                        { id: 'chat', label: 'Chat', icon: MessageSquare },
                        { id: 'actions', label: 'Actions', icon: Settings }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex items-center justify-center gap-2 py-3.5 px-2 text-[13px] font-semibold border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            activeTab === tab.id
                              ? 'border-blue-600 text-blue-700'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                          aria-current={activeTab === tab.id ? 'page' : undefined}
                          aria-label={tab.label}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Desktop Tabs */}
                  <div className="hidden lg:flex border-b border-gray-200">
                    {[
                      { id: 'overview', label: 'Overview', icon: Eye },
                      { id: 'chat', label: 'Chat', icon: MessageSquare },
                      { id: 'actions', label: 'Actions', icon: Settings }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* User Information */}
                        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 rounded-xl">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-gray-900 text-lg flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              User Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-gray-500">Name</p>
                                  <p className="font-medium text-gray-900">{selectedRequest.userName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-500">Email</p>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900 truncate">{selectedRequest.userEmail}</p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(selectedRequest.userEmail)}
                                      className="p-1 h-6 w-6 flex-shrink-0"
                                    >
                                      <Copy className="w-3 h-3 text-gray-500" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                              <Hash className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-500">User ID</p>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900 truncate">{selectedRequest.userId}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(selectedRequest.userId)}
                                    className="p-1 h-6 w-6 flex-shrink-0"
                                  >
                                    <Copy className="w-3 h-3 text-gray-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Form Submission Details */}
                        {(() => {
                          const formFields = parseFormDetails(selectedRequest);
                          return formFields && formFields.length > 0 ? (
                            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10 border-blue-200 dark:border-blue-500/20 rounded-xl shadow-lg">
                              <CardHeader className="pb-4">
                                <CardTitle className="text-gray-900 dark:text-white text-lg sm:text-xl flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <FileText className="w-5 h-5 text-white" />
                                  </div>
                                  <span>Form Submission Details</span>
                                </CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                                  All information submitted by the user
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  {/* Form Fields Table */}
                                  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                                    <div className="overflow-x-auto">
                                      <table className="w-full">
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                          {formFields.map((field, idx) => (
                                            <motion.tr
                                              key={field.key}
                                              initial={{ opacity: 0, x: -10 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              transition={{ delay: idx * 0.05 }}
                                              className="hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors"
                                            >
                                              <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-900/50 w-1/3 sm:w-1/4 whitespace-nowrap">
                                                {field.label}
                                              </td>
                                              <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 dark:text-white break-words">
                                                {typeof field.value === 'object' ? (
                                                  <pre className="whitespace-pre-wrap text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
                                                    {JSON.stringify(field.value, null, 2)}
                                                  </pre>
                                                ) : (
                                                  <span className="whitespace-pre-wrap">{String(field.value)}</span>
                                                )}
                                              </td>
                                              <td className="px-2 sm:px-4 py-3 sm:py-4 w-12">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => copyToClipboard(String(field.value))}
                                                  className="p-1.5 h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                                                >
                                                  <Copy className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                                </Button>
                                              </td>
                                            </motion.tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  {/* Grouped by Step (Optional Enhanced View) */}
                                  {(() => {
                                    const requestData = selectedRequest as any;
                                    const formData = requestData.requestDetails 
                                      ? (typeof requestData.requestDetails === 'string' 
                                          ? JSON.parse(requestData.requestDetails) 
                                          : requestData.requestDetails)
                                      : null;
                                    const steps = formData?.steps || [];
                                    
                                    if (steps.length > 0 && formData?.answers) {
                                      return (
                                        <div className="space-y-4">
                                          {steps.map((step: any, stepIdx: number) => {
                                            if (!step || !step.fields || step.fields.length === 0) return null;
                                            
                                            const stepAnswers = step.fields
                                              .map((field: any) => ({
                                                field,
                                                value: formData.answers[field.name]
                                              }))
                                              .filter((item: any) => 
                                                item.value !== null && 
                                                item.value !== undefined && 
                                                item.value !== ''
                                              );
                                            
                                            if (stepAnswers.length === 0) return null;
                                            
                                            return (
                                              <motion.div
                                                key={stepIdx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: stepIdx * 0.1 }}
                                                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-500/20 p-4 sm:p-6"
                                              >
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                                    {stepIdx + 1}
                                                  </div>
                                                  {step.title || `Step ${stepIdx + 1}`}
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                  {stepAnswers.map((item: any, fieldIdx: number) => (
                                                    <div
                                                      key={fieldIdx}
                                                      className="bg-gray-50/80 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                                                    >
                                                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                                                        {item.field.label || item.field.name}
                                                      </p>
                                                      <p className="text-sm text-gray-900 dark:text-white font-medium break-words">
                                                        {typeof item.value === 'object' 
                                                          ? JSON.stringify(item.value, null, 2)
                                                          : String(item.value)}
                                                      </p>
                                                    </div>
                                                  ))}
                                                </div>
                                              </motion.div>
                                            );
                                          })}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </CardContent>
                            </Card>
                          ) : null;
                        })()}

                        {selectedRequest.serviceCategory && (
                          <Card className="bg-white border-gray-200 rounded-xl">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Tag className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-gray-900">Category</span>
                              </div>
                              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedRequest.serviceCategory}</p>
                            </CardContent>
                          </Card>
                        )}

                        {selectedRequest.adminProposal && (
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <button
                                  className="w-full flex justify-between items-center text-left font-medium text-gray-900 mb-3"
                                  onClick={() => setExpandedSection(expandedSection === 'proposal' ? null : 'proposal')}
                                  aria-expanded={expandedSection === 'proposal'}
                                >
                                  <span className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    Proposal Details
                                  </span>
                                  {expandedSection === 'proposal' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                                <AnimatePresence>
                                  {expandedSection === 'proposal' && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="text-sm text-gray-600 space-y-3"
                                    >
                                      <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium">Total Price:</span>
                                          <span className="font-bold text-green-700">
                                            {selectedRequest.adminProposal.currency} {selectedRequest.adminProposal.totalPrice}
                                          </span>
                                        </div>
                                        <p className="mb-2">{selectedRequest.adminProposal.description}</p>
                                        {selectedRequest.adminProposal.estimatedDelivery && (
                                          <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span>Estimated Delivery: {selectedRequest.adminProposal.estimatedDelivery}</span>
                                          </div>
                                        )}
                                      </div>
                                      {selectedRequest.adminProposal.lineItems?.length > 0 && (
                                        <div>
                                          <h4 className="font-medium text-gray-700 mb-2">Line Items:</h4>
                                          <div className="space-y-2">
                                            {selectedRequest.adminProposal.lineItems.map((item, index) => (
                                              <div key={index} className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex justify-between items-start">
                                                  <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-gray-500">{item.description}</p>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="font-medium">{item.quantity} x {item.unitPrice}</p>
                                                    <p className="text-sm text-green-600 font-medium">{item.totalPrice}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}

                        {selectedRequest.payment && (
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <button
                              className="w-full flex justify-between items-center text-left font-medium text-gray-900 mb-3"
                              onClick={() => setExpandedSection(expandedSection === 'payment' ? null : 'payment')}
                              aria-expanded={expandedSection === 'payment'}
                            >
                              <span className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-green-600" />
                                Payment Information
                              </span>
                              {expandedSection === 'payment' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            <AnimatePresence>
                              {expandedSection === 'payment' && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="text-sm text-gray-600 space-y-3"
                                >
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <span className="text-gray-500">Method:</span>
                                        <p className="font-medium">{selectedRequest.payment.method}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Amount:</span>
                                        <p className="font-medium">{selectedRequest.payment.currency} {selectedRequest.payment.amount}</p>
                                      </div>
                                    </div>
                                    <div className="mt-3">
                                      <span className="text-gray-500">Status:</span>
                                      <Badge className={`ml-2 ${getStatusColor(selectedRequest.payment.status)}`}>
                                        {selectedRequest.payment.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  {selectedRequest.payment?.upiDetails && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                      <h4 className="font-medium text-gray-700 mb-2">UPI Details:</h4>
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-500">UPI ID:</span>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{selectedRequest.payment.upiDetails.upiId}</span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => copyToClipboard(selectedRequest.payment?.upiDetails?.upiId || '')}
                                              className="p-1 h-6 w-6"
                                            >
                                              <Copy className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        {selectedRequest.payment?.upiDetails?.transactionId && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Transaction ID:</span>
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium">{selectedRequest.payment.upiDetails.transactionId}</span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(selectedRequest.payment?.upiDetails?.transactionId || '')}
                                                className="p-1 h-6 w-6"
                                              >
                                                <Copy className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                        {selectedRequest.payment?.upiDetails?.utr && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-gray-500">UTR:</span>
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium">{selectedRequest.payment.upiDetails.utr}</span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(selectedRequest.payment?.upiDetails?.utr || '')}
                                                className="p-1 h-6 w-6"
                                              >
                                                <Copy className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'chat' && (
                      <motion.div
                        key="chat"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Chat Section - WhatsApp style overlay trigger for mobile */}
                        <div className="lg:hidden">
                          <Button
                            onClick={() => setShowChatOverlay(true)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-12"
                          >
                            Open Chat
                          </Button>
                        </div>
                        <div className="hidden lg:block">
                          <Card className="bg-white border border-gray-200 rounded-xl">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-gray-900 text-lg flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                  <MessageSquare className="w-5 h-5 text-white" />
                                </div>
                                Live Chat
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="h-96 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-white">
                                  {chatMessages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                      <div className="text-center">
                                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-sm">No messages yet</p>
                                        <p className="text-xs text-gray-400">Start a conversation with the user</p>
                                      </div>
                                    </div>
                                  ) : (
                                    chatMessages.map((message) => (
                                      <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={`mb-4 ${message.senderType === 'admin' ? 'text-right' : 'text-left'}`}
                                      >
                                        <div
                                          className={`inline-block px-3 py-2 rounded-2xl max-w-lg ${
                                            message.senderType === 'admin' 
                                              ? 'bg-[#d9fdd3] text-gray-900' 
                                              : 'bg-white border border-gray-200 text-gray-900'
                                          }`}
                                        >
                                          <div className="text-[11px] text-gray-500 mb-1">
                                            {message.senderName}
                                          </div>
                                          <div className="text-sm leading-relaxed">{message.message}</div>
                                          <div className="text-[10px] text-gray-400 mt-1">
                                            {message.createdAt?.toDate ? message.createdAt.toDate().toLocaleTimeString() : new Date(message.createdAt as any).toLocaleTimeString()}
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))
                                  )}
                                  <div ref={chatEndRef} />
                                </div>
                                <div className="flex gap-3">
                                  <Input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="flex-1 bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 h-12"
                                    placeholder="Type a message..."
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                  />
                                  <Button
                                    onClick={handleConnectToUser}
                                    disabled={saving}
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50 transition-all duration-300 h-12 px-6"
                                  >
                                    <User className="w-4 h-4 mr-2" />
                                    Connect
                                  </Button>
                                  <Button
                                    onClick={handleSendMessage}
                                    disabled={saving || !newMessage.trim()}
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50 transition-all duration-300 h-12 px-6"
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'actions' && (
                      <motion.div
                        key="actions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Submit Proposal */}
                        {selectedRequest.status === 'pending' && (
                          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 rounded-xl">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-gray-900 text-lg flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                  <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                Submit Proposal
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Price</label>
                                  <Input
                                    type="number"
                                    value={proposalForm.totalPrice}
                                    onChange={(e) => setProposalForm(prev => ({ ...prev, totalPrice: e.target.value }))}
                                    className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12"
                                    placeholder="Enter total price"
                                    aria-label="Total price"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                  <Select
                                    value={proposalForm.currency}
                                    onValueChange={(value) => setProposalForm(prev => ({ ...prev, currency: value as 'USD' | 'INR' }))}
                                  >
                                    <SelectTrigger className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 h-12">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-gray-200 text-gray-900 rounded-xl">
                                      <SelectItem value="USD">USD</SelectItem>
                                      <SelectItem value="INR">INR</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                  value={proposalForm.description}
                                  onChange={(e) => setProposalForm(prev => ({ ...prev, description: e.target.value }))}
                                  className="w-full bg-white border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                  rows={5}
                                  placeholder="Describe the proposal details"
                                  aria-label="Proposal description"
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery</label>
                                  <Input
                                    type="date"
                                    value={proposalForm.estimatedDelivery}
                                    onChange={(e) => setProposalForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                                    className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 h-12"
                                    aria-label="Estimated delivery date"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Duration</label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={proposalForm.deliveryDuration.value}
                                      onChange={(e) => setProposalForm(prev => ({ 
                                        ...prev, 
                                        deliveryDuration: { ...prev.deliveryDuration, value: Number(e.target.value) }
                                      }))}
                                      className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 h-12"
                                      placeholder="5"
                                      aria-label="Delivery duration value"
                                    />
                                    <Select
                                      value={proposalForm.deliveryDuration.unit}
                                      onValueChange={(value) => setProposalForm(prev => ({ 
                                        ...prev, 
                                        deliveryDuration: { ...prev.deliveryDuration, unit: value as 'days' | 'weeks' }
                                      }))}
                                    >
                                      <SelectTrigger className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 h-12 w-24">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white border-gray-200 text-gray-900 rounded-xl">
                                        <SelectItem value="days">Days</SelectItem>
                                        <SelectItem value="weeks">Weeks</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-4">
                                  <label className="block text-sm font-medium text-gray-700">Line Items</label>
                                  <Button
                                    type="button"
                                    onClick={addLineItem}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add Item
                                  </Button>
                                </div>
                                <div className="space-y-3">
                                  {proposalForm.lineItems.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center p-4 bg-white rounded-xl border border-gray-200">
                                      <Input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                                        className="bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg h-10"
                                        placeholder="Item name"
                                        aria-label={`Line item ${index + 1} name`}
                                      />
                                      <Input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                        className="bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg h-10"
                                        placeholder="Description"
                                        aria-label={`Line item ${index + 1} description`}
                                      />
                                      <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                                        className="bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg h-10"
                                        placeholder="Qty"
                                        aria-label={`Line item ${index + 1} quantity`}
                                      />
                                      <Input
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) => updateLineItem(index, 'unitPrice', Number(e.target.value))}
                                        className="bg-gray-50 border-gray-200 text-gray-900 text-sm rounded-lg h-10"
                                        placeholder="Unit price"
                                        aria-label={`Line item ${index + 1} unit price`}
                                      />
                                      <Button
                                        type="button"
                                        onClick={() => removeLineItem(index)}
                                        variant="destructive"
                                        size="sm"
                                        className="rounded-lg h-10"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <Button
                                onClick={handleSubmitProposal}
                                disabled={saving || !proposalForm.totalPrice || !proposalForm.description}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl disabled:opacity-50 transition-all duration-300 h-12"
                              >
                                {saving ? (
                                  <div className="flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Submitting...
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Submit Proposal
                                  </div>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        )}

                        {/* Payment Review */}
                        {selectedRequest.status === 'payment_review' && selectedRequest.payment && (
                          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 rounded-xl">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-gray-900 text-lg flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                                  <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                Payment Review
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                                    <p className="font-medium text-gray-900">{selectedRequest.payment.method}</p>
                                  </div>
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Amount</p>
                                    <p className="font-medium text-gray-900">{selectedRequest.payment.currency} {selectedRequest.payment.amount}</p>
                                  </div>
                                </div>
                                {selectedRequest.payment.upiDetails && (
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <h4 className="font-medium text-gray-700 mb-3">UPI Details</h4>
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">UPI ID:</span>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{selectedRequest.payment.upiDetails.upiId}</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(selectedRequest.payment?.upiDetails?.upiId || '')}
                                            className="p-1 h-6 w-6"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      {selectedRequest.payment.upiDetails.transactionId && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-gray-500">Transaction ID:</span>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{selectedRequest.payment.upiDetails.transactionId}</span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => copyToClipboard(selectedRequest.payment?.upiDetails?.transactionId || '')}
                                              className="p-1 h-6 w-6"
                                            >
                                              <Copy className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                      {selectedRequest.payment.upiDetails.utr && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-gray-500">UTR:</span>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{selectedRequest.payment.upiDetails.utr}</span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => copyToClipboard(selectedRequest.payment?.upiDetails?.utr || '')}
                                              className="p-1 h-6 w-6"
                                            >
                                              <Copy className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  onClick={() => handleReviewPayment('approve')}
                                  disabled={saving}
                                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl disabled:opacity-50 transition-all duration-300 h-12 px-6"
                                >
                                  {saving ? (
                                    <div className="flex items-center gap-2">
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                      Processing...
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4" />
                                      Approve Payment
                                    </div>
                                  )}
                                </Button>
                                <Button
                                  onClick={() => handleReviewPayment('reject')}
                                  disabled={saving}
                                  variant="destructive"
                                  className="rounded-xl disabled:opacity-50 transition-all duration-300 h-12 px-6"
                                >
                                  {saving ? (
                                    <div className="flex items-center gap-2">
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                      Processing...
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <XCircle className="w-4 h-4" />
                                      Reject Payment
                                    </div>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Status Update */}
                        {['processing', 'in_progress'].includes(selectedRequest.status) && (
                          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 rounded-xl">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-gray-900 text-lg flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center">
                                  <Clock className="w-5 h-5 text-white" />
                                </div>
                                Update Status
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                  onClick={() => handleUpdateStatus('in_progress')}
                                  disabled={saving}
                                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl disabled:opacity-50 transition-all duration-300 h-12 px-6"
                                >
                                  {saving ? (
                                    <div className="flex items-center gap-2">
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                      Updating...
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      Mark In Progress
                                    </div>
                                  )}
                                </Button>
                                <Button
                                  onClick={() => handleUpdateStatus('completed')}
                                  disabled={saving}
                                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl disabled:opacity-50 transition-all duration-300 h-12 px-6"
                                >
                                  {saving ? (
                                    <div className="flex items-center gap-2">
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                      Updating...
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4" />
                                      Mark Completed
                                    </div>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Project Delivery Details */}
                        {selectedRequest && (
                          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 rounded-xl">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-gray-900 text-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                                    <Download className="w-5 h-5 text-white" />
                                  </div>
                                  🧩 Project Delivery Details
                                </div>
                                {selectedRequest.deliverables && (
                                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Details Sent
                                  </div>
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Website Link</label>
                                  <Input
                                    type="url"
                                    value={deliverables.websiteLink}
                                    onChange={(e) => setDeliverables(prev => ({ ...prev, websiteLink: e.target.value }))}
                                    className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 h-12"
                                    placeholder="https://example.com"
                                    aria-label="Website link"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Panel Link</label>
                                  <Input
                                    type="url"
                                    value={deliverables.adminPanelLink}
                                    onChange={(e) => setDeliverables(prev => ({ ...prev, adminPanelLink: e.target.value }))}
                                    className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 h-12"
                                    placeholder="https://admin.example.com"
                                    aria-label="Admin panel link"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                                  <Input
                                    type="text"
                                    value={deliverables.username}
                                    onChange={(e) => setDeliverables(prev => ({ ...prev, username: e.target.value }))}
                                    className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 h-12"
                                    placeholder="Enter username"
                                    aria-label="Username"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                  <Input
                                    type="password"
                                    value={deliverables.password}
                                    onChange={(e) => setDeliverables(prev => ({ ...prev, password: e.target.value }))}
                                    className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 h-12"
                                    placeholder="Enter password"
                                    aria-label="Password"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Files</label>
                                <Input
                                  type="file"
                                  multiple
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []).map(file => file.name);
                                    setDeliverables(prev => ({ ...prev, files }));
                                  }}
                                  className="bg-white border-gray-200 text-gray-900 rounded-xl h-12"
                                  aria-label="Upload files"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                <textarea
                                  value={deliverables.notes}
                                  onChange={(e) => setDeliverables(prev => ({ ...prev, notes: e.target.value }))}
                                  className="w-full bg-white border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                  rows={5}
                                  placeholder="Additional notes for the user"
                                  aria-label="Deliverable notes"
                                />
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  onClick={handleReleaseDeliverables}
                                  disabled={saving}
                                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl disabled:opacity-50 transition-all duration-300 h-12"
                                >
                                  {saving ? (
                                    <div className="flex items-center gap-2">
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                      {selectedRequest.deliverables ? 'Updating...' : 'Saving...'}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Download className="w-4 h-4" />
                                      {selectedRequest.deliverables ? 'Update Delivery Details' : 'Send Delivery Details'}
                                    </div>
                                  )}
                                </Button>
                                {selectedRequest.deliverables && (
                                  <Button
                                    onClick={() => {
                                      setDeliverables({
                                        websiteLink: '',
                                        adminPanelLink: '',
                                        username: '',
                                        password: '',
                                        files: [],
                                        notes: ''
                                      });
                                    }}
                                    variant="outline"
                                    className="px-6 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl h-12"
                                  >
                                    Clear Form
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Submit Inquiry */}
                        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 rounded-xl">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-gray-900 text-lg flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-white" />
                              </div>
                              Submit Inquiry
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                              <Select
                                value={newInquiry.type}
                                onValueChange={(value) => setNewInquiry(prev => ({ ...prev, type: value as any }))}
                              >
                                <SelectTrigger className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-purple-500 h-12">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200 text-gray-900 rounded-xl">
                                  <SelectItem value="question">Question</SelectItem>
                                  <SelectItem value="concern">Concern</SelectItem>
                                  <SelectItem value="request">Request</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                              <textarea
                                value={newInquiry.message}
                                onChange={(e) => setNewInquiry(prev => ({ ...prev, message: e.target.value }))}
                                className="w-full bg-white border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                                rows={5}
                                placeholder="Enter your inquiry..."
                                aria-label="Inquiry message"
                              />
                            </div>
                            <Button
                              onClick={handleSubmitInquiry}
                              disabled={saving || !newInquiry.message.trim()}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl disabled:opacity-50 transition-all duration-300 h-12"
                            >
                              {saving ? (
                                <div className="flex items-center gap-2">
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Submitting...
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" />
                                  Submit Inquiry
                                </div>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
      {/* WhatsApp-style Chat Overlay */}
      {showChatOverlay && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-[#111b21] text-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#128C7E]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowChatOverlay(false)}
                className="px-3 py-1.5 bg-black/10 rounded-lg hover:bg-black/20"
              >
                Back
              </button>
              <div>
                <div className="font-semibold">{selectedRequest?.userName || 'User'}</div>
                <div className="text-xs text-white/80">Online</div>
              </div>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 bg-[url('https://i.imgur.com/jW5G4Gv.png')] bg-cover bg-center">
            {chatMessages.length === 0 ? (
              <div className="text-center text-white/70 py-8">No messages yet</div>
            ) : (
              chatMessages.map((m) => (
                <div key={m.id} className={`mb-2 flex ${m.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${m.senderType === 'admin' ? 'bg-[#d9fdd3] text-gray-900' : 'bg-white'} max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-md`}>
                    <div className="text-[10px] opacity-60 mb-0.5">{m.senderName}</div>
                    <div>{m.message}</div>
                    <div className="text-[10px] text-black/50 mt-1 text-right">
                      {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString() : new Date(m.createdAt as any).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          {/* Composer */}
          <div className="p-3 bg-[#202c33] flex gap-2">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message"
              className="flex-1 bg-[#2a3942] border border-black/20 rounded-lg px-3 py-2 text-sm focus:outline-none text-white placeholder-white/60"
            />
            <Button
              onClick={handleSendMessage}
              disabled={saving || !newMessage.trim()}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm"
            >
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 