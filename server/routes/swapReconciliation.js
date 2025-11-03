import express from 'express';
import { firestore } from '../firebaseAdmin.js';

const router = express.Router();

/**
 * Verify swap using swap engine/on-chain checker
 * This is a placeholder - replace with actual swap engine integration
 */
async function verifySwapOnChain(swapRequest) {
  // TODO: Integrate with actual swap engine/on-chain checker
  // For now, we'll mark swaps older than 1 minute as verified (assuming they were processed)
  // In production, this should check the blockchain/swap engine to verify the swap actually happened
  
  const createdAt = swapRequest.createdAt;
  if (!createdAt) return false;
  
  const createdAtTime = createdAt.toDate ? createdAt.toDate().getTime() : createdAt;
  const now = Date.now();
  const ageMs = now - createdAtTime;
  
  // If swap is older than 1 minute, assume it's verified (for existing pending swaps)
  // For new swaps processed atomically, they're already marked as success
  return ageMs > 60000;
}

/**
 * Process pending swap reconciliation
 * Marks confirmed pending swaps as success (or failed) after verification
 */
router.post('/reconcile', async (req, res) => {
  try {
    console.log('[SwapReconciliation] Starting reconciliation job...');
    
    // Find all pending swaps
    const swapRequestsRef = firestore.collection('swapRequests');
    const pendingSwapsSnap = await swapRequestsRef
      .where('status', '==', 'pending')
      .get();
    
    if (pendingSwapsSnap.empty) {
      return res.json({ 
        success: true, 
        message: 'No pending swaps to reconcile',
        processed: 0 
      });
    }
    
    let successCount = 0;
    let failedCount = 0;
    const errors = [];
    
    for (const swapDoc of pendingSwapsSnap.docs) {
      const swapRequest = { id: swapDoc.id, ...swapDoc.data() };
      
      try {
        // Verify swap using swap engine/on-chain checker
        const isVerified = await verifySwapOnChain(swapRequest);
        
        if (isVerified) {
          // Use batch write for atomic updates
          const batch = firestore.batch();
          
          // Update swap request to success
          const swapRequestRef = swapRequestsRef.doc(swapRequest.id);
          batch.update(swapRequestRef, {
            status: 'success',
            verifiedAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp()
          });
          
          // Update transaction status if transactionId exists
          if (swapRequest.transactionId) {
            const transactionRef = firestore
              .collection('wallets')
              .doc(swapRequest.userId)
              .collection('transactions')
              .doc(swapRequest.transactionId);
            
            batch.update(transactionRef, {
              status: 'success',
              description: `Swapped ${swapRequest.dlxAmount.toFixed(2)} DLX to ${swapRequest.usdtAmount.toFixed(2)} USDT (Credited to Purchase Wallet)`,
              updatedAt: firestore.FieldValue.serverTimestamp()
            });
          }
          
          await batch.commit();
          successCount++;
          console.log(`[SwapReconciliation] Marked swap ${swapRequest.id} as success`);
        } else {
          // Could not verify - mark as failed if too old (> 24 hours)
          const createdAt = swapRequest.createdAt;
          if (createdAt) {
            const createdAtTime = createdAt.toDate ? createdAt.toDate().getTime() : createdAt;
            const ageMs = Date.now() - createdAtTime;
            const ageHours = ageMs / (1000 * 60 * 60);
            
            if (ageHours > 24) {
              // Mark as failed if older than 24 hours and still unverified
              const batch = firestore.batch();
              
              const swapRequestRef = swapRequestsRef.doc(swapRequest.id);
              batch.update(swapRequestRef, {
                status: 'failed',
                verifiedAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp()
              });
              
              if (swapRequest.transactionId) {
                const transactionRef = firestore
                  .collection('wallets')
                  .doc(swapRequest.userId)
                  .collection('transactions')
                  .doc(swapRequest.transactionId);
                
                batch.update(transactionRef, {
                  status: 'failed',
                  description: `Swap failed: Could not verify swap transaction`,
                  updatedAt: firestore.FieldValue.serverTimestamp()
                });
              }
              
              await batch.commit();
              failedCount++;
              console.log(`[SwapReconciliation] Marked swap ${swapRequest.id} as failed (unverified after 24h)`);
            }
          }
        }
      } catch (error) {
        console.error(`[SwapReconciliation] Error processing swap ${swapRequest.id}:`, error);
        errors.push({ swapId: swapRequest.id, error: error.message });
      }
    }
    
    return res.json({
      success: true,
      message: 'Reconciliation completed',
      processed: pendingSwapsSnap.size,
      successCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('[SwapReconciliation] Reconciliation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to reconcile swaps'
    });
  }
});

/**
 * Reconcile a specific swap by ID
 */
router.post('/reconcile/:swapId', async (req, res) => {
  try {
    const { swapId } = req.params;
    
    const swapRequestRef = firestore.collection('swapRequests').doc(swapId);
    const swapRequestSnap = await swapRequestRef.get();
    
    if (!swapRequestSnap.exists) {
      return res.status(404).json({
        success: false,
        error: 'Swap request not found'
      });
    }
    
    const swapRequest = { id: swapRequestSnap.id, ...swapRequestSnap.data() };
    
    if (swapRequest.status !== 'pending') {
      return res.json({
        success: true,
        message: `Swap is already ${swapRequest.status}`,
        swapId,
        status: swapRequest.status
      });
    }
    
    // Verify swap
    const isVerified = await verifySwapOnChain(swapRequest);
    
    if (isVerified) {
      const batch = firestore.batch();
      
      batch.update(swapRequestRef, {
        status: 'success',
        verifiedAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
      
      if (swapRequest.transactionId) {
        const transactionRef = firestore
          .collection('wallets')
          .doc(swapRequest.userId)
          .collection('transactions')
          .doc(swapRequest.transactionId);
        
        batch.update(transactionRef, {
          status: 'success',
          description: `Swapped ${swapRequest.dlxAmount.toFixed(2)} DLX to ${swapRequest.usdtAmount.toFixed(2)} USDT (Credited to Purchase Wallet)`,
          updatedAt: firestore.FieldValue.serverTimestamp()
        });
      }
      
      await batch.commit();
      
      return res.json({
        success: true,
        message: 'Swap marked as success',
        swapId,
        status: 'success'
      });
    } else {
      return res.json({
        success: false,
        message: 'Swap could not be verified',
        swapId,
        status: 'pending'
      });
    }
  } catch (error) {
    console.error(`[SwapReconciliation] Error reconciling swap ${req.params.swapId}:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to reconcile swap'
    });
  }
});

export default router;

