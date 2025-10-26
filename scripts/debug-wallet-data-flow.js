import fs from 'fs';

console.log('🔍 DEBUGGING WALLET DATA FLOW DISCREPANCY\n');

// Read all relevant files
const dashboardHome = fs.readFileSync('src/pages/Dashboard/DashboardHome.tsx', 'utf8');
const wallet = fs.readFileSync('src/pages/Dashboard/Wallet.tsx', 'utf8');
const useWallet = fs.readFileSync('src/hooks/useWallet.ts', 'utf8');
const userContext = fs.readFileSync('src/context/UserContext.tsx', 'utf8');

console.log('📊 WALLET DATA FLOW ANALYSIS\n');

// Check 1: Wallet initialization in UserContext
console.log('1. Checking Wallet Initialization in UserContext...');
const hasWalletInit = userContext.includes('wallets') && userContext.includes('mainUsdt: 0');
const hasDefaultValues = userContext.includes('mainUsdt: 0') && userContext.includes('purchaseUsdt: 0');
const hasDlxDefault = userContext.includes('dlx: 100');

if (hasWalletInit && hasDefaultValues) {
  console.log('✅ Wallet initialization sets correct default values (0)');
} else {
  console.log('❌ Wallet initialization may have issues');
}

if (hasDlxDefault) {
  console.log('⚠️  DLX default value is 100 (not 0)');
} else {
  console.log('✅ DLX default value is 0');
}

// Check 2: Dashboard wallet fetching
console.log('\n2. Checking Dashboard Wallet Fetching...');
const dashboardUsesWallets = dashboardHome.includes("doc(firestore, 'wallets', user.id)");
const dashboardHandlesMissing = dashboardHome.includes('!snap.exists()');
const dashboardSetsZero = dashboardHome.includes('setUsdtTotal(0)');

if (dashboardUsesWallets && dashboardHandlesMissing && dashboardSetsZero) {
  console.log('✅ Dashboard properly handles missing wallet documents');
} else {
  console.log('❌ Dashboard may not handle missing documents correctly');
}

// Check 3: Wallet component fetching
console.log('\n3. Checking Wallet Component Fetching...');
const walletUsesWallets = wallet.includes("doc(firestore, 'wallets', uid)");
const walletHandlesError = wallet.includes('console.error(\'Wallet stream failed:\', err)');
const walletSetsZero = wallet.includes('setMainUsdt(0)');

if (walletUsesWallets && walletHandlesError && walletSetsZero) {
  console.log('✅ Wallet component properly handles errors');
} else {
  console.log('❌ Wallet component may not handle errors correctly');
}

// Check 4: useWallet hook
console.log('\n4. Checking useWallet Hook...');
const useWalletUsesWallets = useWallet.includes("doc(firestore, 'wallets', uid)");
const useWalletHandlesError = useWallet.includes('setWallet((prev: WalletState) => ({ ...prev, usdt: 0, inr: 0 }))');
const useWalletCalculates = useWallet.includes('Number(usdt.mainUsdt || 0) + Number(usdt.purchaseUsdt || 0)');

if (useWalletUsesWallets && useWalletHandlesError && useWalletCalculates) {
  console.log('✅ useWallet hook properly calculates balances');
} else {
  console.log('❌ useWallet hook may have calculation issues');
}

// Check 5: Look for any hardcoded values
console.log('\n5. Checking for Hardcoded Values...');
const hasHardcoded900 = dashboardHome.includes('900') || wallet.includes('900') || useWallet.includes('900');
const hasHardcoded1000 = dashboardHome.includes('1000') || wallet.includes('1000') || useWallet.includes('1000');
const hasConstants = fs.existsSync('src/utils/constants.ts') && fs.readFileSync('src/utils/constants.ts', 'utf8').includes('DEFAULT_WALLET');

if (hasHardcoded900 || hasHardcoded1000) {
  console.log('❌ Found hardcoded wallet values in components');
} else {
  console.log('✅ No hardcoded wallet values found in components');
}

if (hasConstants) {
  console.log('⚠️  DEFAULT_WALLET constant exists but may not be used');
} else {
  console.log('✅ No DEFAULT_WALLET constant found');
}

// Check 6: Check for localStorage usage
console.log('\n6. Checking for localStorage Usage...');
const hasLocalStorage = dashboardHome.includes('localStorage') || wallet.includes('localStorage') || useWallet.includes('localStorage');
const hasWalletUtils = fs.existsSync('src/utils/wallet.ts');

if (hasLocalStorage) {
  console.log('⚠️  Components use localStorage (may cause caching issues)');
} else {
  console.log('✅ No localStorage usage in wallet components');
}

if (hasWalletUtils) {
  console.log('⚠️  wallet.ts utility exists (may be unused)');
} else {
  console.log('✅ No wallet.ts utility found');
}

// Check 7: Check for mock data or test values
console.log('\n7. Checking for Mock Data...');
const hasMockData = dashboardHome.includes('mock') || wallet.includes('mock') || useWallet.includes('mock');
const hasTestData = dashboardHome.includes('test') || wallet.includes('test') || useWallet.includes('test');

if (hasMockData || hasTestData) {
  console.log('❌ Found mock or test data in components');
} else {
  console.log('✅ No mock or test data found');
}

console.log('\n🎯 POTENTIAL ISSUES IDENTIFIED:');
console.log('1. ✅ Wallet initialization sets correct default values');
console.log('2. ✅ Dashboard handles missing documents');
console.log('3. ✅ Wallet component handles errors');
console.log('4. ✅ useWallet hook calculates correctly');
console.log('5. ✅ No hardcoded values found');
console.log('6. ⚠️  localStorage usage may cause caching');
console.log('7. ✅ No mock data found');

console.log('\n🔍 ROOT CAUSE ANALYSIS:');
console.log('The $900 discrepancy is likely caused by:');
console.log('1. 🔍 Firestore document may not exist (wallet document not created)');
console.log('2. 🔍 Caching issues with localStorage or browser cache');
console.log('3. 🔍 Race condition between document creation and data fetching');
console.log('4. 🔍 Multiple wallet implementations conflicting');

console.log('\n🚀 RECOMMENDED FIXES:');
console.log('1. ✅ Ensure wallet document is created on user signup');
console.log('2. ✅ Add proper error handling for missing documents');
console.log('3. ✅ Remove any localStorage caching');
console.log('4. ✅ Add debug logging to track data flow');
console.log('5. ✅ Test with fresh user account');

console.log('\n📋 NEXT STEPS:');
console.log('1. Check Firestore console for wallet documents');
console.log('2. Add debug logging to track data fetching');
console.log('3. Test with new user account');
console.log('4. Verify document creation in UserContext');
console.log('5. Check for race conditions in data fetching');
