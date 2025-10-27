# 2-Level Commission System Implementation

## 🎯 Overview

This document describes the comprehensive 2-level referral commission system implemented for the DLX platform. The system supports rank-based commissions, multi-currency proportional payouts, and instant credit after payment confirmation.

## 🏗️ System Architecture

### **Core Components**

1. **Referral Tracking System** (`src/utils/referralTracking.ts`)
   - 2-level commission calculation
   - Multi-currency support
   - Referral chain traversal
   - Instant wallet updates

2. **Rank System** (`src/utils/rankSystem.ts`)
   - 5-tier rank structure
   - Commission percentage definitions
   - Rank-based calculations

3. **Wallet Service** (`src/services/walletService.ts`)
   - Multi-currency wallet management
   - Referral income processing
   - Transaction logging

4. **Referral Income Hook** (`src/hooks/useReferralIncome.ts`)
   - Real-time income tracking
   - Multi-currency display
   - Referral statistics

## 🎖️ Commission Structure

### **Level 1 - Direct Referral (Rank-Based)**

| Rank | Commission % | Example ($500 purchase) |
|------|-------------|------------------------|
| 🟢 **Starter** | 20% | $100 |
| 🔵 **DLX Associate** | 25% | $125 |
| 🟣 **DLX Executive** | 30% | $150 |
| 🟠 **DLX Director** | 35% | $175 |
| 🔴 **DLX President** | 45% | $225 |

### **Level 2 - Indirect Referral (15% of Level 1)**

Level 2 affiliates receive 15% of their Level 1 affiliate's commission, not of the original purchase amount.

**Example:**
- Level 1 (DLX Director): $175 commission
- Level 2: $175 × 15% = $26.25 commission

## 💱 Multi-Currency Support

### **Proportional Payouts**

The system supports proportional payouts across multiple currencies:

**Example: 50% USDT + 50% DLX Payment**
- Purchase: $500 (50% USDT + 50% DLX)
- Level 1 (DLX Director): $87.50 USDT + $87.50 DLX
- Level 2: $13.13 USDT + $13.13 DLX

### **Supported Currencies**
- **DLX**: Stored in user document (`referralIncome`)
- **USDT**: Stored in wallet document (`usdt.referrallevel1/level2`)
- **INR**: Stored in wallet document (`inr.referrallevel1/level2`)

## 🔧 Implementation Details

### **1. Commission Calculation**

```typescript
// Calculate 2-level commissions
const commissionData = calculate2LevelCommission(
  amount: number,
  level1Rank: string,
  currency: 'DLX' | 'USDT' | 'INR'
);

// Returns:
// {
//   level1Commission: number,
//   level2Commission: number,
//   level1Percentage: number,
//   level2Percentage: 15
// }
```

### **2. Referral Chain Traversal**

```typescript
// Get referral chain for 2-level commissions
const { level1AffiliateId, level2AffiliateId } = await getReferralChain(userId);

// Level 1: Direct referrer of the buyer
// Level 2: Referrer of Level 1 (if exists)
```

### **3. Wallet Updates**

```typescript
// Update wallets with multi-currency payouts
await updateWalletWithCommission(
  userId: string,
  commission: number,
  currency: 'DLX' | 'USDT' | 'INR',
  commissionType: 'level1' | 'level2',
  orderId: string
);
```

### **4. Purchase Processing**

```typescript
// Process purchase with 2-level commissions
await trackReferralPurchase(
  affiliateId: string,
  userId: string,
  orderId: string,
  amount: number,
  productName: string,
  currency: 'DLX' | 'USDT' | 'INR'
);
```

## 📊 Database Schema

### **User Document Updates**

```typescript
// DLX referral income
referralIncome: {
  level1: number,
  level2: number,
  total: number,
  lastUpdated: Timestamp
}
```

### **Wallet Document Updates**

```typescript
// USDT/INR referral income
usdt: {
  mainUsdt: number,
  purchaseUsdt: number,
  referrallevel1: number,
  referrallevel2: number,
  total: number
},
inr: {
  mainInr: number,
  purchaseInr: number,
  referrallevel1: number,
  referrallevel2: number,
  total: number
}
```

### **Transaction Logging**

```typescript
// Referral transaction records
referralTransactions: {
  userId: string,
  orderId: string,
  amount: number,
  currency: 'DLX' | 'USDT' | 'INR',
  type: 'level1' | 'level2',
  timestamp: Timestamp,
  description: string
}
```

