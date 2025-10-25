const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, onSnapshot } = require('firebase/firestore');
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

class DepositApprovalTester {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);
    this.testUserId = 'test-user-' + Date.now();
    this.testAdminId = 'test-admin-' + Date.now();
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
      mainUsdt: 0,
      purchaseUsdt: 0,
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

  async createTestDeposit() {
    this.log('Creating test deposit request...');
    
    const depositRequest = {
      userId: this.testUserId,
      amount: 100,
      method: 'usdt-bep20',
      status: 'pending',
      currency: 'USDT',
      fees: 0,
      txnId: 'test-tx-' + Date.now(),
      notes: 'Test deposit for approval flow',
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(this.db, 'depositRequests'), depositRequest);
    this.log(`Test deposit created with ID: ${docRef.id}`);
    return docRef.id;
  }

  async simulateAdminApproval(depositId) {
    this.log('Simulating admin approval...');
    
    // This simulates what happens in AdminTransactions3.tsx approveDeposit function
    const depositRef = doc(this.db, 'depositRequests', depositId);
    const walletRef = doc(this.db, 'wallets', this.testUserId);
    
    // Get current wallet data
    const walletSnap = await getDoc(walletRef);
    const walletData = walletSnap.data() || {};
    const currentBalance = Number(walletData.mainUsdt || 0);
    const newBalance = currentBalance + 100; // 100 USDT deposit
    
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
    
    this.log(`Wallet updated: ${currentBalance} → ${newBalance} USDT`);
    this.log('Deposit request approved');
  }

  async verifyWalletUpdate() {
    this.log('Verifying wallet update...');
    
    const walletRef = doc(this.db, 'wallets', this.testUserId);
    const walletSnap = await getDoc(walletRef);
    const walletData = walletSnap.data() || {};
    
    const mainUsdt = Number(walletData.mainUsdt || 0);
    const purchaseUsdt = Number(walletData.purchaseUsdt || 0);
    
    this.log(`Current wallet balance: Main USDT: ${mainUsdt}, Purchase USDT: ${purchaseUsdt}`);
    
    if (mainUsdt === 100) {
      this.log('✅ Wallet balance correctly updated to 100 USDT', 'success');
      return true;
    } else {
      this.log(`❌ Expected 100 USDT, got ${mainUsdt}`, 'error');
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
        
        if (updateCount >= 2) { // Initial + update
          unsubscribe();
          resolve(true);
        }
      }, (error) => {
        this.log(`Wallet listener error: ${error.message}`, 'error');
        unsubscribe();
        resolve(false);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, 10000);
    });
  }

  async runTest() {
    try {
      this.log('🚀 Starting deposit approval flow test...');
      
      // Setup
      await this.setupTestUser();
      
      // Test wallet listener
      this.log('Testing wallet listener...');
      const listenerPromise = this.testWalletListener();
      
      // Create deposit
      const depositId = await this.createTestDeposit();
      
      // Simulate admin approval
      await this.simulateAdminApproval(depositId);
      
      // Wait for listener to complete
      const listenerSuccess = await listenerPromise;
      
      // Verify final state
      const walletSuccess = await this.verifyWalletUpdate();
      
      if (listenerSuccess && walletSuccess) {
        this.log('🎉 All tests passed! Deposit approval flow is working correctly.', 'success');
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
  const tester = new DepositApprovalTester();
  await tester.runTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DepositApprovalTester;
