/**
 * Admin Panel Verification Script
 * Checks for common issues and provides recommendations
 */

import fs from 'fs';
import path from 'path';

class AdminPanelVerifier {
  constructor() {
    this.issues = [];
    this.recommendations = [];
    this.projectRoot = process.cwd();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  }

  checkFileExists(filePath) {
    return fs.existsSync(path.join(this.projectRoot, filePath));
  }

  checkForDuplicates() {
    this.log('Checking for duplicate files...');
    
    const adminFiles = [
      'src/pages/SecretAdmin/AdminTransactions.tsx',
      'src/pages/SecretAdmin/AdminTransactions.js',
      'src/pages/SecretAdmin/AdminTransactions2.js',
      'src/pages/SecretAdmin/AdminSupport.js',
      'src/components/AdminSupportDashboard.tsx',
      'src/components/EnhancedAdminTransactions.tsx'
    ];

    const duplicates = adminFiles.filter(file => this.checkFileExists(file));
    
    if (duplicates.length > 0) {
      this.issues.push(`Found duplicate files: ${duplicates.join(', ')}`);
      this.recommendations.push('Remove duplicate files to prevent conflicts');
    } else {
      this.log('No duplicate files found', 'success');
    }
  }

  checkRouting() {
    this.log('Checking routing configuration...');
    
    const appTsxPath = 'src/App.tsx';
    if (!this.checkFileExists(appTsxPath)) {
      this.issues.push('App.tsx not found');
      return;
    }

    const appContent = fs.readFileSync(path.join(this.projectRoot, appTsxPath), 'utf8');
    
    // Check if AdminTransactions2 is imported and used
    if (appContent.includes('AdminTransactions2')) {
      this.log('AdminTransactions2 is properly imported in routing', 'success');
    } else {
      this.issues.push('AdminTransactions2 not found in routing');
    }

    // Check for proper route configuration
    if (appContent.includes('/secret-admin/transactions')) {
      this.log('Transactions route properly configured', 'success');
    } else {
      this.issues.push('Transactions route not found in routing');
    }
  }

  checkTransactionHandling() {
    this.log('Checking transaction handling implementation...');
    
    const adminTxPath = 'src/pages/SecretAdmin/AdminTransactions2.tsx';
    if (!this.checkFileExists(adminTxPath)) {
      this.issues.push('AdminTransactions2.tsx not found');
      return;
    }

    const content = fs.readFileSync(path.join(this.projectRoot, adminTxPath), 'utf8');
    
    // Check for enhanced error handling
    const hasEnhancedErrorHandling = content.includes('Enhanced status validation') && 
                                   content.includes('throw new Error') &&
                                   content.includes('error_logs');
    
    if (hasEnhancedErrorHandling) {
      this.log('Enhanced error handling found', 'success');
    } else {
      this.issues.push('Enhanced error handling not implemented');
      this.recommendations.push('Implement proper error handling with specific error messages');
    }

    // Check for Firestore transactions
    const hasTransactions = content.includes('runTransaction') && 
                          content.includes('tx.get') && 
                          content.includes('tx.update');
    
    if (hasTransactions) {
      this.log('Firestore transactions properly implemented', 'success');
    } else {
      this.issues.push('Firestore transactions not properly implemented');
      this.recommendations.push('Use Firestore transactions for atomic operations');
    }

    // Check for status validation
    const hasStatusValidation = content.includes('currentStatus !== \'pending\'') &&
                               content.includes('Cannot approve') &&
                               content.includes('already been');
    
    if (hasStatusValidation) {
      this.log('Status validation properly implemented', 'success');
    } else {
      this.issues.push('Status validation not properly implemented');
      this.recommendations.push('Add proper status validation before operations');
    }
  }

