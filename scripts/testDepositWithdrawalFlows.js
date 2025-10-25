const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, query, where, getDocs, updateDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBvOkBwJcJjJjJjJjJjJjJjJjJjJjJjJjJ",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

class DepositWithdrawalFlowTester {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);
    this.testUserId = 'test-user-' + Date.now();
    this.testAdminId = 'test-admin-' + Date.now();
    this.depositRequestId = null;
    this.withdrawalRequestId = null;
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async setupTestUser() {
    this.log('Setting up test user...');
    
    // Create test user wallet document
    const walletRef = doc(this.db, 'wallets', this.testUserId);
    await setDoc(walletRef, {
      mainUsdt: 100, // Start with 100 USDT
      purchaseUsdt: 50, // Start with 50 USDT
      mainInr: 0,
      purchaseInr: 0,
      dlx: 0,
      walletUpdatedAt: serverTimestamp()
    });

    // Create test user document
    const userRef = doc(this.db, 'users', this.testUserId);
    await setDoc(userRef, {
      email: 'test@example.com',
      name: 'Test User',
      wallet: {
        miningBalance: 0
      }
    });

    this.log('Test user setup complete');
  }

  async testDepositFlow() {
    this.log('🧪 Testing Deposit Flow...');
    
    // Step 1: Create deposit request
    this.log('Creating deposit request...');
    const depositRequest = {
      userId: this.testUserId,
      amount: 50,
      method: 'usdt-bep20',
      status: 'pending',
      currency: 'USDT',
      fees: 0,
      txnId: 'test-deposit-tx-' + Date.now(),
      notes: 'Test deposit for approval flow',
      createdAt: serverTimestamp()
    };

    const depositRef = await addDoc(collection(this.db, 'depositRequests'), depositRequest);
    this.depositRequestId = depositRef.id;
    this.log(`Deposit request created with ID: ${this.depositRequestId}`);

    // Step 2: Create corresponding transaction
    const transactionRef = await addDoc(collection(this.db, 'wallets', this.testUserId, 'transactions'), {
      type: 'deposit',
      amount: 50,
      currency: 'USDT',
      status: 'pending',
      description: 'Deposit via BEP20 (Admin Verification Pending)',
      createdAt: serverTimestamp(),
      requestId: this.depositRequestId
    });
    this.log(`Transaction created with ID: ${transactionRef.id}`);

    // Step 3: Simulate admin approval
    this.log('Simulating admin approval...');
    await this.simulateDepositApproval();

    // Step 4: Verify results
    await this.verifyDepositResults();
  }

  async simulateDepositApproval() {
    // This simulates what happens in AdminTransactions2.tsx approveDeposit function
    const depositRef = doc(this.db, 'depositRequests', this.depositRequestId);
    const walletRef = doc(this.db, 'wallets', this.testUserId);
    
    // Get current wallet data
    const walletSnap = await getDoc(walletRef);
    const walletData = walletSnap.data() || {};
    const currentBalance = Number(walletData.mainUsdt || 0);
    const newBalance = currentBalance + 50; // 50 USDT deposit
    
    // Update wallet with new balance (using direct field structure)
    await setDoc(walletRef, {
      ...walletData,
      mainUsdt: newBalance,
      walletUpdatedAt: serverTimestamp()
    }, { merge: true });
    
    // Update deposit request status
    await setDoc(depositRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      reviewedBy: this.testAdminId,
      approvedBy: 'test-admin@example.com'
    }, { merge: true });

    // Update corresponding transaction
    const txQuery = query(
      collection(this.db, 'wallets', this.testUserId, 'transactions'),
      where('requestId', '==', this.depositRequestId)
    );
    const txSnap = await getDocs(txQuery);
    if (!txSnap.empty) {
      const txDoc = txSnap.docs[0];
      await updateDoc(txDoc.ref, {
        status: 'success',
        description: 'Deposit via usdt-bep20 (Approved and Credited)',
        updatedAt: serverTimestamp()
      });
    }
    
    this.log(`Wallet updated: ${currentBalance} → ${newBalance} USDT`);
    this.log('Deposit request approved and transaction updated');
  }

  async verifyDepositResults() {
    this.log('Verifying deposit results...');
    
    // Check wallet balance
    const walletRef = doc(this.db, 'wallets', this.testUserId);
    const walletSnap = await getDoc(walletRef);
    const walletData = walletSnap.data() || {};
    const mainUsdt = Number(walletData.mainUsdt || 0);
    
    // Check deposit request status
    const depositRef = doc(this.db, 'depositRequests', this.depositRequestId);
    const depositSnap = await getDoc(depositRef);
    const depositData = depositSnap.data() || {};
    
    // Check transaction status
    const txQuery = query(
      collection(this.db, 'wallets', this.testUserId, 'transactions'),
      where('requestId', '==', this.depositRequestId)
    );
    const txSnap = await getDocs(txQuery);
    const transactionData = txSnap.empty ? null : txSnap.docs[0].data();
    
    this.log(`Wallet balance: ${mainUsdt} USDT`);
    this.log(`Deposit request status: ${depositData.status}`);
    this.log(`Transaction status: ${transactionData?.status || 'Not found'}`);
    
    if (mainUsdt === 150 && depositData.status === 'approved' && transactionData?.status === 'success') {
      this.log('✅ Deposit flow test PASSED', 'success');
      return true;
    } else {
      this.log('❌ Deposit flow test FAILED', 'error');
      return false;
    }
  }

  async testWithdrawalFlow() {
    this.log('🧪 Testing Withdrawal Flow...');
    
    // Step 1: Create withdrawal request
    this.log('Creating withdrawal request...');
    const withdrawalRequest = {
      userId: this.testUserId,
      amount: 25,
      method: 'usdt-bep20',
      walletType: 'main',
      status: 'pending',
      currency: 'USDT',
      fees: 0,
      notes: 'Test withdrawal for approval flow',
      createdAt: serverTimestamp()
    };

    const withdrawalRef = await addDoc(collection(this.db, 'withdrawalRequests'), withdrawalRequest);
    this.withdrawalRequestId = withdrawalRef.id;
    this.log(`Withdrawal request created with ID: ${this.withdrawalRequestId}`);

    // Step 2: Create corresponding transaction
    const transactionRef = await addDoc(collection(this.db, 'wallets', this.testUserId, 'transactions'), {
      type: 'withdraw',
      amount: 25,
      currency: 'USDT',
      status: 'pending',
      description: 'Withdrawal to BEP20 (Admin Verification Pending)',
      createdAt: serverTimestamp(),
      requestId: this.withdrawalRequestId
    });
    this.log(`Transaction created with ID: ${transactionRef.id}`);

    // Step 3: Simulate admin approval
    this.log('Simulating admin approval...');
    await this.simulateWithdrawalApproval();

    // Step 4: Verify results
    await this.verifyWithdrawalResults();
  }

  async simulateWithdrawalApproval() {
    // This simulates what happens in AdminTransactions2.tsx approveWithdrawal function
    const withdrawalRef = doc(this.db, 'withdrawalRequests', this.withdrawalRequestId);
    const walletRef = doc(this.db, 'wallets', this.testUserId);
    
    // Get current wallet data
    const walletSnap = await getDoc(walletRef);
    const walletData = walletSnap.data() || {};
    const currentBalance = Number(walletData.mainUsdt || 0);
    const newBalance = currentBalance - 25; // 25 USDT withdrawal
    
    // Update wallet with new balance (using direct field structure)
    await setDoc(walletRef, {
      ...walletData,
      mainUsdt: newBalance,
      walletUpdatedAt: serverTimestamp()
    }, { merge: true });
    
    // Update withdrawal request status
    await setDoc(withdrawalRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      reviewedBy: this.testAdminId,
      approvedBy: 'test-admin@example.com'
    }, { merge: true });

    // Update corresponding transaction
    const txQuery = query(
      collection(this.db, 'wallets', this.testUserId, 'transactions'),
      where('requestId', '==', this.withdrawalRequestId)
    );
    const txSnap = await getDocs(txQuery);
    if (!txSnap.empty) {
      const txDoc = txSnap.docs[0];
      await updateDoc(txDoc.ref, {
        status: 'success',
        description: 'Withdrawal to usdt-bep20 (Approved and Processed)',
        updatedAt: serverTimestamp()
      });
    }
    
    this.log(`Wallet updated: ${currentBalance} → ${newBalance} USDT`);
    this.log('Withdrawal request approved and transaction updated');
  }

  async verifyWithdrawalResults() {
    this.log('Verifying withdrawal results...');
    
    // Check wallet balance
    const walletRef = doc(this.db, 'wallets', this.testUserId);
    const walletSnap = await getDoc(walletRef);
    const walletData = walletSnap.data() || {};
    const mainUsdt = Number(walletData.mainUsdt || 0);
    
    // Check withdrawal request status
    const withdrawalRef = doc(this.db, 'withdrawalRequests', this.withdrawalRequestId);
    const withdrawalSnap = await getDoc(withdrawalRef);
    const withdrawalData = withdrawalSnap.data() || {};
    
    // Check transaction status
    const txQuery = query(
      collection(this.db, 'wallets', this.testUserId, 'transactions'),
      where('requestId', '==', this.withdrawalRequestId)
    );
    const txSnap = await getDocs(txQuery);
    const transactionData = txSnap.empty ? null : txSnap.docs[0].data();
    
    this.log(`Wallet balance: ${mainUsdt} USDT`);
    this.log(`Withdrawal request status: ${withdrawalData.status}`);
    this.log(`Transaction status: ${transactionData?.status || 'Not found'}`);
    
    if (mainUsdt === 125 && withdrawalData.status === 'approved' && transactionData?.status === 'success') {
      this.log('✅ Withdrawal flow test PASSED', 'success');
      return true;
    } else {
      this.log('❌ Withdrawal flow test FAILED', 'error');
      return false;
    }
  }

  async testWalletListener() {
    this.log('Testing wallet listener...');
    
    return new Promise((resolve) => {
      const walletRef = doc(this.db, 'wallets', this.testUserId);
      let updateCount = 0;
      
      const unsubscribe = onSnapshot(walletRef, (snap) => {
        updateCount++;
        const data = snap.data() || {};
        const mainUsdt = Number(data.mainUsdt || 0);
        const purchaseUsdt = Number(data.purchaseUsdt || 0);
        
        this.log(`Wallet listener update #${updateCount}: Main USDT: ${mainUsdt}, Purchase USDT: ${purchaseUsdt}`);
        
        if (updateCount >= 3) { // Initial + deposit + withdrawal
          unsubscribe();
          resolve(true);
        }
      }, (error) => {
        this.log(`Wallet listener error: ${error.message}`, 'error');
        unsubscribe();
        resolve(false);
      });
      
      // Timeout after 15 seconds
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, 15000);
    });
  }

  async runAllTests() {
    try {
      this.log('🚀 Starting comprehensive deposit and withdrawal flow tests...');
      
      // Setup
      await this.setupTestUser();
      
      // Test wallet listener
      this.log('Testing wallet listener...');
      const listenerPromise = this.testWalletListener();
      
      // Test deposit flow
      const depositSuccess = await this.testDepositFlow();
      
      // Test withdrawal flow
      const withdrawalSuccess = await this.testWithdrawalFlow();
      
      // Wait for listener to complete
      const listenerSuccess = await listenerPromise;
      
      // Final verification
      const walletRef = doc(this.db, 'wallets', this.testUserId);
      const walletSnap = await getDoc(walletRef);
      const walletData = walletSnap.data() || {};
      const finalBalance = Number(walletData.mainUsdt || 0);
      
      this.log(`Final wallet balance: ${finalBalance} USDT`);
      
      if (depositSuccess && withdrawalSuccess && listenerSuccess && finalBalance === 125) {
        this.log('🎉 ALL TESTS PASSED! Deposit and withdrawal flows are working correctly.', 'success');
      } else {
        this.log('❌ Some tests failed. Check the logs above.', 'error');
      }
      
    } catch (error) {
      this.log(`Test failed with error: ${error.message}`, 'error');
      console.error(error);
    }
  }
}

// Run the test
async function main() {
  const tester = new DepositWithdrawalFlowTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DepositWithdrawalFlowTester;
