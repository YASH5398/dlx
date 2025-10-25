import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { firestore } from '../../firebase';
import { 
  doc, 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';

type DepositMethod = 'usdt' | 'inr';
type WithdrawMethod = 'usdt' | 'inr';
type Blockchain = 'bep20' | 'trc20';
type FlowType = 'deposit' | 'withdraw' | 'swap' | null;

interface Transaction {
  id: string;
  date: string;
  type: 'deposit' | 'withdraw' | 'swap';
  amount: string;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'approved' | 'rejected';
  description: string;
  createdAt?: number;
  requestId?: string;
}

interface DepositRequest {
  id: string;
  userId: string;
  amount: number;
  method: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: any;
  currency: string;
  fees: number;
  txnId?: string;
  notes?: string;
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  method: string;
  walletType: 'main' | 'purchase';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: any;
  currency: string;
  fees: number;
  txnId?: string;
  notes?: string;
}

export default function WalletEnhanced() {
  const { wallet } = useWallet();
  const { user } = useUser();
  const { addNotification } = useNotifications();
  const uid = user?.id;
  
  const [activeFlow, setActiveFlow] = useState<FlowType>(null);
  const [depositStep, setDepositStep] = useState(1);
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [swapStep, setSwapStep] = useState(1);
  const [depositMethod, setDepositMethod] = useState<DepositMethod | null>(null);
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod | null>(null);
  const [blockchain, setBlockchain] = useState<Blockchain | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [swapAmount, setSwapAmount] = useState('');
  const [upi, setUpi] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txHashFile, setTxHashFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  // Firestore-streamed wallet breakdown
  const [mainUsdt, setMainUsdt] = useState(0);
  const [mainInr, setMainInr] = useState(0);
  const [purchaseUsdt, setPurchaseUsdt] = useState(0);
  const [purchaseInr, setPurchaseInr] = useState(0);

  const dlxUsdRate = 0.1;
  const dlxUsdValue = useMemo(() => (wallet?.dlx ?? 0) * dlxUsdRate, [wallet?.dlx]);
  const swapUsdtValue = useMemo(() => (parseFloat(swapAmount) || 0) * dlxUsdRate, [swapAmount]);

  const depositAddress = {
    bep20: '0x85fdfd1a83c4bc9a8c11f3b1308ead5d397d41d3',
    trc20: 'TH1s69X1MqxJJme6BVPU3XFXhk8QwSXa7M'
  };

  // Stream wallet from Firestore wallets collection
  useEffect(() => {
    if (!uid) return;
    const walletDoc = doc(firestore, 'wallets', uid);
    const unsub = onSnapshot(walletDoc, (snap) => {
      const d = (snap.data() as any) || {};
      setMainUsdt(Number(d.mainUsdt || 0));
      setPurchaseUsdt(Number(d.purchaseUsdt || 0));
      setMainInr(Number(d.mainInr || 0));
      setPurchaseInr(Number(d.purchaseInr || 0));
    }, (err) => {
      console.error('Wallet stream failed:', err);
      setMainUsdt(0);
      setPurchaseUsdt(0);
      setMainInr(0);
      setPurchaseInr(0);
    });
    return () => { try { unsub(); } catch {} };
  }, [uid]);

  // Stream user's deposit requests
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      query(
        collection(firestore, 'depositRequests'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      ),
      (snap) => {
        const requests: DepositRequest[] = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as DepositRequest));
        setDepositRequests(requests);
      },
      (err) => {
        console.error('Deposit requests stream failed:', err);
      }
    );
    return () => { try { unsub(); } catch {} };
  }, [uid]);

  // Stream user's withdrawal requests
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      query(
        collection(firestore, 'withdrawalRequests'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      ),
      (snap) => {
        const requests: WithdrawalRequest[] = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as WithdrawalRequest));
        setWithdrawalRequests(requests);
      },
      (err) => {
        console.error('Withdrawal requests stream failed:', err);
      }
    );
    return () => { try { unsub(); } catch {} };
  }, [uid]);

  // Stream recent transactions from Firestore
  useEffect(() => {
    if (!uid) return;
    const txQ = query(collection(firestore, 'wallets', uid, 'transactions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(txQ, (snap) => {
      const rows: Transaction[] = [];
      snap.forEach((docSnap) => {
        const t = docSnap.data() as any;
        const ts = t.createdAt?.toMillis ? t.createdAt.toMillis() : Number(t.createdAt || 0);
        rows.push({
          id: docSnap.id,
          date: ts ? new Date(ts).toLocaleString() : '',
          type: t.type as Transaction['type'],
          amount: (typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount || '0'))).toFixed(2),
          currency: t.currency ?? 'USDT',
          status: (t.status as Transaction['status']) ?? 'pending',
          description: t.description ?? '',
          createdAt: ts || 0,
          requestId: t.requestId
        });
      });
      rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setTransactions(rows);
    });
    return () => { try { unsub(); } catch {} };
  }, [uid]);

  // Enhanced transaction display with request status
  const enhancedTransactions = useMemo(() => {
    const enhanced: Transaction[] = [];
    
    // Add deposit requests as transactions
    depositRequests.forEach(req => {
      const ts = req.createdAt?.toMillis ? req.createdAt.toMillis() : Number(req.createdAt || 0);
      enhanced.push({
        id: req.id,
        date: ts ? new Date(ts).toLocaleString() : '',
        type: 'deposit',
        amount: req.amount.toFixed(2),
        currency: req.currency || 'USDT',
        status: req.status === 'pending' ? 'pending' : 
                req.status === 'approved' ? 'success' :
                req.status === 'rejected' ? 'failed' : 'completed',
        description: `Deposit via ${req.method} ${req.status === 'pending' ? '(Awaiting verification)' : 
                     req.status === 'approved' ? '(Approved and Credited)' :
                     req.status === 'rejected' ? '(Rejected)' : '(Completed)'}`,
        createdAt: ts || 0,
        requestId: req.id
      });
    });

    // Add withdrawal requests as transactions
    withdrawalRequests.forEach(req => {
      const ts = req.createdAt?.toMillis ? req.createdAt.toMillis() : Number(req.createdAt || 0);
      enhanced.push({
        id: req.id,
        date: ts ? new Date(ts).toLocaleString() : '',
        type: 'withdraw',
        amount: req.amount.toFixed(2),
        currency: req.currency || 'USDT',
        status: req.status === 'pending' ? 'pending' : 
                req.status === 'approved' ? 'success' :
                req.status === 'rejected' ? 'failed' : 'completed',
        description: `Withdrawal to ${req.method} ${req.status === 'pending' ? '(Awaiting verification)' : 
                     req.status === 'approved' ? '(Approved and Processed)' :
                     req.status === 'rejected' ? '(Rejected)' : '(Completed)'}`,
        createdAt: ts || 0,
        requestId: req.id
      });
    });

    // Add regular transactions
    enhanced.push(...transactions);

    return enhanced.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [depositRequests, withdrawalRequests, transactions]);

  const handleFlowChange = (flow: FlowType) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveFlow(flow);
      setDepositStep(1);
      setWithdrawStep(1);
      setSwapStep(1);
      setDepositMethod(null);
      setWithdrawMethod(null);
      setBlockchain(null);
      setDepositAmount('');
      setWithdrawAmount('');
      setSwapAmount('');
      setUpi('');
      setWalletAddress('');
      setTxHash('');
      setTxHashFile(null);
      setIsTransitioning(false);
    }, 500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!uid || !amt || amt <= 0) return;
    if (depositMethod === 'usdt' && !txHash) return;
    if (depositMethod === 'inr' && !upi) return;
    
    setIsProcessing(true);
    const currency = depositMethod === 'inr' ? 'INR' : 'USDT';
    const method = depositMethod === 'usdt' ? `usdt-${blockchain}` : 'inr-upi';
    const notes = depositMethod === 'inr' ? `UPI: ${upi}` : `Network: ${String(blockchain).toUpperCase()}`;

    try {
      // Use atomic API for deposit request creation
      const { createDepositRequest } = await import('../../utils/transactionAPI');
      
      await createDepositRequest({
        userId: uid,
        amount: amt,
        method,
        currency,
        fees: 0,
        txnId: depositMethod === 'usdt' ? txHash : undefined,
        notes
      });
      
      try { 
        await addNotification({ 
          type: 'transaction', 
          message: `Deposit submitted: ${amt} ${currency} (Awaiting verification)` 
        }, true); 
      } catch {}
      
      handleFlowChange(null);
    } catch (e: any) {
      try { 
        await addNotification({ 
          type: 'error', 
          message: e?.message || 'Deposit submission failed.' 
        }, false); 
      } catch {}
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!uid || !amt || amt <= 0) return;
    if (withdrawMethod === 'usdt' && (!walletAddress || !blockchain)) return;
    if (withdrawMethod === 'inr' && !upi) return;
    
    // Check sufficient balance
    const walletType = withdrawMethod === 'usdt' ? 'main' : 'purchase';
    const currentBalance = walletType === 'main' ? mainUsdt : purchaseUsdt;
    
    if (currentBalance < amt) {
      try { 
        await addNotification({ 
          type: 'error', 
          message: `Insufficient balance. Available: ${currentBalance} ${withdrawMethod === 'inr' ? 'INR' : 'USDT'}` 
        }, false); 
      } catch {}
      return;
    }
    
    setIsProcessing(true);
    const currency = withdrawMethod === 'inr' ? 'INR' : 'USDT';
    const description = withdrawMethod === 'inr' 
      ? 'Withdrawal to UPI' 
      : `Withdrawal to ${blockchain?.toUpperCase()}`;

    try {
      // Use atomic API for withdrawal request creation
      const { createWithdrawalRequest } = await import('../../utils/transactionAPI');
      
      const method = withdrawMethod === 'usdt' ? `usdt-${blockchain}` : 'inr-upi';
      const notes = withdrawMethod === 'inr' 
        ? `UPI: ${upi}` 
        : `Address: ${walletAddress} | Network: ${String(blockchain).toUpperCase()}`;
      
      await createWithdrawalRequest({
        userId: uid,
        amount: amt,
        method,
        walletType: walletType as 'main' | 'purchase',
        currency,
        fees: 0,
        notes
      });
      
      try { 
        await addNotification({ 
          type: 'transaction', 
          message: `Withdrawal submitted: ${amt} ${currency} (Awaiting verification)` 
        }, true); 
      } catch {}
      
      handleFlowChange(null);
    } catch (e: any) {
      try { 
        await addNotification({ 
          type: 'error', 
          message: e?.message || 'Withdrawal submission failed.' 
        }, false); 
      } catch {}
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'success': return 'text-green-400';
      case 'approved': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': 
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'success': return 'Success';
      case 'approved': return 'Approved';
      case 'pending': return 'Pending';
      case 'failed': 
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Main USDT</div>
          <div className="text-2xl font-bold">{mainUsdt.toFixed(2)}</div>
        </div>
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Purchase USDT</div>
          <div className="text-2xl font-bold">{purchaseUsdt.toFixed(2)}</div>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">DLX Tokens</div>
          <div className="text-2xl font-bold">{wallet?.dlx?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">DLX Value (USD)</div>
          <div className="text-2xl font-bold">${dlxUsdValue.toFixed(2)}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => handleFlowChange('deposit')}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
        >
          Deposit
        </button>
        <button
          onClick={() => handleFlowChange('withdraw')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
        >
          Withdraw
        </button>
        <button
          onClick={() => handleFlowChange('swap')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
        >
          Swap
        </button>
      </div>

      {/* Enhanced Transaction History */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
          <p className="text-sm text-gray-600">All your deposits, withdrawals, and swaps</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enhancedTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tx.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      tx.type === 'deposit' ? 'bg-green-100 text-green-800' :
                      tx.type === 'withdraw' ? 'bg-red-100 text-red-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {tx.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tx.amount} {tx.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                      {getStatusText(tx.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {tx.description}
                  </td>
                </tr>
              ))}
              {enhancedTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Status Summary */}
      {(depositRequests.length > 0 || withdrawalRequests.length > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">Pending Requests</h4>
          <div className="space-y-2">
            {depositRequests.filter(req => req.status === 'pending').map(req => (
              <div key={req.id} className="text-sm text-yellow-700">
                Deposit: {req.amount} {req.currency} - {req.status}
              </div>
            ))}
            {withdrawalRequests.filter(req => req.status === 'pending').map(req => (
              <div key={req.id} className="text-sm text-yellow-700">
                Withdrawal: {req.amount} {req.currency} - {req.status}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
