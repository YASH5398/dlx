import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import type { DocumentData, QuerySnapshot, FieldValue } from 'firebase/firestore';
import { firestore } from '../firebase';

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
  id?: string;
  type: 'new_request' | 'new_message' | 'status_change';
  requestId: string;
  userId: string;
  userName: string;
  message: string;
  read: boolean;
  createdAt: Timestamp | Date | FieldValue;
}

class SupportService {
  private supportRequestsRef = collection(firestore, 'support_requests');
  private notificationsRef = collection(firestore, 'admin_notifications');

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
      const requestData: Omit<SupportRequest, 'id'> = {
        userId,
        userName,
        userEmail,
        status: 'pending',
        type,
        title: metadata?.title || `${type === 'ai_agent' ? 'AI Agent' : 'Live Chat'} Request`,
        category: metadata?.category || 'general',
        priority: metadata?.priority || 'medium',
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        metadata: {
          userAgent: metadata?.userAgent,
          referrer: metadata?.referrer,
          sessionId: metadata?.sessionId || `session_${Date.now()}`
        }
      };

      const docRef = await addDoc(this.supportRequestsRef, requestData);
      
      // Add initial message
      await this.addMessage(docRef.id, {
        sender: 'user',
        senderName: userName,
        senderId: userId,
        text: initialMessage,
        type: type === 'ai_agent' ? 'ai_request' : 'message',
        status: 'sent'
      });

      // Create admin notification
      await this.createAdminNotification({
        type: 'new_request',
        requestId: docRef.id,
        userId,
        userName,
        message: `New ${type === 'ai_agent' ? 'AI Agent' : 'Live Chat'} request from ${userName}`,
        read: false
      });

      console.log(`Support request created: ${docRef.id}`);
      return docRef.id;
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
          type: 'new_message',
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
      const docRef = await addDoc(this.notificationsRef, {
        ...notification,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating admin notification:', error);
      throw new Error('Failed to create admin notification');
    }
  }

  // Subscribe to admin notifications
  subscribeToAdminNotifications(
    adminId: string,
    callback: (notifications: AdminNotification[]) => void
  ): () => void {
    const q = query(this.notificationsRef, where('read', '==', false), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const notifications: AdminNotification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AdminNotification));
      callback(notifications);
    }, (error) => {
      console.error('Error subscribing to admin notifications:', error);
    });
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'admin_notifications', notificationId), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Simulate AI Chatbot message handling
  async sendAIChatMessage(
    userId: string,
    userName: string,
    userEmail: string,
    message: string
  ): Promise<{ success: boolean; reply?: string; error?: string }> {
    try {
      // Simulate response delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // A simple hardcoded response - replace with actual AI service
      const reply = `Thanks, ${userName}! I understand you're asking: "${message}". Our AI will assist you shortly.`;

      // Save to support_requests collection for history under a generic chatbot session
      const chatSessionId = `chatbot_${userId}`;
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
        status: 'sent'
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
        status: 'delivered'
      });

      return { success: true, reply };
    } catch (error) {
      console.error('Error handling AI chat message:', error);
      return { success: false, error: 'Failed to process AI chat message' };
    }
  }
}

export const supportService = new SupportService();
export default supportService;