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

class TransactionMigrator {
  constructor() {
    this.migratedDeposits = 0;
    this.migratedWithdrawals = 0;
    this.errors = [];
    this.logs = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
    this.logs.push(logEntry);
  }

  async migrateUserTransactions() {
    this.log('Starting migration of user transactions...');
    
    try {
      // Get all users
      const usersSnapshot = await db.collection('users').get();
      this.log(`Found ${usersSnapshot.size} users to process`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // Check if user has transactions in the old format
        const transactionsSnapshot = await db
          .collection('wallets')
          .doc(userId)
          .collection('transactions')
          .get();

        this.log(`Processing ${transactionsSnapshot.size} transactions for user ${userId}`);

        for (const txDoc of transactionsSnapshot.docs) {
          const txData = txDoc.data();
          
          // Only migrate if it's a deposit or withdrawal and doesn't already exist in the new collections
          if (txData.type === 'deposit' && txData.status === 'pending') {
            await this.migrateDeposit(userId, txData, txDoc.id);
          } else if (txData.type === 'withdraw' && txData.status === 'pending') {
            await this.migrateWithdrawal(userId, txData, txDoc.id);
          }
        }
      }

      this.log(`Migration completed. Deposits: ${this.migratedDeposits}, Withdrawals: ${this.migratedWithdrawals}`);
      
    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error');
      this.errors.push(error.message);
    }
  }

  async migrateDeposit(userId, txData, txId) {
    try {
      // Check if deposit request already exists
      const existingDeposits = await db
        .collection('depositRequests')
        .where('userId', '==', userId)
        .where('amount', '==', txData.amount)
        .where('status', '==', 'pending')
        .get();

      if (existingDeposits.empty) {
        // Create new deposit request
        await db.collection('depositRequests').add({
          userId,
          amount: txData.amount,
          method: txData.method || 'unknown',
          status: 'pending',
          currency: txData.currency || 'USDT',
          fees: txData.fees || 0,
          txnId: txData.txnId || null,
          notes: `Migrated from transaction ${txId}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          migratedFrom: txId,
          migrationDate: admin.firestore.FieldValue.serverTimestamp()
        });

        this.migratedDeposits++;
        this.log(`Migrated deposit for user ${userId}: ${txData.amount} ${txData.currency || 'USDT'}`);
      } else {
        this.log(`Deposit already exists for user ${userId}, skipping`, 'warn');
      }
    } catch (error) {
      this.log(`Failed to migrate deposit for user ${userId}: ${error.message}`, 'error');
      this.errors.push(`Deposit migration failed for user ${userId}: ${error.message}`);
    }
  }

  async migrateWithdrawal(userId, txData, txId) {
    try {
      // Check if withdrawal request already exists
      const existingWithdrawals = await db
        .collection('withdrawalRequests')
        .where('userId', '==', userId)
        .where('amount', '==', txData.amount)
        .where('status', '==', 'pending')
        .get();

      if (existingWithdrawals.empty) {
        // Create new withdrawal request
        await db.collection('withdrawalRequests').add({
          userId,
          amount: txData.amount,
          method: txData.method || 'unknown',
          walletType: txData.walletType || 'main',
          status: 'pending',
          currency: txData.currency || 'USDT',
          fees: txData.fees || 0,
          txnId: txData.txnId || null,
          notes: `Migrated from transaction ${txId}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          migratedFrom: txId,
          migrationDate: admin.firestore.FieldValue.serverTimestamp()
        });

        this.migratedWithdrawals++;
        this.log(`Migrated withdrawal for user ${userId}: ${txData.amount} ${txData.currency || 'USDT'}`);
      } else {
        this.log(`Withdrawal already exists for user ${userId}, skipping`, 'warn');
      }
    } catch (error) {
      this.log(`Failed to migrate withdrawal for user ${userId}: ${error.message}`, 'error');
      this.errors.push(`Withdrawal migration failed for user ${userId}: ${error.message}`);
    }
  }

  async createArchiveCollection() {
    this.log('Creating archive collection for old transactions...');
    
    try {
      // Create a backup of all user transactions
      const usersSnapshot = await db.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const transactionsSnapshot = await db
          .collection('wallets')
          .doc(userId)
          .collection('transactions')
          .get();

        if (!transactionsSnapshot.empty) {
          // Create archive entry
          await db.collection('transactionArchive').doc(userId).set({
            userId,
            transactionCount: transactionsSnapshot.size,
            archivedAt: admin.firestore.FieldValue.serverTimestamp(),
            transactions: transactionsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          });
        }
      }

      this.log('Archive collection created successfully');
    } catch (error) {
      this.log(`Failed to create archive: ${error.message}`, 'error');
      this.errors.push(`Archive creation failed: ${error.message}`);
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        migratedDeposits: this.migratedDeposits,
        migratedWithdrawals: this.migratedWithdrawals,
        totalErrors: this.errors.length
      },
      errors: this.errors,
      logs: this.logs
    };

    const reportPath = path.join(__dirname, 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Migration report saved to: ${reportPath}`);
    return report;
  }

  async run() {
    this.log('Starting transaction migration process...');
    
    try {
      // Step 1: Create archive of existing transactions
      await this.createArchiveCollection();
      
      // Step 2: Migrate user transactions
      await this.migrateUserTransactions();
      
      // Step 3: Generate report
      const report = await this.generateReport();
      
      this.log('Migration process completed successfully');
      return report;
      
    } catch (error) {
      this.log(`Migration process failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new TransactionMigrator();
  migrator.run()
    .then(report => {
      console.log('\n=== MIGRATION COMPLETE ===');
      console.log(`Deposits migrated: ${report.summary.migratedDeposits}`);
      console.log(`Withdrawals migrated: ${report.summary.migratedWithdrawals}`);
      console.log(`Errors: ${report.summary.totalErrors}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = TransactionMigrator;
