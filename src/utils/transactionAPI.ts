import { 
  collection, 
  doc, 
  addDoc, 
  runTransaction, 
  serverTimestamp,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { firestore } from '../firebase';

// Retry utility with exponential backoff for rate limit errors
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (429 or quota exceeded)
      const isRateLimitError = 
        error?.code === 'resource-exhausted' ||
        error?.code === 8 ||
        error?.message?.includes('429') ||
        error?.message?.toLowerCase().includes('quota') ||
        error?.message?.toLowerCase().includes('too many requests');
      
      // Only retry on rate limit errors
      if (!isRateLimitError || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, attempt);
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Types
export interface DepositRequest {
  id?: string;
  userId: string;
  amount: number;
  method: string;
  status: 'pending' | 'pending_manual' | 'done' | 'rejected';
  currency: string;
  fees: number;
  txnId?: string;
  notes?: string;
  createdAt: any;
  approvedAt?: any;
  reviewedBy?: string;
  approvedBy?: string;
  transactionId?: string; // Link to transaction document
}

export interface WithdrawalRequest {
  id?: string;
  userId: string;
  amount: number;
  method: string;
  walletType: 'main' | 'purchase';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  currency: string;
  fees: number;
  txnId?: string;
  notes?: string;
  createdAt: any;
  approvedAt?: any;
  reviewedBy?: string;
  approvedBy?: string;
  transactionId?: string; // Link to transaction document
}

export interface Transaction {
  id?: string;
  type: 'deposit' | 'withdraw' | 'swap';
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'rejected';
  description: string;
  requestId?: string; // Link to request document
  swapRequestId?: string; // Link to swap request document
  dlxAmount?: number; // DLX amount swapped (for swaps)
  createdAt: any;
  updatedAt?: any;
}

export interface SwapRequest {
  id?: string;
  userId: string;
  dlxAmount: number;
  usdtAmount: number;
  status: 'pending' | 'success' | 'failed' | 'rejected';
  exchangeRate: number;
  transactionId?: string; // Link to transaction document
  verifiedAt?: any;
  createdAt: any;
  updatedAt?: any;
}

export interface WalletData {
  mainUsdt: number;
  purchaseUsdt: number;
  mainInr: number;
  purchaseInr: number;
  dlx: number;
  walletUpdatedAt: any;
}

// Generate a fallback transaction id when upstream does not provide one
function generateFallbackTxnId(prefix: string): string {
  const timePart = Date.now().toString(36).toUpperCase();
  const randPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}-${timePart}-${randPart}`;
}

// Atomic deposit request creation
export async function createDepositRequest(data: {
  userId: string;
  amount: number;
  method: string;
  currency: string;
  fees?: number;
  txnId?: string;
  notes?: string;
  address?: string; // For USDT deposits
  network?: string; // e.g., TRC20, BEP20
}): Promise<{ requestId: string; transactionId: string }> {
  const { userId, amount, method, currency, fees = 0, txnId, notes } = data;
  
  if (!userId || !amount || amount <= 0) {
    throw new Error('Invalid deposit request data');
  }

  const description = method.includes('upi') 
    ? 'Deposit via UPI' 
    : `Deposit via ${method.toUpperCase()}`;

  // Ensure txnId is always present. For INR (UPI) deposits, generate a readable fallback.
  const ensuredTxnId = txnId && txnId.trim().length > 0
    ? txnId
    : generateFallbackTxnId(method.includes('upi') ? 'INR' : 'DEP');

  return retryWithBackoff(async () => {
    let requestId: string;
    let transactionId: string;

    await runTransaction(firestore, async (tx) => {
      // 1. Create deposit request
      const requestRef = doc(collection(firestore, 'depositRequests'));
      const requestData: DepositRequest = {
        userId,
        amount,
        method,
        status: 'pending',
        currency,
        fees,
        txnId: ensuredTxnId,
        notes,
        createdAt: serverTimestamp()
      };
      // Attach address and network if provided
      if ((data as any).address) (requestData as any).address = (data as any).address;
      if ((data as any).network) (requestData as any).network = (data as any).network;
      
      tx.set(requestRef, requestData);
      requestId = requestRef.id;

      // 2. Create transaction document
      const transactionRef = doc(collection(firestore, 'wallets', userId, 'transactions'));
      const transactionData: Transaction = {
        type: 'deposit',
        amount,
        currency,
        status: 'pending',
        description: `${description} (Admin Verification Pending)`,
        requestId: requestRef.id,
        createdAt: serverTimestamp()
      };
      
      tx.set(transactionRef, transactionData);
      transactionId = transactionRef.id;

      // 3. Update request with transaction ID
      tx.update(requestRef, { transactionId: transactionRef.id });
    });

    return { requestId: requestId!, transactionId: transactionId! };
  }, 3, 1000).catch((error) => {
    console.error('Failed to create deposit request after retries:', error);
    throw new Error('Failed to create deposit request. Please try again.');
  });
}

// Atomic withdrawal request creation
export async function createWithdrawalRequest(data: {
  userId: string;
  amount: number;
  method: string;
  walletType: 'main' | 'purchase';
  currency: string;
  fees?: number;
  notes?: string;
}): Promise<{ requestId: string; transactionId: string }> {
  const { userId, amount, method, walletType, currency, fees = 0, notes } = data;
  
  if (!userId || !amount || amount <= 0) {
    throw new Error('Invalid withdrawal request data');
  }

  const description = method.includes('upi') 
    ? 'Withdrawal to UPI' 
    : `Withdrawal to ${method.toUpperCase()}`;

  return retryWithBackoff(async () => {
    let requestId: string;
    let transactionId: string;

    await runTransaction(firestore, async (tx) => {
      // 1. Create withdrawal request
      const requestRef = doc(collection(firestore, 'withdrawalRequests'));
      const requestData: WithdrawalRequest = {
        userId,
        amount,
        method,
        walletType,
        status: 'pending',
        currency,
        fees,
        notes,
        createdAt: serverTimestamp()
      };
      
      tx.set(requestRef, requestData);
      requestId = requestRef.id;

      // 2. Create transaction document
      const transactionRef = doc(collection(firestore, 'wallets', userId, 'transactions'));
      const transactionData: Transaction = {
        type: 'withdraw',
        amount,
        currency,
        status: 'pending',
        description: `${description} (Admin Verification Pending)`,
        requestId: requestRef.id,
        createdAt: serverTimestamp()
      };
      
      tx.set(transactionRef, transactionData);
      transactionId = transactionRef.id;

      // 3. Update request with transaction ID
      tx.update(requestRef, { transactionId: transactionRef.id });
    });

    return { requestId: requestId!, transactionId: transactionId! };
  }, 3, 1000).catch((error) => {
    console.error('Failed to create withdrawal request after retries:', error);
    throw new Error('Failed to create withdrawal request. Please try again.');
  });
}

// Atomic deposit approval
export async function approveDeposit(requestId: string, adminId: string, adminEmail: string): Promise<void> {
  return retryWithBackoff(async () => {
    await runTransaction(firestore, async (tx) => {
      // 1. Get deposit request
      const requestRef = doc(firestore, 'depositRequests', requestId);
      const requestSnap = await tx.get(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Deposit request not found');
      }

      const requestData = requestSnap.data() as DepositRequest;
      
      // 2. Validate status (allow admin approval for pending and pending_manual)
      if (requestData.status !== 'pending' && requestData.status !== 'pending_manual') {
        throw new Error(`Request already processed. Current status: ${requestData.status}`);
      }

      // 3. Get user wallet
      const walletRef = doc(firestore, 'wallets', requestData.userId);
      const walletSnap = await tx.get(walletRef);
      
      if (!walletSnap.exists()) {
        throw new Error('User wallet not found');
      }

      const walletData = walletSnap.data() as WalletData;
      const currentBalance = Number(walletData.mainUsdt || 0);
      const newBalance = currentBalance + requestData.amount;

      // 4. Update wallet (canonical structure)
      tx.update(walletRef, {
        'usdt.mainUsdt': newBalance,
        walletUpdatedAt: serverTimestamp()
      });

      // 5. Update request status to 'done'
      tx.update(requestRef, {
        status: 'done',
        approvedAt: serverTimestamp(),
        reviewedBy: adminId,
        approvedBy: adminEmail
      });

      // 6. Update transaction status
      if (requestData.transactionId) {
        const transactionRef = doc(firestore, 'wallets', requestData.userId, 'transactions', requestData.transactionId);
        tx.update(transactionRef, {
          status: 'success',
          description: `Deposit via ${requestData.method} (Approved and Credited)`,
          updatedAt: serverTimestamp()
        });
      }

      // 7. Create audit log
      const auditRef = doc(collection(firestore, 'audit_logs'));
      tx.set(auditRef, {
        actor_id: adminId,
        actor_email: adminEmail,
        action: 'approve_deposit',
        target_type: 'deposit_request',
        target_id: requestId,
        meta: {
          userId: requestData.userId,
          amount: requestData.amount,
          method: requestData.method,
          currency: requestData.currency,
          previousBalance: currentBalance,
          newBalance: newBalance
        },
        created_at: serverTimestamp()
      });
    });
  }, 3, 1000).catch((error) => {
    console.error('Failed to approve deposit after retries:', error);
    throw error;
  });
}

// Atomic withdrawal approval
export async function approveWithdrawal(requestId: string, adminId: string, adminEmail: string): Promise<void> {
  return retryWithBackoff(async () => {
    await runTransaction(firestore, async (tx) => {
      // 1. Get withdrawal request
      const requestRef = doc(firestore, 'withdrawalRequests', requestId);
      const requestSnap = await tx.get(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Withdrawal request not found');
      }

      const requestData = requestSnap.data() as WithdrawalRequest;
      
      // 2. Validate status
      if (requestData.status !== 'pending') {
        throw new Error(`Request already processed. Current status: ${requestData.status}`);
      }

      // 3. Get user wallet
      const walletRef = doc(firestore, 'wallets', requestData.userId);
      const walletSnap = await tx.get(walletRef);
      
      if (!walletSnap.exists()) {
        throw new Error('User wallet not found');
      }

      const walletData = walletSnap.data() as WalletData;
      const walletType = requestData.walletType;
      const balanceField = walletType === 'main' ? 'mainUsdt' : 'purchaseUsdt';
      const currentBalance = Number(walletData[balanceField] || 0);

      // 4. Check sufficient balance
      if (currentBalance < requestData.amount) {
        throw new Error(`Insufficient balance. Available: ${currentBalance} ${requestData.currency}, Requested: ${requestData.amount} ${requestData.currency}`);
      }

      const newBalance = currentBalance - requestData.amount;

      // 5. Update wallet (canonical structure)
      const updateData: any = {
        [`usdt.${balanceField}`]: newBalance,
        walletUpdatedAt: serverTimestamp()
      };
      tx.update(walletRef, updateData);

      // 6. Update request status
      tx.update(requestRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        reviewedBy: adminId,
        approvedBy: adminEmail
      });

      // 7. Update transaction status
      if (requestData.transactionId) {
        const transactionRef = doc(firestore, 'wallets', requestData.userId, 'transactions', requestData.transactionId);
        tx.update(transactionRef, {
          status: 'success',
          description: `Withdrawal to ${requestData.method} (Approved and Processed)`,
          updatedAt: serverTimestamp()
        });
      }

      // 8. Create audit log
      const auditRef = doc(collection(firestore, 'audit_logs'));
      tx.set(auditRef, {
        actor_id: adminId,
        actor_email: adminEmail,
        action: 'approve_withdrawal',
        target_type: 'withdrawal_request',
        target_id: requestId,
        meta: {
          userId: requestData.userId,
          amount: requestData.amount,
          method: requestData.method,
          walletType: requestData.walletType,
          currency: requestData.currency,
          previousBalance: currentBalance,
          newBalance: newBalance
        },
        created_at: serverTimestamp()
      });
    });
  }, 3, 1000).catch((error) => {
    console.error('Failed to approve withdrawal after retries:', error);
    throw error;
  });
}

// Reject deposit
export async function rejectDeposit(requestId: string, adminId: string, adminEmail: string, reason?: string): Promise<void> {
  return retryWithBackoff(async () => {
    await runTransaction(firestore, async (tx) => {
      const requestRef = doc(firestore, 'depositRequests', requestId);
      const requestSnap = await tx.get(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Deposit request not found');
      }

      const requestData = requestSnap.data() as DepositRequest;
      
      if (requestData.status !== 'pending' && requestData.status !== 'pending_manual') {
        throw new Error(`Request already processed. Current status: ${requestData.status}`);
      }

      // Update request status
      tx.update(requestRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        reviewedBy: adminId,
        rejectedBy: adminEmail
      });

      // Update transaction status
      if (requestData.transactionId) {
        const transactionRef = doc(firestore, 'wallets', requestData.userId, 'transactions', requestData.transactionId);
        tx.update(transactionRef, {
          status: 'rejected',
          description: `Deposit via ${requestData.method} (Rejected)`,
          updatedAt: serverTimestamp()
        });
      }

      // Create audit log
      const auditRef = doc(collection(firestore, 'audit_logs'));
      tx.set(auditRef, {
        actor_id: adminId,
        actor_email: adminEmail,
        action: 'reject_deposit',
        target_type: 'deposit_request',
        target_id: requestId,
        meta: {
          userId: requestData.userId,
          amount: requestData.amount,
          method: requestData.method,
          currency: requestData.currency,
          reason: reason || 'Admin rejection'
        },
        created_at: serverTimestamp()
      });
    });
  }, 3, 1000).catch((error) => {
    console.error('Failed to reject deposit after retries:', error);
    throw error;
  });
}

// Reject withdrawal
export async function rejectWithdrawal(requestId: string, adminId: string, adminEmail: string, reason?: string): Promise<void> {
  return retryWithBackoff(async () => {
    await runTransaction(firestore, async (tx) => {
      const requestRef = doc(firestore, 'withdrawalRequests', requestId);
      const requestSnap = await tx.get(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Withdrawal request not found');
      }

      const requestData = requestSnap.data() as WithdrawalRequest;
      
      if (requestData.status !== 'pending') {
        throw new Error(`Request already processed. Current status: ${requestData.status}`);
      }

      // Update request status
      tx.update(requestRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        reviewedBy: adminId,
        rejectedBy: adminEmail
      });

      // Update transaction status
      if (requestData.transactionId) {
        const transactionRef = doc(firestore, 'wallets', requestData.userId, 'transactions', requestData.transactionId);
        tx.update(transactionRef, {
          status: 'rejected',
          description: `Withdrawal to ${requestData.method} (Rejected)`,
          updatedAt: serverTimestamp()
        });
      }

      // Create audit log
      const auditRef = doc(collection(firestore, 'audit_logs'));
      tx.set(auditRef, {
        actor_id: adminId,
        actor_email: adminEmail,
        action: 'reject_withdrawal',
        target_type: 'withdrawal_request',
        target_id: requestId,
        meta: {
          userId: requestData.userId,
          amount: requestData.amount,
          method: requestData.method,
          walletType: requestData.walletType,
          currency: requestData.currency,
          reason: reason || 'Admin rejection'
        },
        created_at: serverTimestamp()
      });
    });
  }, 3, 1000).catch((error) => {
    console.error('Failed to reject withdrawal after retries:', error);
    throw error;
  });
}

// Get user's deposit requests
export async function getUserDepositRequests(userId: string): Promise<DepositRequest[]> {
  const q = query(
    collection(firestore, 'depositRequests'),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as DepositRequest));
}

// Get user's withdrawal requests
export async function getUserWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]> {
  const q = query(
    collection(firestore, 'withdrawalRequests'),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as WithdrawalRequest));
}

// Atomic DLX to USDT swap - processes immediately and credits purchase wallet
export async function processSwap(data: {
  userId: string;
  dlxAmount: number;
  exchangeRate?: number; // Default 0.1 if not provided
}): Promise<{ swapRequestId: string; transactionId: string }> {
  const { userId, dlxAmount, exchangeRate = 0.1 } = data;
  
  if (!userId || !dlxAmount || dlxAmount < 50) {
    throw new Error('Invalid swap request. Minimum 50 DLX required.');
  }

  const usdtAmount = Number((dlxAmount * exchangeRate).toFixed(2));

  return retryWithBackoff(async () => {
    let swapRequestId: string;
    let transactionId: string;

    await runTransaction(firestore, async (tx) => {
      // 1. Get user document for DLX balance
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await tx.get(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnap.data() as any;
      const currentDlx = Number(userData?.wallet?.miningBalance || 0);

      // 2. Check sufficient DLX balance
      if (currentDlx < dlxAmount) {
        throw new Error(`Insufficient DLX balance. Available: ${currentDlx.toFixed(2)} DLX, Required: ${dlxAmount.toFixed(2)} DLX`);
      }

      // 3. Get wallet document for USDT balance
      const walletRef = doc(firestore, 'wallets', userId);
      const walletSnap = await tx.get(walletRef);
      
      if (!walletSnap.exists()) {
        // Create wallet if it doesn't exist
        tx.set(walletRef, {
          usdt: { mainUsdt: 0, purchaseUsdt: 0 },
          inr: { mainInr: 0, purchaseInr: 0 },
          dlx: 0,
          walletUpdatedAt: serverTimestamp()
        });
      }

      const walletData = walletSnap.data() as any;
      const currentPurchaseUsdt = Number(walletData?.usdt?.purchaseUsdt || 0);
      const newPurchaseUsdt = Number((currentPurchaseUsdt + usdtAmount).toFixed(2));
      const newDlx = Number((currentDlx - dlxAmount).toFixed(2));

      // 4. Update DLX balance in user document
      tx.update(userRef, {
        'wallet.miningBalance': newDlx,
        'wallet.updatedAt': serverTimestamp()
      });

      // 5. Credit USDT to purchase wallet
      tx.update(walletRef, {
        'usdt.purchaseUsdt': newPurchaseUsdt,
        walletUpdatedAt: serverTimestamp()
      });

      // 6. Create swap request document
      const swapRequestRef = doc(collection(firestore, 'swapRequests'));
      const swapRequestData: SwapRequest = {
        userId,
        dlxAmount,
        usdtAmount,
        status: 'success', // Mark as success immediately since we processed it atomically
        exchangeRate,
        createdAt: serverTimestamp()
      };
      
      tx.set(swapRequestRef, swapRequestData);
      swapRequestId = swapRequestRef.id;

      // 7. Create transaction document with success status
      const transactionRef = doc(collection(firestore, 'wallets', userId, 'transactions'));
      const transactionData: Transaction = {
        type: 'swap',
        amount: usdtAmount,
        currency: 'USDT',
        status: 'success',
        description: `Swapped ${dlxAmount.toFixed(2)} DLX to ${usdtAmount.toFixed(2)} USDT (Credited to Purchase Wallet)`,
        swapRequestId: swapRequestRef.id,
        dlxAmount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      tx.set(transactionRef, transactionData);
      transactionId = transactionRef.id;

      // 8. Update swap request with transaction ID
      tx.update(swapRequestRef, { 
        transactionId: transactionRef.id,
        updatedAt: serverTimestamp()
      });
    });

    return { swapRequestId: swapRequestId!, transactionId: transactionId! };
  }, 3, 1000).catch((error: any) => {
    console.error('Failed to process swap after retries:', error);
    throw new Error(error?.message || 'Failed to process swap. Please try again.');
  });
}