  checkBackendAPI() {
    this.log('Checking backend API implementation...');
    
    const transactionsRoutePath = 'server/routes/transactions.js';
    if (!this.checkFileExists(transactionsRoutePath)) {
      this.issues.push('Backend transactions route not found');
      this.recommendations.push('Create backend API routes for transaction processing');
    } else {
      this.log('Backend transactions route found', 'success');
      
      const content = fs.readFileSync(path.join(this.projectRoot, transactionsRoutePath), 'utf8');
      
      if (content.includes('validateTransactionStatus') && content.includes('createAuditLog')) {
        this.log('Backend API properly structured', 'success');
      } else {
        this.issues.push('Backend API not properly structured');
        this.recommendations.push('Implement proper backend API with validation and logging');
      }
    }

    // Check if routes are registered in main server file
    const serverIndexPath = 'server/index.js';
    if (this.checkFileExists(serverIndexPath)) {
      const content = fs.readFileSync(path.join(this.projectRoot, serverIndexPath), 'utf8');
      if (content.includes('transactionsRouter')) {
        this.log('Transactions router properly registered', 'success');
      } else {
        this.issues.push('Transactions router not registered in server');
        this.recommendations.push('Register transactions router in server/index.js');
      }
    }
  }

  checkWalletIntegration() {
    this.log('Checking wallet integration...');
    
    const walletPath = 'src/pages/Dashboard/Wallet.tsx';
    if (!this.checkFileExists(walletPath)) {
      this.issues.push('Wallet component not found');
      return;
    }

    const content = fs.readFileSync(path.join(this.projectRoot, walletPath), 'utf8');
    
    // Check if deposit/withdrawal requests are created properly
    const createsDepositRequests = content.includes('depositRequests') && 
                                  content.includes('addDoc') &&
                                  content.includes('status: \'pending\'');
    
    const createsWithdrawalRequests = content.includes('withdrawalRequests') && 
                                    content.includes('addDoc') &&
                                    content.includes('status: \'pending\'');
    
    if (createsDepositRequests && createsWithdrawalRequests) {
      this.log('Wallet properly creates deposit/withdrawal requests', 'success');
    } else {
      this.issues.push('Wallet does not properly create requests');
      this.recommendations.push('Ensure wallet creates proper deposit/withdrawal requests');
    }
  }

  checkErrorLogging() {
    this.log('Checking error logging implementation...');
    
    const adminTxPath = 'src/pages/SecretAdmin/AdminTransactions2.tsx';
    if (this.checkFileExists(adminTxPath)) {
      const content = fs.readFileSync(path.join(this.projectRoot, adminTxPath), 'utf8');
      
      if (content.includes('error_logs') && content.includes('addDoc')) {
        this.log('Error logging properly implemented', 'success');
      } else {
        this.issues.push('Error logging not implemented');
        this.recommendations.push('Implement error logging for debugging');
      }
    }
  }

  generateReport() {
    console.log('\n=== ADMIN PANEL VERIFICATION REPORT ===\n');
    
    if (this.issues.length === 0) {
      this.log('No issues found! Admin panel appears to be properly configured.', 'success');
    } else {
      this.log(`Found ${this.issues.length} issues:`, 'error');
      this.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    if (this.recommendations.length > 0) {
      console.log('\nRecommendations:');
      this.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Issues: ${this.issues.length}`);
    console.log(`Recommendations: ${this.recommendations.length}`);
    console.log(`Status: ${this.issues.length === 0 ? 'HEALTHY' : 'NEEDS ATTENTION'}`);
  }

  async runVerification() {
    this.log('Starting admin panel verification...');
    
    this.checkForDuplicates();
    this.checkRouting();
    this.checkTransactionHandling();
    this.checkBackendAPI();
    this.checkWalletIntegration();
    this.checkErrorLogging();
    
    this.generateReport();
    
    return {
      issues: this.issues,
      recommendations: this.recommendations,
      healthy: this.issues.length === 0
    };
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new AdminPanelVerifier();
  verifier.runVerification().then((result) => {
    process.exit(result.healthy ? 0 : 1);
  }).catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

export { AdminPanelVerifier };
