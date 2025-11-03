import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, query, orderBy, where, doc, getDoc, getDocs } from 'firebase/firestore';
import { 
  approveWithdrawal, 
  rejectWithdrawal, 
  type WithdrawalRequest 
} from '../../utils/transactionAPI';
import { useUser } from '../../context/UserContext';
import { userCache } from '../../utils/userCache';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import Modal from '../../components/ui/Modal';
import { 
  Search, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  Eye,
  RefreshCw,
  TrendingDown,
  CreditCard,
  Wallet,
  Banknote,
  Filter,
  Download
} from 'lucide-react';

interface WithdrawalRequestWithUser extends WithdrawalRequest {
  user?: {
    name: string;
    email: string;
  };
}

export default function AdminWithdrawalRequests() {
  const { user } = useUser();
  const [requests, setRequests] = useState<WithdrawalRequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [walletTypeFilter, setWalletTypeFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequestWithUser | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      // One-time fetch instead of continuous listener
      const q = query(
        collection(firestore, 'withdrawalRequests'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const requestsData: WithdrawalRequestWithUser[] = [];
      const requestsMap = new Map<string, WithdrawalRequestWithUser>();
      
      // Step 1: Extract all unique user IDs
      const uniqueUserIds = new Set<string>();
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data() as WithdrawalRequest;
        uniqueUserIds.add(data.userId);
        
        // Initialize request with basic data
        requestsMap.set(docSnap.id, {
          id: docSnap.id,
          ...data
        } as WithdrawalRequestWithUser);
      });
      
      // Step 2: Batch fetch all user documents in parallel with cache support
      const userDataMap = new Map<string, { name: string; email: string }>();
      const userIdArray = Array.from(uniqueUserIds);
      
      // Separate cached and uncached users
      const uncachedUserIds: string[] = [];
      userIdArray.forEach(userId => {
        const cached = userCache.get(userId);
        if (cached) {
          userDataMap.set(userId, cached);
        } else {
          uncachedUserIds.push(userId);
        }
      });
      
      // Fetch only uncached users in parallel
      if (uncachedUserIds.length > 0) {
        const userPromises = uncachedUserIds.map(userId => 
          getDoc(doc(firestore, 'users', userId)).catch(err => {
            console.error(`Failed to fetch user ${userId}:`, err);
            return null;
          })
        );
        
        const userDocs = await Promise.all(userPromises);
        userDocs.forEach((userDoc, index) => {
          if (userDoc?.exists()) {
            const userData = userDoc.data();
            const name = userData.name || userData.displayName || 'Unknown User';
            const email = userData.email || 'No Email';
            const userId = uncachedUserIds[index];
            
            // Store in cache and map
            userCache.set(userId, name, email);
            userDataMap.set(userId, { name, email });
          }
        });
      }
      
      // Step 3: Populate user data from cache/map
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data() as WithdrawalRequest;
        const requestWithUser = requestsMap.get(docSnap.id)!;
        requestWithUser.user = userDataMap.get(data.userId) || {
          name: 'Unknown User',
          email: 'No Email'
        };
        requestsData.push(requestWithUser);
      });
      
      setRequests(requestsData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load withdrawal requests:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      await approveWithdrawal(requestId, user.id, user.email);
      setSelectedRequest(null);
      // Refresh data after approval (one-time fetch)
      await loadRequests();
    } catch (error: any) {
      console.error('Failed to approve withdrawal:', error);
      const errorMessage = error?.message?.toLowerCase().includes('quota') || 
                          error?.message?.includes('429') ||
                          error?.code === 'resource-exhausted'
        ? 'Rate limit exceeded. The request is being retried automatically. Please wait a moment and try again if it still fails.'
        : 'Failed to approve withdrawal. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: string, reason?: string) => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      await rejectWithdrawal(requestId, user.id, user.email, reason);
      setSelectedRequest(null);
      setShowRejectDialog(false);
      setRejectReason('');
      // Refresh data after rejection (one-time fetch)
      await loadRequests();
    } catch (error) {
      console.error('Failed to reject withdrawal:', error);
      alert('Failed to reject withdrawal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || request.method === methodFilter;
    const matchesWalletType = walletTypeFilter === 'all' || request.walletType === walletTypeFilter;
    const matchesSearch = searchTerm === '' || 
      request.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.amount.toString().includes(searchTerm) ||
      request.txnId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesMethod && matchesWalletType && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading withdrawal requests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Withdrawal Requests
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage and process withdrawal requests</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live updates</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={(value) => setMethodFilter(value)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filter by method" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
              <Select value={walletTypeFilter} onValueChange={(value) => setWalletTypeFilter(value)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filter by wallet" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Wallets</SelectItem>
                  <SelectItem value="main">Main Wallet</SelectItem>
                  <SelectItem value="purchase">Purchase Wallet</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={loadRequests}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 text-sm font-medium">Pending</p>
                  <p className="text-yellow-100 text-2xl font-bold">
                    {requests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-600/20 to-green-700/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Approved</p>
                  <p className="text-green-100 text-2xl font-bold">
                    {requests.filter(r => r.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-600/20 to-red-700/20 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-300 text-sm font-medium">Rejected</p>
                  <p className="text-red-100 text-2xl font-bold">
                    {requests.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Total Amount</p>
                  <p className="text-blue-100 text-2xl font-bold">
                    {formatAmount(
                      requests.reduce((sum, r) => sum + r.amount, 0),
                      'USDT'
                    )}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table */}
        <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Withdrawal Requests
              <Badge variant="outline" className="ml-2">
                {filteredRequests.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage and process withdrawal requests from users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">Method</TableHead>
                    <TableHead className="text-gray-300">Wallet Type</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} className="border-gray-700 hover:bg-gray-800/50">
                      <TableCell className="text-white">
                        <div>
                          <div className="font-medium">{request.user?.name || 'Unknown User'}</div>
                          <div className="text-sm text-gray-400">{request.user?.email || 'No Email'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="font-medium">{formatAmount(request.amount, request.currency)}</div>
                        {request.fees > 0 && (
                          <div className="text-sm text-gray-400">Fees: {formatAmount(request.fees, request.currency)}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="capitalize">{request.method}</span>
                        </div>
                        {request.txnId && (
                          <div className="text-sm text-gray-400">ID: {request.txnId}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-gray-400" />
                          <span className="capitalize">{request.walletType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            <span className="capitalize">{request.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="text-sm">{formatDate(request.createdAt)}</div>
                        {request.approvedAt && (
                          <div className="text-xs text-gray-400">
                            Approved: {formatDate(request.approvedAt)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Request Details Modal */}
        <Modal
          open={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title="Withdrawal Request Details"
          maxWidth="max-w-2xl"
        >
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">User</label>
                  <p className="text-white">{selectedRequest.user?.name || 'Unknown User'}</p>
                  <p className="text-sm text-gray-400">{selectedRequest.user?.email || 'No Email'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Amount</label>
                  <p className="text-white text-lg font-semibold">
                    {formatAmount(selectedRequest.amount, selectedRequest.currency)}
                  </p>
                  {selectedRequest.fees > 0 && (
                    <p className="text-sm text-gray-400">
                      Fees: {formatAmount(selectedRequest.fees, selectedRequest.currency)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Method</label>
                  <p className="text-white capitalize">{selectedRequest.method}</p>
                  {selectedRequest.txnId && (
                    <p className="text-sm text-gray-400">Transaction ID: {selectedRequest.txnId}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Wallet Type</label>
                  <p className="text-white capitalize">{selectedRequest.walletType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Status</label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedRequest.status)}
                      <span className="capitalize">{selectedRequest.status}</span>
                    </div>
                  </Badge>
                </div>
              </div>
              
              {selectedRequest.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Notes</label>
                  <p className="text-white bg-gray-700/50 p-3 rounded-md">{selectedRequest.notes}</p>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Created: {formatDate(selectedRequest.createdAt)}</span>
              </div>
              
              {selectedRequest.approvedBy && (
                <div className="text-sm text-gray-400">
                  Approved by: {selectedRequest.approvedBy}
                </div>
              )}
              
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t border-gray-700">
                  <Button
                    onClick={() => handleApprove(selectedRequest.id!)}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {isProcessing ? 'Processing...' : 'Approve'}
                  </Button>
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isProcessing}
                    variant="destructive"
                    className="disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Reject Dialog */}
        <Modal
          open={showRejectDialog}
          onClose={() => setShowRejectDialog(false)}
          title="Reject Withdrawal Request"
        >
          <div className="space-y-4">
            <p className="text-gray-400">
              Please provide a reason for rejecting this withdrawal request.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-white/5 border-white/10 text-white placeholder:text-gray-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                rows={3}
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleReject(selectedRequest?.id!, rejectReason)}
                disabled={isProcessing}
                variant="destructive"
                className="disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                {isProcessing ? 'Rejecting...' : 'Reject Request'}
              </Button>
              <Button
                onClick={() => setShowRejectDialog(false)}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
