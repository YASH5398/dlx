import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { supportService } from '../../services/supportService';
import ChatInterface from '../../components/ChatInterface';

interface SupportRequest {
  id?: string;
  status: string;
  createdAt: any;
  lastMessageAt?: any;
}
import { 
  MessageSquare, 
  Bot, 
  Users, 
  AlertCircle,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Support: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [userRequests, setUserRequests] = useState<SupportRequest[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatType, setChatType] = useState<'ai_agent' | 'live_chat' | 'ai_chatbot'>('ai_chatbot');
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: '',
    category: 'general',
    priority: 'medium',
    description: ''
  });

  // Subscribe to user's support requests
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const unsubscribe = supportService.subscribeToUserRequests(user.id, (requests) => {
      setUserRequests(requests);
    });

    return unsubscribe;
  }, [user, navigate]);

  // Handle opening different chat types
  const handleOpenChat = (type: 'ai_agent' | 'live_chat' | 'ai_chatbot', requestId?: string) => {
    setChatType(type);
    setSelectedRequestId(requestId);
    setIsChatOpen(true);
  };

  // Handle creating new AI Agent request
  const handleCreateAIAgentRequest = async (message: string) => {
    if (!user || !message.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const requestId = await supportService.createSupportRequest(
        user.id,
        user.name || 'Anonymous User',
        user.email || '',
        message.trim(),
        'ai_agent',
        {
          title: 'AI Agent Support Request',
          category: 'general',
          priority: 'medium'
        }
      );

      // Open chat with the new request
      handleOpenChat('ai_agent', requestId);
    } catch (error) {
      console.error('Error creating AI Agent request:', error);
      setError('Failed to create support request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opening ticket form
  const handleOpenTicketForm = () => {
    setIsTicketFormOpen(true);
  };

  // Handle ticket form submission
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticketForm.title.trim() || !ticketForm.description.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const requestId = await supportService.createSupportRequest(
        user.id,
        user.name || 'Anonymous User',
        user.email || '',
        ticketForm.description,
        'live_chat',
        {
          title: ticketForm.title,
          category: ticketForm.category,
          priority: ticketForm.priority as 'low' | 'medium' | 'high' | 'urgent'
        }
      );

      // Reset form
      setTicketForm({
        title: '',
        category: 'general',
        priority: 'medium',
        description: ''
      });
      setIsTicketFormOpen(false);

      // Open chat with the new request
      handleOpenChat('live_chat', requestId);
    } catch (error) {
      console.error('Error creating support ticket:', error);
      setError('Failed to create support ticket. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get status color for requests
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'active': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Please log in</h3>
          <p className="text-gray-600">You need to be logged in to access support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          {userRequests.filter(req => req.status === 'pending').length > 0 && (
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              {userRequests.filter(req => req.status === 'pending').length} pending requests
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Chat Interface */}
        {isChatOpen && (
          <ChatInterface
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            chatType={chatType}
            requestId={selectedRequestId}
          />
        )}

        {/* Ticket Form Modal */}
        {isTicketFormOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Raise Support Ticket</h2>
                  <button
                    onClick={() => setIsTicketFormOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleTicketSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={ticketForm.title}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        id="category"
                        value={ticketForm.category}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="general">General</option>
                        <option value="technical">Technical</option>
                        <option value="billing">Billing</option>
                        <option value="account">Account</option>
                        <option value="feature">Feature Request</option>
                        <option value="bug">Bug Report</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        id="priority"
                        value={ticketForm.priority}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Please provide detailed information about your issue..."
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setIsTicketFormOpen(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !ticketForm.title.trim() || !ticketForm.description.trim()}
                      className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Creating...' : 'Create Ticket'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Get Help</h2>
              <div className="space-y-4">
                <button
                  onClick={() => handleOpenChat('ai_chatbot')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={isLoading}
                >
                  <Bot className="w-5 h-5 mr-2" />
                  AI Chatbot
                </button>
                
                <button
                  onClick={() => handleCreateAIAgentRequest('I need help with my account')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={isLoading}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Contact AI Agent
                </button>

                <button
                  onClick={() => handleOpenTicketForm()}
                  className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  disabled={isLoading}
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Raise Support Ticket
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Support</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Requests</span>
                  <span className="font-medium">{userRequests.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-medium text-orange-600">
                    {userRequests.filter(req => req.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active</span>
                  <span className="font-medium text-green-600">
                    {userRequests.filter(req => req.status === 'active').length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Request History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Your Support Requests</h2>
              </div>
              
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : userRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No support requests yet</h3>
                    <p className="text-gray-600">Start a conversation with our AI chatbot or contact an agent.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleOpenChat('ai_agent', request.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(request.status)}`}></div>
                            <span className="font-medium text-gray-900">Support Request</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatTime(request.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">
                            Status: {request.status}
                          </span>
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                        </div>
                        
                        {request.lastMessageAt && (
                          <div className="mt-2 text-xs text-gray-500">
                            Last message: {formatTime(request.lastMessageAt)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Support;