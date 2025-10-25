const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'dlx-ai'
  });
}

const db = admin.firestore();

class AtomicSystemMigrator {
  constructor() {
    this.migratedDeposits = 0;
    this.migratedWithdrawals = 0;
    this.migratedTransactions = 0;
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  }

  async migrateDepositRequests() {
    this.log('Migrating deposit requests...');
    
    try {
      const depositRequestsSnapshot = await db.collection('depositRequests').get();
      
      for (const doc of depositRequestsSnapshot.docs) {
        const data = doc.data();
        
        // Check if already has transactionId
        if (data.transactionId) {
          this.log(`Deposit request ${doc.id} already has transactionId, skipping`);
          continue;
        }
        
        try {
          // Find corresponding transaction
          const transactionsSnapshot = await db.collection('wallets').doc(data.userId)
            .collection('transactions')
            .where('requestId', '==', doc.id)
            .get();
          
          if (!transactionsSnapshot.empty) {
            const transactionDoc = transactionsSnapshot.docs[0];
            
            // Update deposit request with transactionId
            await db.collection('depositRequests').doc(doc.id).update({
              transactionId: transactionDoc.id
            });
            
            // Update transaction with requestId if not already set
            const transactionData = transactionDoc.data();
            if (!transactionData.requestId) {
              await transactionDoc.ref.update({
                requestId: doc.id
              });
            }
            
            this.migratedDeposits++;
            this.log(`Migrated deposit request ${doc.id} -> transaction ${transactionDoc.id}`);
          } else {
            this.log(`No transaction found for deposit request ${doc.id}`, 'warn');
          }
        } catch (error) {
          this.log(`Failed to migrate deposit request ${doc.id}: ${error.message}`, 'error');
          this.errors.push(`Deposit request ${doc.id}: ${error.message}`);
        }
      }
      
      this.log(`✅ Migrated ${this.migratedDeposits} deposit requests`);
    } catch (error) {
      this.log(`Failed to migrate deposit requests: ${error.message}`, 'error');
    }
  }

  async migrateWithdrawalRequests() {
    this.log('Migrating withdrawal requests...');
    
    try {
      const withdrawalRequestsSnapshot = await db.collection('withdrawalRequests').get();
      
      for (const doc of withdrawalRequestsSnapshot.docs) {
        const data = doc.data();
        
        // Check if already has transactionId
        if (data.transactionId) {
          this.log(`Withdrawal request ${doc.id} already has transactionId, skipping`);
          continue;
        }
        
        try {
          // Find corresponding transaction
          const transactionsSnapshot = await db.collection('wallets').doc(data.userId)
            .collection('transactions')
            .where('requestId', '==', doc.id)
            .get();
          
          if (!transactionsSnapshot.empty) {
            const transactionDoc = transactionsSnapshot.docs[0];
            
            // Update withdrawal request with transactionId
            await db.collection('withdrawalRequests').doc(doc.id).update({
              transactionId: transactionDoc.id
            });
            
            // Update transaction with requestId if not already set
            const transactionData = transactionDoc.data();
            if (!transactionData.requestId) {
              await transactionDoc.ref.update({
                requestId: doc.id
              });
            }
            
            this.migratedWithdrawals++;
            this.log(`Migrated withdrawal request ${doc.id} -> transaction ${transactionDoc.id}`);
          } else {
            this.log(`No transaction found for withdrawal request ${doc.id}`, 'warn');
          }
        } catch (error) {
          this.log(`Failed to migrate withdrawal request ${doc.id}: ${error.message}`, 'error');
          this.errors.push(`Withdrawal request ${doc.id}: ${error.message}`);
        }
      }
      
      this.log(`✅ Migrated ${this.migratedWithdrawals} withdrawal requests`);
    } catch (error) {
      this.log(`Failed to migrate withdrawal requests: ${error.message}`, 'error');
    }
  }

