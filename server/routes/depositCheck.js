import express from 'express';
import { checkDeposit } from '../api/mexcDepositCheck.js';
import { firestore } from '../firebaseAdmin.js';

const router = express.Router();

// Check deposit status
router.post('/check', async (req, res) => {
  try {
    // TEMP DISABLED: Short-circuit without verifying or updating wallet
    return res.json({ status: 'not_found', amountReceived: 0, txnHash: '' });

    // Map frontend network names to MEXC API network names
    const networkMap = {
      'bep20': 'BEP20',
      'trc20': 'TRC20'
    };

    const mexcNetwork = networkMap[network];
    if (!mexcNetwork) {
      return res.status(400).json({ error: 'Invalid network' });
    }

    const requestedAmount = parseFloat(amount);
    const depositResult = await checkDeposit(address, mexcNetwork, requestedAmount, userId);
    console.log('[DepositCheck] Result from MEXC check', depositResult);
    
    // Handle amount validation
    let finalStatus = depositResult.status;
    let amountReceived = depositResult.amount || 0;
    let txnHash = depositResult.txnHash || '';
    
    if (depositResult.status === 'success') {
      const receivedAmount = parseFloat(amountReceived);
      
      if (receivedAmount >= requestedAmount) {
        // Full deposit received
        finalStatus = 'success';
        amountReceived = requestedAmount;
      } else if (receivedAmount > 0) {
        // Partial deposit received
        finalStatus = 'partial';
      } else {
        // No deposit found
        finalStatus = 'not_found';
      }
    }

    // Persist transaction (duplicate-safe): only for confirmed success with new hash
    if (finalStatus === 'success' && txnHash) {
      try {
        const txSnap = await firestore
          .collection('transactions')
          .where('txnHash', '==', txnHash)
          .limit(1)
          .get();
        if (txSnap.empty) {
          const writeRes = await firestore.collection('transactions').add({
            type: 'deposit',
            userId,
            address,
            network: mexcNetwork,
            amountRequested: requestedAmount,
            amountCredited: amountReceived,
            txnHash,
            insertTime: depositResult.insertTime || null,
            createdAt: new Date().toISOString()
          });
          console.log('[DepositCheck] Transaction recorded', { id: writeRes.id, txnHash });
        }
      } catch (txErr) {
        console.error('Failed to record transaction:', txErr);
        // continue; we still try to credit to avoid losing funds if verification passed
      }
    }

    // Update wallet balance if deposit was received
    if (finalStatus === 'success' || finalStatus === 'partial') {
      try {
        const walletRef = firestore.collection('wallets').doc(userId);
        const walletDoc = await walletRef.get();
        
        if (walletDoc.exists) {
          const currentData = walletDoc.data();
          const currentMainUsdt = currentData?.usdt?.mainUsdt || 0;
          const newMainUsdt = currentMainUsdt + parseFloat(amountReceived);
          
          await walletRef.update({
            'usdt.mainUsdt': newMainUsdt
          });
          console.log('[DepositCheck] Wallet updated', { userId, credited: Number(amountReceived), newMainUsdt });
        } else {
          // Create wallet if it doesn't exist
          await walletRef.set({
            usdt: { mainUsdt: parseFloat(amountReceived), purchaseUsdt: 0 },
            inr: { mainInr: 0, purchaseInr: 0 },
            dlx: 0
          });
          console.log('[DepositCheck] Wallet created and credited', { userId, credited: Number(amountReceived) });
        }
        
        console.log(`Deposit ${finalStatus}: ${amountReceived} USDT added to user ${userId} (requested: ${amount})`);

        // If a deposit request id is provided and we have a confirmed success, mark it done and persist txn details
        if (requestId && finalStatus === 'success') {
          try {
            await firestore.collection('depositRequests').doc(requestId).update({
              status: 'done',
              txId: txnHash || '',
              userId,
              verifiedNetwork: mexcNetwork,
              amountReceived: Number(amountReceived),
              amountRequested: Number(requestedAmount),
              updatedAt: new Date()
            });
          } catch (err) {
            console.error('Failed to update depositRequests status to done:', err);
          }
        }
      } catch (updateError) {
        console.error('Error updating wallet balance:', updateError);
        // Don't fail the request if wallet update fails
      }
    }

    res.json({ 
      status: finalStatus,
      amountReceived: amountReceived,
      txnHash: txnHash
    });
  } catch (error) {
    console.error('Deposit check error:', error);
    res.status(500).json({ error: 'Failed to check deposit status' });
  }
});

export default router;
