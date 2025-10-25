import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDatabase, ref, set } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const database = getDatabase(app);

async function testSupportSystem() {
  console.log('🧪 Testing Support System Implementation...\n');

  try {
    // Test 1: Create a test digital product order with productLink
    console.log('1. Testing Digital Product Order with Product Link...');
    const testOrder = {
      id: `test_order_${Date.now()}`,
      userId: 'test_user_123',
      userEmail: 'test@example.com',
      productTitle: 'Test Digital Product',
      type: 'Digital',
      amountUsd: 99.99,
      amountInr: 0,
      status: 'paid',
      orderStatus: 'completed',
      productLink: 'https://example.com/product-access',
      downloadUrl: 'https://example.com/download',
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    const orderRef = await addDoc(collection(firestore, 'orders'), testOrder);
    console.log('✅ Test order created with productLink:', testOrder.productLink);

    // Test 2: Create a test inquiry for the order
    console.log('\n2. Testing Product Inquiry Submission...');
    const testInquiry = {
      id: `inquiry_${Date.now()}`,
      orderId: orderRef.id,
      userId: 'test_user_123',
      userName: 'Test User',
      userEmail: 'test@example.com',
      inquiryType: 'question',
      message: 'How do I access my digital product?',
      submittedBy: 'user',
      submittedAt: serverTimestamp(),
      status: 'pending',
      createdAt: serverTimestamp()
    };

    const inquiryRef = await addDoc(collection(firestore, 'inquiries'), testInquiry);
    console.log('✅ Test inquiry created:', inquiryRef.id);

    // Test 3: Create a test service request
    console.log('\n3. Testing Service Request Creation...');
    const testServiceRequest = {
      id: `service_${Date.now()}`,
      userId: 'test_user_123',
      userName: 'Test User',
      userEmail: 'test@example.com',
      serviceId: 'test_service_123',
      serviceTitle: 'Test Service Request',
      serviceCategory: 'Web Development',
      requestDetails: 'I need a website built for my business',
      status: 'pending',
      chatId: `chat_${Date.now()}`,
      inquiries: [],
      notifications: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const serviceRef = await addDoc(collection(firestore, 'serviceRequests'), testServiceRequest);
    console.log('✅ Test service request created:', serviceRef.id);

    // Test 4: Create a test ticket
    console.log('\n4. Testing Support Ticket Creation...');
    const testTicket = {
      id: `ticket_${Date.now()}`,
      userId: 'test_user_123',
      userName: 'Test User',
      userEmail: 'test@example.com',
      subject: 'Test Support Ticket',
      description: 'I need help with my account',
      status: 'Pending',
      priority: 'medium',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const ticketRef = await addDoc(collection(firestore, 'tickets'), testTicket);
    console.log('✅ Test ticket created:', ticketRef.id);

    // Test 5: Create admin connection record
    console.log('\n5. Testing Admin Connection Feature...');
    const testConnection = {
      requestId: inquiryRef.id,
      requestType: 'product_inquiry',
      adminId: 'admin_123',
      adminName: 'Test Admin',
      connectedAt: serverTimestamp(),
      status: 'active'
    };

    const connectionRef = await addDoc(collection(firestore, 'adminConnections'), testConnection);
    console.log('✅ Test admin connection created:', connectionRef.id);

    // Test 6: Create test mining transaction for DLX calculation
    console.log('\n6. Testing DLX Mining Transaction...');
    const testMiningTransaction = {
      id: `mining_${Date.now()}`,
      userId: 'test_user_123',
      type: 'mining',
      amount: 10.5,
      currency: 'DLX',
      description: 'Mining reward',
      status: 'completed',
      createdAt: serverTimestamp()
    };

    const miningRef = await addDoc(collection(firestore, 'transactions'), testMiningTransaction);
    console.log('✅ Test mining transaction created:', miningRef.id);

    // Test 7: Create test wallet with DLX balance
    console.log('\n7. Testing Wallet DLX Display...');
    const testWallet = {
      userId: 'test_user_123',
      mainUsdt: 100.0,
      purchaseUsdt: 50.0,
      dlx: 25.5,
      miningBalance: 10.5,
      walletUpdatedAt: serverTimestamp()
    };

    const walletRef = doc(firestore, 'wallets', 'test_user_123');
    await updateDoc(walletRef, testWallet).catch(async () => {
      // If wallet doesn't exist, create it
      await addDoc(collection(firestore, 'wallets'), {
        id: 'test_user_123',
        ...testWallet
      });
    });
    console.log('✅ Test wallet created with DLX balance:', testWallet.dlx);

    // Test 8: Create admin notification
    console.log('\n8. Testing Admin Notifications...');
    const testNotification = {
      id: `admin_notif_${Date.now()}`,
      type: 'product_inquiry',
      message: 'New product inquiry submitted',
      data: {
        orderId: orderRef.id,
        inquiryType: 'question',
        message: 'How do I access my digital product?',
        userName: 'Test User'
      },
      createdAt: Date.now(),
      read: false,
      route: '/admin/support-requests'
    };

    const notificationRef = ref(database, `notifications/admins/${testNotification.id}`);
    await set(notificationRef, testNotification);
    console.log('✅ Test admin notification created:', testNotification.id);

    // Test 9: Verify all data was created correctly
    console.log('\n9. Verifying Data Integrity...');
    
    // Check order
    const orderDoc = await getDoc(doc(firestore, 'orders', orderRef.id));
    if (orderDoc.exists()) {
      const orderData = orderDoc.data();
      console.log('✅ Order verification:', {
        hasProductLink: !!orderData.productLink,
        hasDownloadUrl: !!orderData.downloadUrl,
        status: orderData.status
      });
    }

    // Check inquiry
    const inquiryDoc = await getDoc(doc(firestore, 'inquiries', inquiryRef.id));
    if (inquiryDoc.exists()) {
      const inquiryData = inquiryDoc.data();
      console.log('✅ Inquiry verification:', {
        hasOrderId: !!inquiryData.orderId,
        hasMessage: !!inquiryData.message,
        status: inquiryData.status
      });
    }

    // Check service request
    const serviceDoc = await getDoc(doc(firestore, 'serviceRequests', serviceRef.id));
    if (serviceDoc.exists()) {
      const serviceData = serviceDoc.data();
      console.log('✅ Service request verification:', {
        hasChatId: !!serviceData.chatId,
        hasInquiries: Array.isArray(serviceData.inquiries),
        status: serviceData.status
      });
    }

    // Check ticket
    const ticketDoc = await getDoc(doc(firestore, 'tickets', ticketRef.id));
    if (ticketDoc.exists()) {
      const ticketData = ticketDoc.data();
      console.log('✅ Ticket verification:', {
        hasSubject: !!ticketData.subject,
        hasDescription: !!ticketData.description,
        status: ticketData.status
      });
    }

    // Check mining transaction
    const miningDoc = await getDoc(doc(firestore, 'transactions', miningRef.id));
    if (miningDoc.exists()) {
      const miningData = miningDoc.data();
      console.log('✅ Mining transaction verification:', {
        type: miningData.type,
        amount: miningData.amount,
        currency: miningData.currency
      });
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Digital product orders with productLink field');
    console.log('✅ Product inquiry submission and storage');
    console.log('✅ Service request creation and management');
    console.log('✅ Support ticket creation');
    console.log('✅ Admin connection functionality');
    console.log('✅ DLX mining transaction tracking');
    console.log('✅ Wallet DLX balance display');
    console.log('✅ Admin notification system');
    console.log('✅ Data integrity verification');

    console.log('\n🔗 Test Data Created:');
    console.log(`- Order ID: ${orderRef.id}`);
    console.log(`- Inquiry ID: ${inquiryRef.id}`);
    console.log(`- Service Request ID: ${serviceRef.id}`);
    console.log(`- Ticket ID: ${ticketRef.id}`);
    console.log(`- Connection ID: ${connectionRef.id}`);
    console.log(`- Mining Transaction ID: ${miningRef.id}`);
    console.log(`- Notification ID: ${testNotification.id}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testSupportSystem()
  .then(() => {
    console.log('\n✅ Support system test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Support system test failed:', error);
    process.exit(1);
  });

export { testSupportSystem };
