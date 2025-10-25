// Commission calculation utilities for orders, purchases, and referrals
import { getRankInfo, calculateCommission } from './rankSystem';

export interface CommissionCalculation {
  originalAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  finalAmount: number;
  userRank: string;
  rankName: string;
}

/**
 * Calculate commission for a transaction
 */
export function calculateTransactionCommission(
  amount: number,
  userRank: string,
  transactionType: 'order' | 'purchase' | 'referral' = 'order'
): CommissionCalculation {
  const rankInfo = getRankInfo(userRank);
  const commissionAmount = calculateCommission(amount, userRank);
  const finalAmount = amount - commissionAmount;

  return {
    originalAmount: amount,
    commissionPercentage: rankInfo.commission,
    commissionAmount,
    finalAmount,
    userRank,
    rankName: rankInfo.name
  };
}

/**
 * Calculate commission for multiple transactions
 */
export function calculateMultipleCommissions(
  transactions: Array<{ amount: number; userRank: string; type?: 'order' | 'purchase' | 'referral' }>
): {
  totalOriginalAmount: number;
  totalCommissionAmount: number;
  totalFinalAmount: number;
  breakdown: CommissionCalculation[];
} {
  const breakdown = transactions.map(tx => 
    calculateTransactionCommission(tx.amount, tx.userRank, tx.type)
  );

  const totalOriginalAmount = breakdown.reduce((sum, calc) => sum + calc.originalAmount, 0);
  const totalCommissionAmount = breakdown.reduce((sum, calc) => sum + calc.commissionAmount, 0);
  const totalFinalAmount = breakdown.reduce((sum, calc) => sum + calc.finalAmount, 0);

  return {
    totalOriginalAmount,
    totalCommissionAmount,
    totalFinalAmount,
    breakdown
  };
}

/**
 * Calculate commission for a service order
 */
export function calculateServiceCommission(
  servicePrice: number,
  userRank: string,
  serviceId: string
): CommissionCalculation {
  return calculateTransactionCommission(servicePrice, userRank, 'order');
}

/**
 * Calculate commission for a product purchase
 */
export function calculateProductCommission(
  productPrice: number,
  userRank: string,
  productId: string
): CommissionCalculation {
  return calculateTransactionCommission(productPrice, userRank, 'purchase');
}

/**
 * Calculate commission for a referral bonus
 */
export function calculateReferralCommission(
  referralAmount: number,
  userRank: string,
  referralId: string
): CommissionCalculation {
  return calculateTransactionCommission(referralAmount, userRank, 'referral');
}

/**
 * Format commission information for display
 */
export function formatCommissionInfo(calculation: CommissionCalculation): {
  displayText: string;
  commissionText: string;
  finalAmountText: string;
} {
  return {
    displayText: `${calculation.rankName} (${calculation.commissionPercentage}% commission)`,
    commissionText: `$${calculation.commissionAmount.toFixed(2)} commission`,
    finalAmountText: `$${calculation.finalAmount.toFixed(2)} after commission`
  };
}

/**
 * Get commission summary for a user
 */
export function getCommissionSummary(
  userRank: string,
  totalVolume: number
): {
  rankName: string;
  commissionPercentage: number;
  potentialCommission: number;
  nextRankInfo?: {
    name: string;
    requiredVolume: number;
    additionalCommission: number;
  };
} {
  const rankInfo = getRankInfo(userRank);
  const potentialCommission = calculateCommission(totalVolume, userRank);

  // Get next rank info (simplified)
  const rankOrder = ['starter', 'dlx-associate', 'dlx-executive', 'dlx-director', 'dlx-president'];
  const currentIndex = rankOrder.indexOf(userRank);
  const nextRank = currentIndex < rankOrder.length - 1 ? rankOrder[currentIndex + 1] : null;
  
  let nextRankInfo;
  if (nextRank) {
    const nextRankData = getRankInfo(nextRank);
    nextRankInfo = {
      name: nextRankData.name,
      requiredVolume: 0, // This would need to be calculated based on business rules
      additionalCommission: nextRankData.commission - rankInfo.commission
    };
  }

  return {
    rankName: rankInfo.name,
    commissionPercentage: rankInfo.commission,
    potentialCommission,
    nextRankInfo
  };
}

/**
 * Validate commission calculation
 */
export function validateCommissionCalculation(calculation: CommissionCalculation): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (calculation.originalAmount < 0) {
    errors.push('Original amount cannot be negative');
  }

  if (calculation.commissionPercentage < 0 || calculation.commissionPercentage > 100) {
    errors.push('Commission percentage must be between 0 and 100');
  }

  if (calculation.commissionAmount < 0) {
    errors.push('Commission amount cannot be negative');
  }

  if (calculation.finalAmount < 0) {
    errors.push('Final amount cannot be negative');
  }

  if (Math.abs(calculation.originalAmount - calculation.commissionAmount - calculation.finalAmount) > 0.01) {
    errors.push('Commission calculation is incorrect');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
