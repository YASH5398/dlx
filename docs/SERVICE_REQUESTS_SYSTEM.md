# Service Requests System - Complete Documentation

## 🎯 Overview

The Service Requests System is a comprehensive solution for managing service orders from submission to completion. It includes full user & admin workflow, payments, chat, notifications, and order deliverables.

## 🏗️ System Architecture

### **Core Components**

1. **Service Requests API** (`src/utils/serviceRequestsAPI.ts`)
   - Centralized API for all service request operations
   - Atomic transactions for data consistency
   - Comprehensive error handling and logging

2. **Admin Panel** (`src/pages/SecretAdmin/AdminServiceRequestsEnhanced.tsx`)
   - Real-time service request management
   - Proposal submission with line items
   - Payment review and approval
   - Order status management
   - Deliverables release
   - Chat and inquiry handling

3. **User Orders Page** (`src/pages/Dashboard/OrdersEnhanced.tsx`)
   - Order status timeline
   - Payment options (wallet + UPI)
   - Chat with admin
   - Inquiry submission
   - Deliverables access

4. **Service Request Modal** (`src/components/ServiceRequestModalEnhanced.tsx`)
   - Enhanced service request submission
   - File attachments support
   - User-friendly interface

## 📊 Data Structure

### **ServiceRequest Interface**

```typescript
interface ServiceRequest {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceTitle: string;
  serviceCategory: string;
  requestDetails: string;
  attachments?: string[];
  status: ServiceRequestStatus;
  
  // Admin proposal details
  adminProposal?: {
    totalPrice: number;
    currency: 'USD' | 'INR';
    lineItems: ProposalLineItem[];
    description: string;
    estimatedDelivery: string;
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
    files?: string[];
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
```

### **Status Flow**

```
pending → proposal_sent → awaiting_payment → payment_review → processing → in_progress → completed
   ↓           ↓              ↓                ↓
cancelled   cancelled      cancelled       cancelled
```

## 🔄 User Workflow

### **1. Service Request Submission**

1. User clicks "Buy/Request Service" on any service
2. Fills out enhanced request form with:
   - Service details
   - Requirements description
   - File attachments (optional)
3. Request is saved to `serviceRequests` collection
4. User receives confirmation notification
5. Admin receives notification of new request

### **2. Admin Proposal**

1. Admin reviews request details
2. Creates detailed proposal with:
   - Total price and currency
   - Line items breakdown
   - Description and timeline
   - Estimated delivery date
3. Proposal is submitted and status changes to `proposal_sent`
4. User receives notification with proposal details

### **3. Payment Processing**

#### **Digital Wallet Payment**
- User can pay using Main Wallet + Purchase Wallet
- 50/50 split option available
- Automatic balance validation
- Instant approval and status update

#### **UPI Payment**
- User enters UPI ID: `digilinex@ibl`
- User completes payment and enters transaction details
- Status changes to `payment_review`
- Admin reviews and approves/rejects payment
- Status updates to `processing` or `proposal_sent`

### **4. Order Processing**

1. Admin updates status to `processing` when work begins
2. Admin updates status to `in_progress` during active work
3. Real-time chat between user and admin
4. User can submit inquiries for questions/concerns
5. Admin responds to inquiries and chat messages

### **5. Deliverables Release**

1. Admin releases deliverables with:
   - Website links
   - Admin panel access
   - Credentials (username/password)
   - Files and documentation
   - Additional notes
2. Status changes to `completed`
3. User receives notification and access to deliverables

## 🛠️ Admin Features

### **Service Request Management**

- **Filtering**: By status, user, service, date
- **Search**: By user name, email, service title
- **Real-time Updates**: Live status changes and notifications

### **Proposal Management**

- **Line Items**: Detailed breakdown of services
- **Pricing**: Flexible USD/INR pricing
- **Timeline**: Estimated delivery dates
- **Description**: Detailed service description

### **Payment Management**

- **Wallet Payments**: Automatic processing with balance validation
- **UPI Payments**: Manual review and approval process
- **Payment History**: Complete audit trail

### **Order Management**

- **Status Updates**: Real-time status changes
- **Progress Tracking**: Visual timeline for users
- **Communication**: Integrated chat system

### **Deliverables Management**

- **File Uploads**: Support for multiple file types
- **Access Credentials**: Secure credential management
- **Documentation**: Comprehensive delivery notes

## 💬 Communication Features

### **Chat System**

- **Real-time Messaging**: Between users and admins
- **Message History**: Complete conversation logs
- **Notifications**: Real-time message alerts
- **File Attachments**: Support for file sharing

### **Inquiry System**

- **Question Types**: Questions, concerns, requests
- **Admin Responses**: Structured response system
- **Status Tracking**: Inquiry resolution tracking
- **Notifications**: Real-time inquiry alerts

## 🔔 Notification System

### **User Notifications**

- **Proposal Received**: When admin submits proposal
- **Payment Status**: Payment approval/rejection
- **Order Updates**: Status changes and progress
- **Deliverables**: When deliverables are released
- **Chat Messages**: New messages from admin
- **Inquiry Responses**: Responses to user inquiries

### **Admin Notifications**

- **New Requests**: When users submit requests
- **Payment Reviews**: When UPI payments need review
- **User Messages**: New chat messages from users
- **Inquiries**: New user inquiries

## 🔒 Security & Data Protection

### **Access Control**

- **User Isolation**: Users can only access their own data
- **Admin Authentication**: Proper admin access control
- **Data Validation**: Comprehensive input validation
- **Audit Logging**: Complete operation history