## 🎨 UI Components

### **DLX Wallet Card**

The wallet card now displays:
- **Level 1 Income**: Rank-based commission earnings
- **Level 2 Income**: 15% of Level 1's commission
- **Multi-Currency Summary**: DLX, USDT, INR totals
- **Referral Counts**: Active referrals per level

### **Real-time Updates**

- Instant wallet updates after purchase confirmation
- Live referral income tracking
- Multi-currency balance display

## 🚀 Usage Examples

### **Basic Purchase Processing**

```typescript
import { trackReferralPurchase } from './utils/referralTracking';

// Process a $500 DLX purchase
await trackReferralPurchase(
  'buyer123',
  'buyer123',
  'ORDER_123456',
  500,
  'Premium Service',
  'DLX'
);
```

### **Multi-Currency Purchase**

```typescript
// Process a $1000 purchase (50% USDT + 50% DLX)
await trackReferralPurchase(
  'buyer123',
  'buyer123',
  'ORDER_123457',
  1000,
  'Enterprise Package',
  'USDT' // Primary currency
);
```

### **Integration with Purchase Flow**

```typescript
import { integrateWithPurchaseFlow } from './utils/referralCommissionExample';

const result = await integrateWithPurchaseFlow(
  userId,
  productId,
  productName,
  price,
  paymentMethod
);

if (result.success) {
  console.log('Purchase processed with commissions:', result.orderId);
}
```

## 🔍 Testing & Validation

### **Commission Calculation Tests**

```typescript
// Test different ranks
const ranks = ['starter', 'dlx-associate', 'dlx-executive', 'dlx-director', 'dlx-president'];
ranks.forEach(rank => {
  const commission = calculate2LevelCommission(500, rank, 'DLX');
  console.log(`${rank}: L1=${commission.level1Commission}, L2=${commission.level2Commission}`);
});
```

### **Multi-Currency Tests**

```typescript
// Test proportional payouts
const usdtCommission = calculate2LevelCommission(250, 'dlx-director', 'USDT');
const dlxCommission = calculate2LevelCommission(250, 'dlx-director', 'DLX');
console.log('USDT:', usdtCommission.level1Commission);
console.log('DLX:', dlxCommission.level1Commission);
```

## 📈 Performance Considerations

### **Optimizations**

1. **Batch Operations**: All wallet updates use Firestore batch writes
2. **Real-time Listeners**: Efficient snapshot listeners for live updates
3. **Caching**: Referral chain caching to reduce database queries
4. **Error Handling**: Comprehensive error handling and rollback mechanisms

### **Monitoring**

- Transaction logging for audit trails
- Error tracking and alerting
- Performance metrics for commission processing

## 🔒 Security Features

### **Validation**

- Commission amount validation
- Currency type validation
- User permission checks
- Duplicate transaction prevention

### **Audit Trail**

- Complete transaction history
- Commission calculation logs
- Wallet update records
- Error tracking and reporting

## 🎯 Future Enhancements

### **Planned Features**

1. **Dynamic Commission Rates**: Admin-configurable commission percentages
2. **Tier Progression**: Automatic rank upgrades based on performance
3. **Bonus Structures**: Special commission bonuses for milestones
4. **Analytics Dashboard**: Comprehensive referral analytics
5. **Mobile Notifications**: Real-time commission notifications

### **Scalability**

- Support for additional currencies
- Multi-level commission structures (3+ levels)
- Advanced referral tracking and analytics
- Integration with external payment systems

## 📚 API Reference

### **Core Functions**

- `calculate2LevelCommission()`: Calculate commissions based on rank
- `getReferralChain()`: Get Level 1 and Level 2 affiliate IDs
- `updateWalletWithCommission()`: Update wallets with commission payouts
- `trackReferralPurchase()`: Process purchase with 2-level commissions

### **Hooks**

- `useReferralIncome()`: Real-time referral income tracking
- `useUserRank()`: User rank information and updates

### **Services**

- `WalletService.processReferralCommission()`: Process multi-currency commissions
- `WalletService.getWalletBalance()`: Get current wallet balances

---

This implementation provides a robust, scalable, and user-friendly 2-level commission system that supports multiple currencies and provides instant payouts to affiliates based on their rank and referral performance.
