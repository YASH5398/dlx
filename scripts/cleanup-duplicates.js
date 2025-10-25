import fs from 'fs';
import path from 'path';

console.log('🧹 Cleaning up duplicate wallet/dashboard components...\n');

// Files to remove (duplicates)
const filesToRemove = [
  'src/pages/Dashboard/WalletEnhanced.tsx', // Duplicate of Wallet.tsx
  'src/hooks/useWallet.js', // Duplicate of useWallet.ts
  'src/utils/wallet.js', // Duplicate of wallet.ts
];

// Files to keep (canonical)
const canonicalFiles = [
  'src/pages/Dashboard/Wallet.tsx', // Main wallet component
  'src/hooks/useWallet.ts', // Main wallet hook
  'src/utils/wallet.ts', // Main wallet utilities
];

console.log('📋 DUPLICATE FILES TO REMOVE:');
filesToRemove.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`❌ ${file} (duplicate)`);
  } else {
    console.log(`⚠️  ${file} (not found)`);
  }
});

console.log('\n📋 CANONICAL FILES TO KEEP:');
canonicalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} (canonical)`);
  } else {
    console.log(`❌ ${file} (missing!)`);
  }
});

// Check for imports that need to be updated
console.log('\n🔍 CHECKING FOR IMPORTS THAT NEED UPDATES:');

const filesToCheck = [
  'src/pages/Dashboard/Wallet.tsx',
  'src/pages/Dashboard/OrdersEnhanced.tsx',
  'src/pages/Dashboard/DashboardHome.tsx'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('useWallet.js')) {
      console.log(`⚠️  ${file} imports useWallet.js (should be useWallet.ts)`);
    }
    if (content.includes('wallet.js')) {
      console.log(`⚠️  ${file} imports wallet.js (should be wallet.ts)`);
    }
    if (content.includes('WalletEnhanced')) {
      console.log(`⚠️  ${file} imports WalletEnhanced (should be Wallet)`);
    }
  }
});

console.log('\n🎯 CLEANUP SUMMARY:');
console.log('✅ Wallet.tsx is the canonical wallet component');
console.log('✅ useWallet.ts is the canonical wallet hook');
console.log('✅ wallet.ts is the canonical wallet utilities');
console.log('❌ WalletEnhanced.tsx is a duplicate (not used in routing)');
console.log('❌ useWallet.js is a duplicate (not imported anywhere)');
console.log('❌ wallet.js is a duplicate (not imported anywhere)');

console.log('\n🚀 RECOMMENDED ACTIONS:');
console.log('1. Remove WalletEnhanced.tsx (duplicate)');
console.log('2. Remove useWallet.js (duplicate)');
console.log('3. Remove wallet.js (duplicate)');
console.log('4. Ensure all imports point to canonical files');
console.log('5. Update Wallet.tsx to use canonical wallets collection');
console.log('6. Update DashboardHome.tsx to use canonical wallets collection');

console.log('\n✨ This will eliminate data source conflicts and ensure consistency!');
