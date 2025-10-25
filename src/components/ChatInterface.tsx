import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Phone, Video, MoreVertical, ArrowLeft, Smile } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { supportService } from '../services/supportService';
import { formatDistanceToNow } from 'date-fns';

type SenderType = 'user' | 'admin' | 'ai';
type MessageStatus = 'sent' | 'delivered' | 'read';
type MessageKind = 'message' | 'system' | 'ai_request';

interface SupportMessage {
  id?: string;
  requestId: string;
  sender: SenderType;
  senderName: string;
  senderId: string;
  text: string;
  timestamp: any;
  type: MessageKind;
  status: MessageStatus;
}

interface SupportRequest {
  userName: string;
  status: string;
  createdAt: any;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  requestId?: string;
  isAdmin?: boolean;
  initialMessage?: string;
  chatType: 'ai_agent' | 'live_chat' | 'ai_chatbot';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isOpen,
  onClose,
  requestId,
  isAdmin = false,
  initialMessage = '',
  chatType
}) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<SupportRequest | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isChatBlocked, setIsChatBlocked] = useState(chatType === 'ai_agent'); // Initialize based on chatType
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Subscribe to messages if we have a requestId
  useEffect(() => {
    if (!requestId) return;

    const unsubscribeMessages = supportService.subscribeToMessages(requestId, (newMessages) => {
      setMessages(newMessages);
    });

    // Subscribe to request status changes for AI Agent chat
    let unsubscribeStatus: () => void;
    if (chatType === 'ai_agent') {
      unsubscribeStatus = supportService.subscribeToRequestStatus(requestId, (status, assignedAdmin) => {
        if (status === 'active' && assignedAdmin) {
          setIsChatBlocked(false); // Unblock chat when admin connects
        } else {
          setIsChatBlocked(true); // Keep chat blocked otherwise
        }
      });
    }

    return () => {
      unsubscribeMessages();
      if (unsubscribeStatus) {
        unsubscribeStatus();
      }
    };
  }, [requestId, chatType]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);

    try {
      if (chatType === 'ai_chatbot') {
        // Handle standalone AI chatbot
        setIsTyping(true);
        
        // Add user message to local state immediately
        const userMessage: SupportMessage = {
          id: `temp_${Date.now()}`,
          requestId: 'chatbot',
          sender: 'user',
          senderName: user?.name || 'You',
          senderId: user?.id || 'anonymous',
          text: messageText,
          timestamp: new Date(),
          type: 'message',
          status: 'sent'
        };
        setMessages(prev => [...prev, userMessage]);

        const result = await supportService.sendAIChatMessage(
          user?.id || 'anonymous',
          user?.name || 'Anonymous User',
          user?.email || '',
          messageText
        );

        setIsTyping(false);

        if (result.success && result.reply) {
          const aiMessage: SupportMessage = {
            id: `ai_${Date.now()}`,
            requestId: 'chatbot',
            sender: 'ai',
            senderName: 'AI Assistant',
            senderId: 'ai',
            text: result.reply,
            timestamp: new Date(),
            type: 'message',
            status: 'delivered'
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          throw new Error(result.error || 'Failed to get AI response');
        }
      } else if (requestId) {
        // Handle support request messages
        await supportService.addMessage(requestId, {
          sender: isAdmin ? 'admin' : 'user',
          senderName: isAdmin ? 'Support Agent' : (user?.name || 'User'),
          senderId: user?.id || 'anonymous',
          text: messageText,
          type: 'message',
          status: 'sent'
        });
        if (chatType === 'ai_agent') {
          setIsChatBlocked(true); // Block chat after user sends message in AI Agent support
        }
      } else {
        // Create new support request
        const newRequestId = await supportService.createSupportRequest(
          user?.id || 'anonymous',
          user?.name || 'Anonymous User',
          user?.email || '',
          messageText,
          chatType,
          {
            title: `${chatType === 'ai_agent' ? 'AI Agent' : 'Live Chat'} Request`,
            category: 'general',
            priority: 'medium'
          }
        );
        
        // The component should be re-rendered with the new requestId
        console.log('New support request created:', newRequestId);
        if (chatType === 'ai_agent') {
          setIsChatBlocked(true); // Block chat after creating a new AI Agent request
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage: SupportMessage = {
        id: `error_${Date.now()}`,
        requestId: requestId || 'error',
        sender: 'ai',
        senderName: 'System',
        senderId: 'system',
        text: 'Sorry, there was an error sending your message. Please try again.',
        timestamp: new Date(),
        type: 'message',
        status: 'sent'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get chat title
  const getChatTitle = () => {
    if (chatType === 'ai_chatbot') return 'AI Assistant';
    if (isAdmin && currentRequest) return currentRequest.userName;
    return chatType === 'ai_agent' ? 'AI Agent Support' : 'Live Chat Support';
  };

  // Get chat subtitle
  const getChatSubtitle = () => {
    if (chatType === 'ai_chatbot') return 'Ask me anything about our services';
    if (isAdmin && currentRequest) {
      return `${currentRequest.status} • ${formatMessageTime(currentRequest.createdAt)}`;
    }
    return 'We\'ll respond as soon as possible';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-1 hover:bg-green-700 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center font-semibold">
              {chatType === 'ai_chatbot' ? 'AI' : (getChatTitle().charAt(0).toUpperCase())}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{getChatTitle()}</h3>
              <p className="text-xs text-green-100">{getChatSubtitle()}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {chatType !== 'ai_chatbot' && (
            <>
              <button className="p-2 hover:bg-green-700 rounded-full transition-colors">
                <Phone size={18} />
              </button>
              <button className="p-2 hover:bg-green-700 rounded-full transition-colors">
                <Video size={18} />
              </button>
            </>
          )}
          <button className="p-2 hover:bg-green-700 rounded-full transition-colors">
            <MoreVertical size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-700 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-2">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && chatType === 'ai_chatbot' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome to AI Assistant</h3>
              <p className="text-gray-600">Ask me anything about our services, pricing, or how we can help you!</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex mb-4 ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-green-500 text-white'
                    : message.sender === 'ai'
                    ? 'bg-blue-100 text-gray-800'
                    : 'bg-white text-gray-800 border'
                }`}
              >
                {message.sender !== 'user' && (
                  <div className="text-xs font-semibold mb-1 text-gray-600">
                    {message.senderName}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                  }`}
                >
                  {formatMessageTime(message.timestamp)}
                  {message.sender === 'user' && (
                    <span className="ml-1">
                      {message.status === 'sent' && '✓'}
                      {message.status === 'delivered' && '✓✓'}
                      {message.status === 'read' && '✓✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border rounded-lg px-4 py-2 max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Smile size={20} />
          </button>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                chatType === 'ai_chatbot' 
                  ? "Ask me anything..." 
                  : "Type your message..."
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading || isChatBlocked} // Disable input if loading or chat is blocked
            />
            {isChatBlocked && chatType === 'ai_agent' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 rounded-full text-sm text-gray-600">
                Waiting for agent to connect...
              </div>
            )}
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading || isChatBlocked} // Disable button if chat is blocked
            className={`p-2 rounded-full transition-colors ${
              newMessage.trim() && !isLoading
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;