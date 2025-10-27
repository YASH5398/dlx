import { firestore } from '../firebase';
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund';
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  metadata?: {
    orderId?: string;
    productType?: string;
    productId?: string;
  };
}

export interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export class WalletService {
  static async getWalletBalance(userId: string): Promise<number> {
    try {
      const walletDoc = await getDoc(doc(firestore, 'wallets', userId));
      if (walletDoc.exists()) {
        const data = walletDoc.data();
        return data.balance || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return 0;
    }
  }

  static async updateWalletBalance(userId: string, amount: number, type: 'add' | 'subtract'): Promise<boolean> {
    try {
      const walletRef = doc(firestore, 'wallets', userId);
      const walletDoc = await getDoc(walletRef);
      
      let currentBalance = 0;
      if (walletDoc.exists()) {
        currentBalance = walletDoc.data().balance || 0;
      }

      const newBalance = type === 'add' 
        ? currentBalance + amount 
        : Math.max(0, currentBalance - amount);

      if (type === 'subtract' && newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      await updateDoc(walletRef, {
        balance: newBalance,
        lastUpdated: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      return false;
    }
  }

  static async createTransaction(
    userId: string,
    type: WalletTransaction['type'],
    amount: number,
    description: string,
    metadata?: WalletTransaction['metadata']
  ): Promise<string> {
    try {
      const transactionData: Omit<WalletTransaction, 'id'> = {
        userId,
        type,
        amount,
        currency: 'USD',
        description,
        status: 'completed',
        createdAt: new Date().toISOString(),
        metadata
      };

      const docRef = await addDoc(collection(firestore, 'wallet_transactions'), transactionData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  static async processPurchase(
    userId: string,
    amount: number,
    productType: string,
    productId: string,
    productName: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Check if user has sufficient balance
      const currentBalance = await this.getWalletBalance(userId);
      if (currentBalance < amount) {
        return {
          success: false,
          error: 'Insufficient wallet balance'
        };
      }

      // Deduct amount from wallet
      const balanceUpdated = await this.updateWalletBalance(userId, amount, 'subtract');
      if (!balanceUpdated) {
        return {
          success: false,
          error: 'Failed to update wallet balance'
        };
      }

      // Create transaction record
      const transactionId = await this.createTransaction(
        userId,
        'purchase',
        amount,
        `Purchase: ${productName}`,
        {
          productType,
          productId
        }
      );

      return {
        success: true,
        transactionId
      };
    } catch (error) {
      console.error('Error processing purchase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async getTransactionHistory(userId: string, limit: number = 50): Promise<WalletTransaction[]> {
    try {
      const q = query(
        collection(firestore, 'wallet_transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WalletTransaction[];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  static async addFunds(userId: string, amount: number, description: string = 'Wallet deposit'): Promise<boolean> {
    try {
      const balanceUpdated = await this.updateWalletBalance(userId, amount, 'add');
      if (balanceUpdated) {
        await this.createTransaction(
          userId,
          'deposit',
          amount,
          description
        );
      }
      return balanceUpdated;
    } catch (error) {
      console.error('Error adding funds:', error);
      return false;
    }
  }

  static async refundPurchase(
    userId: string,
    amount: number,
    originalTransactionId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const balanceUpdated = await this.updateWalletBalance(userId, amount, 'add');
      if (balanceUpdated) {
        await this.createTransaction(
          userId,
          'refund',
          amount,
          `Refund: ${reason}`,
          {
            orderId: originalTransactionId
          }
        );
      }
      return balanceUpdated;
    } catch (error) {
      console.error('Error processing refund:', error);
      return false;
    }
  }

  static async processReferralCommission(
    userId: string,
    amount: number,
    currency: 'DLX' | 'USDT' | 'INR',
    commissionType: 'level1' | 'level2',
    orderId: string
  ): Promise<boolean> {
    try {
      const { updateDoc, increment, serverTimestamp, doc, getDoc, setDoc } = await import('firebase/firestore');
      
      if (currency === 'DLX') {
        // Update DLX balance in user document
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
          [`referralIncome.${commissionType}`]: increment(amount),
          [`referralIncome.total`]: increment(amount),
          [`referralIncome.lastUpdated`]: serverTimestamp()
        });
      } else {
        // Update wallet document for USDT/INR
        const walletRef = doc(firestore, 'wallets', userId);
        const walletDoc = await getDoc(walletRef);
        
        if (walletDoc.exists()) {
          await updateDoc(walletRef, {
            [`${currency.toLowerCase()}.referral${commissionType}`]: increment(amount),
            [`${currency.toLowerCase()}.total`]: increment(amount),
            walletUpdatedAt: serverTimestamp()
          });
        } else {
          // Create wallet document if it doesn't exist
          const newWalletData: any = {
            dlx: 0,
            usdt: { mainUsdt: 0, purchaseUsdt: 0, referrallevel1: 0, referrallevel2: 0, total: 0 },
            inr: { mainInr: 0, purchaseInr: 0, referrallevel1: 0, referrallevel2: 0, total: 0 },
            walletUpdatedAt: serverTimestamp()
          };
          
          newWalletData[currency.toLowerCase()][`referral${commissionType}`] = amount;
          newWalletData[currency.toLowerCase()].total = amount;
          
          await setDoc(walletRef, newWalletData);
        }
      }
      
      // Log the commission transaction
      const transactionRef = doc(collection(firestore, 'referralTransactions'));
      await setDoc(transactionRef, {
        userId,
        orderId,
        amount,
        currency,
        type: commissionType,
        timestamp: serverTimestamp(),
        description: `Referral ${commissionType} commission - ${currency}`
      });
      
      return true;
    } catch (error) {
      console.error('Error processing referral commission:', error);
      return false;
    }
  }
}
