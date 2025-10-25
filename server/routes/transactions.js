import express from 'express';
import admin from 'firebase-admin';
import ensureAdmin from '../middleware/ensureAdmin.js';

const router = express.Router();
const db = admin.firestore();

// Helper function to validate transaction status
function validateTransactionStatus(currentStatus, action) {
  const validTransitions = {
    'approve_deposit': ['pending'],
    'reject_deposit': ['pending'],
    'complete_deposit': ['approved'],
    'approve_withdrawal': ['pending'],
    'reject_withdrawal': ['pending'],
    'complete_withdrawal': ['approved']
  };

  const allowedStatuses = validTransitions[action];
  if (!allowedStatuses) {
    throw new Error(`Invalid action: ${action}`);
  }

  if (!allowedStatuses.includes(currentStatus)) {
    throw new Error(`Cannot ${action.replace('_', ' ')}. Current status: ${currentStatus}. Allowed statuses: ${allowedStatuses.join(', ')}`);
  }
}

// Helper function to create audit log
async function createAuditLog(actorId, actorEmail, action, targetType, targetId, meta) {
  try {
    await db.collection('audit_logs').add({
      actor_id: actorId,
      actor_email: actorEmail,
      action,
      target_type: targetType,
      target_id: targetId,
      meta,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw here as it's not critical for the main operation
  }
}

// Helper function to create error log
async function createErrorLog(action, requestId, userId, adminId, error) {
  try {
    await db.collection('error_logs').add({
      action,
      requestId,
      userId,
      adminId,
      error,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (logError) {
    console.error('Failed to create error log:', logError);
  }
}

// Approve deposit
router.post('/deposits/:id/approve', ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.uid;
  const adminEmail = req.user.email;

  try {
    await db.runTransaction(async (tx) => {
      // Get deposit request
      const reqRef = db.collection('depositRequests').doc(id);
      const reqSnap = await tx.get(reqRef);
      
      if (!reqSnap.exists) {
        throw new Error('Deposit request not found');
      }

      const reqData = reqSnap.data();
      const currentStatus = reqData.status || 'pending';
      
      // Validate status
      validateTransactionStatus(currentStatus, 'approve_deposit');
      
      // Validate amount
      const amount = Number(reqData.amount || 0);
      if (amount <= 0) {
        throw new Error('Invalid deposit amount');
      }

      // Get user wallet
      const walletRef = db.collection('wallets').doc(reqData.userId);
      const walletSnap = await tx.get(walletRef);
      
      if (!walletSnap.exists) {
        throw new Error('User wallet not found');
      }

      const walletData = walletSnap.data();
      const usdt = walletData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
      const currentBalance = Number(usdt.mainUsdt || 0);
      const newBalance = currentBalance + amount;

      // Update wallet
      tx.update(walletRef, {
        'usdt.mainUsdt': newBalance,
        walletUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update request status
      tx.update(reqRef, {
        status: 'approved',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: adminId,
        approvedBy: adminEmail
      });

      // Create audit log
      await createAuditLog(adminId, adminEmail, 'approve_deposit', 'deposit_request', id, {
        userId: reqData.userId,
        amount: reqData.amount,
        method: reqData.method,
        currency: reqData.currency,
        fees: reqData.fees,
        txnId: reqData.txnId,
        previousBalance: currentBalance,
        newBalance: newBalance
      });
    });

    res.json({ 
      success: true, 
      message: 'Deposit approved successfully',
      amount: reqData.amount,
      currency: reqData.currency || 'USDT'
    });

  } catch (error) {
    console.error('Approve deposit failed:', error);
    
    // Log error
    await createErrorLog('approve_deposit', id, reqData?.userId, adminId, error.message);
    
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Failed to approve deposit' 
    });
  }
});

// Reject deposit
router.post('/deposits/:id/reject', ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.uid;
  const adminEmail = req.user.email;

  try {
    await db.runTransaction(async (tx) => {
      const reqRef = db.collection('depositRequests').doc(id);
      const reqSnap = await tx.get(reqRef);
      
      if (!reqSnap.exists) {
        throw new Error('Deposit request not found');
      }

      const reqData = reqSnap.data();
      const currentStatus = reqData.status || 'pending';
      
      validateTransactionStatus(currentStatus, 'reject_deposit');

      tx.update(reqRef, {
        status: 'rejected',
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: adminId,
        rejectedBy: adminEmail
      });

      await createAuditLog(adminId, adminEmail, 'reject_deposit', 'deposit_request', id, {
        userId: reqData.userId,
        amount: reqData.amount,
        method: reqData.method,
        currency: reqData.currency,
        reason: 'Admin rejection'
      });
    });

    res.json({ success: true, message: 'Deposit rejected successfully' });

  } catch (error) {
    console.error('Reject deposit failed:', error);
    await createErrorLog('reject_deposit', id, reqData?.userId, adminId, error.message);
    res.status(400).json({ success: false, error: error.message || 'Failed to reject deposit' });
  }
});

// Complete deposit
router.post('/deposits/:id/complete', ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.uid;
  const adminEmail = req.user.email;

  try {
    await db.runTransaction(async (tx) => {
      const reqRef = db.collection('depositRequests').doc(id);
      const reqSnap = await tx.get(reqRef);
      
      if (!reqSnap.exists) {
        throw new Error('Deposit request not found');
      }

      const reqData = reqSnap.data();
      const currentStatus = reqData.status || 'pending';
      
      validateTransactionStatus(currentStatus, 'complete_deposit');

      tx.update(reqRef, {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: adminId,
        completedBy: adminEmail
      });

      await createAuditLog(adminId, adminEmail, 'complete_deposit', 'deposit_request', id, {
        userId: reqData.userId,
        amount: reqData.amount,
        method: reqData.method,
        currency: reqData.currency
      });
    });

    res.json({ success: true, message: 'Deposit completed successfully' });

  } catch (error) {
    console.error('Complete deposit failed:', error);
    await createErrorLog('complete_deposit', id, reqData?.userId, adminId, error.message);
    res.status(400).json({ success: false, error: error.message || 'Failed to complete deposit' });
  }
});

// Approve withdrawal
router.post('/withdrawals/:id/approve', ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.uid;
  const adminEmail = req.user.email;

  try {
    await db.runTransaction(async (tx) => {
      const reqRef = db.collection('withdrawalRequests').doc(id);
      const reqSnap = await tx.get(reqRef);
      
      if (!reqSnap.exists) {
        throw new Error('Withdrawal request not found');
      }

      const reqData = reqSnap.data();
      const currentStatus = reqData.status || 'pending';
      
      validateTransactionStatus(currentStatus, 'approve_withdrawal');
      
      const amount = Number(reqData.amount || 0);
      if (amount <= 0) {
        throw new Error('Invalid withdrawal amount');
      }

      const walletRef = db.collection('wallets').doc(reqData.userId);
      const walletSnap = await tx.get(walletRef);
      
      if (!walletSnap.exists) {
        throw new Error('User wallet not found');
      }

      const walletData = walletSnap.data();
      const usdt = walletData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
      const walletType = reqData.walletType || 'main';
      const key = walletType === 'main' ? 'mainUsdt' : 'purchaseUsdt';
      const currentBalance = Number(usdt[key] || 0);

      if (currentBalance < amount) {
        throw new Error(`Insufficient balance. Available: ${currentBalance} ${reqData.currency || 'USDT'}, Requested: ${amount} ${reqData.currency || 'USDT'}`);
      }

      const newBalance = currentBalance - amount;
      const updated = { ...usdt, [key]: newBalance };

      tx.update(walletRef, {
        usdt: updated,
        walletUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      tx.update(reqRef, {
        status: 'approved',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: adminId,
        approvedBy: adminEmail
      });

      await createAuditLog(adminId, adminEmail, 'approve_withdrawal', 'withdrawal_request', id, {
        userId: reqData.userId,
        amount: reqData.amount,
        method: reqData.method,
        walletType: reqData.walletType,
        currency: reqData.currency,
        previousBalance: currentBalance,
        newBalance: newBalance
      });
    });

    res.json({ success: true, message: 'Withdrawal approved successfully' });

  } catch (error) {
    console.error('Approve withdrawal failed:', error);
    await createErrorLog('approve_withdrawal', id, reqData?.userId, adminId, error.message);
    res.status(400).json({ success: false, error: error.message || 'Failed to approve withdrawal' });
  }
});

// Reject withdrawal
router.post('/withdrawals/:id/reject', ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.uid;
  const adminEmail = req.user.email;

  try {
    await db.runTransaction(async (tx) => {
      const reqRef = db.collection('withdrawalRequests').doc(id);
      const reqSnap = await tx.get(reqRef);
      
      if (!reqSnap.exists) {
        throw new Error('Withdrawal request not found');
      }

      const reqData = reqSnap.data();
      const currentStatus = reqData.status || 'pending';
      
      validateTransactionStatus(currentStatus, 'reject_withdrawal');

      tx.update(reqRef, {
        status: 'rejected',
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: adminId,
        rejectedBy: adminEmail
      });

      await createAuditLog(adminId, adminEmail, 'reject_withdrawal', 'withdrawal_request', id, {
        userId: reqData.userId,
        amount: reqData.amount,
        method: reqData.method,
        walletType: reqData.walletType,
        currency: reqData.currency,
        reason: 'Admin rejection'
      });
    });

    res.json({ success: true, message: 'Withdrawal rejected successfully' });

  } catch (error) {
    console.error('Reject withdrawal failed:', error);
    await createErrorLog('reject_withdrawal', id, reqData?.userId, adminId, error.message);
    res.status(400).json({ success: false, error: error.message || 'Failed to reject withdrawal' });
  }
});

// Complete withdrawal
router.post('/withdrawals/:id/complete', ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.uid;
  const adminEmail = req.user.email;

  try {
    await db.runTransaction(async (tx) => {
      const reqRef = db.collection('withdrawalRequests').doc(id);
      const reqSnap = await tx.get(reqRef);
      
      if (!reqSnap.exists) {
        throw new Error('Withdrawal request not found');
      }

      const reqData = reqSnap.data();
      const currentStatus = reqData.status || 'pending';
      
      validateTransactionStatus(currentStatus, 'complete_withdrawal');

      tx.update(reqRef, {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: adminId,
        completedBy: adminEmail
      });

      await createAuditLog(adminId, adminEmail, 'complete_withdrawal', 'withdrawal_request', id, {
        userId: reqData.userId,
        amount: reqData.amount,
        method: reqData.method,
        walletType: reqData.walletType,
        currency: reqData.currency
      });
    });

    res.json({ success: true, message: 'Withdrawal completed successfully' });

  } catch (error) {
    console.error('Complete withdrawal failed:', error);
    await createErrorLog('complete_withdrawal', id, reqData?.userId, adminId, error.message);
    res.status(400).json({ success: false, error: error.message || 'Failed to complete withdrawal' });
  }
});

// Get transaction logs for debugging
router.get('/logs', ensureAdmin, async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;
    
    let query = db.collection('audit_logs').orderBy('created_at', 'desc').limit(Number(limit));
    
    if (type) {
      query = query.where('action', '==', type);
    }
    
    const snapshot = await query.get();
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Get logs failed:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

// Get error logs for debugging
router.get('/error-logs', ensureAdmin, async (req, res) => {
  try {
    const { action, limit = 50 } = req.query;
    
    let query = db.collection('error_logs').orderBy('timestamp', 'desc').limit(Number(limit));
    
    if (action) {
      query = query.where('action', '==', action);
    }
    
    const snapshot = await query.get();
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Get error logs failed:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch error logs' });
  }
});

export default router;
