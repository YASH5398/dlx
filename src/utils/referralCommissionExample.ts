/**
 * Example usage of the 2-level referral commission system
 * This file demonstrates how to use the new commission structure
 */

import { trackReferralPurchase, calculate2LevelCommission } from './referralTracking';
import { getRankInfo } from './rankSystem';

/**
 * Example: Process a purchase with 2-level commissions
 */
export async function processPurchaseWithCommissions(
  buyerId: string,
  orderId: string,
  amount: number,
  productName: string,
  currency: 'DLX' | 'USDT' | 'INR' = 'DLX'
): Promise<void> {
  try {
    // Track the referral purchase - this will automatically:
    // 1. Find the referral chain (Level 1 and Level 2)
    // 2. Calculate commissions based on Level 1's rank
    // 3. Update wallets with proportional payouts
    // 4. Log all transactions
    await trackReferralPurchase(
      buyerId, // This will be used to find the referral chain
      buyerId,
      orderId,
      amount,
      productName,
      currency
    );
    
    console.log(`Purchase processed with 2-level commissions: ${amount} ${currency}`);
  } catch (error) {
    console.error('Error processing purchase with commissions:', error);
    throw error;
  }
}

/**
 * Example: Calculate commissions for different ranks
 */
export function demonstrateCommissionCalculation() {
  const purchaseAmount = 500; // $500 purchase
  
  console.log('=== 2-Level Commission Structure Examples ===\n');
  
  const ranks = ['starter', 'dlx-associate', 'dlx-executive', 'dlx-director', 'dlx-president'];
  
  ranks.forEach(rank => {
    const rankInfo = getRankInfo(rank);
    const commissionData = calculate2LevelCommission(purchaseAmount, rank, 'DLX');
    
    console.log(`${rankInfo.name} (${rankInfo.commission}% Level 1):`);
    console.log(`  Purchase Amount: $${purchaseAmount}`);
    console.log(`  Level 1 Commission: $${commissionData.level1Commission.toFixed(2)} (${commissionData.level1Percentage}%)`);
    console.log(`  Level 2 Commission: $${commissionData.level2Commission.toFixed(2)} (${commissionData.level2Percentage}% of Level 1)`);
    console.log(`  Total Commission Paid: $${(commissionData.level1Commission + commissionData.level2Commission).toFixed(2)}`);
    console.log(`  Net to Company: $${(purchaseAmount - commissionData.level1Commission - commissionData.level2Commission).toFixed(2)}\n`);
  });
}

/**
 * Example: Multi-currency proportional payout
 */
export function demonstrateMultiCurrencyPayout() {
  const purchaseAmount = 1000; // $1000 purchase
  const rank = 'dlx-director'; // 35% commission
  
  console.log('=== Multi-Currency Proportional Payout Example ===\n');
  
  // Example: 50% USDT + 50% DLX payment
  const usdtAmount = purchaseAmount * 0.5; // $500 USDT
  const dlxAmount = purchaseAmount * 0.5;  // $500 DLX equivalent
  
  const usdtCommission = calculate2LevelCommission(usdtAmount, rank, 'USDT');
  const dlxCommission = calculate2LevelCommission(dlxAmount, rank, 'DLX');
  
  console.log(`Purchase: $${purchaseAmount} (50% USDT + 50% DLX)`);
  console.log(`\nUSDT Payouts:`);
  console.log(`  Level 1: $${usdtCommission.level1Commission.toFixed(2)} USDT`);
  console.log(`  Level 2: $${usdtCommission.level2Commission.toFixed(2)} USDT`);
  console.log(`\nDLX Payouts:`);
  console.log(`  Level 1: ${dlxCommission.level1Commission.toFixed(2)} DLX`);
  console.log(`  Level 2: ${dlxCommission.level2Commission.toFixed(2)} DLX`);
  console.log(`\nTotal Commission Value: $${(usdtCommission.level1Commission + usdtCommission.level2Commission + dlxCommission.level1Commission + dlxCommission.level2Commission).toFixed(2)}`);
}

/**
 * Example: Integration with existing purchase flow
 */
export async function integrateWithPurchaseFlow(
  userId: string,
  productId: string,
  productName: string,
  price: number,
  paymentMethod: 'DLX' | 'USDT' | 'INR'
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    // Generate order ID
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Process the purchase with 2-level commissions
    await processPurchaseWithCommissions(
      userId,
      orderId,
      price,
      productName,
      paymentMethod
    );
    
    // Additional purchase processing logic would go here
    // (e.g., inventory updates, order confirmation, etc.)
    
    return {
      success: true,
      orderId
    };
  } catch (error) {
    console.error('Error in purchase flow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export for use in other parts of the application
export {
  processPurchaseWithCommissions,
  demonstrateCommissionCalculation,
  demonstrateMultiCurrencyPayout,
  integrateWithPurchaseFlow
};
