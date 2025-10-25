import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, runTransaction, serverTimestamp, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  createServiceRequest, 
  submitAdminProposal, 
  processPayment, 
  reviewPayment, 
  updateOrderStatus, 
  releaseDeliverables,
  sendChatMessage,
  submitInquiry,
  getServiceRequests,
  getServiceRequest,
  getChatMessages
} from '../src/utils/serviceRequestsAPI.ts';

// Initialize Firebase Admin SDK
const serviceAccount = require('../path/to/your/serviceAccountKey.json'); // IMPORTANT: Update this path
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com" // IMPORTANT: Update with your project ID
  });
}
const db = admin.firestore();

// Initialize Firebase Client SDK for user authentication
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // IMPORTANT: Update with your project's API key
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestoreClient = getFirestore(app);

class ServiceRequestsSystemTester {
  constructor() {
    this.testResults = [];
    this.testUserId = '';
    this.testUserEmail = `testuser_${Date.now()}@example.com`;
    this.testUserPassword = 'password123';
    this.adminUserEmail = 'admin@example.com'; // IMPORTANT: Update with your admin email
    this.adminUserPassword = 'adminpassword'; // IMPORTANT: Update with your admin password
    this.adminId = '';
    this.testRequestId = '';
    this.testChatId = '';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} [${type.toUpperCase()}] ${message}`;
    console.log(logEntry);
    this.testResults.push(logEntry);
  }

  async setupTestUserAndAdmin() {
    this.log('Setting up test user and admin...');
    try {
      // Create test user
      const userCredential = await createUserWithEmailAndPassword(auth, this.testUserEmail, this.testUserPassword);
      this.testUserId = userCredential.user.uid;
      this.log(`Test user created: ${this.testUserId}`);

      // Initialize wallet for test user
      await db.collection('wallets').doc(this.testUserId).set({
        mainUsdt: 1000,
        purchaseUsdt: 500,
        mainInr: 0,
        purchaseInr: 0,
        dlx: 0,
        walletUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      this.log(`Test user wallet initialized with 1000 USDT main, 500 USDT purchase.`);

      // Ensure admin user exists and get UID
      const adminUser = await signInWithEmailAndPassword(auth, this.adminUserEmail, this.adminUserPassword);
      this.adminId = adminUser.user.uid;
      this.log(`Admin user signed in: ${this.adminId}`);

      // Set admin custom claim (if not already set)
      const adminDoc = await db.collection('users').doc(this.adminId).get();
      if (!adminDoc.exists || !adminDoc.data().admin) {
        await db.collection('users').doc(this.adminId).set({ admin: true }, { merge: true });
        this.log('Admin custom claim set for admin user.');
      }

      return true;
    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      return false;
    }
  }

  async cleanup() {
    this.log('Cleaning up test data...');
    try {
      // Delete test user's wallet
      await db.collection('wallets').doc(this.testUserId).delete();
      this.log(`Deleted wallet for user ${this.testUserId}`);

      // Delete test user's service requests
      const requestsQuery = await db.collection('serviceRequests').where('userId', '==', this.testUserId).get();
      const batch = db.batch();
      requestsQuery.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      this.log(`Deleted service requests for user ${this.testUserId}`);

      // Delete chat messages
      const chatQuery = await db.collection('chatMessages').where('requestId', '==', this.testRequestId).get();
      const chatBatch = db.batch();
      chatQuery.docs.forEach(doc => chatBatch.delete(doc.ref));
      await chatBatch.commit();
      this.log(`Deleted chat messages for request ${this.testRequestId}`);

      // Delete test user (requires Firebase Admin SDK)
      await admin.auth().deleteUser(this.testUserId);
      this.log(`Deleted test user ${this.testUserId}`);

      return true;
    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testServiceRequestCreation() {
    this.log('--- Testing Service Request Creation ---');
    
    try {
      this.log('1. User creates service request...');
      this.testRequestId = await createServiceRequest({
        userId: this.testUserId,
        userName: 'Test User',
        userEmail: this.testUserEmail,
        serviceId: 'website',
        serviceTitle: 'Website Development',
        serviceCategory: 'Web Development',
        requestDetails: 'I need a modern website for my business with e-commerce functionality.',
        attachments: ['design-mockup.pdf', 'requirements.docx']
      });
      this.log(`Service request created with ID: ${this.testRequestId}`);

      // Verify service request in Firestore
      const requestDoc = await db.collection('serviceRequests').doc(this.testRequestId).get();
      if (!requestDoc.exists || requestDoc.data().status !== 'pending') {
        throw new Error('Service request not found or status is not pending.');
      }
      this.log('Service request verified in Firestore (pending).');

      // Verify chat was created
      const chatQuery = await db.collection('chatMessages').where('requestId', '==', this.testRequestId).get();
      if (chatQuery.empty) {
        throw new Error('Chat messages not found for the request.');
      }
      this.log('Chat messages verified for the request.');

      this.log('Service request creation test PASSED.', 'success');
      return true;
    } catch (error) {
      this.log(`Service request creation test FAILED: ${error.message}`, 'error');
      return false;
    }
  }

  async testAdminProposalSubmission() {
    this.log('--- Testing Admin Proposal Submission ---');
    
    try {
      this.log('1. Admin submits proposal...');
      await submitAdminProposal(
        this.testRequestId,
        this.adminId,
        'Admin User',
        {
          totalPrice: 1500,
          currency: 'USD',
          lineItems: [
            {
              id: crypto.randomUUID(),
              name: 'Website Design',
              description: 'Custom website design and layout',
              quantity: 1,
              unitPrice: 800,
              totalPrice: 800
            },
            {
              id: crypto.randomUUID(),
              name: 'E-commerce Integration',
              description: 'Shopping cart and payment integration',
              quantity: 1,
              unitPrice: 700,
              totalPrice: 700
            }
          ],
          description: 'Complete website development with e-commerce functionality',
          estimatedDelivery: '2024-02-15'
        }
      );
      this.log('Admin proposal submitted successfully.');

      // Verify proposal in Firestore
      const requestDoc = await db.collection('serviceRequests').doc(this.testRequestId).get();
      const requestData = requestDoc.data();
      
      if (requestData.status !== 'proposal_sent') {
        throw new Error('Service request status not updated to proposal_sent.');
      }
      this.log('Service request status verified (proposal_sent).');

      if (!requestData.adminProposal || requestData.adminProposal.totalPrice !== 1500) {
        throw new Error('Admin proposal not found or incorrect total price.');
      }
      this.log('Admin proposal verified with correct total price.');

      this.log('Admin proposal submission test PASSED.', 'success');
      return true;
    } catch (error) {
      this.log(`Admin proposal submission test FAILED: ${error.message}`, 'error');
      return false;
    }
  }

  async testWalletPayment() {
    this.log('--- Testing Wallet Payment ---');
    
    try {
      this.log('1. User pays using wallet (50/50 split)...');
      await processPayment(this.testRequestId, {
        method: 'wallet',
        amount: 1500,
        currency: 'USD',
        walletSplit: {
          mainWallet: 750,
          purchaseWallet: 750
        }
      });
      this.log('Wallet payment processed successfully.');

      // Verify payment in Firestore
      const requestDoc = await db.collection('serviceRequests').doc(this.testRequestId).get();
      const requestData = requestDoc.data();
      
      if (requestData.status !== 'processing') {
        throw new Error('Service request status not updated to processing.');
      }
      this.log('Service request status verified (processing).');

      if (!requestData.payment || requestData.payment.status !== 'approved') {
        throw new Error('Payment not found or not approved.');
      }
      this.log('Payment verified as approved.');

      // Verify wallet balances updated
      const walletDoc = await db.collection('wallets').doc(this.testUserId).get();
      const walletData = walletDoc.data();
      
      if (walletData.mainUsdt !== 250 || walletData.purchaseUsdt !== -250) {
        throw new Error('Wallet balances not updated correctly.');
      }
      this.log('Wallet balances verified (main: 250, purchase: -250).');

      this.log('Wallet payment test PASSED.', 'success');
      return true;
    } catch (error) {
      this.log(`Wallet payment test FAILED: ${error.message}`, 'error');
      return false;
    }
  }

  async testUPIPayment() {
    this.log('--- Testing UPI Payment ---');
    
    try {
      // Create a new service request for UPI test
      const upiRequestId = await createServiceRequest({
        userId: this.testUserId,
        userName: 'Test User',
        userEmail: this.testUserEmail,
        serviceId: 'mobile',
        serviceTitle: 'Mobile App Development',
        serviceCategory: 'App Development',
        requestDetails: 'I need a mobile app for iOS and Android.',
        attachments: []
      });
      this.log(`New service request created for UPI test: ${upiRequestId}`);

      // Admin submits proposal
      await submitAdminProposal(
        upiRequestId,
        this.adminId,
        'Admin User',
        {
          totalPrice: 2000,
          currency: 'USD',
          lineItems: [
            {
              id: crypto.randomUUID(),
              name: 'Mobile App Development',
              description: 'Cross-platform mobile app',
              quantity: 1,
              unitPrice: 2000,
              totalPrice: 2000
            }
          ],
          description: 'Complete mobile app development',
          estimatedDelivery: '2024-03-01'
        }
      );

      // User submits UPI payment
      await processPayment(upiRequestId, {
        method: 'upi',
        amount: 2000,
        currency: 'USD',
        upiDetails: {
          upiId: 'digilinex@ibl',
          transactionId: 'TXN123456789',
          utr: 'UTR987654321'
        }
      });
      this.log('UPI payment submitted successfully.');

      // Verify payment status
      const requestDoc = await db.collection('serviceRequests').doc(upiRequestId).get();
      const requestData = requestDoc.data();
      
      if (requestData.status !== 'payment_review') {
        throw new Error('Service request status not updated to payment_review.');
      }
      this.log('Service request status verified (payment_review).');

      if (!requestData.payment || requestData.payment.status !== 'pending') {
        throw new Error('Payment not found or not pending.');
      }
      this.log('Payment verified as pending review.');

      this.log('UPI payment test PASSED.', 'success');
      return true;
    } catch (error) {
      this.log(`UPI payment test FAILED: ${error.message}`, 'error');
      return false;
    }
  }

  async testAdminPaymentReview() {
    this.log('--- Testing Admin Payment Review ---');
    
    try {
      // Find a payment_review request
      const requestsQuery = await db.collection('serviceRequests').where('status', '==', 'payment_review').get();
      if (requestsQuery.empty) {
        throw new Error('No payment_review requests found.');
      }
      
      const reviewRequestId = requestsQuery.docs[0].id;
      this.log(`Reviewing payment for request: ${reviewRequestId}`);

      // Admin approves payment
      await reviewPayment(reviewRequestId, this.adminId, 'Admin User', 'approve');
      this.log('Payment approved by admin.');

      // Verify status updated
      const requestDoc = await db.collection('serviceRequests').doc(reviewRequestId).get();
      const requestData = requestDoc.data();
      
      if (requestData.status !== 'processing') {
        throw new Error('Service request status not updated to processing.');
      }
      this.log('Service request status verified (processing).');

      if (!requestData.payment || requestData.payment.status !== 'approved') {
        throw new Error('Payment not found or not approved.');
      }
      this.log('Payment verified as approved.');

      this.log('Admin payment review test PASSED.', 'success');
      return true;
    } catch (error) {
      this.log(`Admin payment review test FAILED: ${error.message}`, 'error');
      return false;
    }
  }

  async testOrderStatusUpdates() {
    this.log('--- Testing Order Status Updates ---');
    
    try {
      this.log('1. Admin updates status to in_progress...');
      await updateOrderStatus(
        this.testRequestId,
        this.adminId,
        'Admin User',
        'in_progress',
        'Work has started on your website. We are currently working on the design phase.'
      );
      this.log('Status updated to in_progress.');

      // Verify status update
      const requestDoc = await db.collection('serviceRequests').doc(this.testRequestId).get();
      const requestData = requestDoc.data();
      
      if (requestData.status !== 'in_progress') {
        throw new Error('Service request status not updated to in_progress.');
      }
      this.log('Service request status verified (in_progress).');

      this.log('2. Admin updates status to completed...');
      await updateOrderStatus(
        this.testRequestId,
        this.adminId,
        'Admin User',
        'completed',
        'Your website has been completed and is ready for review.'
      );
      this.log('Status updated to completed.');

      // Verify status update
      const updatedRequestDoc = await db.collection('serviceRequests').doc(this.testRequestId).get();
      const updatedRequestData = updatedRequestDoc.data();
      
      if (updatedRequestData.status !== 'completed') {
        throw new Error('Service request status not updated to completed.');
      }
      this.log('Service request status verified (completed).');

      this.log('Order status updates test PASSED.', 'success');
      return true;
    } catch (error) {
      this.log(`Order status updates test FAILED: ${error.message}`, 'error');
      return false;
    }
  }

  async testDeliverablesRelease() {
    this.log('--- Testing Deliverables Release ---');
    
    try {
      this.log('1. Admin releases deliverables...');
      await releaseDeliverables(
        this.testRequestId,
        this.adminId,
        'Admin User',
        {
          websiteLink: 'https://example.com',
          adminPanelLink: 'https://admin.example.com',
          credentials: {
            username: 'admin',
            password: 'securepassword123'
          },
          files: ['website-files.zip', 'documentation.pdf'],
          notes: 'Website is live and ready for use. Admin panel access provided.'
        }
      );
      this.log('Deliverables released successfully.');

      // Verify deliverables in Firestore
      const requestDoc = await db.collection('serviceRequests').doc(this.testRequestId).get();
      const requestData = requestDoc.data();
      
      if (!requestData.deliverables) {
        throw new Error('Deliverables not found in service request.');
      }
      this.log('Deliverables verified in service request.');

      if (requestData.deliverables.websiteLink !== 'https://example.com') {
        throw new Error('Website link not set correctly.');
      }
      this.log('Website link verified.');

      if (requestData.deliverables.credentials.username !== 'admin') {
        throw new Error('Credentials not set correctly.');
      }
      this.log('Credentials verified.');

      this.log('Deliverables release test PASSED.', 'success');
      return true;
    } catch (error) {
      this.log(`Deliverables release test FAILED: ${error.message}`, 'error');
      return false;
    }
  }

  async testChatSystem() {
    this.log('--- Testing Chat System ---');
    
    try {
      this.log('1. User sends chat message...');
      await sendChatMessage(
        this.testRequestId,
        this.testUserId,
        'Test User',
        'user',
        'Hello, I have a question about the website design. Can you please clarify the color scheme?'
      );
      this.log('User chat message sent.');

      this.log('2. Admin sends chat message...');
      await sendChatMessage(
        this.testRequestId,
        this.adminId,
        'Admin User',
        'admin',
        'Hello! I can help you with the color scheme. We typically use modern, professional colors. Would you like to see some examples?'
      );
      this.log('Admin chat message sent.');

      // Verify chat messages
      const chatMessages = await getChatMessages(this.testRequestId);
      if (chatMessages.length < 3) { // 1 initial + 2 new messages
        throw new Error('Chat messages not found or incorrect count.');
      }
      this.log(`Chat messages verified (${chatMessages.length} messages).`);

      this.log('Chat system test PASSED.', 'success');
      return true;
    } catch (error) {
      this.log(`Chat system test FAILED: ${error.message}`, 'error');
      return false;
    }
  }

  async testInquirySystem() {
    this.log('--- Testing Inquiry System ---');
    
    try {
      this.log('1. User submits inquiry...');
      await submitInquiry(
        this.testRequestId,
        this.testUserId,
        'Test User',
        'question',
        'I would like to know if you can add a blog section to the website. Is this possible?'
      );
      this.log('User inquiry submitted.');

      // Verify inquiry in Firestore
      const requestDoc = await db.collection('serviceRequests').doc(this.testRequestId).get();
      const requestData = requestDoc.data();
      
      if (!requestData.inquiries || requestData.inquiries.length === 0) {
        throw new Error('Inquiry not found in service request.');
      }
      this.log('Inquiry verified in service request.');

      const inquiry = requestData.inquiries[0];
      if (inquiry.type !== 'question' || inquiry.message !== 'I would like to know if you can add a blog section to the website. Is this possible?') {
        throw new Error('Inquiry data not set correctly.');
      }
      this.log('Inquiry data verified.');

      this.log('Inquiry system test PASSED.', 'success');
      return true;
    } catch (error) {
      this.log(`Inquiry system test FAILED: ${error.message}`, 'error');
      return false;
    }
  }

  async testDataRetrieval() {
    this.log('--- Testing Data Retrieval ---');
    
    try {
      this.log('1. Get service requests for user...');
      const userRequests = await getServiceRequests(this.testUserId);
      if (userRequests.length === 0) {
        throw new Error('No service requests found for user.');
      }
      this.log(`User service requests verified (${userRequests.length} requests).`);

      this.log('2. Get specific service request...');
      const specificRequest = await getServiceRequest(this.testRequestId);
      if (!specificRequest) {
        throw new Error('Specific service request not found.');
      }
      this.log('Specific service request verified.');

      this.log('3. Get all service requests...');
      const allRequests = await getServiceRequests();
      if (allRequests.length === 0) {
        throw new Error('No service requests found.');
      }
      this.log(`All service requests verified (${allRequests.length} requests).`);

      this.log('Data retrieval test PASSED.', 'success');
      return true;
    } catch (error) {
      this.log(`Data retrieval test FAILED: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('--- Starting All Service Requests Tests ---');
    let allPassed = true;

