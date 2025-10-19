import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { db } from '../../firebase';
import { off, onValue, push, ref, runTransaction, set } from 'firebase/database';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { useReferral } from '../../hooks/useReferral';

type TabType = 'overview' | 'deposit' | 'withdraw' | 'transactions';
type DepositMethod = 'usdt' | 'inr' | 'crypto';
type WithdrawMethod = 'bank' | 'usdt' | 'crypto';

interface Transaction {
  id: string;
  date: string;
  type: 'deposit' | 'withdraw' | 'service' | 'referral' | 'reward' | 'claim';
  amount: string;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  createdAt?: number;
}

export default function Wallet() {
  const { wallet, refresh } = useWallet();
  const { user } = useUser();
  const { addNotification } = useNotifications();
  const { totalEarnings } = useReferral();
  const uid = user?.id;
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [depositMethod, setDepositMethod] = useState<DepositMethod>('usdt');
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>('bank');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Live transactions and claims
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [claims, setClaims] = useState<{ id: string; amount: number; createdAt: number }[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);

  // DLX -> USD mock rate (replace with API if available)
  const dlxUsdRate = 0.1;
  const dlxUsdValue = useMemo(() => (wallet?.dlx ?? 0) * dlxUsdRate, [wallet?.dlx]);
  const totalClaimed = useMemo(() => claims.reduce((s, c) => s + (c.amount || 0), 0), [claims]);

  useEffect(() => {
    if (!uid) return;
    const rTx = ref(db, `users/${uid}/wallet/transactions`);
    const rClaims = ref(db, `users/${uid}/mining/claims`);

    const unsubTx = onValue(rTx, (snap) => {
      const val = snap.val() || {};
      const arr = Object.values(val) as any[];
      const mapped: Transaction[] = arr
        .map((t: any) => ({
          id: t.id,
          date: t.createdAt ? new Date(t.createdAt).toLocaleString() : t.date || '',
          type: (t.type as Transaction['type']) ?? 'deposit',
          amount: (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount || '0')).toFixed(2),
          currency: t.currency ?? 'USDT',
          status: (t.status as Transaction['status']) ?? 'completed',
          description: t.description ?? '',
          createdAt: t.createdAt ?? 0,
        }))
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setTransactions(mapped);
    });

    const unsubClaims = onValue(rClaims, (snap) => {
      const val = snap.val() || {};
      const arr = Object.values(val) as any[];
      setClaims(
        arr
          .map((c: any) => ({ id: c.id, amount: Number(c.amount) || 0, createdAt: c.createdAt || 0 }))
          .sort((a, b) => b.createdAt - a.createdAt),
      );
    });

    return () => {
      off(rTx);
      off(rClaims);
      try { unsubTx(); } catch {}
      try { unsubClaims(); } catch {}
    };
  }, [uid]);

  const claimTxs: Transaction[] = useMemo(() =>
    claims.map((c) => ({
      id: `claim:${c.id}`,
      date: new Date(c.createdAt).toLocaleString(),
      type: 'claim',
      amount: String(c.amount || 0),
      currency: 'DLX',
      status: 'completed',
      description: 'Daily DLX Mining Reward',
      createdAt: c.createdAt,
    })),
  [claims]);

  const mergedTxs = useMemo(() => {
    const all = [...transactions, ...claimTxs];
    return all.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [transactions, claimTxs]);

  const recent3 = mergedTxs.slice(0, 3);
  const visibleTxs = mergedTxs.slice(0, visibleCount);
  const hasMore = mergedTxs.length > visibleCount;

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!uid || !amt || amt <= 0) return;
    setIsProcessing(true);
    const now = Date.now();
    const currency = depositMethod === 'inr' ? 'INR' : 'USDT';
    const description = depositMethod === 'inr' ? 'Deposit via UPI' : 'Deposit via USDT TRC20';

    try {
      const balPath = depositMethod === 'inr' ? `users/${uid}/wallet/inr` : `users/${uid}/wallet/usdt`;
      await runTransaction(ref(db, balPath), (curr) => (typeof curr === 'number' ? curr : 0) + amt);

      const txRef = push(ref(db, `users/${uid}/wallet/transactions`));
      await set(txRef, {
        id: txRef.key,
        type: 'deposit',
        amount: amt,
        currency,
        status: 'completed',
        description,
        createdAt: now,
      });
      try { await addNotification({ type: 'transaction', message: `Deposit successful: +${amt} ${currency}` }, true); } catch {}
      setDepositAmount('');
    } catch (e: any) {
      try { await addNotification({ type: 'error', message: e?.message || 'Deposit failed. Please try again.' }, false); } catch {}
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!uid || !amt || amt <= 0) return;
    setIsProcessing(true);
    const now = Date.now();
    const currency = 'USDT';
    const description = withdrawMethod === 'bank' ? 'Withdrawal to Bank Account' : withdrawMethod === 'usdt' ? 'Withdrawal to USDT Wallet' : 'Withdrawal to Crypto Wallet';

    try {
      const txRef = push(ref(db, `users/${uid}/wallet/transactions`));
      await set(txRef, {
        id: txRef.key,
        type: 'withdraw',
        amount: amt,
        currency,
        status: 'pending',
        description,
        createdAt: now,
      });
      try { await addNotification({ type: 'transaction', message: `Withdrawal requested: -${amt} ${currency}` }, true); } catch {}
      setWithdrawAmount('');
    } catch (e: any) {
      try { await addNotification({ type: 'error', message: e?.message || 'Withdrawal request failed.' }, false); } catch {}
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 bg-emerald-500/20';
      case 'pending': return 'text-amber-400 bg-amber-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'withdraw':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        );
      case 'service':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        );
      case 'referral':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'reward':
        return (
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'deposit', label: 'Deposit', icon: '💳' },
    { id: 'withdraw', label: 'Withdraw', icon: '💰' },
    { id: 'transactions', label: 'History', icon: '📜' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-10 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Your Wallet</h1>
            <p className="text-gray-400 text-sm sm:text-base mt-1">Manage your balances, deposits, and withdrawals</p>
          </div>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-2 mb-6 sm:mb-8 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* DLX Balance */}
              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl">
                    💎
                  </div>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium">DLX TOKEN</span>
                </div>
                <p className="text-gray-400 text-sm mb-1">DLX Balance</p>
                <p className="text-3xl font-bold text-white">{wallet.dlx.toFixed(2)}</p>
                <p className="text-cyan-300 text-sm mt-1">≈ ${dlxUsdValue.toFixed(2)} USD</p>
              </div>

              {/* USDT Balance */}
              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl">
                    💵
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">USDT</span>
                </div>
                <p className="text-gray-400 text-sm mb-1">USDT Balance</p>
                <p className="text-3xl font-bold text-white">{wallet.usdt.toFixed(2)}</p>
                <p className="text-emerald-300 text-sm mt-1">Tether USD</p>
              </div>

              {/* INR Balance */}
              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl">
                    💰
                  </div>
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">INR</span>
                </div>
                <p className="text-gray-400 text-sm mb-1">INR Balance</p>
                <p className="text-3xl font-bold text-white">₹{wallet.inr.toFixed(2)}</p>
                <p className="text-purple-300 text-sm mt-1">Indian Rupee</p>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 shadow-md hover:shadow-lg transition-shadow duration-300">
                <p className="text-gray-400 text-sm">Total Claimed</p>
                <p className="text-white font-bold text-2xl mt-1">{totalClaimed.toFixed(0)} DLX</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 shadow-md hover:shadow-lg transition-shadow duration-300">
                <p className="text-gray-400 text-sm">Total Commissions</p>
                <p className="text-white font-bold text-2xl mt-1">${totalEarnings.toFixed(2)} USD</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 shadow-md hover:shadow-lg transition-shadow duration-300">
                <p className="text-gray-400 text-sm">Available Balance</p>
                <p className="text-white font-bold text-2xl mt-1">${wallet.usdt.toFixed(2)} USDT • ₹{wallet.inr.toFixed(2)}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('deposit')}
                className="group bg-gray-800/50 rounded-xl p-5 hover:bg-gray-700/70 transition-all duration-300 shadow-md hover:shadow-lg border border-gray-700/50"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-white font-semibold text-lg">Deposit Funds</p>
                <p className="text-gray-400 text-sm mt-1">Add money to wallet</p>
              </button>

              <button
                onClick={() => setActiveTab('withdraw')}
                className="group bg-gray-800/50 rounded-xl p-5 hover:bg-gray-700/70 transition-all duration-300 shadow-md hover:shadow-lg border border-gray-700/50"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <p className="text-white font-semibold text-lg">Withdraw Funds</p>
                <p className="text-gray-400 text-sm mt-1">Transfer to account</p>
              </button>

              <button
                onClick={() => setActiveTab('transactions')}
                className="group bg-gray-800/50 rounded-xl p-5 hover:bg-gray-700/70 transition-all duration-300 shadow-md hover:shadow-lg border border-gray-700/50"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-white font-semibold text-lg">View History</p>
                <p className="text-gray-400 text-sm mt-1">All transactions</p>
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 shadow-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {recent3.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 p-4 rounded-lg bg-gray-900/50 hover:bg-gray-900/70 transition-all duration-300 shadow-sm">
                    {getTypeIcon(tx.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{tx.description}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {tx.date}
                            </span>
                            <span className="capitalize px-2 py-0.5 rounded bg-gray-900/50 text-xs">{tx.type}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold ${tx.type === 'withdraw' || tx.type === 'service' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {tx.type === 'withdraw' || tx.type === 'service' ? '-' : '+'}{tx.amount}
                          </p>
                          <p className="text-gray-500 text-xs">{tx.currency}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${getStatusColor(tx.status)}`}>
                          {tx.status.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          <button className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300">
                            Details
                          </button>
                          {tx.status === 'completed' && (
                            <>
                              <span className="text-gray-700">•</span>
                              <button className="text-xs text-gray-400 hover:text-white font-medium transition-colors duration-300">
                                Receipt
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Deposit Tab */}
        {activeTab === 'deposit' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800/50 rounded-xl p-6 space-y-6 border border-gray-700/50 shadow-lg">
              <h3 className="text-2xl font-bold text-white">Deposit Funds</h3>
              {/* Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Select Method</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setDepositMethod('usdt')}
                    className={`p-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                      depositMethod === 'usdt' ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/30 ring-2 ring-blue-500' : 'bg-gray-900/50 hover:bg-gray-900/70'
                    }`}
                  >
                    <div className="text-3xl mb-2">💵</div>
                    <p className="text-white font-semibold text-sm">USDT</p>
                    <p className="text-gray-400 text-xs mt-1 hidden sm:block">TRC20 / ERC20</p>
                  </button>
                  <button
                    onClick={() => setDepositMethod('inr')}
                    className={`p-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                      depositMethod === 'inr' ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 ring-2 ring-purple-500' : 'bg-gray-900/50 hover:bg-gray-900/70'
                    }`}
                  >
                    <div className="text-3xl mb-2">🇮🇳</div>
                    <p className="text-white font-semibold text-sm">INR</p>
                    <p className="text-gray-400 text-xs mt-1 hidden sm:block">UPI / Bank</p>
                  </button>
                  <button
                    onClick={() => setDepositMethod('crypto')}
                    className={`p-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                      depositMethod === 'crypto' ? 'bg-gradient-to-br from-orange-600/30 to-yellow-600/30 ring-2 ring-orange-500' : 'bg-gray-900/50 hover:bg-gray-900/70'
                    }`}
                  >
                    <div className="text-3xl mb-2">₿</div>
                    <p className="text-white font-semibold text-sm">Crypto</p>
                    <p className="text-gray-400 text-xs mt-1 hidden sm:block">BTC / ETH</p>
                  </button>
                </div>
              </div>
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Enter Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">{depositMethod.toUpperCase()}</div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[10, 50, 100, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      className="px-3 py-1.5 rounded-lg bg-gray-900/50 text-gray-300 text-sm hover:bg-gray-900/70 transition-all duration-300"
                    >
                      +{amount}
                    </button>
                  ))}
                </div>
              </div>
              {/* Instructions */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-white font-semibold text-sm mb-2">Deposit Instructions</p>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• Minimum deposit: $10 / ₹500</li>
                      <li>• Deposits credited within 5-10 minutes</li>
                      <li>• Double-check wallet address before sending</li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* Submit Button */}
              <button
                onClick={handleDeposit}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isProcessing}
                className={`w-full py-3 rounded-lg font-semibold text-base transition-all duration-300 shadow-md ${
                  !depositAmount || parseFloat(depositAmount) <= 0 || isProcessing
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Proceed to Deposit'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === 'withdraw' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800/50 rounded-xl p-6 space-y-6 border border-gray-700/50 shadow-lg">
              <h3 className="text-2xl font-bold text-white">Withdraw Funds</h3>
              {/* Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Select Method</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setWithdrawMethod('bank')}
                    className={`p-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                      withdrawMethod === 'bank' ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/30 ring-2 ring-blue-500' : 'bg-gray-900/50 hover:bg-gray-900/70'
                    }`}
                  >
                    <div className="text-3xl mb-2">🏦</div>
                    <p className="text-white font-semibold text-sm">Bank</p>
                    <p className="text-gray-400 text-xs mt-1 hidden sm:block">Direct transfer</p>
                  </button>
                  <button
                    onClick={() => setWithdrawMethod('usdt')}
                    className={`p-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                      withdrawMethod === 'usdt' ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 ring-2 ring-purple-500' : 'bg-gray-900/50 hover:bg-gray-900/70'
                    }`}
                  >
                    <div className="text-3xl mb-2">💵</div>
                    <p className="text-white font-semibold text-sm">USDT</p>
                    <p className="text-gray-400 text-xs mt-1 hidden sm:block">TRC20 / ERC20</p>
                  </button>
                  <button
                    onClick={() => setWithdrawMethod('crypto')}
                    className={`p-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                      withdrawMethod === 'crypto' ? 'bg-gradient-to-br from-orange-600/30 to-yellow-600/30 ring-2 ring-orange-500' : 'bg-gray-900/50 hover:bg-gray-900/70'
                    }`}
                  >
                    <div className="text-3xl mb-2">₿</div>
                    <p className="text-white font-semibold text-sm">Crypto</p>
                    <p className="text-gray-400 text-xs mt-1 hidden sm:block">BTC / ETH</p>
                  </button>
                </div>
              </div>
              {/* Available Balance */}
              <div className="p-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-gray-400 text-sm mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-white">${wallet.usdt.toFixed(2)} USDT</p>
              </div>
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Enter Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 pr-16"
                  />
                  <button
                    onClick={() => setWithdrawAmount(wallet.usdt.toString())}
                    className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs font-medium hover:bg-purple-500/30 transition-all duration-300"
                  >
                    MAX
                  </button>
                </div>
              </div>
              {/* Wallet Address / Account Details */}
              {withdrawMethod === 'bank' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Account Number</label>
                    <input
                      type="text"
                      placeholder="Enter account number"
                      className="w-full px-4 py-3 rounded-lg bg-gray-900/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="Enter IFSC code"
                      className="w-full px-4 py-3 rounded-lg bg-gray-900/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Wallet Address</label>
                  <input
                    type="text"
                    placeholder="Enter wallet address"
                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
                  />
                </div>
              )}
              {/* Warning */}
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-white font-semibold text-sm mb-2">Important Notes</p>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• Minimum withdrawal: $20 / ₹1000</li>
                      <li>• Processed within 24-48 hours</li>
                      <li>• Verify account details before submitting</li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* Submit Button */}
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || isProcessing}
                className={`w-full py-3 rounded-lg font-semibold text-base transition-all duration-300 shadow-md ${
                  !withdrawAmount || parseFloat(withdrawAmount) <= 0 || isProcessing
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-lg'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Request Withdrawal'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-700/50">
              <h3 className="text-2xl font-bold text-white">Transaction History</h3>
              <p className="text-gray-400 text-sm mt-1">View all your wallet transactions</p>
            </div>
            <div className="divide-y divide-gray-700/50">
              {visibleTxs.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-gray-900/30 transition-all duration-300">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(tx.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{tx.description}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {tx.date}
                            </span>
                            <span className="capitalize px-2 py-0.5 rounded bg-gray-900/50 text-xs">{tx.type}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold ${tx.type === 'withdraw' || tx.type === 'service' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {tx.type === 'withdraw' || tx.type === 'service' ? '-' : '+'}{tx.amount}
                          </p>
                          <p className="text-gray-500 text-xs">{tx.currency}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${getStatusColor(tx.status)}`}>
                          {tx.status.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          <button className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300">
                            Details
                          </button>
                          {tx.status === 'completed' && (
                            <>
                              <span className="text-gray-700">•</span>
                              <button className="text-xs text-gray-400 hover:text-white font-medium transition-colors duration-300">
                                Receipt
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 flex justify-center border-t border-gray-700/50">
              {hasMore ? (
                <button onClick={() => setVisibleCount((v) => v + 5)} className="px-5 py-2 rounded-lg bg-gray-900/50 text-white text-sm font-medium hover:bg-gray-900/70 transition-all duration-300 shadow-md">
                  Load More Transactions
                </button>
              ) : (
                <span className="text-gray-400 text-sm">No more transactions</span>
              )}
            </div>
          </div>
        )}

        {/* Auto-update Notice */}
        <div className="mt-6 rounded-lg bg-blue-500/10 p-4 border border-blue-500/20 shadow-md">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-300">Balances and transactions update live. Click "Refresh" for manual sync.</p>
          </div>
        </div>
      </div>
    </div>
  );
}