### **Payment Security**

- **Balance Validation**: Prevents insufficient balance payments
- **Atomic Transactions**: Ensures data consistency
- **Audit Trail**: Complete payment history
- **Fraud Prevention**: UPI payment verification

## 📱 User Interface

### **Enhanced Service Request Modal**

- **Dynamic Forms**: Based on service type
- **File Uploads**: Drag-and-drop file support
- **Progress Indicators**: Clear submission process
- **Success Feedback**: Confirmation and next steps

### **User Orders Page**

- **Status Timeline**: Visual progress tracking
- **Payment Options**: Wallet and UPI integration
- **Chat Interface**: Real-time communication
- **Deliverables Access**: Secure credential management

### **Admin Panel**

- **Dashboard View**: Overview of all requests
- **Detail Management**: Comprehensive request handling
- **Real-time Updates**: Live status changes
- **Communication Tools**: Integrated chat and inquiry system

## 🧪 Testing

### **Test Coverage**

The system includes comprehensive testing for:

1. **Service Request Creation**
   - User submission process
   - Data validation
   - Notification delivery

2. **Admin Proposal Submission**
   - Proposal creation
   - Line items management
   - Status updates

3. **Payment Processing**
   - Wallet payments (50/50 split)
   - UPI payments
   - Balance validation
   - Status updates

4. **Admin Payment Review**
   - Payment approval/rejection
   - Status updates
   - Notification delivery

5. **Order Status Management**
   - Status transitions
   - Progress tracking
   - User notifications

6. **Deliverables Release**
   - File management
   - Credential handling
   - Access control

7. **Chat System**
   - Message sending/receiving
   - Real-time updates
   - Notification delivery

8. **Inquiry System**
   - Inquiry submission
   - Admin responses
   - Status tracking

### **Running Tests**

```bash
# Update Firebase configuration in the test file
# Run the comprehensive test suite
node scripts/testServiceRequestsSystem.js
```

## 🚀 Deployment

### **Prerequisites**

1. **Firebase Configuration**
   - Update service account key path
   - Configure project ID and API keys
   - Set up Firestore security rules

2. **Environment Setup**
   - Install dependencies
   - Configure Firebase project
   - Set up admin users

### **Firestore Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Service Requests
    match /serviceRequests/{requestId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true;
    }
    
    // Chat Messages
    match /chatMessages/{messageId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.senderId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
    }
    
    // Inquiries
    match /inquiries/{inquiryId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.submittedBy || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
    }
  }
}
```

## 📈 Performance & Scalability

### **Optimization Features**

- **Real-time Updates**: Efficient Firestore listeners
- **Atomic Transactions**: Consistent data operations
- **Caching**: Optimized data retrieval
- **Pagination**: Efficient large dataset handling

### **Monitoring**

- **Error Logging**: Comprehensive error tracking
- **Audit Trails**: Complete operation history
- **Performance Metrics**: System performance monitoring
- **User Analytics**: Usage pattern analysis

## 🔧 Maintenance

### **Regular Tasks**

1. **Data Cleanup**: Remove old test data
2. **Performance Monitoring**: Check system performance
3. **Security Updates**: Regular security patches
4. **Backup Verification**: Ensure data backups

### **Troubleshooting**

1. **Payment Issues**: Check wallet balances and UPI details
2. **Status Sync**: Verify Firestore listeners
3. **Notification Delivery**: Check notification system
4. **Chat Issues**: Verify real-time connections

## 📚 API Reference

### **Core Functions**

```typescript
// Create service request
createServiceRequest(data: CreateServiceRequestInput): Promise<string>

// Submit admin proposal
submitAdminProposal(requestId: string, adminId: string, adminName: string, proposal: AdminProposal): Promise<void>

// Process payment
processPayment(requestId: string, paymentData: PaymentData): Promise<void>

// Review payment (admin)
reviewPayment(requestId: string, adminId: string, adminName: string, action: 'approve' | 'reject', reason?: string): Promise<void>

// Update order status
updateOrderStatus(requestId: string, adminId: string, adminName: string, status: ServiceRequestStatus, message?: string): Promise<void>

// Release deliverables
releaseDeliverables(requestId: string, adminId: string, adminName: string, deliverables: DeliverablesData): Promise<void>

// Send chat message
sendChatMessage(requestId: string, senderId: string, senderName: string, senderType: 'user' | 'admin', message: string, attachments?: string[]): Promise<void>

// Submit inquiry
submitInquiry(requestId: string, userId: string, userName: string, inquiryType: 'question' | 'concern' | 'request', message: string): Promise<void>

// Get service requests
getServiceRequests(userId?: string, status?: ServiceRequestStatus): Promise<ServiceRequest[]>

// Get specific service request
getServiceRequest(requestId: string): Promise<ServiceRequest | null>

// Get chat messages
getChatMessages(requestId: string): Promise<ChatMessage[]>
```

## 🎉 Success Metrics

The Service Requests System provides:

- ✅ **Complete Workflow**: End-to-end service request management
- ✅ **Real-time Communication**: Chat and inquiry system
- ✅ **Flexible Payments**: Wallet and UPI payment options
- ✅ **Admin Control**: Comprehensive admin management tools
- ✅ **User Experience**: Intuitive and responsive interface
- ✅ **Data Security**: Robust security and access control
- ✅ **Scalability**: Built for growth and performance
- ✅ **Maintainability**: Clean, documented, and testable code

The system is production-ready and provides a complete solution for service request management with full user and admin workflows, payments, chat, notifications, and order deliverables.
