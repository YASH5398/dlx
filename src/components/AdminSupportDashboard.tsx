import React, { useState, useEffect, useContext } from 'react';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Bell,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { supportService } from '../services/supportService';
import type { SupportRequest, AdminNotification } from '../services/supportService';
import ChatInterface from './ChatInterface';
import { formatDistanceToNow } from 'date-fns';

const AdminSupportDashboard: React.FC = () => {
  const { user } = useUser();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'closed'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to support requests
  useEffect(() => {
    const unsubscribe = supportService.subscribeToAllRequests((newRequests) => {
      setRequests(newRequests);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Subscribe to admin notifications
  useEffect(() => {
    const unsubscribe = supportService.subscribeToAdminNotifications(user?.id || '', (newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, [user?.id]);

  // Filter requests based on search and status
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle opening chat with a user
  const handleOpenChat = (request: SupportRequest) => {
    setSelectedRequest(request);
    setIsChatOpen(true);
    
    // Mark related notifications as read
    notifications
      .filter(notif => notif.requestId === request.id)
      .forEach(notif => {
        if (notif.id) {
          supportService.markNotificationAsRead(notif.id);
        }
      });
  };

  // Handle status change
  const handleStatusChange = async (requestId: string, newStatus: 'pending' | 'active' | 'closed') => {
    try {
      await supportService.updateRequestStatus(requestId, newStatus, user?.id);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Format timestamp
  const formatTime = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Support Dashboard</h2>
            <p className="text-gray-600 mt-1">Manage customer support requests and live chat</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Bell className="h-6 w-6 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </div>
            
            {/* Stats */}
            <div className="flex space-x-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-yellow-600">{requests.filter(r => r.status === 'pending').length}</div>
                <div className="text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{requests.filter(r => r.status === 'active').length}</div>
                <div className="text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-600">{requests.filter(r => r.status === 'closed').length}</div>
                <div className="text-gray-500">Closed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, title, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Support Requests List */}
      <div className="divide-y divide-gray-200">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No support requests</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'No requests match your current filters.' 
                : 'All support requests will appear here.'}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{request.userName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority || 'medium')}`}>
                        {request.priority || 'medium'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-1">{request.title}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{request.type === 'ai_agent' ? 'AI Agent' : 'Live Chat'}</span>
                      <span>•</span>
                      <span>{request.category}</span>
                      <span>•</span>
                      <span>{formatTime(request.createdAt)}</span>
                      {request.lastMessageAt && (
                        <>
                          <span>•</span>
                          <span>Last message {formatTime(request.lastMessageAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Status Actions */}
                  <div className="flex items-center space-x-1">
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(request.id!, 'active')}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Accept Request"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    
                    {request.status !== 'closed' && (
                      <button
                        onClick={() => handleStatusChange(request.id!, 'closed')}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Close Request"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Chat Button */}
                  <button
                    onClick={() => handleOpenChat(request)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Chat</span>
                  </button>

                  {/* More Options */}
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Show unread notifications for this request */}
              {notifications.filter(notif => notif.requestId === request.id).length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {notifications.filter(notif => notif.requestId === request.id).length} new notification(s)
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Chat Interface */}
      {isChatOpen && selectedRequest && (
        <ChatInterface
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setSelectedRequest(null);
          }}
          requestId={selectedRequest.id}
          isAdmin={true}
          chatType={selectedRequest.type}
        />
      )}
    </div>
  );
};

export default AdminSupportDashboard;