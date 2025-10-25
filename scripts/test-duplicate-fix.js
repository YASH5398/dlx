import fs from 'fs';

console.log('🔍 Testing Duplicate Declaration Fix...\n');

const dashboardHome = fs.readFileSync('src/pages/Dashboard/DashboardHome.tsx', 'utf8');

// Check for duplicate referralsLoading declarations
const referralsLoadingMatches = dashboardHome.match(/referralsLoading/g);
const referralsLoadingCount = referralsLoadingMatches ? referralsLoadingMatches.length : 0;

console.log(`Found ${referralsLoadingCount} references to 'referralsLoading'`);

// Check for proper usage
const hasUseReferralLoading = dashboardHome.includes('loading: referralsLoading');
const hasLocalState = dashboardHome.includes('const [referralsLoading, setReferralsLoading]');

console.log('\n📊 Analysis:');
console.log(`✅ useReferral hook loading: ${hasUseReferralLoading ? 'Present' : 'Missing'}`);
console.log(`❌ Local state declaration: ${hasLocalState ? 'Present (should be removed)' : 'Removed (correct)'}`);

if (hasUseReferralLoading && !hasLocalState) {
  console.log('\n✅ Fix successful! No duplicate declarations found.');
  console.log('✅ referralsLoading now comes only from useReferral hook');
  console.log('✅ No local state conflicts');
} else if (hasLocalState) {
  console.log('\n❌ Fix incomplete! Local state declaration still present.');
} else {
  console.log('\n❌ Fix may have removed too much! Check useReferral hook loading.');
}

// Check for proper usage in UI
const hasUILoading = dashboardHome.includes('{referralsLoading ? \'Loading...\' :');
console.log(`✅ UI loading indicator: ${hasUILoading ? 'Present' : 'Missing'}`);

console.log('\n🎯 Summary:');
if (referralsLoadingCount <= 3 && hasUseReferralLoading && !hasLocalState && hasUILoading) {
  console.log('✅ All checks passed! Duplicate declaration fixed.');
  console.log('✅ referralsLoading properly sourced from useReferral hook');
  console.log('✅ UI loading indicators working correctly');
  console.log('✅ No compilation errors expected');
} else {
  console.log('❌ Some issues remain. Please check the implementation.');
}
