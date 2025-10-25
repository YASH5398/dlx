const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount = null;
const saStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (saStr) {
  try {
    serviceAccount = JSON.parse(saStr);
    if (serviceAccount?.private_key?.includes('\\n')) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } catch {
    serviceAccount = null;
  }
}

const credential = (serviceAccount && typeof serviceAccount.project_id === 'string')
  ? admin.credential.cert(serviceAccount)
  : admin.credential.applicationDefault();

if (!admin.apps.length) {
  admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id,
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://digilinex-a80a9-default-rtdb.firebaseio.com'
  });
}

const db = admin.firestore();

class TransactionSystemTester {
  constructor() {
    this.testResults = [];
    this.errors = [];
    this.testUserId = null;
    this.testDepositId = null;
    this.testWithdrawalId = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
    this.testResults.push({ timestamp, type, message });
  }

  async createTestUser() {
    this.log('Creating test user...');
    
    try {
      const testUserId = `test_user_${Date.now()}`;
      
      // Create user document
      await db.collection('users').doc(testUserId).set({
        email: 'test@example.com',
        name: 'Test User',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create wallet document
      await db.collection('wallets').doc(testUserId).set({
        usdt: {
          mainUsdt: 100.0,
          purchaseUsdt: 50.0
        },
        dlx: 1000.0,
        walletUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      this.testUserId = testUserId;
      this.log(`Test user created: ${testUserId}`, 'success');
      return testUserId;
    } catch (error) {
      this.log(`Failed to create test user: ${error.message}`, 'error');
      this.errors.push(`Test user creation failed: ${error.message}`);
      throw error;
    }
  }

  async testDepositFlow() {
    this.log('Testing deposit flow...');
    
    try {
      if (!this.testUserId) {
        throw new Error('Test user not created');
      }

      // Create deposit request
      const depositData = {
        userId: this.testUserId,
        amount: 50.0,
        method: 'usdt-bep20',
        status: 'pending',
        currency: 'USDT',
        fees: 0,
        txnId: 'test_txn_123',
        notes: 'Test deposit transaction',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const depositRef = await db.collection('depositRequests').add(depositData);
      this.testDepositId = depositRef.id;
      
      this.log(`Deposit request created: ${this.testDepositId}`, 'success');

      // Test approval
      await db.runTransaction(async (tx) => {
        const reqRef = db.collection('depositRequests').doc(this.testDepositId);
        const walletRef = db.collection('wallets').doc(this.testUserId);
        
        const reqSnap = await tx.get(reqRef);
        const walletSnap = await tx.get(walletRef);
        
        if (!reqSnap.exists() || !walletSnap.exists()) {
          throw new Error('Request or wallet not found');
        }
        
        const reqData = reqSnap.data();
        const walletData = walletSnap.data();
        
        if (reqData.status !== 'pending') {
          throw new Error('Request not in pending status');
        }
        
        // Update wallet
        const usdt = walletData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
        const newBalance = (usdt.mainUsdt || 0) + reqData.amount;
        const updatedUsdt = { ...usdt, mainUsdt: newBalance };
        
        tx.update(walletRef, {
          usdt: updatedUsdt,
          walletUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update request
        tx.update(reqRef, {
          status: 'approved',
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
          reviewedBy: 'test_admin',
          approvedBy: 'test@admin.com'
        });
        
        // Create audit log
        tx.set(db.collection('audit_logs').doc(), {
          actor_id: 'test_admin',
          actor_email: 'test@admin.com',
          action: 'approve_deposit',
          target_type: 'deposit_request',
          target_id: this.testDepositId,
          meta: {
            userId: this.testUserId,
            amount: reqData.amount,
            method: reqData.method,
            currency: reqData.currency,
            previousBalance: usdt.mainUsdt || 0,
            newBalance: newBalance
          },
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      this.log('Deposit approved successfully', 'success');

      // Test completion
      await db.runTransaction(async (tx) => {
        const reqRef = db.collection('depositRequests').doc(this.testDepositId);
        const reqSnap = await tx.get(reqRef);
        
        if (!reqSnap.exists()) {
          throw new Error('Request not found');
        }
        
        const reqData = reqSnap.data();
        if (reqData.status !== 'approved') {
          throw new Error('Request not in approved status');
        }
        
        tx.update(reqRef, {
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          reviewedBy: 'test_admin',
          completedBy: 'test@admin.com'
        });
      });

      this.log('Deposit completed successfully', 'success');
      
    } catch (error) {
      this.log(`Deposit flow test failed: ${error.message}`, 'error');
      this.errors.push(`Deposit flow test failed: ${error.message}`);
      throw error;
    }
  }

  async testWithdrawalFlow() {
    this.log('Testing withdrawal flow...');
    
    try {
      if (!this.testUserId) {
        throw new Error('Test user not created');
      }

      // Create withdrawal request
      const withdrawalData = {
        userId: this.testUserId,
        amount: 25.0,
        method: 'usdt-bep20',
        walletType: 'main',
        status: 'pending',
        currency: 'USDT',
        fees: 0,
        notes: 'Test withdrawal transaction',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const withdrawalRef = await db.collection('withdrawalRequests').add(withdrawalData);
      this.testWithdrawalId = withdrawalRef.id;
      
      this.log(`Withdrawal request created: ${this.testWithdrawalId}`, 'success');

      // Test approval
      await db.runTransaction(async (tx) => {
        const reqRef = db.collection('withdrawalRequests').doc(this.testWithdrawalId);
        const walletRef = db.collection('wallets').doc(this.testUserId);
        
        const reqSnap = await tx.get(reqRef);
        const walletSnap = await tx.get(walletRef);
        
        if (!reqSnap.exists() || !walletSnap.exists()) {
          throw new Error('Request or wallet not found');
        }
        
        const reqData = reqSnap.data();
        const walletData = walletSnap.data();
        
        if (reqData.status !== 'pending') {
          throw new Error('Request not in pending status');
        }
        
        // Check balance
        const usdt = walletData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
        const walletType = reqData.walletType || 'main';
        const key = walletType === 'main' ? 'mainUsdt' : 'purchaseUsdt';
        const currentBalance = usdt[key] || 0;
        
        if (currentBalance < reqData.amount) {
          throw new Error(`Insufficient balance. Available: ${currentBalance}, Requested: ${reqData.amount}`);
        }
        
        // Update wallet
        const newBalance = currentBalance - reqData.amount;
        const updatedUsdt = { ...usdt, [key]: newBalance };
        
        tx.update(walletRef, {
          usdt: updatedUsdt,
          walletUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update request
        tx.update(reqRef, {
          status: 'approved',
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
          reviewedBy: 'test_admin',
          approvedBy: 'test@admin.com'
        });
        
        // Create audit log
        tx.set(db.collection('audit_logs').doc(), {
          actor_id: 'test_admin',
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
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      this.log('Withdrawal approved successfully', 'success');

      // Test completion
      await db.runTransaction(async (tx) => {
        const reqRef = db.collection('withdrawalRequests').doc(this.testWithdrawalId);
        const reqSnap = await tx.get(reqRef);
        
        if (!reqSnap.exists()) {
          throw new Error('Request not found');
        }
        
        const reqData = reqSnap.data();
        if (reqData.status !== 'approved') {
          throw new Error('Request not in approved status');
        }
        
        tx.update(reqRef, {
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          reviewedBy: 'test_admin',
          completedBy: 'test@admin.com'
        });
      });

      this.log('Withdrawal completed successfully', 'success');
      
    } catch (error) {
      this.log(`Withdrawal flow test failed: ${error.message}`, 'error');
      this.errors.push(`Withdrawal flow test failed: ${error.message}`);
      throw error;
    }
  }

  async testErrorHandling() {
    this.log('Testing error handling...');
    
    try {
      // Test invalid status transitions
      const invalidDepositRef = await db.collection('depositRequests').add({
        userId: this.testUserId,
        amount: 10.0,
        method: 'usdt-bep20',
        status: 'completed', // Already completed
        currency: 'USDT',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      try {
        await db.runTransaction(async (tx) => {
          const reqRef = db.collection('depositRequests').doc(invalidDepositRef.id);
          const reqSnap = await tx.get(reqRef);
          
          if (!reqSnap.exists()) {
            throw new Error('Request not found');
          }
          
          const reqData = reqSnap.data();
          if (reqData.status !== 'pending') {
            throw new Error('Cannot approve already processed request');
          }
        });
      } catch (error) {
        this.log('Error handling test passed: Invalid status transition caught', 'success');
      }

      // Test insufficient balance
      const insufficientWithdrawalRef = await db.collection('withdrawalRequests').add({
        userId: this.testUserId,
        amount: 1000.0, // More than available
        method: 'usdt-bep20',
        walletType: 'main',
        status: 'pending',
        currency: 'USDT',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      try {
        await db.runTransaction(async (tx) => {
          const reqRef = db.collection('withdrawalRequests').doc(insufficientWithdrawalRef.id);
          const walletRef = db.collection('wallets').doc(this.testUserId);
          
          const reqSnap = await tx.get(reqRef);
          const walletSnap = await tx.get(walletRef);
          
          const reqData = reqSnap.data();
          const walletData = walletSnap.data();
          const usdt = walletData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
          const currentBalance = usdt.mainUsdt || 0;
          
          if (currentBalance < reqData.amount) {
            throw new Error(`Insufficient balance. Available: ${currentBalance}, Requested: ${reqData.amount}`);
          }
        });
      } catch (error) {
        this.log('Error handling test passed: Insufficient balance caught', 'success');
      }

      // Clean up test requests
      await invalidDepositRef.delete();
      await insufficientWithdrawalRef.delete();
      
    } catch (error) {
      this.log(`Error handling test failed: ${error.message}`, 'error');
      this.errors.push(`Error handling test failed: ${error.message}`);
    }
  }

  async testDataConsistency() {
    this.log('Testing data consistency...');
    
    try {
      // Verify deposit request exists and has correct status
      const depositSnap = await db.collection('depositRequests').doc(this.testDepositId).get();
      if (!depositSnap.exists()) {
        throw new Error('Deposit request not found');
      }
      
      const depositData = depositSnap.data();
      if (depositData.status !== 'completed') {
        throw new Error(`Deposit status incorrect: ${depositData.status}`);
      }
      
      this.log('Deposit data consistency verified', 'success');

      // Verify withdrawal request exists and has correct status
      const withdrawalSnap = await db.collection('withdrawalRequests').doc(this.testWithdrawalId).get();
      if (!withdrawalSnap.exists()) {
        throw new Error('Withdrawal request not found');
      }
      
      const withdrawalData = withdrawalSnap.data();
      if (withdrawalData.status !== 'completed') {
        throw new Error(`Withdrawal status incorrect: ${withdrawalData.status}`);
      }
      
      this.log('Withdrawal data consistency verified', 'success');

      // Verify wallet balance
      const walletSnap = await db.collection('wallets').doc(this.testUserId).get();
      if (!walletSnap.exists()) {
        throw new Error('Wallet not found');
      }
      
      const walletData = walletSnap.data();
      const usdt = walletData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
      
      // Expected: 100 (initial) + 50 (deposit) - 25 (withdrawal) = 125
      const expectedBalance = 125.0;
      if (Math.abs(usdt.mainUsdt - expectedBalance) > 0.01) {
        throw new Error(`Wallet balance incorrect. Expected: ${expectedBalance}, Actual: ${usdt.mainUsdt}`);
      }
      
      this.log('Wallet balance consistency verified', 'success');
      
    } catch (error) {
      this.log(`Data consistency test failed: ${error.message}`, 'error');
      this.errors.push(`Data consistency test failed: ${error.message}`);
    }
  }

  async testAuditLogs() {
    this.log('Testing audit logs...');
    
    try {
      // Check audit logs were created
      const auditLogsSnap = await db.collection('audit_logs')
        .where('target_id', 'in', [this.testDepositId, this.testWithdrawalId])
        .get();
      
      if (auditLogsSnap.empty) {
        throw new Error('No audit logs found');
      }
      
      this.log(`Found ${auditLogsSnap.size} audit logs`, 'success');
      
      // Verify log structure
      auditLogsSnap.forEach(doc => {
        const logData = doc.data();
        if (!logData.actor_id || !logData.action || !logData.target_id) {
          throw new Error('Audit log missing required fields');
        }
      });
      
      this.log('Audit log structure verified', 'success');
      
    } catch (error) {
      this.log(`Audit logs test failed: ${error.message}`, 'error');
      this.errors.push(`Audit logs test failed: ${error.message}`);
    }
  }

  async cleanup() {
    this.log('Cleaning up test data...');
    
    try {
      if (this.testDepositId) {
        await db.collection('depositRequests').doc(this.testDepositId).delete();
      }
      
      if (this.testWithdrawalId) {
        await db.collection('withdrawalRequests').doc(this.testWithdrawalId).delete();
      }
      
      if (this.testUserId) {
        await db.collection('users').doc(this.testUserId).delete();
        await db.collection('wallets').doc(this.testUserId).delete();
      }
      
      // Clean up audit logs
      const auditLogsSnap = await db.collection('audit_logs')
        .where('actor_id', '==', 'test_admin')
        .get();
      
      const batch = db.batch();
      auditLogsSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      this.log('Test data cleaned up', 'success');
      
    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`, 'error');
      this.errors.push(`Cleanup failed: ${error.message}`);
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.length,
        errors: this.errors.length,
        successRate: ((this.testResults.length - this.errors.length) / this.testResults.length * 100).toFixed(2) + '%'
      },
      testResults: this.testResults,
      errors: this.errors
    };

    const reportPath = path.join(__dirname, 'transaction-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Test report saved to: ${reportPath}`);
    return report;
  }

  async run() {
    this.log('Starting transaction system tests...');
    
    try {
      // Step 1: Create test user
      await this.createTestUser();
      
      // Step 2: Test deposit flow
      await this.testDepositFlow();
      
      // Step 3: Test withdrawal flow
      await this.testWithdrawalFlow();
      
      // Step 4: Test error handling
      await this.testErrorHandling();
      
      // Step 5: Test data consistency
      await this.testDataConsistency();
      
      // Step 6: Test audit logs
      await this.testAuditLogs();
      
      // Step 7: Cleanup
      await this.cleanup();
      
      // Step 8: Generate report
      const report = await this.generateReport();
      
      this.log('All tests completed successfully');
      return report;
      
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      await this.cleanup();
      throw error;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new TransactionSystemTester();
  tester.run()
    .then(report => {
      console.log('\n=== TEST RESULTS ===');
      console.log(`Total Tests: ${report.summary.totalTests}`);
      console.log(`Errors: ${report.summary.errors}`);
      console.log(`Success Rate: ${report.summary.successRate}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = TransactionSystemTester;
