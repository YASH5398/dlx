import React, { useEffect, useState } from 'react';
import { 
  getServiceRequests, 
  submitAdminProposal,
  reviewPayment,
  updateOrderStatus,
  releaseDeliverables,
  sendChatMessage,
  submitInquiry,
  getChatMessages,
  type ServiceRequest,
  type ProposalLineItem,
  type ChatMessage,
  type Inquiry
} from '../../utils/serviceRequestsAPI';
import { useUser } from '../../context/UserContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card.tsx';
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
  ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminServiceRequestsEnhancedProps {}

export default function AdminServiceRequestsEnhanced({}: AdminServiceRequestsEnhancedProps) {
  const { user } = useUser();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Proposal form
  const [proposalForm, setProposalForm] = useState({
    totalPrice: '',
    currency: 'USD' as 'USD' | 'INR',
    description: '',
    estimatedDelivery: '',
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
    }
  }, [selectedRequest]);

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
          estimatedDelivery: proposalForm.estimatedDelivery
        }
      );
      setProposalForm({
        totalPrice: '',
        currency: 'USD',
        description: '',
        estimatedDelivery: '',
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
      await releaseDeliverables(
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
      setDeliverables({
        websiteLink: '',
        adminPanelLink: '',
        username: '',
        password: '',
        files: [],
        notes: ''
      });
      await loadRequests();
      await loadChatMessages(selectedRequest.id!);
      toast.success('Deliverables released successfully!');
    } catch (error) {
      console.error('Failed to release deliverables:', error);
      toast.error('Failed to release deliverables. Please try again.');
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

  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      request.serviceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg text-gray-700 flex items-center gap-3"
        >
          <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading service requests...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Service Requests</h1>
              <p className="text-gray-600 text-base mt-2">Efficiently manage and process service requests</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live updates</span>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <Card className="mb-10 bg-white border-gray-200 shadow-sm rounded-xl sticky top-0 z-10">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by title, name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 rounded-lg focus:ring-2 focus:ring-blue-600 transition-all duration-300"
                    aria-label="Search service requests"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-gray-100 border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-gray-900">
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
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Requests List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white border-gray-200 shadow-sm rounded-xl sticky top-24">
              <CardHeader>
                <CardTitle className="text-gray-900 text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Service Requests
                  <Badge variant="outline" className="border-blue-200 text-blue-600">
                    {filteredRequests.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Select a request to view and manage details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {filteredRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all duration-300 ${
                          selectedRequest?.id === request.id 
                            ? 'bg-blue-50 border-blue-300 shadow-md' 
                            : 'bg-white border-gray-200 hover:shadow-md hover:border-blue-300'
                        } rounded-lg`}
                        onClick={() => setSelectedRequest(request)}
                        role="button"
                        aria-label={`Select request: ${request.serviceTitle}`}
                      >
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-gray-900 text-lg">{request.serviceTitle}</h3>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span>{request.userName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span className="truncate">{request.userEmail}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(request.userEmail)}
                                className="ml-1 p-1"
                              >
                                <Copy className="w-4 h-4 text-gray-500" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span>{request.serviceCategory}</span>
                            </div>
                            {request.adminProposal && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-gray-500" />
                                <span>{request.adminProposal.currency} {request.adminProposal.totalPrice}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
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
              <Card className="bg-white border-gray-200 shadow-sm rounded-xl">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-gray-900 text-2xl font-semibold tracking-tight">{selectedRequest.serviceTitle}</CardTitle>
                      <CardDescription className="text-gray-600">{selectedRequest.serviceCategory}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(selectedRequest.status)}>
                      {selectedRequest.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* User Information */}
                  <Card className="bg-gray-50 border-gray-200 rounded-lg">
                    <CardHeader>
                      <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        User Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>Name: {selectedRequest.userName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>Email: {selectedRequest.userEmail}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedRequest.userEmail)}
                          className="ml-1 p-1"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span>User ID: {selectedRequest.userId}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedRequest.userId)}
                          className="ml-1 p-1"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Request Details (Accordion) */}
                  <Card className="bg-gray-50 border-gray-200 rounded-lg">
                    <CardHeader>
                      <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Request Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedRequest.requestDetails && (
                        <div>
                          <button
                            className="w-full flex justify-between items-center text-left text-sm font-medium text-gray-900"
                            onClick={() => setExpandedSection(expandedSection === 'details' ? null : 'details')}
                            aria-expanded={expandedSection === 'details'}
                            aria-controls="request-details-content"
                          >
                            <span>Request Description</span>
                            {expandedSection === 'details' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                          <AnimatePresence>
                            {expandedSection === 'details' && (
                              <motion.div
                                id="request-details-content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-2 text-sm text-gray-600"
                              >
                                <p className="whitespace-pre-wrap">{selectedRequest.requestDetails}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(selectedRequest.requestDetails)}
                                  className="mt-2"
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                      {selectedRequest.serviceCategory && (
                        <div>
                          <button
                            className="w-full flex justify-between items-center text-left text-sm font-medium text-gray-900"
                            onClick={() => setExpandedSection(expandedSection === 'category' ? null : 'category')}
                            aria-expanded={expandedSection === 'category'}
                            aria-controls="category-content"
                          >
                            <span>Category</span>
                            {expandedSection === 'category' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                          <AnimatePresence>
                            {expandedSection === 'category' && (
                              <motion.div
                                id="category-content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-2 text-sm text-gray-600"
                              >
                                <p>{selectedRequest.serviceCategory}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                      {selectedRequest.adminProposal && (
                        <div>
                          <button
                            className="w-full flex justify-between items-center text-left text-sm font-medium text-gray-900"
                            onClick={() => setExpandedSection(expandedSection === 'proposal' ? null : 'proposal')}
                            aria-expanded={expandedSection === 'proposal'}
                            aria-controls="proposal-content"
                          >
                            <span>Proposal</span>
                            {expandedSection === 'proposal' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                          <AnimatePresence>
                            {expandedSection === 'proposal' && (
                              <motion.div
                                id="proposal-content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-2 text-sm text-gray-600"
                              >
                                <p>{selectedRequest.adminProposal.currency} {selectedRequest.adminProposal.totalPrice}</p>
                                <p className="mt-1">{selectedRequest.adminProposal.description}</p>
                                {selectedRequest.adminProposal.estimatedDelivery && (
                                  <p className="mt-1">Estimated Delivery: {selectedRequest.adminProposal.estimatedDelivery}</p>
                                )}
                                {selectedRequest.adminProposal.lineItems?.length > 0 && (
                                  <div className="mt-2">
                                    <h4 className="text-sm font-medium text-gray-700">Line Items:</h4>
                                    <ul className="list-disc pl-5 text-sm">
                                      {selectedRequest.adminProposal.lineItems.map((item, index) => (
                                        <li key={index}>
                                          {item.name}: {item.quantity} x {item.unitPrice} = {item.totalPrice}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                      {selectedRequest.payment && (
                        <div>
                          <button
                            className="w-full flex justify-between items-center text-left text-sm font-medium text-gray-900"
                            onClick={() => setExpandedSection(expandedSection === 'payment' ? null : 'payment')}
                            aria-expanded={expandedSection === 'payment'}
                            aria-controls="payment-content"
                          >
                            <span>Payment</span>
                            {expandedSection === 'payment' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                          <AnimatePresence>
                            {expandedSection === 'payment' && (
                              <motion.div
                                id="payment-content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-2 text-sm text-gray-600"
                              >
                                <p>{selectedRequest.payment.currency} {selectedRequest.payment.amount} - {selectedRequest.payment.status}</p>
                                {selectedRequest.payment.upiDetails && (
                                  <div className="mt-2">
                                    <p>UPI ID: {selectedRequest.payment.upiDetails.upiId}</p>
                                    {selectedRequest.payment.upiDetails.transactionId && (
                                      <p>Transaction ID: {selectedRequest.payment.upiDetails.transactionId}</p>
                                    )}
                                    {selectedRequest.payment.upiDetails.utr && (
                                      <p>UTR: {selectedRequest.payment.upiDetails.utr}</p>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Admin Actions */}
                  <div className="space-y-8">
                    {/* Submit Proposal */}
                    {selectedRequest.status === 'pending' && (
                      <Card className="bg-gray-50 border-gray-200 rounded-lg">
                        <CardHeader>
                          <CardTitle className="text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-blue-600" />
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
                                className="bg-gray-100 border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600"
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
                                <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200 text-gray-900">
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
                              className="w-full bg-gray-100 border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 transition-all duration-300"
                              rows={5}
                              placeholder="Describe the proposal details"
                              aria-label="Proposal description"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery</label>
                            <Input
                              type="date"
                              value={proposalForm.estimatedDelivery}
                              onChange={(e) => setProposalForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                              className="bg-gray-100 border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600"
                              aria-label="Estimated delivery date"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <label className="block text-sm font-medium text-gray-700">Line Items</label>
                              <Button
                                type="button"
                                onClick={addLineItem}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                              </Button>
                            </div>
                            <div className="space-y-3">
                              {proposalForm.lineItems.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-5 gap-3 items-center">
                                  <Input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                                    className="bg-gray-100 border-gray-300 text-gray-900 text-sm rounded-lg"
                                    placeholder="Item name"
                                    aria-label={`Line item ${index + 1} name`}
                                  />
                                  <Input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                    className="bg-gray-100 border-gray-300 text-gray-900 text-sm rounded-lg"
                                    placeholder="Description"
                                    aria-label={`Line item ${index + 1} description`}
                                  />
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                                    className="bg-gray-100 border-gray-300 text-gray-900 text-sm rounded-lg"
                                    placeholder="Qty"
                                    aria-label={`Line item ${index + 1} quantity`}
                                  />
                                  <Input
                                    type="number"
                                    value={item.unitPrice}
                                    onChange={(e) => updateLineItem(index, 'unitPrice', Number(e.target.value))}
                                    className="bg-gray-100 border-gray-300 text-gray-900 text-sm rounded-lg"
                                    placeholder="Unit price"
                                    aria-label={`Line item ${index + 1} unit price`}
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => removeLineItem(index)}
                                    variant="destructive"
                                    size="sm"
                                    className="rounded-lg"
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
                            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-all duration-300"
                          >
                            {saving ? 'Submitting...' : 'Submit Proposal'}
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Payment Review */}
                    {selectedRequest.status === 'payment_review' && selectedRequest.payment && (
                      <Card className="bg-gray-50 border-gray-200 rounded-lg">
                        <CardHeader>
                          <CardTitle className="text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                            Payment Review
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 mb-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Method:</span>
                              <span>{selectedRequest.payment.method}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Amount:</span>
                              <span>{selectedRequest.payment.currency} {selectedRequest.payment.amount}</span>
                            </div>
                            {selectedRequest.payment.upiDetails && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">UPI ID:</span>
                                  <span>{selectedRequest.payment.upiDetails.upiId}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(selectedRequest.payment.upiDetails.upiId)}
                                    className="ml-1 p-1"
                                  >
                                    <Copy className="w-4 h-4 text-gray-500" />
                                  </Button>
                                </div>
                                {selectedRequest.payment.upiDetails.transactionId && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Transaction ID:</span>
                                    <span>{selectedRequest.payment.upiDetails.transactionId}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(selectedRequest.payment.upiDetails.transactionId)}
                                      className="ml-1 p-1"
                                    >
                                      <Copy className="w-4 h-4 text-gray-500" />
                                    </Button>
                                  </div>
                                )}
                                {selectedRequest.payment.upiDetails.utr && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">UTR:</span>
                                    <span>{selectedRequest.payment.upiDetails.utr}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(selectedRequest.payment.upiDetails.utr)}
                                      className="ml-1 p-1"
                                    >
                                      <Copy className="w-4 h-4 text-gray-500" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleReviewPayment('approve')}
                              disabled={saving}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-all duration-300"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {saving ? 'Processing...' : 'Approve Payment'}
                            </Button>
                            <Button
                              onClick={() => handleReviewPayment('reject')}
                              disabled={saving}
                              variant="destructive"
                              className="rounded-lg disabled:opacity-50 transition-all duration-300"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              {saving ? 'Processing...' : 'Reject Payment'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Status Update */}
                    {['processing', 'in_progress'].includes(selectedRequest.status) && (
                      <Card className="bg-gray-50 border-gray-200 rounded-lg">
                        <CardHeader>
                          <CardTitle className="text-gray-900 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Update Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleUpdateStatus('in_progress')}
                              disabled={saving}
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-all duration-300"
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              {saving ? 'Updating...' : 'Mark In Progress'}
                            </Button>
                            <Button
                              onClick={() => handleUpdateStatus('completed')}
                              disabled={saving}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-all duration-300"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {saving ? 'Updating...' : 'Mark Completed'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Release Deliverables */}
                    {selectedRequest.status === 'completed' && (
                      <Card className="bg-gray-50 border-gray-200 rounded-lg">
                        <CardHeader>
                          <CardTitle className="text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Release Deliverables
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
                                className="bg-gray-100 border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600"
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
                                className="bg-gray-100 border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600"
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
                                className="bg-gray-100 border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600"
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
                                className="bg-gray-100 border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600"
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
                              className="bg-gray-100 border-gray-300 text-gray-900 rounded-lg"
                              aria-label="Upload files"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            <textarea
                              value={deliverables.notes}
                              onChange={(e) => setDeliverables(prev => ({ ...prev, notes: e.target.value }))}
                              className="w-full bg-gray-100 border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600"
                              rows={5}
                              placeholder="Additional notes for the user"
                              aria-label="Deliverable notes"
                            />
                          </div>
                          <Button
                            onClick={handleReleaseDeliverables}
                            disabled={saving}
                            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-all duration-300"
                          >
                            {saving ? 'Releasing...' : 'Release Deliverables'}
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Chat */}
                    <Card className="bg-gray-50 border-gray-200 rounded-lg">
                      <CardHeader>
                        <CardTitle className="text-gray-900 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                          Chat
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
                            {chatMessages.map((message) => (
                              <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`mb-4 ${message.senderType === 'admin' ? 'text-right' : 'text-left'}`}
                              >
                                <div
                                  className={`inline-block p-3 rounded-lg max-w-lg ${
                                    message.senderType === 'admin' 
                                      ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                                  }`}
                                >
                                  <div className="text-xs font-medium text-gray-600 mb-1">{message.senderName}</div>
                                  <div className="text-sm">{message.message}</div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          <div className="flex gap-3">
                            <Input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              className="flex-1 bg-gray-100 border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600"
                              placeholder="Type a message..."
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              aria-label="Chat message"
                            />
                            <Button
                              onClick={handleSendMessage}
                              disabled={saving || !newMessage.trim()}
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-all duration-300"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Inquiry */}
                    <Card className="bg-gray-50 border-gray-200 rounded-lg">
                      <CardHeader>
                        <CardTitle className="text-gray-900 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-blue-600" />
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
                            <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200 text-gray-900">
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
                            className="w-full bg-gray-100 border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 transition-all duration-300"
                            rows={5}
                            placeholder="Enter your inquiry..."
                            aria-label="Inquiry message"
                          />
                        </div>
                        <Button
                          onClick={handleSubmitInquiry}
                          disabled={saving || !newInquiry.message.trim()}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition-all duration-300"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {saving ? 'Submitting...' : 'Submit Inquiry'}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}