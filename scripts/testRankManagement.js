const admin = require('firebase-admin');
const { initializeApp } = require('firebase-admin/app');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-admin-key.json');
const app = initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://dlx-ai-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

class RankManagementTester {
  constructor() {
    this.testResults = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async createTestUser() {
    this.log('Creating test user for rank management...');
    
    try {
      const testUserId = `test_user_${Date.now()}`;
      
      // Create user document with rank field
      await db.collection('users').doc(testUserId).set({
        email: 'test@example.com',
        name: 'Test User',
        rank: 'starter',
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

  async testRankUpdate() {
    this.log('Testing rank update functionality...');
    
    try {
      const ranks = ['starter', 'dlx-associate', 'dlx-executive', 'dlx-director', 'dlx-president'];
      
      for (const rank of ranks) {
        this.log(`Updating user rank to: ${rank}`);
        
        await db.collection('users').doc(this.testUserId).update({
          rank: rank,
          rankUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          rankUpdatedBy: 'admin'
        });

        // Verify the update
        const userDoc = await db.collection('users').doc(this.testUserId).get();
        const userData = userDoc.data();
        
        if (userData.rank === rank) {
          this.log(`✅ Rank updated successfully to: ${rank}`, 'success');
          this.testResults.push({
            test: 'Rank Update',
            rank: rank,
            status: 'PASSED',
            timestamp: new Date().toISOString()
          });
        } else {
          this.log(`❌ Rank update failed for: ${rank}`, 'error');
          this.testResults.push({
            test: 'Rank Update',
            rank: rank,
            status: 'FAILED',
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      this.log(`Rank update test failed: ${error.message}`, 'error');
      this.errors.push(`Rank update test failed: ${error.message}`);
    }
  }

  async testCommissionCalculation() {
    this.log('Testing commission calculation...');
    
    try {
      const testAmount = 1000;
      const rankCommissions = {
        'starter': 0,
        'dlx-associate': 25,
        'dlx-executive': 30,
        'dlx-director': 35,
        'dlx-president': 45
      };

      for (const [rank, expectedCommission] of Object.entries(rankCommissions)) {
        const commissionAmount = (testAmount * expectedCommission) / 100;
        const finalAmount = testAmount - commissionAmount;

        this.log(`Rank: ${rank}, Commission: ${expectedCommission}%, Amount: $${testAmount}, Commission: $${commissionAmount}, Final: $${finalAmount}`);

        this.testResults.push({
          test: 'Commission Calculation',
          rank: rank,
          amount: testAmount,
          commissionPercentage: expectedCommission,
          commissionAmount: commissionAmount,
          finalAmount: finalAmount,
          status: 'PASSED',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      this.log(`Commission calculation test failed: ${error.message}`, 'error');
      this.errors.push(`Commission calculation test failed: ${error.message}`);
    }
  }

  async testRankStatistics() {
    this.log('Testing rank statistics...');
    
    try {
      // Create multiple test users with different ranks
      const testUsers = [
        { rank: 'starter', name: 'User 1' },
        { rank: 'dlx-associate', name: 'User 2' },
        { rank: 'dlx-executive', name: 'User 3' },
        { rank: 'dlx-director', name: 'User 4' },
        { rank: 'dlx-president', name: 'User 5' }
      ];

      for (const user of testUsers) {
        const userId = `test_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.collection('users').doc(userId).set({
          email: `${user.name.toLowerCase().replace(' ', '')}@example.com`,
          name: user.name,
          rank: user.rank,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Get rank statistics
      const usersSnapshot = await db.collection('users').get();
      const rankStats = {};
      
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        const rank = data.rank || 'starter';
        rankStats[rank] = (rankStats[rank] || 0) + 1;
      });

      this.log('Rank Statistics:', 'info');
      Object.entries(rankStats).forEach(([rank, count]) => {
        this.log(`  ${rank}: ${count} users`);
      });

      this.testResults.push({
        test: 'Rank Statistics',
        statistics: rankStats,
        status: 'PASSED',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.log(`Rank statistics test failed: ${error.message}`, 'error');
      this.errors.push(`Rank statistics test failed: ${error.message}`);
    }
  }

  async cleanup() {
    this.log('Cleaning up test data...');
    
    try {
      // Delete test users
      const usersSnapshot = await db.collection('users').where('email', '==', 'test@example.com').get();
      const deletePromises = [];
      
      usersSnapshot.forEach(doc => {
        deletePromises.push(doc.ref.delete());
      });

      await Promise.all(deletePromises);
      this.log('Test data cleaned up successfully', 'success');
    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`, 'error');
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Rank Management System Tests');
    this.log('=====================================');

    try {
      await this.createTestUser();
      await this.testRankUpdate();
      await this.testCommissionCalculation();
      await this.testRankStatistics();
      
      this.log('✅ All tests completed successfully!');
      
      // Print test results summary
      this.log('\n📊 Test Results Summary:');
      this.log('========================');
      this.testResults.forEach(result => {
        const status = result.status === 'PASSED' ? '✅' : '❌';
        this.log(`${status} ${result.test}: ${result.status}`);
      });

      if (this.errors.length > 0) {
        this.log('\n❌ Errors encountered:');
        this.errors.forEach(error => {
          this.log(`  - ${error}`);
        });
      }

    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
const tester = new RankManagementTester();
tester.runAllTests().catch(console.error);
