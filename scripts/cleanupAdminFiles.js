const fs = require('fs');
const path = require('path');

class AdminFileCleanup {
  constructor() {
    this.projectRoot = process.cwd();
    this.cleanupActions = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
    this.cleanupActions.push({ timestamp, type, message });
  }

  checkFileExists(filePath) {
    return fs.existsSync(path.join(this.projectRoot, filePath));
  }

  async removeDuplicateFiles() {
    this.log('Removing duplicate admin files...');
    
    const duplicateFiles = [
      'src/pages/SecretAdmin/AdminAffiliates.js',
      'src/pages/SecretAdmin/AdminDashboard.js',
      'src/pages/SecretAdmin/AdminInviteAccept.js',
      'src/pages/SecretAdmin/AdminLogin.js',
      'src/pages/SecretAdmin/AdminNotifications.js',
      'src/pages/SecretAdmin/AdminOrders.js',
      'src/pages/SecretAdmin/AdminProducts.js',
      'src/pages/SecretAdmin/AdminReferrals.js',
      'src/pages/SecretAdmin/AdminSettings.js',
      'src/pages/SecretAdmin/AdminSupport.js',
      'src/pages/SecretAdmin/AdminTransactions.js',
      'src/pages/SecretAdmin/AdminTransactions2.js',
      'src/pages/SecretAdmin/AdminUsers.js',
      'src/pages/SecretAdmin/AdminUsers2.js',
      'src/pages/SecretAdmin/SecretAdminLayout.js',
      'src/components/AdminSupportDashboard.tsx'
    ];

    for (const file of duplicateFiles) {
      if (this.checkFileExists(file)) {
        try {
          fs.unlinkSync(path.join(this.projectRoot, file));
          this.log(`Removed duplicate file: ${file}`, 'success');
        } catch (error) {
          this.log(`Failed to remove ${file}: ${error.message}`, 'error');
          this.errors.push(`Failed to remove ${file}: ${error.message}`);
        }
      }
    }
  }

  async updateRouting() {
    this.log('Updating routing to use enhanced components...');
    
    const routingFiles = [
      'src/App.tsx',
      'src/main.tsx'
    ];

    for (const file of routingFiles) {
      if (this.checkFileExists(file)) {
        try {
          let content = fs.readFileSync(path.join(this.projectRoot, file), 'utf8');
          
          // Update imports to use enhanced components
          content = content.replace(
            /import.*AdminTransactions2.*from.*AdminTransactions2/g,
            "import AdminTransactions3 from './pages/SecretAdmin/AdminTransactions3'"
          );
          
          content = content.replace(
            /AdminTransactions2/g,
            'AdminTransactions3'
          );
          
          // Update Wallet import to use enhanced version
          content = content.replace(
            /import.*Wallet.*from.*Dashboard\/Wallet/g,
            "import WalletEnhanced from './pages/Dashboard/WalletEnhanced'"
          );
          
          content = content.replace(
            /<Wallet/g,
            '<WalletEnhanced'
          );
          
          fs.writeFileSync(path.join(this.projectRoot, file), content);
          this.log(`Updated routing in ${file}`, 'success');
        } catch (error) {
          this.log(`Failed to update ${file}: ${error.message}`, 'error');
          this.errors.push(`Failed to update ${file}: ${error.message}`);
        }
      }
    }
  }

