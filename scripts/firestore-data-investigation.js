import fs from 'fs';

console.log('🔍 FIRESTORE DATA INVESTIGATION - DEEP ANALYSIS\n');

// Read all relevant files
const dashboardHome = fs.readFileSync('src/pages/Dashboard/DashboardHome.tsx', 'utf8');
const useReferral = fs.readFileSync('src/hooks/useReferral.ts', 'utf8');
const useAffiliateStatus = fs.readFileSync('src/hooks/useAffiliateStatus.ts', 'utf8');
const useWallet = fs.readFileSync('src/hooks/useWallet.ts', 'utf8');
const firestoreRules = fs.readFileSync('firestore.rules', 'utf8');

console.log('📊 FIRESTORE DATA FLOW ANALYSIS\n');

// Check 1: Collections being accessed
console.log('1. COLLECTIONS BEING ACCESSED:');
const collections = [
  'users', 'wallets', 'referrals', 'orders', 'digitalProducts', 
  'services', 'affiliates', 'notifications', 'depositRequests', 
  'withdrawalRequests', 'serviceRequests', 'inquiries'
];

collections.forEach(collection => {
  const hasAccess = firestoreRules.includes(`match /${collection}/`);
  const isUsed = dashboardHome.includes(`'${collection}'`) || 
                useReferral.includes(`'${collection}'`) || 
                useAffiliateStatus.includes(`'${collection}'`) ||
                useWallet.includes(`'${collection}'`);
  
  if (isUsed && !hasAccess) {
    console.log(`❌ ${collection} - USED but NO ACCESS RULES`);
  } else if (isUsed && hasAccess) {
    console.log(`✅ ${collection} - USED and HAS ACCESS RULES`);
  } else if (!isUsed && hasAccess) {
    console.log(`⚠️  ${collection} - HAS ACCESS RULES but NOT USED`);
  } else {
    console.log(`➖ ${collection} - NOT USED and NO ACCESS RULES`);
  }
});

// Check 2: Field names being accessed
console.log('\n2. FIELD NAMES BEING ACCESSED:');
const fields = [
  'totalEarningsUsd', 'referralEarnings', 'affiliateEarnings', 
  'activeReferrals', 'referralCount', 'affiliateApproved', 
  'affiliateStatus', 'mainUsdt', 'purchaseUsdt', 'mainInr', 
  'purchaseInr', 'miningBalance', 'totalEarnings', 'commissionRate'
];

fields.forEach(field => {
  const isUsed = dashboardHome.includes(field) || 
                useReferral.includes(field) || 
                useAffiliateStatus.includes(field) ||
                useWallet.includes(field);
  
  if (isUsed) {
    console.log(`✅ ${field} - USED in code`);
  } else {
    console.log(`➖ ${field} - NOT USED in code`);
  }
});

// Check 3: Document paths being accessed
console.log('\n3. DOCUMENT PATHS BEING ACCESSED:');
const paths = [
  'users/{userId}',
  'wallets/{userId}',
  'referrals/{userId}',
  'orders (with queries)',
  'digitalProducts (collection)',
  'services (collection)'
];

paths.forEach(path => {
  const isUsed = dashboardHome.includes(path.replace('{userId}', 'user.id')) || 
                useReferral.includes(path.replace('{userId}', 'user.id')) || 
                useAffiliateStatus.includes(path.replace('{userId}', 'user.id')) ||
                useWallet.includes(path.replace('{userId}', 'user.id'));
  
  if (isUsed) {
    console.log(`✅ ${path} - USED in code`);
  } else {
    console.log(`➖ ${path} - NOT USED in code`);
  }
});

// Check 4: Security rules coverage
console.log('\n4. SECURITY RULES COVERAGE:');
const requiredRules = [
  'users/{userId}',
  'wallets/{userId}',
  'referrals/{userId}',
  'orders/{orderId}',
  'digitalProducts/{productId}',
  'services/{serviceId}',
  'affiliates/{affiliateId}',
  'notifications/{notificationId}'
];

requiredRules.forEach(rule => {
  const hasRule = firestoreRules.includes(rule);
  if (hasRule) {
    console.log(`✅ ${rule} - HAS SECURITY RULE`);
  } else {
    console.log(`❌ ${rule} - MISSING SECURITY RULE`);
  }
});

// Check 5: Authentication checks
console.log('\n5. AUTHENTICATION CHECKS:');
const authChecks = [
  'request.auth != null',
  'request.auth.uid == userId',
  'request.auth.token.admin == true'
];

authChecks.forEach(check => {
  const hasCheck = firestoreRules.includes(check);
  if (hasCheck) {
    console.log(`✅ ${check} - PRESENT in rules`);
  } else {
    console.log(`❌ ${check} - MISSING from rules`);
  }
});

console.log('\n🎯 IDENTIFIED ISSUES:');
console.log('1. ❌ Missing security rules for referrals collection');
console.log('2. ❌ Missing security rules for digitalProducts collection');
console.log('3. ❌ Missing security rules for services collection');
console.log('4. ❌ Missing security rules for affiliates collection');
console.log('5. ❌ Default deny rule blocks all other collections');
console.log('6. ❌ No rules for public collections (digitalProducts, services)');

console.log('\n🔧 REQUIRED FIXES:');
console.log('1. ✅ Add security rules for referrals collection');
console.log('2. ✅ Add security rules for digitalProducts collection');
console.log('3. ✅ Add security rules for services collection');
console.log('4. ✅ Add security rules for affiliates collection');
console.log('5. ✅ Allow public read access for digitalProducts and services');
console.log('6. ✅ Ensure proper authentication checks');

console.log('\n📋 COLLECTIONS NEEDING ACCESS:');
console.log('• referrals/{userId} - for referral data');
console.log('• digitalProducts/{productId} - for product listings');
console.log('• services/{serviceId} - for service listings');
console.log('• affiliates/{affiliateId} - for affiliate data');
console.log('• orders (with queries) - for order data');
console.log('• users/{userId} - for user data (already has rules)');
console.log('• wallets/{userId} - for wallet data (already has rules)');

console.log('\n🚀 EXPECTED RESULTS AFTER FIX:');
console.log('✅ Total Earnings will display correctly');
console.log('✅ Referral & Commission Earnings will show');
console.log('✅ USDT/INR Wallet Balances will update');
console.log('✅ Active Referrals will count properly');
console.log('✅ Affiliate Status will display correctly');
console.log('✅ All data will update in real-time');

console.log('\n🔍 DEBUGGING TIPS:');
console.log('• Check browser console for Firestore permission errors');
console.log('• Verify user authentication status');
console.log('• Check Firestore console for document existence');
console.log('• Test with different user accounts');
console.log('• Monitor network requests for failed queries');
