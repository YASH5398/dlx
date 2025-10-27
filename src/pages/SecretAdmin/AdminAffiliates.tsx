import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, doc, onSnapshot, query, updateDoc, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import Modal from '../../components/ui/Modal';
import { 
  Search, 
  Users, 
  Crown,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Eye,
  Filter,
  RefreshCw,
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { getRankInfo } from '../../utils/rankSystem';

interface AffiliateUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  rank: string;
  affiliatePartner: boolean;
  affiliateApproved: boolean;
  affiliateJoinedAt: any;
  affiliateEarnings: number;
  affiliateReferrals: number;
  createdAt: any;
  affiliateStatus?: string;
  affiliateApprovedAt?: any;
  affiliateRejectedAt?: any;
}

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateUser | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      // Fetch all users and filter for affiliate-related data
      const q = query(
        collection(firestore, 'users'),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const affiliatesData: AffiliateUser[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Check if user has any affiliate-related data
          const hasAffiliateData = data.affiliateStatus || 
                                 data.affiliatePartner || 
                                 data.affiliateApproved || 
                                 data.affiliateJoinedAt ||
                                 (data.affiliateEarnings && data.affiliateEarnings > 0) ||
                                 (data.affiliateReferrals && data.affiliateReferrals > 0);
          
          if (hasAffiliateData) {
            affiliatesData.push({
              id: doc.id,
              name: data.name || data.displayName || 'Unknown User',
              email: data.email || '',
              phone: data.phone || data.phoneNumber || '',
              rank: data.rank || 'starter',
              affiliatePartner: data.affiliatePartner || false,
              affiliateApproved: data.affiliateApproved || false,
              affiliateJoinedAt: data.affiliateJoinedAt,
              affiliateEarnings: data.affiliateEarnings || 0,
              affiliateReferrals: data.affiliateReferrals || 0,
              createdAt: data.createdAt,
              affiliateStatus: data.affiliateStatus || 'pending',
              affiliateApprovedAt: data.affiliateApprovedAt,
              affiliateRejectedAt: data.affiliateRejectedAt
            });
          }
        });
        
        // Sort by affiliateJoinedAt or createdAt
        affiliatesData.sort((a, b) => {
          const dateA = a.affiliateJoinedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.affiliateJoinedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setAffiliates(affiliatesData);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading affiliates:', error);
      setLoading(false);
    }
  };

  const handleApproveAffiliate = async () => {
    if (!selectedAffiliate) return;
    
    try {
      setIsUpdating(true);
      await updateDoc(doc(firestore, 'users', selectedAffiliate.id), {
        affiliateApproved: true,
        affiliateApprovedAt: serverTimestamp(),
        affiliateStatus: 'approved',
        approvedBy: 'admin'
      });
      setShowApprovalModal(false);
      setSelectedAffiliate(null);
    } catch (error) {
      console.error('Error approving affiliate:', error);
      alert('Failed to approve affiliate');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectAffiliate = async () => {
    if (!selectedAffiliate) return;
    
    try {
      setIsUpdating(true);
      await updateDoc(doc(firestore, 'users', selectedAffiliate.id), {
        affiliateApproved: false,
        affiliateRejectedAt: serverTimestamp(),
        affiliateStatus: 'rejected',
        rejectedBy: 'admin',
        rejectionReason: rejectionReason
      });
      setShowRejectionModal(false);
      setSelectedAffiliate(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting affiliate:', error);
      alert('Failed to reject affiliate');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (affiliate: AffiliateUser) => {
    if (affiliate.affiliateApproved) return 'bg-green-100 text-green-800';
    if (affiliate.affiliateStatus === 'rejected') return 'bg-red-100 text-red-800';
    if (affiliate.affiliatePartner) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (affiliate: AffiliateUser) => {
    if (affiliate.affiliateApproved) return <CheckCircle className="w-4 h-4" />;
    if (affiliate.affiliateStatus === 'rejected') return <XCircle className="w-4 h-4" />;
    if (affiliate.affiliatePartner) return <Clock className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getStatusText = (affiliate: AffiliateUser) => {
    if (affiliate.affiliateApproved) return 'Approved';
    if (affiliate.affiliateStatus === 'rejected') return 'Rejected';
    if (affiliate.affiliatePartner) return 'Pending';
    return 'Pending';
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = (affiliate.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (affiliate.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'approved' && affiliate.affiliateApproved) ||
                         (statusFilter === 'pending' && !affiliate.affiliateApproved && affiliate.affiliateStatus !== 'rejected') ||
                         (statusFilter === 'rejected' && affiliate.affiliateStatus === 'rejected');
    
    return matchesSearch && matchesStatus;
  });

  const getTotalStats = () => {
    const total = affiliates.length;
    const approved = affiliates.filter(a => a.affiliateApproved).length;
    const pending = affiliates.filter(a => !a.affiliateApproved && a.affiliateStatus !== 'rejected').length;
    const totalEarnings = affiliates.reduce((sum, a) => sum + (a.affiliateEarnings || 0), 0);
    const totalReferrals = affiliates.reduce((sum, a) => sum + (a.affiliateReferrals || 0), 0);
    
    return { total, approved, pending, totalEarnings, totalReferrals };
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading affiliates...</div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Affiliate Management
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage affiliate partners and requests</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live updates</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Total Affiliates</p>
                  <p className="text-blue-100 text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-600/20 to-green-700/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Approved</p>
                  <p className="text-green-100 text-2xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 text-sm font-medium">Pending</p>
                  <p className="text-yellow-100 text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Total Earnings</p>
                  <p className="text-purple-100 text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-600/20 to-orange-700/20 border-orange-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm font-medium">Total Referrals</p>
                  <p className="text-orange-100 text-2xl font-bold">{stats.totalReferrals}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search affiliates..."
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
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={loadAffiliates}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Affiliates Table */}
        <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Affiliates
              <Badge variant="outline" className="ml-2">
                {filteredAffiliates.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage affiliate partners and their requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Affiliate</TableHead>
                    <TableHead className="text-gray-300">Rank</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Earnings</TableHead>
                    <TableHead className="text-gray-300">Referrals</TableHead>
                    <TableHead className="text-gray-300">Joined</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliates.map((affiliate) => {
                    const rankInfo = getRankInfo(affiliate.rank);
                    return (
                      <TableRow key={affiliate.id} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell className="text-white">
                          <div>
                            <div className="font-medium">{affiliate.name || 'Unknown User'}</div>
                            <div className="text-sm text-gray-400">{affiliate.email || 'No Email'}</div>
                            {affiliate.phone && (
                              <div className="text-sm text-gray-400">{affiliate.phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-white">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${rankInfo.color}`}></div>
                            <span className="capitalize">{affiliate.rank}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(affiliate)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(affiliate)}
                              <span>{getStatusText(affiliate)}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">
                          <div className="font-medium">{formatCurrency(affiliate.affiliateEarnings || 0)}</div>
                        </TableCell>
                        <TableCell className="text-white">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            <span>{affiliate.affiliateReferrals || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">
                          <div className="text-sm">{formatDate(affiliate.affiliateJoinedAt || affiliate.createdAt)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAffiliate(affiliate)}
                              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {!affiliate.affiliateApproved && affiliate.affiliateStatus !== 'rejected' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAffiliate(affiliate);
                                    setShowApprovalModal(true);
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAffiliate(affiliate);
                                    setShowRejectionModal(true);
                                  }}
                                  variant="destructive"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Affiliate Details Modal */}
        <Modal
          open={!!selectedAffiliate}
          onClose={() => setSelectedAffiliate(null)}
          title="Affiliate Details"
          maxWidth="max-w-2xl"
        >
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Name</label>
                  <p className="text-white">{selectedAffiliate.name || 'Unknown User'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Email</label>
                  <p className="text-white">{selectedAffiliate.email || 'No Email'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Phone</label>
                  <p className="text-white">{selectedAffiliate.phone || 'No Phone'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Rank</label>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getRankInfo(selectedAffiliate.rank).color}`}></div>
                    <span className="text-white capitalize">{selectedAffiliate.rank}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Status</label>
                  <Badge className={getStatusColor(selectedAffiliate)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedAffiliate)}
                      <span>{getStatusText(selectedAffiliate)}</span>
                    </div>
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Earnings</label>
                  <p className="text-white text-lg font-semibold">{formatCurrency(selectedAffiliate.affiliateEarnings || 0)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Referrals</label>
                  <p className="text-white text-lg font-semibold">{selectedAffiliate.affiliateReferrals || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Joined</label>
                  <p className="text-white">{formatDate(selectedAffiliate.affiliateJoinedAt || selectedAffiliate.createdAt)}</p>
                </div>
              </div>
              
              {selectedAffiliate.affiliateApprovedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Approved At</label>
                  <p className="text-white">{formatDate(selectedAffiliate.affiliateApprovedAt)}</p>
                </div>
              )}
              
              {selectedAffiliate.affiliateRejectedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Rejected At</label>
                  <p className="text-white">{formatDate(selectedAffiliate.affiliateRejectedAt)}</p>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Approval Modal */}
        <Modal
          open={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedAffiliate(null);
          }}
          title="Approve Affiliate"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-600/20 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-300 font-medium">Approve this affiliate?</p>
                <p className="text-green-400 text-sm">This will give them access to affiliate features.</p>
              </div>
            </div>
            
            {selectedAffiliate && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">{selectedAffiliate.name}</h4>
                <p className="text-gray-400 text-sm">{selectedAffiliate.email}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span>Rank: {selectedAffiliate.rank}</span>
                  <span>Referrals: {selectedAffiliate.affiliateReferrals || 0}</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={handleApproveAffiliate}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {isUpdating ? 'Approving...' : 'Approve Affiliate'}
              </Button>
              <Button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedAffiliate(null);
                }}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Rejection Modal */}
        <Modal
          open={showRejectionModal}
          onClose={() => {
            setShowRejectionModal(false);
            setSelectedAffiliate(null);
            setRejectionReason('');
          }}
          title="Reject Affiliate"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-600/20 border border-red-500/30 rounded-lg">
              <XCircle className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-red-300 font-medium">Reject this affiliate?</p>
                <p className="text-red-400 text-sm">This will deny them access to affiliate features.</p>
              </div>
            </div>
            
            {selectedAffiliate && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">{selectedAffiliate.name}</h4>
                <p className="text-gray-400 text-sm">{selectedAffiliate.email}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span>Rank: {selectedAffiliate.rank}</span>
                  <span>Referrals: {selectedAffiliate.affiliateReferrals || 0}</span>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rejection Reason (Optional)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-white/5 border-white/10 text-white placeholder:text-gray-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                rows={3}
                placeholder="Enter reason for rejection..."
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleRejectAffiliate}
                disabled={isUpdating}
                variant="destructive"
                className="disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                {isUpdating ? 'Rejecting...' : 'Reject Affiliate'}
              </Button>
              <Button
                onClick={() => {
                  setShowRejectionModal(false);
                  setSelectedAffiliate(null);
                  setRejectionReason('');
                }}
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