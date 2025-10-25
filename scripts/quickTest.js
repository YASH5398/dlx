/**
 * Quick Admin Panel Test
 * Simple verification of key components
 */

import fs from 'fs';
import path from 'path';

console.log('=== ADMIN PANEL QUICK TEST ===\n');

// Check if key files exist
const keyFiles = [
  'src/pages/SecretAdmin/AdminTransactions2.tsx',
  'src/pages/SecretAdmin/AdminSupport.tsx',
  'server/routes/transactions.js',
  'src/utils/transactionAPI.ts'
];

console.log('Checking key files...');
let allFilesExist = true;

keyFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check for duplicate files
console.log('\nChecking for duplicates...');
const duplicateFiles = [
  'src/pages/SecretAdmin/AdminTransactions.tsx',
  'src/pages/SecretAdmin/AdminTransactions.js',
  'src/pages/SecretAdmin/AdminTransactions2.js',
  'src/pages/SecretAdmin/AdminSupport.js',
  'src/components/AdminSupportDashboard.tsx',
  'src/components/EnhancedAdminTransactions.tsx'
];

let duplicatesFound = 0;
duplicateFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✗ ${file} - DUPLICATE FOUND`);
    duplicatesFound++;
  }
});

if (duplicatesFound === 0) {
  console.log('✓ No duplicate files found');
}

// Check App.tsx routing
console.log('\nChecking routing...');
if (fs.existsSync('src/App.tsx')) {
  const appContent = fs.readFileSync('src/App.tsx', 'utf8');
  
  if (appContent.includes('AdminTransactions2')) {
    console.log('✓ AdminTransactions2 properly imported');
  } else {
    console.log('✗ AdminTransactions2 not found in routing');
  }
  
  if (appContent.includes('/secret-admin/transactions')) {
    console.log('✓ Transactions route configured');
  } else {
    console.log('✗ Transactions route not found');
  }
} else {
  console.log('✗ App.tsx not found');
}

// Check AdminTransactions2.tsx for enhanced features
console.log('\nChecking AdminTransactions2.tsx features...');
if (fs.existsSync('src/pages/SecretAdmin/AdminTransactions2.tsx')) {
  const content = fs.readFileSync('src/pages/SecretAdmin/AdminTransactions2.tsx', 'utf8');
  
  const features = [
    { name: 'Enhanced error handling', check: content.includes('Enhanced status validation') },
    { name: 'Firestore transactions', check: content.includes('runTransaction') },
    { name: 'Status validation', check: content.includes('currentStatus !== \'pending\'') },
    { name: 'Error logging', check: content.includes('error_logs') },
    { name: 'Specific error messages', check: content.includes('already been approved') }
  ];
  
  features.forEach(feature => {
    if (feature.check) {
      console.log(`✓ ${feature.name}`);
    } else {
      console.log(`✗ ${feature.name} - MISSING`);
    }
  });
} else {
  console.log('✗ AdminTransactions2.tsx not found');
}

console.log('\n=== SUMMARY ===');
console.log(`Key files exist: ${allFilesExist ? 'YES' : 'NO'}`);
console.log(`Duplicates found: ${duplicatesFound}`);
console.log(`Status: ${allFilesExist && duplicatesFound === 0 ? 'HEALTHY' : 'NEEDS ATTENTION'}`);

if (allFilesExist && duplicatesFound === 0) {
  console.log('\n🎉 Admin panel appears to be properly configured!');
} else {
  console.log('\n⚠️  Admin panel needs attention. Please review the issues above.');
}