  async migrateWalletStructure() {
    this.log('Migrating wallet structure to direct fields...');
    
    try {
      const walletsSnapshot = await db.collection('wallets').get();
      
      for (const doc of walletsSnapshot.docs) {
        const data = doc.data();
        
        // Check if wallet uses nested structure
        if (data.usdt && typeof data.usdt === 'object') {
          try {
            const updates = {};
            
            // Migrate nested usdt structure to direct fields
            if (data.usdt.mainUsdt !== undefined) {
              updates.mainUsdt = data.usdt.mainUsdt;
            }
            if (data.usdt.purchaseUsdt !== undefined) {
              updates.purchaseUsdt = data.usdt.purchaseUsdt;
            }
            
            // Only update if there are changes
            if (Object.keys(updates).length > 0) {
              await db.collection('wallets').doc(doc.id).update(updates);
              this.log(`Migrated wallet ${doc.id} to direct field structure`);
            }
          } catch (error) {
            this.log(`Failed to migrate wallet ${doc.id}: ${error.message}`, 'error');
            this.errors.push(`Wallet ${doc.id}: ${error.message}`);
          }
        }
      }
      
      this.log('✅ Wallet structure migration completed');
    } catch (error) {
      this.log(`Failed to migrate wallet structure: ${error.message}`, 'error');
    }
  }

  async migrateTransactionStatuses() {
    this.log('Migrating transaction statuses...');
    
    try {
      const usersSnapshot = await db.collection('wallets').get();
      
      for (const userDoc of usersSnapshot.docs) {
        const transactionsSnapshot = await userDoc.ref.collection('transactions').get();
        
        for (const transactionDoc of transactionsSnapshot.docs) {
          const data = transactionDoc.data();
          
          // Update status mapping
          let newStatus = data.status;
          if (data.status === 'approved') {
            newStatus = 'success';
          }
          
          if (newStatus !== data.status) {
            try {
              await transactionDoc.ref.update({
                status: newStatus,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              
              this.migratedTransactions++;
              this.log(`Updated transaction ${transactionDoc.id} status: ${data.status} -> ${newStatus}`);
            } catch (error) {
              this.log(`Failed to update transaction ${transactionDoc.id}: ${error.message}`, 'error');
              this.errors.push(`Transaction ${transactionDoc.id}: ${error.message}`);
            }
          }
        }
      }
      
      this.log(`✅ Migrated ${this.migratedTransactions} transaction statuses`);
    } catch (error) {
      this.log(`Failed to migrate transaction statuses: ${error.message}`, 'error');
    }
  }

  async createAuditLogs() {
    this.log('Creating migration audit log...');
    
    try {
      await db.collection('audit_logs').add({
        actor_id: 'system',
        actor_email: 'migration@system',
        action: 'system_migration',
        target_type: 'migration',
        target_id: 'atomic_system_migration',
        meta: {
          migratedDeposits: this.migratedDeposits,
          migratedWithdrawals: this.migratedWithdrawals,
          migratedTransactions: this.migratedTransactions,
          errors: this.errors,
          migrationDate: new Date().toISOString()
        },
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      this.log('✅ Migration audit log created');
    } catch (error) {
      this.log(`Failed to create audit log: ${error.message}`, 'error');
    }
  }

  async runMigration() {
    this.log('🚀 Starting Atomic System Migration');
    this.log('=' .repeat(60));
    
    try {
      await this.migrateWalletStructure();
      await this.migrateDepositRequests();
      await this.migrateWithdrawalRequests();
      await this.migrateTransactionStatuses();
      await this.createAuditLogs();
      
      this.log('=' .repeat(60));
      this.log('🎉 Migration completed successfully!');
      this.log(`📊 Summary:`);
      this.log(`  - Migrated ${this.migratedDeposits} deposit requests`);
      this.log(`  - Migrated ${this.migratedWithdrawals} withdrawal requests`);
      this.log(`  - Migrated ${this.migratedTransactions} transaction statuses`);
      
      if (this.errors.length > 0) {
        this.log(`⚠️ ${this.errors.length} errors occurred during migration:`);
        this.errors.forEach(error => this.log(`  - ${error}`, 'error'));
      }
      
      return {
        success: true,
        migratedDeposits: this.migratedDeposits,
        migratedWithdrawals: this.migratedWithdrawals,
        migratedTransactions: this.migratedTransactions,
        errors: this.errors
      };
    } catch (error) {
      this.log(`❌ Migration failed: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message,
        migratedDeposits: this.migratedDeposits,
        migratedWithdrawals: this.migratedWithdrawals,
        migratedTransactions: this.migratedTransactions,
        errors: this.errors
      };
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new AtomicSystemMigrator();
  migrator.runMigration()
    .then(results => {
      console.log('\n📊 Migration Results:', results);
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Migration runner failed:', error);
      process.exit(1);
    });
}

module.exports = AtomicSystemMigrator;
