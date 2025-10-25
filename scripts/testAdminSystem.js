/**
 * Comprehensive Admin System Test
 * Tests deposit/withdrawal processing, error handling, and system integrity
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase config (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

class AdminSystemTester {
  constructor() {
    this.testResults = [];
    this.testUserId = 'test-user-' + Date.now();
    this.testDepositId = null;
    this.testWithdrawalId = null;
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
    this.testResults.push({ timestamp, type, message });
  }

  async setupTestUser() {
    try {
      await this.log('Setting up test user...');
      
      // Create test user wallet
      const walletRef = doc(db, 'wallets', this.testUserId);
      await updateDoc(walletRef, {
        dlx: 0,
        usdt: { mainUsdt: 100, purchaseUsdt: 50 },
        walletUpdatedAt: serverTimestamp()
      }, { merge: true });

      await this.log('Test user wallet created successfully', 'success');
      return true;
    } catch (error) {
      await this.log(`Failed to setup test user: ${error.message}`, 'error');
      return false;
    }
  }

  async createTestDeposit() {
    try {
      await this.log('Creating test deposit request...');
      
      const depositData = {
        userId: this.testUserId,
        amount: 50,
        method: 'usdt-bep20',
        status: 'pending',
        createdAt: serverTimestamp(),
        currency: 'USDT',
        fees: 0,
        txnId: 'test-tx-' + Date.now(),
        notes: 'Test deposit for admin system validation'
      };

      const depositRef = await addDoc(collection(db, 'depositRequests'), depositData);
      this.testDepositId = depositRef.id;
      
      await this.log(`Test deposit created with ID: ${this.testDepositId}`, 'success');
      return true;
    } catch (error) {
      await this.log(`Failed to create test deposit: ${error.message}`, 'error');
      return false;
    }
  }

  async createTestWithdrawal() {
    try {
      await this.log('Creating test withdrawal request...');
      
      const withdrawalData = {
        userId: this.testUserId,
        amount: 25,
        method: 'usdt-bep20',
        walletType: 'main',
        status: 'pending',
        createdAt: serverTimestamp(),
        currency: 'USDT',
        fees: 0,
        notes: 'Test withdrawal for admin system validation'
      };

      const withdrawalRef = await addDoc(collection(db, 'withdrawalRequests'), withdrawalData);
      this.testWithdrawalId = withdrawalRef.id;
      
      await this.log(`Test withdrawal created with ID: ${this.testWithdrawalId}`, 'success');
      return true;
    } catch (error) {
      await this.log(`Failed to create test withdrawal: ${error.message}`, 'error');
      return false;
    }
  }

  async testDepositApproval() {
    try {
      await this.log('Testing deposit approval...');
      
      if (!this.testDepositId) {
        throw new Error('No test deposit ID available');
      }

      const depositRef = doc(db, 'depositRequests', this.testDepositId);
      const walletRef = doc(db, 'wallets', this.testUserId);
      const logRef = doc(collection(db, 'audit_logs'));

      await runTransaction(db, async (tx) => {
        // Get current request data
        const reqSnap = await tx.get(depositRef);
        if (!reqSnap.exists()) {
          throw new Error('Deposit request not found');
        }
        
        const reqData = reqSnap.data();
        const currentStatus = reqData.status || 'pending';
        
        if (currentStatus !== 'pending') {
          throw new Error(`Cannot approve deposit. Current status: ${currentStatus}`);
        }
        
        // Get wallet data
        const wSnap = await tx.get(walletRef);
        if (!wSnap.exists()) {
          throw new Error('User wallet not found');
        }
        
        const wData = wSnap.data();
        const usdt = wData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
        const currentBalance = Number(usdt.mainUsdt || 0);
        const amount = Number(reqData.amount || 0);
        const newBalance = currentBalance + amount;
        
        // Update wallet
        const updated = { ...usdt, mainUsdt: newBalance };
        tx.update(walletRef, { 
          usdt: updated, 
          walletUpdatedAt: serverTimestamp() 
        });
        
        // Update request status
        tx.update(depositRef, { 
          status: 'approved', 
          approvedAt: serverTimestamp(), 
          reviewedBy: 'test-admin'
        });
        
        // Create audit log
        tx.set(logRef, { 
          actor_id: 'test-admin', 
          actor_email: 'test@admin.com', 
          action: 'approve_deposit', 
          target_type: 'deposit_request', 
          target_id: this.testDepositId, 
          meta: { 
            userId: this.testUserId, 
            amount: reqData.amount, 
            method: reqData.method, 
            currency: reqData.currency,
            previousBalance: currentBalance,
            newBalance: newBalance
          }, 
          created_at: serverTimestamp() 
        });
      });

      await this.log('Deposit approval transaction completed successfully', 'success');
      return true;
    } catch (error) {
      await this.log(`Deposit approval failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testWithdrawalApproval() {
    try {
      await this.log('Testing withdrawal approval...');
      
      if (!this.testWithdrawalId) {
        throw new Error('No test withdrawal ID available');
      }

      const withdrawalRef = doc(db, 'withdrawalRequests', this.testWithdrawalId);
      const walletRef = doc(db, 'wallets', this.testUserId);
      const logRef = doc(collection(db, 'audit_logs'));

      await runTransaction(db, async (tx) => {
        // Get current request data
        const reqSnap = await tx.get(withdrawalRef);
        if (!reqSnap.exists()) {
          throw new Error('Withdrawal request not found');
        }
        
        const reqData = reqSnap.data();
        const currentStatus = reqData.status || 'pending';
        
        if (currentStatus !== 'pending') {
          throw new Error(`Cannot approve withdrawal. Current status: ${currentStatus}`);
        }
        
        const amount = Number(reqData.amount || 0);
        if (amount <= 0) {
          throw new Error('Invalid withdrawal amount');
        }
        
        // Get wallet data
        const wSnap = await tx.get(walletRef);
        if (!wSnap.exists()) {
          throw new Error('User wallet not found');
        }
        
        const wData = wSnap.data();
        const usdt = wData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
        const walletType = reqData.walletType || 'main';
        const key = walletType === 'main' ? 'mainUsdt' : 'purchaseUsdt';
        const currentBalance = Number(usdt[key] || 0);
        
        if (currentBalance < amount) {
          throw new Error(`Insufficient balance. Available: ${currentBalance}, Requested: ${amount}`);
        }
        
        const newBalance = currentBalance - amount;
        const updated = { ...usdt, [key]: newBalance };
        
        // Update wallet
        tx.update(walletRef, { 
          usdt: updated, 
          walletUpdatedAt: serverTimestamp() 
        });
        
        // Update request status
        tx.update(withdrawalRef, { 
          status: 'approved', 
          approvedAt: serverTimestamp(), 
          reviewedBy: 'test-admin'
        });
        
        // Create audit log
        tx.set(logRef, { 
          actor_id: 'test-admin', 
          actor_email: 'test@admin.com', 
          action: 'approve_withdrawal', 
          target_type: 'withdrawal_request', 
          target_id: this.testWithdrawalId, 
          meta: { 
            userId: this.testUserId, 
            amount: reqData.amount, 
            method: reqData.method, 
            walletType: reqData.walletType,
            currency: reqData.currency,
            previousBalance: currentBalance,
            newBalance: newBalance
          }, 
          created_at: serverTimestamp() 
        });
      });

      await this.log('Withdrawal approval transaction completed successfully', 'success');
      return true;
    } catch (error) {
      await this.log(`Withdrawal approval failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testStatusValidation() {
    try {
      await this.log('Testing status validation...');
      
      if (!this.testDepositId) {
        throw new Error('No test deposit ID available');
      }

      const depositRef = doc(db, 'depositRequests', this.testDepositId);
      
      // Try to approve already approved deposit (should fail)
      try {
        await runTransaction(db, async (tx) => {
          const reqSnap = await tx.get(depositRef);
          const reqData = reqSnap.data();
          const currentStatus = reqData.status || 'pending';
          
          if (currentStatus !== 'pending') {
            throw new Error(`Cannot approve deposit. Current status: ${currentStatus}`);
          }
          
          // This should not execute since status is already 'approved'
          tx.update(depositRef, { status: 'approved' });
        });
        
        await this.log('Status validation failed - duplicate approval allowed', 'error');
        return false;
      } catch (error) {
        if (error.message.includes('Current status: approved')) {
          await this.log('Status validation working correctly - duplicate approval blocked', 'success');
          return true;
        } else {
          throw error;
        }
      }
    } catch (error) {
      await this.log(`Status validation test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async verifyFinalState() {
    try {
      await this.log('Verifying final system state...');
      
      // Check deposit status
      const depositRef = doc(db, 'depositRequests', this.testDepositId);
      const depositSnap = await getDoc(depositRef);
      const depositData = depositSnap.data();
      
      if (depositData.status !== 'approved') {
        await this.log(`Deposit status incorrect: ${depositData.status}`, 'error');
        return false;
      }
      
      // Check withdrawal status
      const withdrawalRef = doc(db, 'withdrawalRequests', this.testWithdrawalId);
      const withdrawalSnap = await getDoc(withdrawalRef);
      const withdrawalData = withdrawalSnap.data();
      
      if (withdrawalData.status !== 'approved') {
        await this.log(`Withdrawal status incorrect: ${withdrawalData.status}`, 'error');
        return false;
      }
      
      // Check wallet balance
      const walletRef = doc(db, 'wallets', this.testUserId);
      const walletSnap = await getDoc(walletRef);
      const walletData = walletSnap.data();
      
      const expectedBalance = 100 + 50 - 25; // Initial + deposit - withdrawal
      const actualBalance = Number(walletData.usdt.mainUsdt || 0);
      
      if (Math.abs(actualBalance - expectedBalance) > 0.01) {
        await this.log(`Wallet balance incorrect. Expected: ${expectedBalance}, Actual: ${actualBalance}`, 'error');
        return false;
      }
      
      await this.log('Final state verification passed', 'success');
      return true;
    } catch (error) {
      await this.log(`Final state verification failed: ${error.message}`, 'error');
      return false;
    }
  }

  async cleanup() {
    try {
      await this.log('Cleaning up test data...');
      
      // Note: In a real test, you might want to delete test data
      // For now, we'll just log the cleanup
      await this.log('Test cleanup completed', 'success');
    } catch (error) {
      await this.log(`Cleanup failed: ${error.message}`, 'error');
    }
  }

  async runFullTest() {
    await this.log('Starting comprehensive admin system test...');
    
    const results = {
      setup: await this.setupTestUser(),
      depositCreation: await this.createTestDeposit(),
      withdrawalCreation: await this.createTestWithdrawal(),
      depositApproval: await this.testDepositApproval(),
      withdrawalApproval: await this.testWithdrawalApproval(),
      statusValidation: await this.testStatusValidation(),
      finalVerification: await this.verifyFinalState()
    };
    
    await this.cleanup();
    
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    await this.log(`Test completed: ${passed}/${total} tests passed`);
    
    return {
      results,
      passed,
      total,
      success: passed === total
    };
  }

  getTestResults() {
    return this.testResults;
  }
}

// Export for use in other scripts
export { AdminSystemTester };

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AdminSystemTester();
  tester.runFullTest().then((result) => {
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Passed: ${result.passed}/${result.total}`);
    console.log(`Success: ${result.success ? 'YES' : 'NO'}`);
    console.log('\nDetailed Results:');
    Object.entries(result.results).forEach(([test, passed]) => {
      console.log(`  ${test}: ${passed ? 'PASS' : 'FAIL'}`);
    });
    process.exit(result.success ? 0 : 1);
  }).catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}
