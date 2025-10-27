// Rank-based commission system utilities

export interface RankInfo {
  name: string;
  color: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  commission: number;
  icon: string;
  description: string;
}

export const RANK_DEFINITIONS: Record<string, RankInfo> = {
  'starter': {
    name: 'Starter',
    color: 'bg-green-500',
    textColor: 'text-green-300',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-600/20',
    commission: 20,
    icon: 'star',
    description: 'Entry level rank with 20% commission'
  },
  'dlx-associate': {
    name: 'DLX Associate',
    color: 'bg-blue-500',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-600/20',
    commission: 25,
    icon: 'award',
    description: 'Associate level with 25% commission'
  },
  'dlx-executive': {
    name: 'DLX Executive',
    color: 'bg-purple-500',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-600/20',
    commission: 30,
    icon: 'crown',
    description: 'Executive level with 30% commission'
  },
  'dlx-director': {
    name: 'DLX Director',
    color: 'bg-orange-500',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-500/30',
    bgColor: 'bg-orange-600/20',
    commission: 35,
    icon: 'trophy',
    description: 'Director level with 35% commission'
  },
  'dlx-president': {
    name: 'DLX President',
    color: 'bg-red-500',
    textColor: 'text-red-300',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-600/20',
    commission: 45,
    icon: 'medal',
    description: 'President level with 45% commission'
  }
};

/**
 * Get rank information for a given rank key
 */
export function getRankInfo(rank: string): RankInfo {
  return RANK_DEFINITIONS[rank] || RANK_DEFINITIONS['starter'];
}

/**
 * Calculate commission amount based on user rank and transaction amount
 */
export function calculateCommission(amount: number, userRank: string): number {
  const rankInfo = getRankInfo(userRank);
  return (amount * rankInfo.commission) / 100;
}

/**
 * Get commission percentage for a given rank
 */
export function getCommissionPercentage(userRank: string): number {
  const rankInfo = getRankInfo(userRank);
  return rankInfo.commission;
}

/**
 * Check if a user is eligible for commissions
 */
export function isEligibleForCommission(userRank: string): boolean {
  const rankInfo = getRankInfo(userRank);
  return rankInfo.commission > 0;
}

/**
 * Get rank badge classes for UI display
 */
export function getRankBadgeClasses(userRank: string): string {
  const rankInfo = getRankInfo(userRank);
  return `${rankInfo.bgColor} ${rankInfo.borderColor} ${rankInfo.textColor}`;
}

/**
 * Get rank display name
 */
export function getRankDisplayName(userRank: string): string {
  const rankInfo = getRankInfo(userRank);
  return rankInfo.name;
}

/**
 * Get all available ranks for selection
 */
export function getAllRanks(): Array<{ key: string; info: RankInfo }> {
  return Object.entries(RANK_DEFINITIONS).map(([key, info]) => ({ key, info }));
}

/**
 * Get rank statistics from user data
 */
export function getRankStatistics(users: Array<{ rank?: string }>): Record<string, number> {
  const stats: Record<string, number> = {
    starter: 0,
    'dlx-associate': 0,
    'dlx-executive': 0,
    'dlx-director': 0,
    'dlx-president': 0
  };
  
  users.forEach(user => {
    const rank = user.rank || 'starter';
    if (stats.hasOwnProperty(rank)) {
      stats[rank]++;
    }
  });
  
  return stats;
}

/**
 * Apply commission to a transaction
 * This function should be called when processing orders, purchases, or referrals
 */
export function applyCommissionToTransaction(
  transactionAmount: number,
  userRank: string,
  transactionType: 'order' | 'purchase' | 'referral'
): {
  originalAmount: number;
  commissionAmount: number;
  commissionPercentage: number;
  finalAmount: number;
} {
  const commissionPercentage = getCommissionPercentage(userRank);
  const commissionAmount = calculateCommission(transactionAmount, userRank);
  const finalAmount = transactionAmount - commissionAmount;

  return {
    originalAmount: transactionAmount,
    commissionAmount,
    commissionPercentage,
    finalAmount
  };
}

/**
 * Get rank progression requirements (for future use)
 */
export function getRankProgressionRequirements(): Record<string, {
  minReferrals?: number;
  minSales?: number;
  minEarnings?: number;
  requirements: string[];
}> {
  return {
    'starter': {
      requirements: ['Complete account setup']
    },
    'dlx-associate': {
      minReferrals: 5,
      minSales: 1000,
      requirements: ['5+ referrals', '$1000+ in sales']
    },
    'dlx-executive': {
      minReferrals: 15,
      minSales: 5000,
      minEarnings: 500,
      requirements: ['15+ referrals', '$5000+ in sales', '$500+ in earnings']
    },
    'dlx-director': {
      minReferrals: 30,
      minSales: 15000,
      minEarnings: 2000,
      requirements: ['30+ referrals', '$15000+ in sales', '$2000+ in earnings']
    },
    'dlx-president': {
      minReferrals: 50,
      minSales: 50000,
      minEarnings: 10000,
      requirements: ['50+ referrals', '$50000+ in sales', '$10000+ in earnings']
    }
  };
}
