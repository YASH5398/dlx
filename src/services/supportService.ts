import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  setDoc,
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import type { DocumentData, QuerySnapshot, FieldValue } from 'firebase/firestore';
import { firestore } from '../firebase';

// Backend API base URL
const API_BASE = import.meta.env.VITE_SUPPORT_API_URL || 'http://localhost:4000';

// Types for Support System
export interface SupportRequest {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'active' | 'closed';
  type: 'ai_agent' | 'live_chat';
  title?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Timestamp | Date | FieldValue;
  lastMessageAt: Timestamp | Date | FieldValue;
  assignedAdmin?: string;
  metadata?: {
    userAgent?: string;
    referrer?: string;
    sessionId?: string;
  };
}

export interface SupportMessage {
  id?: string;
  requestId: string;
  sender: 'user' | 'admin' | 'ai';
  senderName: string;
  senderId: string;
  text: string;
  timestamp: Timestamp | Date | FieldValue;
  type: 'message' | 'system' | 'ai_request';
  status: 'sent' | 'delivered' | 'read';
  metadata?: {
    aiModel?: string;
    processingTime?: number;
    retryCount?: number;
  };
}

export interface AdminNotification {
  id: string;
  requestId: string;
  userId: string;
  userName?: string;
  message: string;
  createdAt: number;
  read?: boolean;
}

class SupportService {
  private supportRequestsRef = collection(firestore, 'support_requests');
  private adminNotificationsRef = collection(firestore, 'admin_notifications');

  // Create a new support request (AI Agent flow)
  async createSupportRequest(
    userId: string, 
    userName: string, 
    userEmail: string,
    initialMessage: string,
    type: 'ai_agent' | 'live_chat' = 'ai_agent',
    metadata?: {
      title?: string;
      category?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      userAgent?: string;
      referrer?: string;
      sessionId?: string;
    }
  ): Promise<string> {
    try {
      // Create support request directly in Firestore (no backend API dependency)
      const requestData: Omit<SupportRequest, 'id'> = {
        userId,
        userName,
        userEmail,
        status: 'pending',
        type,
        title: metadata?.title || `${type === 'ai_agent' ? 'AI Agent' : 'Live Chat'} Support Request`,
        category: metadata?.category || 'general',
        priority: metadata?.priority || 'medium',
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        metadata: {
          userAgent: metadata?.userAgent || navigator?.userAgent || 'Unknown',
          referrer: metadata?.referrer || document?.referrer || 'Unknown',
          sessionId: metadata?.sessionId || `session_${Date.now()}`,
        },
      };

      const docRef = await addDoc(this.supportRequestsRef, requestData);
      const requestId = docRef.id;

      // Add initial message to Firestore thread
      await this.addMessage(requestId, {
        sender: 'user',
        senderName: userName,
        senderId: userId,
        text: initialMessage,
        type: type === 'ai_agent' ? 'ai_request' : 'message',
        status: 'sent',
      });

      // Notify admins
      await this.createAdminNotification({
        requestId,
        userId,
        userName,
        message: `New ${type === 'ai_agent' ? 'AI Agent' : 'Live Chat'} request from ${userName}`,
        read: false,
      });

      // For AI Agent requests, add a system message about waiting for agent
      if (type === 'ai_agent') {
        await this.addMessage(requestId, {
          sender: 'admin',
          senderName: 'System',
          senderId: 'system',
          text: 'Your request has been submitted to our AI Agent support team. An agent will connect with you shortly. Please wait while we process your request.',
          type: 'system',
          status: 'sent',
        });
      }

      console.log(`Support request created: ${requestId}`);
      return requestId;
    } catch (error) {
      console.error('Error creating support request:', error);
      throw new Error('Failed to create support request');
    }
  }

