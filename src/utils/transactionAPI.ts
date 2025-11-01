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
import { firestore } from '../firebase';

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
  type: 'deposit' | 'withdraw';
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'rejected';
  description: string;
  requestId?: string; // Link to request document
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

  let requestId: string;
  let transactionId: string;

  try {
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
  } catch (error) {
    console.error('Failed to create deposit request:', error);
    throw new Error('Failed to create deposit request. Please try again.');
  }
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

  let requestId: string;
  let transactionId: string;

  try {
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
  } catch (error) {
    console.error('Failed to create withdrawal request:', error);
    throw new Error('Failed to create withdrawal request. Please try again.');
  }
}

// Atomic deposit approval
export async function approveDeposit(requestId: string, adminId: string, adminEmail: string): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Failed to approve deposit:', error);
    throw error;
  }
}

// Atomic withdrawal approval
export async function approveWithdrawal(requestId: string, adminId: string, adminEmail: string): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Failed to approve withdrawal:', error);
    throw error;
  }
}

// Reject deposit
export async function rejectDeposit(requestId: string, adminId: string, adminEmail: string, reason?: string): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Failed to reject deposit:', error);
    throw error;
  }
}

// Reject withdrawal
export async function rejectWithdrawal(requestId: string, adminId: string, adminEmail: string, reason?: string): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Failed to reject withdrawal:', error);
    throw error;
  }
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