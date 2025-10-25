const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, doc, getDoc, updateDoc, runTransaction, serverTimestamp } = require('firebase/firestore');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'dlx-ai'
  });
}

const db = admin.firestore();

class DepositWithdrawalSystemTester {
  constructor() {
    this.testResults = [];
    this.testUserId = null;
    this.testDepositId = null;
    this.testWithdrawalId = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    this.testResults.push({ timestamp, type, message });
  }

  async setupTestUser() {
    try {
      this.log('Setting up test user...');
      
      // Create test user
      const testUser = await admin.auth().createUser({
        email: `test-${Date.now()}@example.com`,
        password: 'testpassword123',
        displayName: 'Test User'
      });
      
      this.testUserId = testUser.uid;
      
      // Create wallet for test user
      await db.collection('wallets').doc(this.testUserId).set({
        mainUsdt: 100.0,
        purchaseUsdt: 50.0,
        mainInr: 1000.0,
        purchaseInr: 500.0,
        dlx: 1000.0,
        walletUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      this.log(`Test user created: ${this.testUserId}`);
      return true;
    } catch (error) {
      this.log(`Failed to setup test user: ${error.message}`, 'error');
      return false;
    }
  }

  async testDepositRequestCreation() {
    try {
      this.log('Testing deposit request creation...');
      
      const { createDepositRequest } = await import('../src/utils/transactionAPI.ts');
      
      const result = await createDepositRequest({
        userId: this.testUserId,
        amount: 50.0,
        method: 'usdt-bep20',
        currency: 'USDT',
        fees: 0,
        txnId: 'test-tx-hash-123',
        notes: 'Test deposit via BEP20'
      });
      
      this.testDepositId = result.requestId;
      this.log(`Deposit request created: ${result.requestId}`);
      
      // Verify request was created
      const requestDoc = await db.collection('depositRequests').doc(result.requestId).get();
      if (!requestDoc.exists) {
        throw new Error('Deposit request not found in database');
      }
      
      // Verify transaction was created
      const transactionDoc = await db.collection('wallets').doc(this.testUserId)
        .collection('transactions').doc(result.transactionId).get();
      if (!transactionDoc.exists) {
        throw new Error('Transaction not found in database');
      }
      
      // Verify linking
      const requestData = requestDoc.data();
      const transactionData = transactionDoc.data();
      
      if (requestData.transactionId !== result.transactionId) {
        throw new Error('Request not linked to transaction');
      }
      
      if (transactionData.requestId !== result.requestId) {
        throw new Error('Transaction not linked to request');
      }
      
      this.log('✅ Deposit request creation test passed');
      return true;
    } catch (error) {
      this.log(`❌ Deposit request creation test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testWithdrawalRequestCreation() {
    try {
      this.log('Testing withdrawal request creation...');
      
      const { createWithdrawalRequest } = await import('../src/utils/transactionAPI.ts');
      
      const result = await createWithdrawalRequest({
        userId: this.testUserId,
        amount: 25.0,
        method: 'usdt-bep20',
        walletType: 'main',
        currency: 'USDT',
        fees: 0,
        notes: 'Test withdrawal to BEP20'
      });
      
      this.testWithdrawalId = result.requestId;
      this.log(`Withdrawal request created: ${result.requestId}`);
      
      // Verify request was created
      const requestDoc = await db.collection('withdrawalRequests').doc(result.requestId).get();
      if (!requestDoc.exists) {
        throw new Error('Withdrawal request not found in database');
      }
      
      // Verify transaction was created
      const transactionDoc = await db.collection('wallets').doc(this.testUserId)
        .collection('transactions').doc(result.transactionId).get();
      if (!transactionDoc.exists) {
        throw new Error('Transaction not found in database');
      }
      
      // Verify linking
      const requestData = requestDoc.data();
      const transactionData = transactionDoc.data();
      
      if (requestData.transactionId !== result.transactionId) {
        throw new Error('Request not linked to transaction');
      }
      
      if (transactionData.requestId !== result.requestId) {
        throw new Error('Transaction not linked to request');
      }
      
      this.log('✅ Withdrawal request creation test passed');
      return true;
    } catch (error) {
      this.log(`❌ Withdrawal request creation test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testDepositApproval() {
    try {
      this.log('Testing deposit approval...');
      
      if (!this.testDepositId) {
        throw new Error('No test deposit ID available');
      }
      
      const { approveDeposit } = await import('../src/utils/transactionAPI.ts');
      
      // Get initial wallet balance
      const walletBefore = await db.collection('wallets').doc(this.testUserId).get();
      const balanceBefore = walletBefore.data().mainUsdt;
      
      // Approve deposit
      await approveDeposit(this.testDepositId, 'test-admin', 'admin@example.com');
      
      // Verify wallet balance increased
      const walletAfter = await db.collection('wallets').doc(this.testUserId).get();
      const balanceAfter = walletAfter.data().mainUsdt;
      
      if (balanceAfter !== balanceBefore + 50.0) {
        throw new Error(`Wallet balance not updated correctly. Before: ${balanceBefore}, After: ${balanceAfter}`);
      }
      
      // Verify request status updated
      const requestDoc = await db.collection('depositRequests').doc(this.testDepositId).get();
      const requestData = requestDoc.data();
      
      if (requestData.status !== 'approved') {
        throw new Error(`Request status not updated. Current: ${requestData.status}`);
      }
      
      // Verify transaction status updated
      const transactionDoc = await db.collection('wallets').doc(this.testUserId)
        .collection('transactions').doc(requestData.transactionId).get();
      const transactionData = transactionDoc.data();
      
      if (transactionData.status !== 'success') {
        throw new Error(`Transaction status not updated. Current: ${transactionData.status}`);
      }
      
      this.log('✅ Deposit approval test passed');
      return true;
    } catch (error) {
      this.log(`❌ Deposit approval test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testWithdrawalApproval() {
    try {
      this.log('Testing withdrawal approval...');
      
      if (!this.testWithdrawalId) {
        throw new Error('No test withdrawal ID available');
      }
      
      const { approveWithdrawal } = await import('../src/utils/transactionAPI.ts');
      
      // Get initial wallet balance
      const walletBefore = await db.collection('wallets').doc(this.testUserId).get();
      const balanceBefore = walletBefore.data().mainUsdt;
      
      // Approve withdrawal
      await approveWithdrawal(this.testWithdrawalId, 'test-admin', 'admin@example.com');
      
      // Verify wallet balance decreased
      const walletAfter = await db.collection('wallets').doc(this.testUserId).get();
      const balanceAfter = walletAfter.data().mainUsdt;
      
      if (balanceAfter !== balanceBefore - 25.0) {
        throw new Error(`Wallet balance not updated correctly. Before: ${balanceBefore}, After: ${balanceAfter}`);
      }
      
      // Verify request status updated
      const requestDoc = await db.collection('withdrawalRequests').doc(this.testWithdrawalId).get();
      const requestData = requestDoc.data();
      
      if (requestData.status !== 'approved') {
        throw new Error(`Request status not updated. Current: ${requestData.status}`);
      }
      
      // Verify transaction status updated
      const transactionDoc = await db.collection('wallets').doc(this.testUserId)
        .collection('transactions').doc(requestData.transactionId).get();
      const transactionData = transactionDoc.data();
      
      if (transactionData.status !== 'success') {
        throw new Error(`Transaction status not updated. Current: ${transactionData.status}`);
      }
      
      this.log('✅ Withdrawal approval test passed');
      return true;
    } catch (error) {
      this.log(`❌ Withdrawal approval test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testInsufficientBalanceWithdrawal() {
    try {
      this.log('Testing insufficient balance withdrawal...');
      
      const { createWithdrawalRequest, approveWithdrawal } = await import('../src/utils/transactionAPI.ts');
      
      // Create withdrawal request for more than available balance
      const result = await createWithdrawalRequest({
        userId: this.testUserId,
        amount: 1000.0, // More than available
        method: 'usdt-bep20',
        walletType: 'main',
        currency: 'USDT',
        fees: 0,
        notes: 'Test insufficient balance withdrawal'
      });
      
      // Try to approve - should fail
      try {
        await approveWithdrawal(result.requestId, 'test-admin', 'admin@example.com');
        throw new Error('Withdrawal should have failed due to insufficient balance');
      } catch (error) {
        if (error.message.includes('Insufficient balance')) {
          this.log('✅ Insufficient balance test passed - withdrawal correctly rejected');
          return true;
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.log(`❌ Insufficient balance test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testIdempotency() {
    try {
      this.log('Testing idempotency - duplicate approval...');
      
      if (!this.testDepositId) {
        throw new Error('No test deposit ID available');
      }
      
      const { approveDeposit } = await import('../src/utils/transactionAPI.ts');
      
      // Try to approve the same deposit again - should fail
      try {
        await approveDeposit(this.testDepositId, 'test-admin', 'admin@example.com');
        throw new Error('Duplicate approval should have failed');
      } catch (error) {
        if (error.message.includes('already been approved') || error.message.includes('already processed')) {
          this.log('✅ Idempotency test passed - duplicate approval correctly rejected');
          return true;
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.log(`❌ Idempotency test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async cleanup() {
    try {
      this.log('Cleaning up test data...');
      
      if (this.testUserId) {
        // Delete test user
        await admin.auth().deleteUser(this.testUserId);
        
        // Delete wallet
        await db.collection('wallets').doc(this.testUserId).delete();
        
        // Delete transactions
        const transactionsSnapshot = await db.collection('wallets').doc(this.testUserId)
          .collection('transactions').get();
        
        for (const doc of transactionsSnapshot.docs) {
          await doc.ref.delete();
        }
      }
      
      if (this.testDepositId) {
        await db.collection('depositRequests').doc(this.testDepositId).delete();
      }
      
      if (this.testWithdrawalId) {
        await db.collection('withdrawalRequests').doc(this.testWithdrawalId).delete();
      }
      
      // Clean up audit logs
      const auditLogsSnapshot = await db.collection('audit_logs')
        .where('actor_id', '==', 'test-admin')
        .get();
      
      for (const doc of auditLogsSnapshot.docs) {
        await doc.ref.delete();
      }
      
      this.log('✅ Cleanup completed');
    } catch (error) {
      this.log(`⚠️ Cleanup failed: ${error.message}`, 'warn');
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Deposit & Withdrawal System Tests');
    this.log('=' .repeat(60));
    
    const tests = [
      { name: 'Setup Test User', fn: () => this.setupTestUser() },
      { name: 'Deposit Request Creation', fn: () => this.testDepositRequestCreation() },
      { name: 'Withdrawal Request Creation', fn: () => this.testWithdrawalRequestCreation() },
      { name: 'Deposit Approval', fn: () => this.testDepositApproval() },
      { name: 'Withdrawal Approval', fn: () => this.testWithdrawalApproval() },
      { name: 'Insufficient Balance Test', fn: () => this.testInsufficientBalanceWithdrawal() },
      { name: 'Idempotency Test', fn: () => this.testIdempotency() }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        const result = await test.fn();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        this.log(`❌ ${test.name} failed with error: ${error.message}`, 'error');
        failed++;
      }
    }
    
    this.log('=' .repeat(60));
    this.log(`🎯 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      this.log('🎉 All tests passed! System is working correctly.');
    } else {
      this.log('⚠️ Some tests failed. Please review the issues above.');
    }
    
    await this.cleanup();
    
    return { passed, failed, results: this.testResults };
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new DepositWithdrawalSystemTester();
  tester.runAllTests()
    .then(results => {
      console.log('\n📊 Final Results:', results);
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = DepositWithdrawalSystemTester;
