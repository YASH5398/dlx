import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, doc, onSnapshot, query, updateDoc, orderBy, where } from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog } from '@headlessui/react';
import { 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  Eye,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Wallet,
  Banknote
} from 'lucide-react';

interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  method?: string;
  description?: string;
  createdAt: any;
  updatedAt?: any;
  adminNotes?: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function AdminTransactionsEnhanced() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      // Listen to both deposits and withdrawals
      const depositsQuery = query(collection(firestore, 'deposits'), orderBy('createdAt', 'desc'));
      const withdrawalsQuery = query(collection(firestore, 'withdrawals'), orderBy('createdAt', 'desc'));
      
      const unsubscribeDeposits = onSnapshot(depositsQuery, (snapshot) => {
        const deposits: Transaction[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          deposits.push({
            id: doc.id,
            userId: data.userId || '',
            type: 'deposit',
            amount: data.amount || 0,
            currency: data.currency || 'USDT',
            status: data.status || 'pending',
            method: data.method || 'Unknown',
            description: data.description || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            adminNotes: data.adminNotes || '',
            user: data.user || null
          });
        });
        
        setTransactions(prev => {
          const filtered = prev.filter(t => t.type !== 'deposit');
          return [...filtered, ...deposits].sort((a, b) => 
            new Date(b.createdAt?.toDate?.() || 0).getTime() - new Date(a.createdAt?.toDate?.() || 0).getTime()
          );
        });
      });
      
      const unsubscribeWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
        const withdrawals: Transaction[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          withdrawals.push({
            id: doc.id,
            userId: data.userId || '',
            type: 'withdrawal',
            amount: data.amount || 0,
            currency: data.currency || 'USDT',
            status: data.status || 'pending',
            method: data.method || 'Unknown',
            description: data.description || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            adminNotes: data.adminNotes || '',
            user: data.user || null
          });
        });
        
        setTransactions(prev => {
          const filtered = prev.filter(t => t.type !== 'withdrawal');
          return [...filtered, ...withdrawals].sort((a, b) => 
            new Date(b.createdAt?.toDate?.() || 0).getTime() - new Date(a.createdAt?.toDate?.() || 0).getTime()
          );
        });
      });
      
      setLoading(false);
      
      return () => {
        unsubscribeDeposits();
        unsubscribeWithdrawals();
      };
    } catch (error) {
      console.error('Error loading transactions:', error);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (transactionId: string, newStatus: string, adminNotes?: string) => {
    try {
      setIsUpdating(true);
      const collectionName = selectedTransaction?.type === 'deposit' ? 'deposits' : 'withdrawals';
      await updateDoc(doc(firestore, collectionName, transactionId), {
        status: newStatus,
        adminNotes: adminNotes || '',
        updatedAt: new Date(),
        reviewedBy: 'admin'
      });
      
      // Update local state
      setTransactions(prev => prev.map(t => 
        t.id === transactionId 
          ? { ...t, status: newStatus, adminNotes: adminNotes || '', updatedAt: new Date() }
          : t
      ));
      
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'completed': return CheckCircle;
      default: return AlertCircle;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return ArrowDownLeft;
      case 'withdrawal': return ArrowUpRight;
      default: return DollarSign;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-green-600 dark:text-green-400';
      case 'withdrawal': return 'text-red-600 dark:text-red-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTotalStats = () => {
    const total = transactions.length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    const approved = transactions.filter(t => t.status === 'approved').length;
    const rejected = transactions.filter(t => t.status === 'rejected').length;
    const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
    
    return { total, pending, approved, rejected, totalDeposits, totalWithdrawals };
  };

  const stats = getTotalStats();

  const exportCsv = () => {
    const header = ['ID', 'Type', 'User', 'Amount', 'Currency', 'Status', 'Method', 'Created', 'Updated'];
    const lines = transactions.map(t => [
      t.id,
      t.type,
      t.user?.name || 'Unknown',
      t.amount.toString(),
      t.currency,
      t.status,
      t.method || 'N/A',
      t.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
      t.updatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'
    ].join(','));
    
    const blob = new Blob([[header.join(',')].concat(lines).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Transactions
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Manage deposits and withdrawals
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-500 dark:text-slate-400">Live updates</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-6 lg:mt-0">
            <Button onClick={exportCsv} variant="outline" className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={loadTransactions} variant="outline" className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-300">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-300">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.approved}</div>
                  <div className="text-sm text-green-600 dark:text-green-300">Approved</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.rejected}</div>
                  <div className="text-sm text-red-600 dark:text-red-300">Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">${stats.totalDeposits.toFixed(0)}</div>
                  <div className="text-sm text-green-600 dark:text-green-300">Deposits</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">${stats.totalWithdrawals.toFixed(0)}</div>
                  <div className="text-sm text-red-600 dark:text-red-300">Withdrawals</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search transactions, users, or IDs..."
                    className="pl-10 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Transactions ({filteredTransactions.length})
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Manage deposits and withdrawals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-700">
                    <TableHead className="text-slate-700 dark:text-slate-300">Transaction</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">User</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Amount</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Method</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const TypeIcon = getTypeIcon(transaction.type);
                    const StatusIcon = getStatusIcon(transaction.status);
                    
                    return (
                      <TableRow key={transaction.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${transaction.type === 'deposit' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                              {React.createElement(getTypeIcon(transaction.type), { className: `w-4 h-4 ${getTypeColor(transaction.type)}` })}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                ID: {transaction.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {transaction.user?.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {transaction.user?.email || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-bold ${getTypeColor(transaction.type)}`}>
                            {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {transaction.currency}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(transaction.status)} border-0`}>
                            {React.createElement(getStatusIcon(transaction.status), { className: "w-3 h-3 mr-1" })}
                            {transaction.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-slate-600 dark:text-slate-300">
                            {transaction.method || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-slate-600 dark:text-slate-300">
                            {transaction.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {transaction.createdAt?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTransaction(transaction)}
                              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 dark:text-slate-400 py-8">
                        No transactions match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredTransactions.map((transaction) => {
                const TypeIcon = getTypeIcon(transaction.type);
                const StatusIcon = getStatusIcon(transaction.status);
                
                return (
                  <Card key={transaction.id} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${transaction.type === 'deposit' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                            {React.createElement(getTypeIcon(transaction.type), { className: `w-4 h-4 ${getTypeColor(transaction.type)}` })}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {transaction.user?.name || 'Unknown User'}
                            </div>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(transaction.status)} border-0 text-xs`}>
                          {React.createElement(getStatusIcon(transaction.status), { className: "w-3 h-3 mr-1" })}
                          {transaction.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Amount:</span>
                          <div className={`font-bold ${getTypeColor(transaction.type)}`}>
                            {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)} {transaction.currency}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Method:</span>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {transaction.method || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Date:</span>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {transaction.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Time:</span>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {transaction.createdAt?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTransaction(transaction)}
                        className="w-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details Modal */}
        <Dialog open={!!selectedTransaction} onClose={() => setSelectedTransaction(null)} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-2xl rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 backdrop-blur-xl p-6">
              {selectedTransaction && (
                <>
                  <Dialog.Title className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    Transaction Details
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Transaction ID:</span>
                        <div className="text-slate-900 dark:text-white font-medium">{selectedTransaction.id}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Type:</span>
                        <div className="text-slate-900 dark:text-white font-medium">
                          {selectedTransaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Amount:</span>
                        <div className={`font-bold text-lg ${getTypeColor(selectedTransaction.type)}`}>
                          {selectedTransaction.type === 'deposit' ? '+' : '-'}${selectedTransaction.amount.toFixed(2)} {selectedTransaction.currency}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Status:</span>
                        <div>
                          <Badge className={`${getStatusColor(selectedTransaction.status)} border-0`}>
                            {selectedTransaction.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">User:</span>
                        <div className="text-slate-900 dark:text-white font-medium">
                          {selectedTransaction.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {selectedTransaction.user?.email || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Method:</span>
                        <div className="text-slate-900 dark:text-white font-medium">
                          {selectedTransaction.method || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Created:</span>
                        <div className="text-slate-900 dark:text-white font-medium">
                          {selectedTransaction.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Updated:</span>
                        <div className="text-slate-900 dark:text-white font-medium">
                          {selectedTransaction.updatedAt?.toDate?.()?.toLocaleString() || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    {selectedTransaction.description && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Description:</span>
                        <div className="text-slate-900 dark:text-white font-medium">
                          {selectedTransaction.description}
                        </div>
                      </div>
                    )}
                    
                    {selectedTransaction.adminNotes && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Admin Notes:</span>
                        <div className="text-slate-900 dark:text-white font-medium">
                          {selectedTransaction.adminNotes}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedTransaction.status === 'pending' && (
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Update Status</h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleStatusUpdate(selectedTransaction.id, 'approved')}
                          disabled={isUpdating}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleStatusUpdate(selectedTransaction.id, 'rejected')}
                          disabled={isUpdating}
                          variant="destructive"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedTransaction(null)}
                      className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      Close
                    </Button>
                  </div>
                </>
              )}
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
