import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { ref, set } from 'firebase/database';
import { db } from '../firebase';

// Enhanced Service Request Types
export type ServiceRequestStatus = 
  | 'pending'           // User submitted, waiting for admin proposal
  | 'proposal_sent'     // Admin sent proposal, waiting for user payment
  | 'awaiting_payment'  // User needs to make payment
  | 'payment_review'    // Payment submitted, admin reviewing
  | 'processing'        // Payment approved, work in progress
  | 'in_progress'        // Work actively being done
  | 'completed'         // Work completed, deliverables ready
  | 'cancelled';        // Request cancelled

export type PaymentMethod = 'wallet' | 'upi';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface ServiceRequest {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceTitle: string;
  serviceCategory: string;
  requestDetails: object | string; // Support both object (new) and string (legacy) for backward compatibility
  attachments?: string[]; // File URLs
  status: ServiceRequestStatus;
  
  // Admin proposal details
  adminProposal?: {
    totalPrice: number;
    currency: 'USD' | 'INR';
    lineItems: ProposalLineItem[];
    description: string;
    estimatedDelivery: string; // Date string
    deliveryDuration: DeliveryDuration;
    submittedAt: Timestamp;
    submittedBy: string;
  };
  
  // Payment details
  payment?: {
    method: PaymentMethod;
    status: PaymentStatus;
    amount: number;
    currency: 'USD' | 'INR';
    walletSplit?: {
      mainWallet: number;
      purchaseWallet: number;
    };
    upiDetails?: {
      upiId: string;
      transactionId?: string;
      utr?: string;
    };
    submittedAt?: Timestamp;
    reviewedAt?: Timestamp;
    reviewedBy?: string;
  };
  
  // Order deliverables
  deliverables?: {
    websiteLink?: string;
    adminPanelLink?: string;
    credentials?: {
      username?: string;
      password?: string;
    };
    files?: string[]; // File URLs
    notes?: string;
    releasedAt: Timestamp;
    releasedBy: string;
  };
  
  // Chat and inquiries
  chatId?: string;
  inquiries?: Inquiry[];
  
  // Notifications
  notifications: Notification[];
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProposalLineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DeliveryDuration {
  value: number;
  unit: 'days' | 'weeks';
}

export interface Inquiry {
  id: string;
  type: 'question' | 'concern' | 'request';
  message: string;
  submittedBy: 'user' | 'admin';
  submittedAt: Timestamp;
  response?: {
    message: string;
    respondedBy: string;
    respondedAt: Timestamp;
  };
}

export interface Notification {
  id: string;
  type: 'proposal' | 'payment' | 'deliverable' | 'chat' | 'inquiry' | 'status';
  title: string;
  message: string;
  createdAt: Timestamp;
  read: boolean;
  actionUrl?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  message: string;
  attachments?: string[];
  createdAt: Timestamp;
  read: boolean;
}

// Collections
const serviceRequestsCol = collection(firestore, 'serviceRequests');
const chatMessagesCol = collection(firestore, 'chatMessages');
const inquiriesCol = collection(firestore, 'inquiries');

// Create Service Request
export async function createServiceRequest(data: {
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceTitle: string;
  serviceCategory: string;
  requestDetails: object;
  attachments?: string[];
}): Promise<string> {
  const { userId, userName, userEmail, serviceId, serviceTitle, serviceCategory, requestDetails, attachments = [] } = data;
  
  if (!userId || !serviceId || !requestDetails) {
    throw new Error('Invalid service request data');
  }

  try {
    const requestId = crypto.randomUUID();
    const chatId = `chat_${requestId}`;
    
    const serviceRequest: ServiceRequest = {
      id: requestId,
      userId,
      userName,
      userEmail,
      serviceId,
      serviceTitle,
      serviceCategory,
      // Store as object directly (Firestore supports nested objects)
      requestDetails: typeof requestDetails === 'string' ? (() => {
        try {
          // If it's already a string, try to parse it to object
          return JSON.parse(requestDetails);
        } catch {
          // If parsing fails, keep as string for backward compatibility
          return requestDetails;
        }
      })() : requestDetails,
      attachments,
      status: 'pending',
      chatId,
      inquiries: [],
      notifications: [],
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    await runTransaction(firestore, async (tx) => {
      // Create service request
      const requestRef = doc(serviceRequestsCol, requestId);
      tx.set(requestRef, serviceRequest);

      // Create initial chat message
      const chatRef = doc(chatMessagesCol, `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
      const initialMessage: ChatMessage & { requestId: string } = {
        id: chatRef.id,
        senderId: userId,
        senderName: userName,
        senderType: 'user',
        message: `New service request submitted: ${serviceTitle}`,
        createdAt: serverTimestamp() as Timestamp,
        read: false,
        requestId: requestId
      };
      tx.set(chatRef, initialMessage);

      // Create order
      const orderRef = doc(collection(firestore, 'orders'), crypto.randomUUID());
      tx.set(orderRef, {
        id: orderRef.id,
        userId,
        userEmail,
        serviceRequestId: requestId,
        serviceId,
        serviceTitle,
        status: 'pending',
        paymentStatus: 'pending',
        reviewAllowed: false,
        orderStatus: 'pending',
        type: 'Service',
        amountUsd: 0,
        amountInr: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    // Notify admin
    await notifyAdmin('New service request submitted', {
      type: 'service_request',
      requestId,
      serviceTitle,
      userName,
      userEmail
    });

    return requestId;
  } catch (error) {
    console.error('Failed to create service request:', error);
    throw new Error('Failed to create service request. Please try again.');
  }
}

// Submit Admin Proposal
export async function submitAdminProposal(
  requestId: string, 
  adminId: string, 
  adminName: string,
  proposal: {
    totalPrice: number;
    currency: 'USD' | 'INR';
    lineItems: ProposalLineItem[];
    description: string;
    estimatedDelivery: string;
    deliveryDuration: DeliveryDuration;
  }
): Promise<void> {
  try {
    await runTransaction(firestore, async (tx) => {
      const requestRef = doc(serviceRequestsCol, requestId);
      const requestSnap = await tx.get(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Service request not found');
      }

      const requestData = requestSnap.data() as ServiceRequest;
      
      if (requestData.status !== 'pending') {
        throw new Error(`Cannot submit proposal. Current status: ${requestData.status}`);
      }

      // Update request with proposal
      tx.update(requestRef, {
        status: 'proposal_sent',
        adminProposal: {
          ...proposal,
          submittedAt: serverTimestamp(),
          submittedBy: adminId
        },
        updatedAt: serverTimestamp()
      });

      // Add notification
      const notification: Notification = {
        id: crypto.randomUUID(),
        type: 'proposal',
        title: 'Proposal Received',
        message: `Admin has submitted a proposal for your ${requestData.serviceTitle} request. Total: ${proposal.currency} ${proposal.totalPrice}`,
        createdAt: Timestamp.now(),
        read: false,
        actionUrl: `/orders/${requestId}`
      };

      tx.update(requestRef, {
        notifications: arrayUnion(notification)
      });

      // Add chat message
      const chatRef = doc(chatMessagesCol, `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
      const chatMessage: ChatMessage & { requestId: string } = {
        id: chatRef.id,
        senderId: adminId,
        senderName: adminName,
        senderType: 'admin',
        message: `Proposal submitted: ${proposal.currency} ${proposal.totalPrice}. ${proposal.description}`,
        createdAt: serverTimestamp() as Timestamp,
        read: false,
        requestId
      };
      tx.set(chatRef, chatMessage);
    });

    // Get request data for notification
    const requestDoc = await getDoc(doc(firestore, 'service_requests', requestId));
    if (requestDoc.exists()) {
      const requestData = requestDoc.data() as ServiceRequest;
      // Notify user
      await notifyUser(requestData.userId, 'Proposal Received', 
        `Admin has submitted a proposal for your ${requestData.serviceTitle} request. Please review and proceed with payment.`);
    }

  } catch (error) {
    console.error('Failed to submit proposal:', error);
    throw error;
  }
}

// Process Payment
export async function processPayment(
  requestId: string,
  paymentData: {
    method: PaymentMethod;
    amount: number;
    currency: 'USD' | 'INR';
    walletSplit?: { mainWallet: number; purchaseWallet: number };
    upiDetails?: { upiId: string; transactionId?: string; utr?: string };
  }
): Promise<void> {
  try {
    await runTransaction(firestore, async (tx) => {
      const requestRef = doc(serviceRequestsCol, requestId);
      const requestSnap = await tx.get(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Service request not found');
      }

      const requestData = requestSnap.data() as ServiceRequest;
      
      if (requestData.status !== 'proposal_sent') {
        throw new Error(`Cannot process payment. Current status: ${requestData.status}`);
      }

      if (!requestData.adminProposal) {
        throw new Error('No proposal found for this request');
      }

      // Validate payment amount
      if (paymentData.amount !== requestData.adminProposal.totalPrice) {
        throw new Error('Payment amount does not match proposal amount');
      }

      // Handle wallet payment
      if (paymentData.method === 'wallet') {
        const walletRef = doc(firestore, 'wallets', requestData.userId);
        const walletSnap = await tx.get(walletRef);
        
        if (!walletSnap.exists()) {
          throw new Error('User wallet not found');
        }

        const walletData = walletSnap.data();
        const usdt = walletData.usdt || {};
        const mainBalance = Number(usdt.mainUsdt || 0);
        const purchaseBalance = Number(usdt.purchaseUsdt || 0);
        
        if (paymentData.walletSplit) {
          const { mainWallet, purchaseWallet } = paymentData.walletSplit;
          
          if (mainWallet > mainBalance) {
            throw new Error(`Insufficient main wallet balance. Available: ${mainBalance}, Required: ${mainWallet}`);
          }
          
          if (purchaseWallet > purchaseBalance) {
            throw new Error(`Insufficient purchase wallet balance. Available: ${purchaseBalance}, Required: ${purchaseWallet}`);
          }
          
          // Deduct from both wallets
          tx.update(walletRef, {
            'usdt.mainUsdt': mainBalance - mainWallet,
            'usdt.purchaseUsdt': purchaseBalance - purchaseWallet,
            walletUpdatedAt: serverTimestamp()
          });
        } else {
          // Use main wallet only
          if (paymentData.amount > mainBalance) {
            throw new Error(`Insufficient main wallet balance. Available: ${mainBalance}, Required: ${paymentData.amount}`);
          }
          
          tx.update(walletRef, {
            'usdt.mainUsdt': mainBalance - paymentData.amount,
            walletUpdatedAt: serverTimestamp()
          });
        }
      }

      // Update request with payment
      tx.update(requestRef, {
        status: paymentData.method === 'wallet' ? 'processing' : 'payment_review',
        payment: {
          ...paymentData,
          status: paymentData.method === 'wallet' ? 'approved' : 'pending',
          submittedAt: serverTimestamp(),
          reviewedAt: paymentData.method === 'wallet' ? serverTimestamp() : undefined,
          reviewedBy: paymentData.method === 'wallet' ? 'system' : undefined
        },
        updatedAt: serverTimestamp()
      });

      // When wallet payment is auto-approved, unlock reviews on corresponding order
      if (paymentData.method === 'wallet') {
        const ordersQueryRef = query(
          collection(firestore, 'orders'),
          where('serviceRequestId', '==', requestId)
        );
        const ordersSnapshot = await getDocs(ordersQueryRef);
        if (!ordersSnapshot.empty) {
          const orderDoc = ordersSnapshot.docs[0];
          tx.update(orderDoc.ref, {
            userId: requestData.userId,
            serviceId: requestData.serviceId,
            paymentStatus: 'success',
            reviewAllowed: true,
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Add notification
      const notification: Notification = {
        id: crypto.randomUUID(),
        type: 'payment',
        title: paymentData.method === 'wallet' ? 'Payment Approved' : 'Payment Submitted',
        message: paymentData.method === 'wallet' 
          ? `Payment of ${paymentData.currency} ${paymentData.amount} has been processed from your wallet.`
          : `Payment of ${paymentData.currency} ${paymentData.amount} has been submitted for admin review.`,
        createdAt: Timestamp.now(),
        read: false
      };

      tx.update(requestRef, {
        notifications: arrayUnion(notification)
      });
    });

    // Notify admin for UPI payments
    if (paymentData.method === 'upi') {
      await notifyAdmin('Payment submitted for review', {
        type: 'payment_review',
        requestId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        upiDetails: paymentData.upiDetails
      });
    }

  } catch (error) {
    console.error('Failed to process payment:', error);
    throw error;
  }
}

// Approve/Reject Payment (Admin)
export async function reviewPayment(
  requestId: string,
  adminId: string,
  adminName: string,
  action: 'approve' | 'reject',
  reason?: string
): Promise<void> {
  try {
    await runTransaction(firestore, async (tx) => {
      const requestRef = doc(serviceRequestsCol, requestId);
      const requestSnap = await tx.get(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Service request not found');
      }

      const requestData = requestSnap.data() as ServiceRequest;
      
      if (requestData.status !== 'payment_review') {
        throw new Error(`Cannot review payment. Current status: ${requestData.status}`);
      }

      if (!requestData.payment) {
        throw new Error('No payment found for this request');
      }

      // Update payment status
      tx.update(requestRef, {
        status: action === 'approve' ? 'processing' : 'proposal_sent',
        payment: {
          ...requestData.payment,
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewedAt: serverTimestamp(),
          reviewedBy: adminId
        },
        updatedAt: serverTimestamp()
      });

  // If approved, mark corresponding order as reviewAllowed
  if (action === 'approve') {
    const ordersQueryRef = query(
      collection(firestore, 'orders'),
      where('serviceRequestId', '==', requestId)
    );
    const ordersSnapshot = await getDocs(ordersQueryRef);
    if (!ordersSnapshot.empty) {
      const orderDoc = ordersSnapshot.docs[0];
      tx.update(orderDoc.ref, {
        userId: requestData.userId,
        serviceId: requestData.serviceId,
        paymentStatus: 'success',
        reviewAllowed: true,
        updatedAt: serverTimestamp(),
      });
    }
  }

      // Add notification
      const notification: Notification = {
        id: crypto.randomUUID(),
        type: 'payment',
        title: action === 'approve' ? 'Payment Approved' : 'Payment Rejected',
        message: action === 'approve' 
          ? `Your payment has been approved. Work will begin shortly.`
          : `Your payment was rejected. ${reason || 'Please contact support for more information.'}`,
        createdAt: Timestamp.now(),
        read: false
      };

      tx.update(requestRef, {
        notifications: arrayUnion(notification)
      });

      // Add chat message
      const chatRef = doc(chatMessagesCol, `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
      const chatMessage: ChatMessage & { requestId: string } = {
        id: chatRef.id,
        senderId: adminId,
        senderName: adminName,
        senderType: 'admin',
        message: action === 'approve' 
          ? `Payment approved. Work will begin shortly.`
          : `Payment rejected. ${reason || 'Please contact support for more information.'}`,
        createdAt: serverTimestamp() as Timestamp,
        read: false,
        requestId
      };
      tx.set(chatRef, chatMessage);
    });

    // Notify user
    // Get request data for notification
    const requestDoc = await getDoc(doc(firestore, 'service_requests', requestId));
    if (requestDoc.exists()) {
      const requestData = requestDoc.data() as ServiceRequest;
      await notifyUser(requestData.userId, 
      action === 'approve' ? 'Payment Approved' : 'Payment Rejected',
      action === 'approve' 
        ? 'Your payment has been approved. Work will begin shortly.'
        : `Your payment was rejected. ${reason || 'Please contact support for more information.'}`);
    }

  } catch (error) {
    console.error('Failed to review payment:', error);
    throw error;
  }
}

// Update Order Status
export async function updateOrderStatus(
  requestId: string,
  adminId: string,
  adminName: string,
  status: ServiceRequestStatus,
  message?: string
): Promise<void> {
  try {
    await runTransaction(firestore, async (tx) => {
      const requestRef = doc(serviceRequestsCol, requestId);
      const requestSnap = await tx.get(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Service request not found');
      }

      const requestData = requestSnap.data() as ServiceRequest;

      // Update status
      tx.update(requestRef, {
        status,
        updatedAt: serverTimestamp()
      });

      // Add notification
      const statusMessages: Record<string, string> = {
        'pending': 'Your request is being reviewed.',
        'proposal_sent': 'A proposal has been sent for your request.',
        'awaiting_payment': 'Payment is required to proceed.',
        'payment_review': 'Your payment is being reviewed.',
        'processing': 'Work has started on your request.',
        'in_progress': 'Work is actively being done on your request.',
        'completed': 'Your order has been completed. Check deliverables.',
        'cancelled': 'Your order has been cancelled.'
      };

      const notification: Notification = {
        id: crypto.randomUUID(),
        type: 'status',
        title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: message || statusMessages[status] || `Order status updated to ${status}.`,
        createdAt: Timestamp.now(),
        read: false
      };

      tx.update(requestRef, {
        notifications: arrayUnion(notification)
      });

      // Add chat message
      const chatRef = doc(chatMessagesCol, `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
      const chatMessage: ChatMessage & { requestId: string } = {
        id: chatRef.id,
        senderId: adminId,
        senderName: adminName,
        senderType: 'admin',
        message: message || `Order status updated to ${status}.`,
        createdAt: serverTimestamp() as Timestamp,
        read: false,
        requestId
      };
      tx.set(chatRef, chatMessage);
    });

    // Notify user
    const statusMessages: Record<string, string> = {
      'pending': 'Your request is being reviewed.',
      'proposal_sent': 'A proposal has been sent for your request.',
      'awaiting_payment': 'Payment is required to proceed.',
      'payment_review': 'Your payment is being reviewed.',
      'processing': 'Work has started on your request.',
      'in_progress': 'Work is actively being done on your request.',
      'completed': 'Your order has been completed. Check deliverables.',
      'cancelled': 'Your order has been cancelled.'
    };

    // Get request data for notification
    const requestDoc = await getDoc(doc(firestore, 'service_requests', requestId));
    if (requestDoc.exists()) {
      const requestData = requestDoc.data() as ServiceRequest;
      await notifyUser(requestData.userId, 
      `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message || statusMessages[status] || `Order status updated to ${status}.`);
    }

  } catch (error) {
    console.error('Failed to update order status:', error);
    throw error;
  }
}

// Release Deliverables
export async function updateDeliveryDetails(
  requestId: string,
  adminId: string,
  adminName: string,
  deliverables: {
    websiteLink?: string;
    adminPanelLink?: string;
    credentials?: { username?: string; password?: string };
    files?: string[];
    notes?: string;
  }
): Promise<void> {
  try {
    await runTransaction(firestore, async (tx) => {
      const requestRef = doc(serviceRequestsCol, requestId);
      const requestSnap = await tx.get(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Service request not found');
      }

      const requestData = requestSnap.data() as ServiceRequest;

      // Update with deliverables without changing status
      tx.update(requestRef, {
        deliverables: {
          ...deliverables,
          updatedAt: serverTimestamp(),
          updatedBy: adminId
        },
        updatedAt: serverTimestamp()
      });

      // Also update the corresponding order in the orders collection
      const ordersQuery = query(
        collection(firestore, 'orders'),
        where('serviceRequestId', '==', requestId)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      
      if (!ordersSnapshot.empty) {
        const orderDoc = ordersSnapshot.docs[0];
        tx.update(orderDoc.ref, {
          deliverables: {
            ...deliverables,
            updatedAt: serverTimestamp(),
            updatedBy: adminId
          },
          updatedAt: serverTimestamp()
        });
      }

      // Add notification
      const notification: Notification = {
        id: crypto.randomUUID(),
        type: 'deliverable',
        title: 'Delivery Details Updated',
        message: 'Your order delivery details have been updated. Check your order details.',
        createdAt: Timestamp.now(),
        read: false,
        actionUrl: `/orders/${requestId}`
      };

      tx.update(requestRef, {
        notifications: arrayUnion(notification)
      });

      // Add chat message
      const chatRef = doc(chatMessagesCol, `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
      const chatMessage: ChatMessage & { requestId: string } = {
        id: chatRef.id,
        senderId: adminId,
        senderName: adminName,
        senderType: 'admin',
        message: 'Delivery details have been updated. Check your order details for the latest information.',
        createdAt: serverTimestamp() as Timestamp,
        read: false,
        requestId
      };
      tx.set(chatRef, chatMessage);
    });

    // Notify user
    const requestDoc = await getDoc(doc(firestore, 'service_requests', requestId));
    if (requestDoc.exists()) {
      const requestData = requestDoc.data() as ServiceRequest;
      await notifyUser(requestData.userId,
        'Delivery Details Updated',
        'Your order delivery details have been updated. Check your order details for the latest information.');
    }

  } catch (error) {
    console.error('Failed to update delivery details:', error);
    throw error;
  }
}

export async function releaseDeliverables(
  requestId: string,
  adminId: string,
  adminName: string,
  deliverables: {
    websiteLink?: string;
    adminPanelLink?: string;
    credentials?: { username?: string; password?: string };
    files?: string[];
    notes?: string;
  }
): Promise<void> {
  try {
    await runTransaction(firestore, async (tx) => {
      const requestRef = doc(serviceRequestsCol, requestId);
      const requestSnap = await tx.get(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Service request not found');
      }

      const requestData = requestSnap.data() as ServiceRequest;

      // Update with deliverables
      tx.update(requestRef, {
        status: 'completed',
        deliverables: {
          ...deliverables,
          releasedAt: serverTimestamp(),
          releasedBy: adminId
        },
        updatedAt: serverTimestamp()
      });

      // Also update the corresponding order in the orders collection
      const ordersQuery = query(
        collection(firestore, 'orders'),
        where('serviceRequestId', '==', requestId)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      
      if (!ordersSnapshot.empty) {
        const orderDoc = ordersSnapshot.docs[0];
        tx.update(orderDoc.ref, {
          deliverables: {
            ...deliverables,
            releasedAt: serverTimestamp(),
            releasedBy: adminId
          },
          orderStatus: 'completed',
          updatedAt: serverTimestamp()
        });
      }

      // Add notification
      const notification: Notification = {
        id: crypto.randomUUID(),
        type: 'deliverable',
        title: 'Deliverables Released',
        message: 'Your order deliverables have been released. Check your order details.',
        createdAt: Timestamp.now(),
        read: false,
        actionUrl: `/orders/${requestId}`
      };

      tx.update(requestRef, {
        notifications: arrayUnion(notification)
      });

      // Add chat message
      const chatRef = doc(chatMessagesCol, `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
      const chatMessage: ChatMessage & { requestId: string } = {
        id: chatRef.id,
        senderId: adminId,
        senderName: adminName,
        senderType: 'admin',
        message: 'Deliverables have been released. Check your order details for access information.',
        createdAt: serverTimestamp() as Timestamp,
        read: false,
        requestId
      };
      tx.set(chatRef, chatMessage);
    });

    // Notify user
    // Get request data for notification
    const requestDoc = await getDoc(doc(firestore, 'service_requests', requestId));
    if (requestDoc.exists()) {
      const requestData = requestDoc.data() as ServiceRequest;
      await notifyUser(requestData.userId, 
      'Deliverables Released',
      'Your order deliverables have been released. Check your order details for access information.');
    }

  } catch (error) {
    console.error('Failed to release deliverables:', error);
    throw error;
  }
}

// Send Chat Message
export async function sendChatMessage(
  requestId: string,
  senderId: string,
  senderName: string,
  senderType: 'user' | 'admin',
  message: string,
  attachments?: string[]
): Promise<void> {
  try {
    // Avoid writing undefined fields to Firestore
    const baseMessage: any = {
      id: crypto.randomUUID(),
      senderId,
      senderName,
      senderType,
      message,
      createdAt: serverTimestamp() as Timestamp,
      read: false,
      requestId
    };
    if (attachments && attachments.length > 0) {
      baseMessage.attachments = attachments;
    }

    await addDoc(chatMessagesCol, baseMessage);

    // Notify recipient
    const recipientType = senderType === 'user' ? 'admin' : 'user';
    // Get request data for notification
    const requestDoc = await getDoc(doc(firestore, 'service_requests', requestId));
    if (requestDoc.exists()) {
      const requestData = requestDoc.data() as ServiceRequest;
      await notifyUser(requestData.userId, 
      'New Message',
      `New message in your ${requestData.serviceTitle} order.`);
    }

  } catch (error) {
    console.error('Failed to send chat message:', error);
    throw error;
  }
}

// Submit Inquiry
export async function submitInquiry(
  requestId: string,
  userId: string,
  userName: string,
  inquiryType: 'question' | 'concern' | 'request',
  message: string
): Promise<void> {
  try {
    const inquiry: Inquiry = {
      id: crypto.randomUUID(),
      type: inquiryType,
      message,
      submittedBy: 'user',
      submittedAt: serverTimestamp() as Timestamp
    };

    // First, try to find a service request with this ID
    let serviceRequestFound = false;
    
    try {
      await runTransaction(firestore, async (tx) => {
        const requestRef = doc(serviceRequestsCol, requestId);
        const requestSnap = await tx.get(requestRef);
        
        if (requestSnap.exists()) {
          serviceRequestFound = true;
          const requestData = requestSnap.data() as ServiceRequest;

          // Add notification
          const notification: Notification = {
            id: crypto.randomUUID(),
            type: 'inquiry',
            title: 'New Inquiry',
            message: `New ${inquiryType} submitted for your ${requestData.serviceTitle} order.`,
            createdAt: serverTimestamp() as Timestamp,
            read: false
          };

          // Add inquiry and notification in a single update
          tx.update(requestRef, {
            inquiries: arrayUnion(inquiry),
            notifications: arrayUnion(notification),
            updatedAt: serverTimestamp()
          });
        }
      });
    } catch (error) {
      console.log('Service request not found, trying to create inquiry for order');
    }

    // If no service request found, create a general inquiry for the order
    if (!serviceRequestFound) {
      try {
        // Create a general inquiry document for digital product orders
        const inquiryRef = doc(collection(firestore, 'inquiries'));
        await addDoc(collection(firestore, 'inquiries'), {
          id: inquiryRef.id,
          orderId: requestId,
          userId,
          userName,
          inquiryType,
          message,
          submittedBy: 'user',
          submittedAt: serverTimestamp(),
          status: 'pending',
          createdAt: serverTimestamp()
        });

        // Notify admin about the inquiry
        await notifyAdmin('New product inquiry submitted', {
          type: 'product_inquiry',
          orderId: requestId,
          inquiryType,
          message,
          userName
        });

      } catch (error) {
        console.error('Failed to create general inquiry:', error);
        throw new Error('Failed to submit inquiry. Please try again.');
      }
    } else {
      // Notify admin for service request inquiry
      await notifyAdmin('New inquiry submitted', {
        type: 'inquiry',
        requestId,
        inquiryType,
        message,
        userName
      });
    }

  } catch (error) {
    console.error('Failed to submit inquiry:', error);
    throw error;
  }
}

// Get Service Requests
export async function getServiceRequests(
  userId?: string,
  status?: ServiceRequestStatus
): Promise<ServiceRequest[]> {
  try {
    let q = query(serviceRequestsCol, orderBy('createdAt', 'desc'));
    
    if (userId) {
      q = query(serviceRequestsCol, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    }
    
    if (status) {
      q = query(serviceRequestsCol, where('status', '==', status), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ServiceRequest));
  } catch (error) {
    console.error('Failed to get service requests:', error);
    throw error;
  }
}

// Get Service Request by ID
export async function getServiceRequest(requestId: string): Promise<ServiceRequest | null> {
  try {
    const docRef = doc(serviceRequestsCol, requestId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as ServiceRequest;
  } catch (error) {
    console.error('Failed to get service request:', error);
    throw error;
  }
}

// Submit/Attach Payment Reference (UTR / Transaction ID)
export async function submitPaymentReference(
  requestId: string,
  data: { utr?: string; transactionId?: string }
): Promise<void> {
  try {
    const requestRef = doc(serviceRequestsCol, requestId);
    // Merge into existing payment object and set/update upiDetails
    await updateDoc(requestRef, {
      payment: {
        upiDetails: {
          utr: data.utr || null,
          transactionId: data.transactionId || null
        }
      } as any,
      updatedAt: serverTimestamp()
    });

    // Optional: add a chat message noting reference submission
    const chatRef = doc(chatMessagesCol, `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    const chatMessage: ChatMessage & { requestId: string } = {
      id: chatRef.id,
      senderId: requestId,
      senderName: 'System',
      senderType: 'user',
      message: `Payment reference submitted${data.utr ? ` (UTR: ${data.utr})` : ''}${data.transactionId ? ` (TXN: ${data.transactionId})` : ''}.`,
      createdAt: serverTimestamp() as Timestamp,
      read: false,
      requestId
    };
    await addDoc(chatMessagesCol, chatMessage);
  } catch (error) {
    console.error('Failed to submit payment reference:', error);
    throw error;
  }
}

// Get Chat Messages
export async function getChatMessages(requestId: string): Promise<ChatMessage[]> {
  try {
    const q = query(
      chatMessagesCol,
      where('requestId', '==', requestId),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatMessage));
  } catch (error) {
    console.error('Failed to get chat messages:', error);
    throw error;
  }
}

// Helper functions for notifications
async function notifyUser(userId: string, title: string, message: string): Promise<void> {
  try {
    const notificationId = `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const notification = {
      id: notificationId,
      type: 'service',
      message,
      createdAt: Date.now(),
      read: false,
      route: '/orders'
    };
    
    await set(ref(db, `notifications/users/${userId}/${notificationId}`), notification);
  } catch (error) {
    console.error('Failed to notify user:', error);
  }
}

async function notifyAdmin(title: string, data: any): Promise<void> {
  try {
    const notificationId = `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const notification = {
      id: notificationId,
      type: 'service_request',
      message: title,
      data,
      createdAt: Date.now(),
      read: false,
      route: '/admin/service-requests'
    };
    
    await set(ref(db, `notifications/admins/${notificationId}`), notification);
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}