  async createIndexFiles() {
    this.log('Creating index files for better imports...');
    
    const indexFiles = [
      {
        path: 'src/pages/SecretAdmin/index.ts',
        content: `export { default as AdminTransactions } from './AdminTransactions3';
export { default as AdminOrders } from './AdminOrders';
export { default as AdminProducts } from './AdminProducts';
export { default as AdminSupport } from './AdminSupport';
export { default as AdminUsers } from './AdminUsers2';
export { default as AdminSettings } from './AdminSettings';
export { default as AdminDashboard } from './AdminDashboard';`
      },
      {
        path: 'src/pages/Dashboard/index.ts',
        content: `export { default as Wallet } from './WalletEnhanced';
export { default as DashboardHome } from './DashboardHome';
export { default as Orders } from './Orders';
export { default as Profile } from './Profile';
export { default as Settings } from './Settings';
export { default as Support } from './Support';`
      }
    ];

    for (const indexFile of indexFiles) {
      try {
        const dir = path.dirname(path.join(this.projectRoot, indexFile.path));
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(this.projectRoot, indexFile.path), indexFile.content);
        this.log(`Created index file: ${indexFile.path}`, 'success');
      } catch (error) {
        this.log(`Failed to create ${indexFile.path}: ${error.message}`, 'error');
        this.errors.push(`Failed to create ${indexFile.path}: ${error.message}`);
      }
    }
  }

  async updatePackageJson() {
    this.log('Updating package.json scripts...');
    
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Add new scripts
        packageJson.scripts = {
          ...packageJson.scripts,
          'migrate:transactions': 'node scripts/migrateTransactions.js',
          'test:transactions': 'node scripts/testTransactionSystem.js',
          'cleanup:admin': 'node scripts/cleanupAdminFiles.js',
          'verify:admin': 'node scripts/verifyAdminPanel.js'
        };
        
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        this.log('Updated package.json with new scripts', 'success');
      }
    } catch (error) {
      this.log(`Failed to update package.json: ${error.message}`, 'error');
      this.errors.push(`Failed to update package.json: ${error.message}`);
    }
  }

  async createDocumentation() {
    this.log('Creating documentation...');
    
    const documentation = `# Enhanced Transaction System

## Overview
This system provides a robust deposit and withdrawal management system with separate Firestore collections, comprehensive error handling, and real-time status updates.

## Architecture

### Collections
- \`depositRequests\`: All deposit requests with status tracking
- \`withdrawalRequests\`: All withdrawal requests with status tracking
- \`audit_logs\`: Complete audit trail of all admin actions
- \`error_logs\`: Detailed error logging for debugging
- \`transactionArchive\`: Historical transaction data

### Components
- \`AdminTransactions3.tsx\`: Enhanced admin panel with comprehensive error handling
- \`WalletEnhanced.tsx\`: Improved user wallet interface with real-time status
- \`migrateTransactions.js\`: Data migration script
- \`testTransactionSystem.js\`: Comprehensive testing suite

## Features

### Admin Panel
- Real-time streaming of deposit and withdrawal requests
- Enhanced status validation with specific error messages
- Comprehensive error logging and audit trails
- Atomic transactions with proper rollback
- User notification system

### User Interface
- Real-time status updates for all transactions
- Enhanced transaction history with request status
- Improved error handling and user feedback
- Separate display for pending requests

### Error Handling
- Status transition validation
- Insufficient balance checks
- Duplicate operation prevention
- Comprehensive error logging
- User-friendly error messages

## Usage

### Migration
\`\`\`bash
npm run migrate:transactions
\`\`\`

### Testing
\`\`\`bash
npm run test:transactions
\`\`\`

### Cleanup
\`\`\`bash
npm run cleanup:admin
\`\`\`

## Status Flow

### Deposits
1. User submits deposit → \`pending\`
2. Admin approves → \`approved\` (wallet credited)
3. Admin completes → \`completed\`

### Withdrawals
1. User submits withdrawal → \`pending\`
2. Admin approves → \`approved\` (wallet debited)
3. Admin completes → \`completed\`

## Error Prevention
- Status validation prevents invalid transitions
- Balance checks prevent insufficient funds
- Atomic transactions ensure data consistency
- Comprehensive logging for debugging
`;

    try {
      fs.writeFileSync(path.join(this.projectRoot, 'docs/transaction-system.md'), documentation);
      this.log('Created documentation: docs/transaction-system.md', 'success');
    } catch (error) {
      this.log(`Failed to create documentation: ${error.message}`, 'error');
      this.errors.push(`Failed to create documentation: ${error.message}`);
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        cleanupActions: this.cleanupActions.length,
        errors: this.errors.length,
        successRate: ((this.cleanupActions.length - this.errors.length) / this.cleanupActions.length * 100).toFixed(2) + '%'
      },
      cleanupActions: this.cleanupActions,
      errors: this.errors
    };

    const reportPath = path.join(this.projectRoot, 'cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Cleanup report saved to: ${reportPath}`);
    return report;
  }

  async run() {
    this.log('Starting admin file cleanup...');
    
    try {
      // Step 1: Remove duplicate files
      await this.removeDuplicateFiles();
      
      // Step 2: Update routing
      await this.updateRouting();
      
      // Step 3: Create index files
      await this.createIndexFiles();
      
      // Step 4: Update package.json
      await this.updatePackageJson();
      
      // Step 5: Create documentation
      await this.createDocumentation();
      
      // Step 6: Generate report
      const report = await this.generateReport();
      
      this.log('Cleanup completed successfully');
      return report;
      
    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run cleanup if called directly
if (require.main === module) {
  const cleanup = new AdminFileCleanup();
  cleanup.run()
    .then(report => {
      console.log('\n=== CLEANUP COMPLETE ===');
      console.log(`Actions: ${report.summary.cleanupActions}`);
      console.log(`Errors: ${report.summary.errors}`);
      console.log(`Success Rate: ${report.summary.successRate}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = AdminFileCleanup;
