import express from 'express';
import { firestore } from '../firebaseAdmin.js';

const router = express.Router();

// List manual deposits (optionally filter by status)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = firestore.collection('manualDeposits');
    if (status) query = query.where('status', '==', status);
    const snap = await query.orderBy('createdAt', 'desc').limit(200).get();
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    res.json({ items });
  } catch (e) {
    console.error('[ManualDeposits] List error', e);
    res.status(500).json({ error: 'Failed to list manual deposits' });
  }
});

// Approve a manual deposit and credit wallet
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const ref = firestore.collection('manualDeposits').doc(id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Manual deposit not found' });

    const data = doc.data() || {};
    if (data.status === 'approved') {
      return res.json({ ok: true, alreadyApproved: true });
    }

    const userId = String(data.userId || '');
    const amount = Number(data.amount || 0);
    const network = String(data.network || '');
    const txnId = String(data.txnId || '');

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid manual deposit data' });
    }

    // Record transaction if not present
    try {
      let exists = false;
      if (txnId) {
        const txSnap = await firestore
          .collection('transactions')
          .where('txnHash', '==', txnId)
          .limit(1)
          .get();
        exists = !txSnap.empty;
      }

      if (!exists && txnId) {
        const writeRes = await firestore.collection('transactions').add({
          type: 'deposit_manual',
          userId,
          network,
          amountRequested: amount,
          amountCredited: amount,
          txnHash: txnId,
          createdAt: new Date().toISOString()
        });
        console.log('[ManualDeposits] Transaction recorded', { id: writeRes.id, txnId });
      }
    } catch (txErr) {
      console.error('[ManualDeposits] Failed to record transaction', txErr);
    }

    // Credit wallet
    const walletRef = firestore.collection('wallets').doc(userId);
    const walletDoc = await walletRef.get();
    if (walletDoc.exists) {
      const w = walletDoc.data() || {};
      const currentMainUsdt = Number(w?.usdt?.mainUsdt || 0);
      const newMainUsdt = currentMainUsdt + amount;
      await walletRef.update({ 'usdt.mainUsdt': newMainUsdt });
      console.log('[ManualDeposits] Wallet updated', { userId, credited: amount, newMainUsdt });
    } else {
      await walletRef.set({
        usdt: { mainUsdt: amount, purchaseUsdt: 0 },
        inr: { mainInr: 0, purchaseInr: 0 },
        dlx: 0
      });
      console.log('[ManualDeposits] Wallet created and credited', { userId, credited: amount });
    }

    // Mark as approved
    await ref.update({ status: 'approved', approvedAt: new Date().toISOString() });

    res.json({ ok: true, approved: true });
  } catch (e) {
    console.error('[ManualDeposits] Approve error', e);
    res.status(500).json({ error: 'Failed to approve manual deposit' });
  }
});

export default router;

