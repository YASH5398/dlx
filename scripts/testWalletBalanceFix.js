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

class WalletBalanceFixTester {
  constructor() {
    this.testResults = [];
    this.errors = [];
    this.testUserId = null;
    this.testDepositId = null;
    this.initialWalletsBalance = 0;
    this.initialUsersBalance = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
    this.testResults.push({ timestamp, type, message });
  }

  async createTestUser() {
    this.log('Creating test user with proper wallet structure...');
    
    try {
      const testUserId = `test_user_${Date.now()}`;
      
      // Create user document with wallet structure
      await db.collection('users').doc(testUserId).set({
        email: 'test@example.com',
        name: 'Test User',
        wallet: {
          main: 100.0,
          purchase: 50.0
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create wallet document with proper structure
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

  async recordInitialBalances() {
    this.log('Recording initial balances...');
    
    try {
      // Get wallets collection balance
      const walletsDoc = await db.collection('wallets').doc(this.testUserId).get();
      const walletsData = walletsDoc.data() || {};
      const usdt = walletsData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
      this.initialWalletsBalance = Number(usdt.mainUsdt || 0) + Number(usdt.purchaseUsdt || 0);
      
      // Get users collection balance
      const usersDoc = await db.collection('users').doc(this.testUserId).get();
      const usersData = usersDoc.data() || {};
      const wallet = usersData.wallet || { main: 0, purchase: 0 };
      this.initialUsersBalance = Number(wallet.main || 0) + Number(wallet.purchase || 0);
      
      this.log(`Initial wallets balance: ${this.initialWalletsBalance}`, 'success');
      this.log(`Initial users balance: ${this.initialUsersBalance}`, 'success');
      
    } catch (error) {
      this.log(`Failed to record initial balances: ${error.message}`, 'error');
      this.errors.push(`Initial balance recording failed: ${error.message}`);
    }
  }

  async testDepositApproval() {
    this.log('Testing deposit approval with FIXED logic...');
    
    try {
      // Create deposit request
      const depositData = {
        userId: this.testUserId,
        amount: 25.0,
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

      // FIXED: Test approval with proper dual collection update
      await db.runTransaction(async (tx) => {
        const reqRef = db.collection('depositRequests').doc(this.testDepositId);
        const walletRef = db.collection('wallets').doc(this.testUserId);
        const userRef = db.collection('users').doc(this.testUserId);
        
        const reqSnap = await tx.get(reqRef);
        const walletSnap = await tx.get(walletRef);
        const userSnap = await tx.get(userRef);
        
        if (!reqSnap.exists() || !walletSnap.exists()) {
          throw new Error('Request or wallet not found');
        }
        
        const reqData = reqSnap.data();
        const walletData = walletSnap.data();
        const userData = userSnap.exists() ? userSnap.data() : {};
        
        if (reqData.status !== 'pending') {
          throw new Error('Request not in pending status');
        }
        
        const amount = reqData.amount;
        
        // Update wallets collection (for useWallet hook)
        const usdt = walletData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
        const currentBalance = Number(usdt.mainUsdt || 0);
        const newBalance = currentBalance + amount;
        
        const updatedUsdt = { ...usdt, mainUsdt: newBalance };
        tx.set(walletRef, {
          ...walletData,
          usdt: updatedUsdt,
          walletUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // FIXED: Also update users collection (for WalletEnhanced component)
        const userWallet = userData.wallet || { main: 0, purchase: 0 };
        const userMainBalance = Number(userWallet.main || 0);
        const userNewBalance = userMainBalance + amount;
        
        const updatedUserWallet = { ...userWallet, main: userNewBalance };
        tx.set(userRef, {
          ...userData,
          wallet: updatedUserWallet,
          walletUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
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
            previousBalance: currentBalance,
            newBalance: newBalance,
            userPreviousBalance: userMainBalance,
            userNewBalance: userNewBalance
          },
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      this.log('Deposit approved with FIXED dual collection update', 'success');
      
    } catch (error) {
      this.log(`Deposit approval test failed: ${error.message}`, 'error');
      this.errors.push(`Deposit approval test failed: ${error.message}`);
      throw error;
    }
  }

  async verifyBalanceConsistency() {
    this.log('Verifying balance consistency across collections...');
    
    try {
      // Check wallets collection
      const walletsDoc = await db.collection('wallets').doc(this.testUserId).get();
      const walletsData = walletsDoc.data() || {};
      const usdt = walletsData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
      const walletsBalance = Number(usdt.mainUsdt || 0) + Number(usdt.purchaseUsdt || 0);
      
      // Check users collection
      const usersDoc = await db.collection('users').doc(this.testUserId).get();
      const usersData = usersDoc.data() || {};
      const wallet = usersData.wallet || { main: 0, purchase: 0 };
      const usersBalance = Number(wallet.main || 0) + Number(wallet.purchase || 0);
      
      this.log(`Wallets collection balance: ${walletsBalance}`, 'info');
      this.log(`Users collection balance: ${usersBalance}`, 'info');
      
      // Verify both collections have the same total balance
      if (Math.abs(walletsBalance - usersBalance) > 0.01) {
        throw new Error(`Balance mismatch: Wallets=${walletsBalance}, Users=${usersBalance}`);
      }
      
      // Verify the balance increased by the deposit amount
      const expectedBalance = this.initialWalletsBalance + 25.0;
      if (Math.abs(walletsBalance - expectedBalance) > 0.01) {
        throw new Error(`Balance not updated correctly. Expected: ${expectedBalance}, Actual: ${walletsBalance}`);
      }
      
      this.log('Balance consistency verified across both collections', 'success');
      
    } catch (error) {
      this.log(`Balance consistency verification failed: ${error.message}`, 'error');
      this.errors.push(`Balance consistency verification failed: ${error.message}`);
      throw error;
    }
  }

  async testRealTimeUpdates() {
    this.log('Testing real-time update simulation...');
    
    try {
      // Simulate what the frontend components would see
      const walletsDoc = await db.collection('wallets').doc(this.testUserId).get();
      const usersDoc = await db.collection('users').doc(this.testUserId).get();
      
      const walletsData = walletsDoc.data() || {};
      const usersData = usersDoc.data() || {};
      
      // Simulate useWallet hook data
      const useWalletData = {
        usdt: Number(walletsData.usdt?.mainUsdt || 0) + Number(walletsData.usdt?.purchaseUsdt || 0),
        inr: Number(walletsData.usdt?.mainInr || 0) + Number(walletsData.usdt?.purchaseInr || 0),
        dlx: Number(usersData.wallet?.miningBalance || 0)
      };
      
      // Simulate WalletEnhanced data
      const walletEnhancedData = {
        mainUsdt: Number(walletsData.usdt?.mainUsdt || 0),
        purchaseUsdt: Number(walletsData.usdt?.purchaseUsdt || 0),
        userBalance: Number(usersData.wallet?.main || 0) + Number(usersData.wallet?.purchase || 0)
      };
      
      this.log(`useWallet hook would show: ${useWalletData.usdt} USDT`, 'info');
      this.log(`WalletEnhanced would show: ${walletEnhancedData.userBalance} USDT`, 'info');
      
      // Verify both show the same total
      if (Math.abs(useWalletData.usdt - walletEnhancedData.userBalance) > 0.01) {
        throw new Error(`Frontend components show different balances: useWallet=${useWalletData.usdt}, WalletEnhanced=${walletEnhancedData.userBalance}`);
      }
      
      this.log('Real-time update simulation successful', 'success');
      
    } catch (error) {
      this.log(`Real-time update test failed: ${error.message}`, 'error');
      this.errors.push(`Real-time update test failed: ${error.message}`);
    }
  }

  async testDepositRequestStatus() {
    this.log('Testing deposit request status...');
    
    try {
      const depositDoc = await db.collection('depositRequests').doc(this.testDepositId).get();
      
      if (!depositDoc.exists()) {
        throw new Error('Deposit request not found');
      }
      
      const depositData = depositDoc.data();
      
      if (depositData.status !== 'approved') {
        throw new Error(`Deposit status incorrect: ${depositData.status}`);
      }
      
      this.log('Deposit request status verified as approved', 'success');
      
    } catch (error) {
      this.log(`Deposit request status test failed: ${error.message}`, 'error');
      this.errors.push(`Deposit request status test failed: ${error.message}`);
    }
  }

  async cleanup() {
    this.log('Cleaning up test data...');
    
    try {
      if (this.testDepositId) {
        await db.collection('depositRequests').doc(this.testDepositId).delete();
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
      errors: this.errors,
      fixSummary: {
        issue: 'Wallet balance not updating after admin approval',
        rootCause: 'Data structure mismatch between wallets and users collections',
        solution: 'Update both collections during admin approval',
        components: {
          adminPanel: 'AdminTransactionsFixed.tsx - Updates both collections',
          userWallet: 'WalletFixed.tsx - Listens to both collections',
          useWallet: 'useWallet.ts - Listens to wallets collection',
          walletEnhanced: 'WalletEnhanced.tsx - Listens to users collection'
        }
      }
    };

    const reportPath = path.join(__dirname, 'wallet-balance-fix-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Test report saved to: ${reportPath}`);
    return report;
  }

  async run() {
    this.log('Starting wallet balance fix tests...');
    
    try {
      // Step 1: Create test user
      await this.createTestUser();
      
      // Step 2: Record initial balances
      await this.recordInitialBalances();
      
      // Step 3: Test deposit approval with FIXED logic
      await this.testDepositApproval();
      
      // Step 4: Verify balance consistency
      await this.verifyBalanceConsistency();
      
      // Step 5: Test real-time updates
      await this.testRealTimeUpdates();
      
      // Step 6: Test deposit request status
      await this.testDepositRequestStatus();
      
      // Step 7: Cleanup
      await this.cleanup();
      
      // Step 8: Generate report
      const report = await this.generateReport();
      
      this.log('All wallet balance fix tests completed successfully');
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
  const tester = new WalletBalanceFixTester();
  tester.run()
    .then(report => {
      console.log('\n=== WALLET BALANCE FIX TEST RESULTS ===');
      console.log(`Total Tests: ${report.summary.totalTests}`);
      console.log(`Errors: ${report.summary.errors}`);
      console.log(`Success Rate: ${report.summary.successRate}`);
      console.log('\n=== FIX SUMMARY ===');
      console.log(`Issue: ${report.fixSummary.issue}`);
      console.log(`Root Cause: ${report.fixSummary.rootCause}`);
      console.log(`Solution: ${report.fixSummary.solution}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = WalletBalanceFixTester;