    if (await this.setupTestUserAndAdmin()) {
      if (!(await this.testServiceRequestCreation())) allPassed = false;
      if (!(await this.testAdminProposalSubmission())) allPassed = false;
      if (!(await this.testWalletPayment())) allPassed = false;
      if (!(await this.testUPIPayment())) allPassed = false;
      if (!(await this.testAdminPaymentReview())) allPassed = false;
      if (!(await this.testOrderStatusUpdates())) allPassed = false;
      if (!(await this.testDeliverablesRelease())) allPassed = false;
      if (!(await this.testChatSystem())) allPassed = false;
      if (!(await this.testInquirySystem())) allPassed = false;
      if (!(await this.testDataRetrieval())) allPassed = false;
    } else {
      allPassed = false;
      this.log('Skipping tests due to setup failure.', 'error');
    }

    this.log('--- All Tests Finished ---');
    if (allPassed) {
      this.log('All service requests tests PASSED!', 'success');
    } else {
      this.log('Some service requests tests FAILED.', 'error');
    }

    await this.cleanup();
    return allPassed;
  }
}

// Run the tests
const tester = new ServiceRequestsSystemTester();
tester.runAllTests().then(() => {
  console.log('\n--- Test Report ---');
  tester.testResults.forEach(log => console.log(log));
}).catch(console.error);
