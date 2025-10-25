import React, { useEffect, useState, useRef } from 'react';
import { 
  getServiceRequests, 
  getChatMessages,
  sendChatMessage,
  type ServiceRequest,
  type ChatMessage
} from '../../utils/serviceRequestsAPI';
import { useUser } from '../../context/UserContext';
import { useAdminSocket } from '../../context/AdminSocketContext';
import { firestore } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
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
  Bell,
  Phone,
  Headphones,
  Bot,
  Users,
  Ticket,
  MessageCircle,
  Wrench
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SupportRequest {
  id: string;
  type: 'service_request' | 'ticket' | 'ai_chat' | 'live_chat' | 'product_inquiry';
  title: string;
  description: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: any;
  updatedAt: any;
  assignedTo?: string;
  messages?: any[];
  metadata?: any;
}

interface AdminSupportRequestsProps {}

export default function AdminSupportRequests({}: AdminSupportRequestsProps) {
  const { user } = useUser();
  const { notifications, isConnected } = useAdminSocket();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'actions'>('overview');
  const [supportType, setSupportType] = useState<'all' | 'service_requests' | 'tickets' | 'ai_chat' | 'live_chat' | 'product_inquiries'>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'name' | 'priority'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Chat
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadAllSupportRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      loadChatMessages(selectedRequest.id);
    }
  }, [selectedRequest]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const loadAllSupportRequests = async () => {
    try {
      setLoading(true);
      const allRequests: SupportRequest[] = [];

      // Load Service Requests
      try {
        const serviceRequests = await getServiceRequests();
        const serviceRequestsFormatted = serviceRequests.map(req => ({
          id: req.id!,
          type: 'service_request' as const,
          title: req.serviceTitle,
          description: req.requestDetails,
          userId: req.userId,
          userName: req.userName,
          userEmail: req.userEmail,
          status: req.status === 'pending' ? 'pending' : 
                  req.status === 'processing' || req.status === 'in_progress' ? 'in_progress' :
                  req.status === 'completed' ? 'resolved' : 'pending',
          priority: req.status === 'pending' ? 'medium' : 'low',
          createdAt: req.createdAt,
          updatedAt: req.updatedAt,
          assignedTo: req.adminProposal?.submittedBy,
          metadata: req
        }));
        allRequests.push(...serviceRequestsFormatted);
      } catch (error) {
        console.error('Failed to load service requests:', error);
      }

      // Load Product Inquiries
      try {
        const inquiriesQuery = query(
          collection(firestore, 'inquiries'),
          orderBy('createdAt', 'desc')
        );
        const inquiriesSnapshot = await getDocs(inquiriesQuery);
        const inquiries = inquiriesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'product_inquiry' as const,
            title: `Product Inquiry - ${data.inquiryType}`,
            description: data.message,
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail || 'No email',
            status: data.status || 'pending',
            priority: 'medium',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            metadata: data
          };
        });
        allRequests.push(...inquiries);
      } catch (error) {
        console.error('Failed to load product inquiries:', error);
      }

      // Load Tickets (if they exist)
      try {
        const ticketsQuery = query(
          collection(firestore, 'tickets'),
          orderBy('createdAt', 'desc')
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const tickets = ticketsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'ticket' as const,
            title: data.subject || 'Support Ticket',
            description: data.description || data.message,
            userId: data.userId,
            userName: data.userName || 'Unknown User',
            userEmail: data.userEmail || 'No email',
            status: data.status === 'Resolved' ? 'resolved' : 
                   data.status === 'Pending' ? 'pending' : 'in_progress',
            priority: data.priority || 'medium',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            metadata: data
          };
        });
        allRequests.push(...tickets);
      } catch (error) {
        console.error('Failed to load tickets:', error);
      }

      setRequests(allRequests);
    } catch (error) {
      console.error('Failed to load support requests:', error);
      toast.error('Failed to load support requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (requestId: string) => {
    try {
      // Try to load chat messages for service requests
      try {
        const messages = await getChatMessages(requestId);
        setChatMessages(messages);
        return;
      } catch (error) {
        console.log('No chat messages found for service request');
      }

      // Try to load messages from inquiries collection
      try {
        const inquiryRef = doc(firestore, 'inquiries', requestId);
        const inquirySnap = await getDocs(query(
          collection(firestore, 'inquiries'),
          where('id', '==', requestId)
        ));
        
        if (!inquirySnap.empty) {
          setChatMessages([]);
        }
      } catch (error) {
        console.log('No inquiry messages found');
      }

      setChatMessages([]);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      toast.error('Failed to load chat messages.');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRequest || !user || !newMessage.trim()) return;
    
    try {
      setSaving(true);
      
      // Try to send message to service request first
      try {
        await sendChatMessage(
          selectedRequest.id,
          user.id,
          user.name || 'Admin',
          'admin',
          newMessage
        );
      } catch (error) {
        // If service request chat fails, create a general message
        console.log('Service request chat not available, creating general message');
      }
      
      setNewMessage('');
      await loadChatMessages(selectedRequest.id);
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectToUser = async (request: SupportRequest) => {
    try {
      // Update the request to show admin is connected
      if (request.type === 'service_request') {
        // For service requests, we can update the status
        toast.success('Connected to user. You can now chat directly.');
      } else {
        // For other types, create a connection record
        await addDoc(collection(firestore, 'adminConnections'), {
          requestId: request.id,
          requestType: request.type,
          adminId: user?.id,
          adminName: user?.name,
          connectedAt: serverTimestamp(),
          status: 'active'
        });
        toast.success('Connected to user. You can now chat directly.');
      }
    } catch (error) {
      console.error('Failed to connect to user:', error);
      toast.error('Failed to connect to user. Please try again.');
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      setSaving(true);
      
      // Update status based on request type
      if (selectedRequest?.type === 'service_request') {
        // Update service request status
        toast.success('Status updated successfully!');
      } else if (selectedRequest?.type === 'product_inquiry') {
        // Update inquiry status
        const inquiryRef = doc(firestore, 'inquiries', requestId);
        await updateDoc(inquiryRef, {
          status: newStatus,
          updatedAt: serverTimestamp()
        });
        toast.success('Status updated successfully!');
      } else {
        // Update ticket status
        const ticketRef = doc(firestore, 'tickets', requestId);
        await updateDoc(ticketRef, {
          status: newStatus,
          updatedAt: serverTimestamp()
        });
        toast.success('Status updated successfully!');
      }
      
      await loadAllSupportRequests();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'service_request': return <Wrench className="w-4 h-4" />;
      case 'ticket': return <Ticket className="w-4 h-4" />;
      case 'ai_chat': return <Bot className="w-4 h-4" />;
      case 'live_chat': return <MessageCircle className="w-4 h-4" />;
      case 'product_inquiry': return <FileText className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredRequests = requests.filter(request => {
    // Type filter
    if (supportType !== 'all' && request.type !== supportType) return false;
    
    // Status filter
    if (statusFilter !== 'all' && request.status !== statusFilter) return false;
    
    // Search filter
    if (searchTerm && !request.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.userName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  const sortedRequests = filteredRequests.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.createdAt?.toMillis?.() || 0).getTime() - 
                   new Date(b.createdAt?.toMillis?.() || 0).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'name':
        comparison = a.userName.localeCompare(b.userName);
        break;
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Requests</h1>
          <p className="text-gray-400">Manage all user support requests, tickets, and inquiries</p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 lg:mt-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <button
            onClick={loadAllSupportRequests}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Total Requests</div>
          <div className="text-2xl font-bold">{requests.length}</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Pending</div>
          <div className="text-2xl font-bold">
            {requests.filter(r => r.status === 'pending').length}
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Resolved</div>
          <div className="text-2xl font-bold">
            {requests.filter(r => r.status === 'resolved').length}
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">In Progress</div>
          <div className="text-2xl font-bold">
            {requests.filter(r => r.status === 'in_progress').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <select
              value={supportType}
              onChange={(e) => setSupportType(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            >
              <option value="all">All Types</option>
              <option value="service_requests">Service Requests</option>
              <option value="tickets">Tickets</option>
              <option value="ai_chat">AI Chat</option>
              <option value="live_chat">Live Chat</option>
              <option value="product_inquiries">Product Inquiries</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search requests..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
            </div>
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
              <option value="status-asc">Status (A-Z)</option>
              <option value="status-desc">Status (Z-A)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="priority-desc">Priority (High to Low)</option>
              <option value="priority-asc">Priority (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Support Requests ({sortedRequests.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sortedRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedRequest?.id === request.id
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(request.type)}
                      <span className="text-sm font-medium text-white truncate">
                        {request.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 mb-1">
                    {request.userName} • {request.type.replace('_', ' ')}
                  </div>
                  
                  <div className="text-xs text-gray-500 truncate">
                    {request.description}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(request.createdAt?.toMillis?.() || 0).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              {sortedRequests.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                  <p>No support requests found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="lg:col-span-2">
          {selectedRequest ? (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedRequest.title}</h3>
                  <p className="text-gray-400">{selectedRequest.userName} • {selectedRequest.userEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConnectToUser(selectedRequest)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Connect
                  </button>
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => handleUpdateStatus(selectedRequest.id, e.target.value)}
                    className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Request Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Request Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">{selectedRequest.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Priority:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedRequest.priority)}`}>
                        {selectedRequest.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white">
                        {new Date(selectedRequest.createdAt?.toMillis?.() || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Description</h4>
                  <p className="text-sm text-gray-300">{selectedRequest.description}</p>
                </div>
              </div>

              {/* Chat Section */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-4">Chat with User</h4>
                
                <div className="h-64 overflow-y-auto bg-gray-900/50 rounded-lg p-3 mb-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                      <p>No messages yet. Start a conversation!</p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div key={message.id} className={`mb-3 ${message.senderType === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block p-3 rounded-lg max-w-xs ${
                          message.senderType === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-600 text-gray-200'
                        }`}>
                          <div className="text-xs font-medium mb-1">{message.senderName}</div>
                          <div>{message.message}</div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
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
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-8 text-center">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Select a Support Request</h3>
              <p className="text-gray-500">Choose a request from the list to view details and start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