  // Add a message to a support request
  async addMessage(
    requestId: string, 
    messageData: Omit<SupportMessage, 'id' | 'requestId' | 'timestamp'>
  ): Promise<string> {
    try {
      const messagesRef = collection(firestore, 'support_requests', requestId, 'messages');
      
      const message: Omit<SupportMessage, 'id'> = {
        ...messageData,
        requestId,
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(messagesRef, message);

      // Update last message timestamp in support request
      await updateDoc(doc(firestore, 'support_requests', requestId), {
        lastMessageAt: serverTimestamp()
      });

      // Create notification for admin if message is from user
      if (messageData.sender === 'user') {
        await this.createAdminNotification({
          requestId,
          userId: messageData.senderId,
          userName: messageData.senderName,
          message: `New message from ${messageData.senderName}`,
          read: false
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error adding message:', error);
      throw new Error('Failed to add message');
    }
  }

  // Subscribe to messages for a specific support request
  subscribeToMessages(
    requestId: string, 
    callback: (messages: SupportMessage[]) => void
  ): () => void {
    const messagesRef = collection(firestore, 'support_requests', requestId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const messages: SupportMessage[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SupportMessage));
      callback(messages);
    }, (error) => {
      console.error('Error subscribing to messages:', error);
    });
  }

  // Subscribe to support requests for a user
  subscribeToUserRequests(
    userId: string, 
    callback: (requests: SupportRequest[]) => void
  ): () => void {
    const q = query(
      this.supportRequestsRef, 
      where('userId', '==', userId),
      orderBy('lastMessageAt', 'desc')
    );

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const requests: SupportRequest[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SupportRequest));
      callback(requests);
    }, (error) => {
      console.error('Error subscribing to user requests:', error);
    });
  }

  // Subscribe to all support requests (for admin)
  subscribeToAllRequests(
    callback: (requests: SupportRequest[]) => void
  ): () => void {
    const q = query(this.supportRequestsRef, orderBy('lastMessageAt', 'desc'));

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const requests: SupportRequest[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SupportRequest));
      callback(requests);
    }, (error) => {
      console.error('Error subscribing to all requests:', error);
    });
  }

  // Update support request status
  async updateRequestStatus(
    requestId: string, 
    status: 'pending' | 'active' | 'closed',
    adminId?: string
  ): Promise<void> {
    try {
      const updateData: Partial<SupportRequest> = {
        status,
        lastMessageAt: serverTimestamp()
      };

      if (adminId && status === 'active') {
        updateData.assignedAdmin = adminId;
      }

      await updateDoc(doc(firestore, 'support_requests', requestId), updateData);

      // Add system message about status change
      await this.addMessage(requestId, {
        sender: 'admin',
        senderName: 'System',
        senderId: 'system',
        text: `Request status changed to ${status}${adminId ? ` and assigned to admin` : ''}`,
        type: 'system',
        status: 'sent'
      });

    } catch (error) {
      console.error('Error updating request status:', error);
      throw new Error('Failed to update request status');
    }
  }

  // Create admin notification
  async createAdminNotification(
    notification: Omit<AdminNotification, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(this.adminNotificationsRef, {
        ...notification,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating admin notification:', error);
      throw new Error('Failed to create admin notification');
    }
  }

  // Subscribe to a specific support request's status
  subscribeToRequestStatus(
    requestId: string,
    callback: (status: SupportRequest['status'], assignedAdmin?: string) => void
  ): () => void {
    const requestRef = doc(firestore, 'support_requests', requestId);

    return onSnapshot(requestRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const request = docSnapshot.data() as SupportRequest;
        callback(request.status, request.assignedAdmin);
      } else {
        console.log("No such document!");
        // Optionally, handle the case where the document might be deleted
      }
    }, (error) => {
      console.error('Error subscribing to request status:', error);
    });
  }

  // Simulate AI Chatbot message handling
  async sendAIChatMessage(
    userId: string,
    userName: string,
    userEmail: string,
    message: string
  ): Promise<{ success: boolean; reply?: string; error?: string }> {
    try {
      // Simulate AI response with intelligent fallback
      const reply = this.generateAIResponse(message, userName);

      // Save to support_requests collection for history under a generic chatbot session
      const chatSessionId = `chatbot_${userId}`;
      
      // Ensure the parent support request document exists
      const chatSessionRef = doc(firestore, 'support_requests', chatSessionId);
      const chatSessionDoc = await getDoc(chatSessionRef);
      
      if (!chatSessionDoc.exists()) {
        // Create the parent document for the chatbot session
        await setDoc(chatSessionRef, {
          userId,
          userName,
          userEmail,
          status: 'active',
          type: 'ai_chatbot',
          title: 'AI Chatbot Session',
          category: 'general',
          priority: 'medium',
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
          metadata: {
            userAgent: navigator?.userAgent || 'Unknown',
            referrer: document?.referrer || 'Unknown',
            sessionId: chatSessionId,
          },
        });
      }

      const messagesRef = collection(firestore, 'support_requests', chatSessionId, 'messages');

      // Save user message
      await addDoc(messagesRef, {
        requestId: chatSessionId,
        sender: 'user',
        senderName: userName,
        senderId: userId,
        text: message,
        timestamp: serverTimestamp(),
        type: 'message',
        status: 'sent',
      });

      // Save AI reply
      await addDoc(messagesRef, {
        requestId: chatSessionId,
        sender: 'ai',
        senderName: 'AI Assistant',
        senderId: 'ai',
        text: reply,
        timestamp: serverTimestamp(),
        type: 'message',
        status: 'delivered',
      });

      return { success: true, reply };
    } catch (error) {
      console.error('Error handling AI chat message:', error);
      return { success: false, error: 'Failed to process AI chat message' };
    }
  }

  // Generate AI response based on message content
  private generateAIResponse(message: string, userName: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `Hello ${userName}! 👋 I'm your AI assistant. How can I help you today? I can assist with questions about our services, pricing, account issues, or general inquiries.`;
    }
    
    // Service-related questions
    if (lowerMessage.includes('service') || lowerMessage.includes('what do you offer')) {
      return `We offer a comprehensive range of digital services including:\n\n• 🪙 Crypto Token Creation ($2,999)\n• 🎨 Website Development ($1,499)\n• 💬 Chatbot Development ($999)\n• 📱 Mobile App Development ($250)\n• 🤖 Telegram Bot Development ($799)\n• 🔍 Smart Contract Audits ($2,499)\n• 🛒 E-commerce Store Setup ($190)\n• 📈 TradingView Indicators ($30)\n• 📊 Social Media Management ($20/month)\n• 🎬 Video Editing Services ($15)\n\nWould you like more details about any specific service?`;
    }
    
    // Pricing questions
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
      return `Our pricing varies by service complexity:\n\n💰 **Starting Prices:**\n• Basic services: $15-$50\n• Development services: $250-$999\n• Premium services: $1,499-$2,999\n\n💳 **Payment Options:**\n• USDT (crypto)\n• INR (Indian Rupees)\n• Multiple wallet options\n\n🎯 **Affiliate Program:**\n• Earn 20-40% commission\n• Refer clients and earn\n• No upfront costs\n\nWould you like a custom quote for your specific needs?`;
    }
    
    // Account/technical issues
    if (lowerMessage.includes('account') || lowerMessage.includes('login') || lowerMessage.includes('password')) {
      return `I can help with account-related issues:\n\n🔐 **Account Problems:**\n• Password reset\n• Login issues\n• Profile updates\n• Security concerns\n\n💼 **Account Features:**\n• Wallet management\n• Order tracking\n• Referral system\n• Mining rewards\n\nFor urgent account issues, I can connect you with our support team. What specific account problem are you experiencing?`;
    }
    
    // Mining/rewards questions
    if (lowerMessage.includes('mining') || lowerMessage.includes('reward') || lowerMessage.includes('dlx')) {
      return `Mining System Overview:\n\n⛏️ **Daily Mining:**\n• Claim daily rewards\n• Build mining streaks\n• Earn DLX tokens\n\n🎯 **Task Rewards:**\n• Telegram task: 25 DLX\n• Twitter task: 25 DLX\n• Total: 50 DLX per day\n\n💎 **DLX Token:**\n• Current value: $0.10\n• Tradeable on exchanges\n• Multiple earning methods\n\nNeed help with mining or want to start earning?`;
    }
    
    // Support/help requests
    if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('problem')) {
      return `I'm here to help! 🛠️\n\n**Common Solutions:**\n• Check our FAQ section\n• Review account settings\n• Verify payment methods\n• Clear browser cache\n\n**Contact Options:**\n• AI Chatbot (me!) - instant responses\n• AI Agent - human support\n• Support tickets - detailed help\n\nWhat specific issue can I help you resolve?`;
    }
    
    // Default response
    return `Thanks for your message, ${userName}! 🤖\n\nI understand you're asking: "${message}"\n\nI'm here to help with:\n• Service information\n• Pricing details\n• Account support\n• Technical issues\n• Mining questions\n• General inquiries\n\nCould you provide more specific details about what you need help with?`;
  }

  /**
   * Subscribe to admin notifications, optionally filtering unread only.
   */
  subscribeToAdminNotifications(
    adminId: string | undefined,
    callback: (notifications: AdminNotification[]) => void,
    options?: { unreadOnly?: boolean }
  ) {
    try {
      const constraints: any[] = [orderBy('createdAt', 'desc')];
      // Currently notifications don't have adminId; we stream all and let UI filter by request/user.
      if (options?.unreadOnly) {
        constraints.unshift(where('read', '==', false));
      }
      const q = query(this.adminNotificationsRef, ...constraints);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs: AdminNotification[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        callback(notifs);
      }, (error) => {
        console.error('subscribeToAdminNotifications error:', error);
      });
      return unsubscribe;
    } catch (err) {
      console.error('Failed to subscribe to admin notifications', err);
      return () => {};
    }
  }

  /**
   * Mark a notification as read.
   */
  async markNotificationAsRead(notificationId: string) {
    try {
      await updateDoc(doc(firestore, 'admin_notifications', notificationId), { read: true });
    } catch (err) {
      console.error('Failed to mark admin notification as read', err);
      throw err;
    }
  }
}

export const supportService = new SupportService();
export default supportService;