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
  AlertCircle
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