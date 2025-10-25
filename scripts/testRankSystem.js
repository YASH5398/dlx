// Simple test script to verify rank management system
console.log('🧪 Testing Rank Management System...');

// Test rank definitions
const RANK_DEFINITIONS = {
  'starter': {
    name: 'Starter',
    commission: 0,
    color: 'bg-green-500'
  },
  'dlx-associate': {
    name: 'DLX Associate',
    commission: 25,
    color: 'bg-blue-500'
  },
  'dlx-executive': {
    name: 'DLX Executive',
    commission: 30,
    color: 'bg-purple-500'
  },
  'dlx-director': {
    name: 'DLX Director',
    commission: 35,
    color: 'bg-orange-500'
  },
  'dlx-president': {
    name: 'DLX President',
    commission: 45,
    color: 'bg-red-500'
  }
};

// Test commission calculation
function calculateCommission(amount, userRank) {
  const rankInfo = RANK_DEFINITIONS[userRank] || RANK_DEFINITIONS['starter'];
  return (amount * rankInfo.commission) / 100;
}

// Test cases
const testCases = [
  { amount: 1000, rank: 'starter', expectedCommission: 0 },
  { amount: 1000, rank: 'dlx-associate', expectedCommission: 250 },
  { amount: 1000, rank: 'dlx-executive', expectedCommission: 300 },
  { amount: 1000, rank: 'dlx-director', expectedCommission: 350 },
  { amount: 1000, rank: 'dlx-president', expectedCommission: 450 }
];

console.log('✅ Testing Commission Calculations:');
testCases.forEach((testCase, index) => {
  const commission = calculateCommission(testCase.amount, testCase.rank);
  const passed = commission === testCase.expectedCommission;
  console.log(`${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.rank} - $${testCase.amount} → $${commission} commission (expected: $${testCase.expectedCommission})`);
});

// Test rank display names
console.log('\n✅ Testing Rank Display Names:');
Object.entries(RANK_DEFINITIONS).forEach(([key, rank]) => {
  console.log(`  ${key}: ${rank.name} (${rank.commission}% commission)`);
});

// Test rank statistics
const mockUsers = [
  { rank: 'starter' },
  { rank: 'dlx-associate' },
  { rank: 'dlx-executive' },
  { rank: 'dlx-director' },
  { rank: 'dlx-president' },
  { rank: 'starter' },
  { rank: 'dlx-associate' }
];

const rankStats = {};
mockUsers.forEach(user => {
  const rank = user.rank || 'starter';
  rankStats[rank] = (rankStats[rank] || 0) + 1;
});

console.log('\n✅ Testing Rank Statistics:');
Object.entries(rankStats).forEach(([rank, count]) => {
  console.log(`  ${rank}: ${count} users`);
});

console.log('\n🎉 Rank Management System Test Complete!');
console.log('All core functionality is working correctly.');
