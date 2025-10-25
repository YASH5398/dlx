import React, { useEffect, useState, useMemo } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ShoppingBagIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

type Order = { 
  id: string; 
  user: string; 
  total: number; 
  status: string; 
  productName: string; 
  downloadUrl: string; 
  paymentMethod: string; 
  paymentStatus: string; 
  createdAt: number;
  userEmail?: string;
  orderType?: string;
  currency?: string;
};

export default function AdminOrders() {
  const [rows, setRows] = useState<Order[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date'|'amount'|'status'|'user'>('date');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 12;

  useEffect(() => {
    setLoading(true);
    const q = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Order[] = [];
      snap.forEach((docSnap) => {
        const d: any = docSnap.data() || {};
        arr.push({
          id: docSnap.id,
          user: d.userEmail || d.user || d.userId || '-',
          total: Number(d.total || d.amountUsd || 0),
          status: d.status || 'pending',
          productName: d.productName || d.product || '-',
          downloadUrl: d.downloadUrl || d.downloadLink || '',
          paymentMethod: d.paymentMethod || '-',
          paymentStatus: d.paymentStatus || '-',
          createdAt: d.createdAt?.toMillis ? d.createdAt.toMillis() : Number(d.createdAt || d.timestamp || 0),
          userEmail: d.userEmail || d.user,
          orderType: d.type || 'Digital',
          currency: d.currency || 'USD'
        });
      });
      setRows(arr);
      setLoading(false);
    }, (err) => {
      console.error('Failed to stream orders:', err);
      toast.error('Failed to load orders');
      setLoading(false);
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  const filteredRows = useMemo(() => {
    let filtered = rows;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(order => 
        order.productName.toLowerCase().includes(searchLower) ||
        order.user.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower) ||
        order.paymentMethod.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(order => order.orderType === typeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'amount':
          comparison = a.total - b.total;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'user':
          comparison = a.user.localeCompare(b.user);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [rows, search, statusFilter, typeFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice((page-1)*pageSize, page*pageSize);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await updateDoc(doc(firestore, 'orders', id), { status });
      toast.success('Order status updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      processing: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      completed: 'bg-green-500/20 text-green-300 border-green-500/50',
      delivered: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/50',
      refunded: 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: ClockIcon,
      processing: ArrowPathIcon,
      completed: CheckCircleIcon,
      delivered: CheckCircleIcon,
      cancelled: XCircleIcon,
      refunded: ArrowPathIcon
    };
    return icons[status as keyof typeof icons] || ClockIcon;
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      paid: 'bg-green-500/20 text-green-300 border-green-500/50',
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      failed: 'bg-red-500/20 text-red-300 border-red-500/50',
      refunded: 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  };

  const StatusBadge = ({ status, icon: Icon }: { status: string; icon: any }) => (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      <Icon className="w-3 h-3" />
      {status.toUpperCase()}
    </div>
  );

  const PaymentStatusBadge = ({ status }: { status: string }) => (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(status)}`}>
      {status.toUpperCase()}
    </div>
  );

  const OrderCard = ({ order }: { order: Order }) => {
    const StatusIcon = getStatusIcon(order.status);
    const isOverdue = order.status === 'pending' && 
      new Date(order.createdAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000;

    return (
      <div className={`group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/20 ${
        selectedOrder?.id === order.id ? 'ring-2 ring-blue-500/50 border-blue-500/50' : ''
      }`}>
        {/* Overdue indicator */}
        {isOverdue && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-orange-500 rounded-full" />
        )}

        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ShoppingBagIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                  {order.productName}
                </h3>
                <p className="text-sm text-gray-400">#{order.id.slice(0, 8)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={order.status} icon={StatusIcon} />
              <PaymentStatusBadge status={order.paymentStatus} />
              {isOverdue && (
                <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded">
                  OVERDUE
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Customer</span>
            <span className="text-sm text-gray-300">{order.user}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Amount</span>
            <span className="text-sm font-semibold text-emerald-400">
              ${order.total.toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Payment</span>
            <span className="text-sm text-gray-300">{order.paymentMethod}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Type</span>
            <span className="text-sm text-gray-300">{order.orderType}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Date</span>
            <span className="text-sm text-gray-300">
              {new Date(order.createdAt).toLocaleDateString()}
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
          
          {order.downloadUrl && (
            <button className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 border border-purple-500/30 hover:border-purple-500/50 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200">
              <DocumentArrowDownIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const OrderTable = () => (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {pageRows.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              return (
                <tr key={order.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <ShoppingBagIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{order.productName}</div>
                        <div className="text-sm text-gray-400">#{order.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{order.user}</div>
                    <div className="text-sm text-gray-400">{order.userEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-emerald-400">${order.total.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">{order.currency}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{order.paymentMethod}</div>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.status} icon={StatusIcon} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        disabled={updating === order.id}
                        className={`text-xs rounded-lg px-2 py-1 border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                          order.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : order.status === 'processing'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                            : order.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                            : 'bg-gray-500/20 text-gray-300 border-gray-500/50'
                        } ${updating === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-800 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-6">
                  <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="h-6 bg-gray-700 rounded w-24 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Order Management</h1>
            <p className="text-gray-400">Track and manage customer orders in real-time</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700/50 hover:border-gray-600/50 rounded-lg text-sm font-medium transition-all duration-200"
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
            </button>
          </div>
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
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                >
                  <option value="all">All Types</option>
                  <option value="Digital">Digital</option>
                  <option value="Service">Service</option>
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
                  <option value="user-asc">Customer (A-Z)</option>
                  <option value="user-desc">Customer (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-300">{filteredRows.length}</div>
            <div className="text-sm text-blue-200">Total Orders</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-300">
              {filteredRows.filter(o => o.status === 'pending').length}
            </div>
            <div className="text-sm text-yellow-200">Pending</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-300">
              {filteredRows.filter(o => o.status === 'delivered').length}
            </div>
            <div className="text-sm text-green-200">Delivered</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-300">
              ${filteredRows.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
            </div>
            <div className="text-sm text-purple-200">Total Revenue</div>
          </div>
        </div>

        {/* Orders Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageRows.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>

        {/* Empty State */}
        {pageRows.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBagIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {search || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters to see more orders.'
                : 'No orders have been placed yet.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-sm text-gray-400">
              Showing {((page-1)*pageSize)+1}-{Math.min(page*pageSize, filteredRows.length)} of {filteredRows.length} orders
            </div>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3">Order Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Order ID:</span>
                        <span className="text-white">#{selectedOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Product:</span>
                        <span className="text-white">{selectedOrder.productName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white">{selectedOrder.orderType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-emerald-400 font-semibold">${selectedOrder.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payment Method:</span>
                        <span className="text-white">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date:</span>
                        <span className="text-white">
                          {new Date(selectedOrder.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3">Customer Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white">{selectedOrder.user}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white">{selectedOrder.userEmail}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-semibold text-white mb-2">Status Management</h4>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                        disabled={updating === selectedOrder.id}
                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                          selectedOrder.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : selectedOrder.status === 'processing'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                            : selectedOrder.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                            : 'bg-gray-500/20 text-gray-300 border-gray-500/50'
                        } ${updating === selectedOrder.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {selectedOrder.downloadUrl && (
                  <div className="mt-6 bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3">Download Link</h3>
                    <a
                      href={selectedOrder.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      Download Files
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}