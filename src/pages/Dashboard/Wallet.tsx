import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';

type TabType = 'overview' | 'deposit' | 'withdraw' | 'transactions';
type DepositMethod = 'usdt' | 'inr' | 'crypto';
type WithdrawMethod = 'bank' | 'usdt' | 'crypto';

interface Transaction {
  id: string;
  date: string;
  type: 'deposit' | 'withdraw' | 'service' | 'referral' | 'reward';
  amount: string;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
}

export default function Wallet() {
  const { wallet, refresh } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [depositMethod, setDepositMethod] = useState<DepositMethod>('usdt');
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>('bank');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock transaction data
  const transactions: Transaction[] = [
    { id: '1', date: '2024-10-15', type: 'deposit', amount: '100.00', currency: 'USDT', status: 'completed', description: 'Deposit via USDT TRC20' },
    { id: '2', date: '2024-10-14', type: 'service', amount: '50.00', currency: 'USDT', status: 'completed', description: 'Payment for Website Development' },
    { id: '3', date: '2024-10-13', type: 'referral', amount: '25.50', currency: 'USDT', status: 'completed', description: 'Referral Commission - Level 1' },
    { id: '4', date: '2024-10-12', type: 'reward', amount: '2.5', currency: 'DLX', status: 'completed', description: 'Daily DLX Mining Reward' },
    { id: '5', date: '2024-10-11', type: 'withdraw', amount: '75.00', currency: 'USDT', status: 'pending', description: 'Withdrawal to Bank Account' },
    { id: '6', date: '2024-10-10', type: 'deposit', amount: '200.00', currency: 'INR', status: 'completed', description: 'Deposit via UPI' },
  ];

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setDepositAmount('');
      refresh();
      alert(`Deposit of ${depositAmount} initiated successfully!`);
    }, 2000);
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setWithdrawAmount('');
      refresh();
      alert(`Withdrawal of ${withdrawAmount} initiated successfully!`);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 bg-emerald-500/10';
      case 'pending': return 'text-yellow-400 bg-yellow-500/10';
      case 'failed': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'withdraw':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        );
      case 'service':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        );
      case 'referral':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'reward':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full">
        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Your Wallet
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-0.5">Manage balances, deposits, and withdrawals</p>
            </div>
            
            <button
              onClick={refresh}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/80 text-white text-sm font-medium hover:bg-slate-800 transition-all group self-start sm:self-auto"
            >
              <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto gap-2 pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Balance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* DLX Balance */}
                <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-cyan-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl sm:text-2xl">
                      💎
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                      DLX TOKEN
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm mb-1">DLX Balance</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-0.5">{wallet.dlx.toFixed(2)}</p>
                  <p className="text-cyan-400 text-xs">DigiLinex Token</p>
                </div>

                {/* USDT Balance */}
                <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-emerald-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-xl sm:text-2xl">
                      💵
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      USDT
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm mb-1">USDT Balance</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-0.5">{wallet.usdt.toFixed(2)}</p>
                  <p className="text-emerald-400 text-xs">Tether USD</p>
                </div>

                {/* INR Balance */}
                <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-purple-500/10 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl sm:text-2xl">
                      💰
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
                      INR
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm mb-1">INR Balance</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-0.5">₹{wallet.inr.toFixed(2)}</p>
                  <p className="text-purple-400 text-xs">Indian Rupee</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveTab('deposit')}
                  className="group bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 hover:bg-slate-800/70 transition-all text-left border border-slate-700/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold text-base mb-0.5">Deposit Funds</p>
                  <p className="text-slate-400 text-xs">Add money to wallet</p>
                </button>

                <button
                  onClick={() => setActiveTab('withdraw')}
                  className="group bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 hover:bg-slate-800/70 transition-all text-left border border-slate-700/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold text-base mb-0.5">Withdraw Funds</p>
                  <p className="text-slate-400 text-xs">Transfer to account</p>
                </button>

                <button
                  onClick={() => setActiveTab('transactions')}
                  className="group bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 hover:bg-slate-800/70 transition-all text-left border border-slate-700/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold text-base mb-0.5">View History</p>
                  <p className="text-slate-400 text-xs">All transactions</p>
                </button>
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Recent Activity</h3>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    View All →
                  </button>
                </div>
                
                <div className="space-y-2.5">
                  {transactions.slice(0, 3).map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-all">
                      {getTypeIcon(tx.type)}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate text-xs sm:text-sm">{tx.description}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{tx.date}</p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-xs sm:text-sm ${tx.type === 'withdraw' || tx.type === 'service' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {tx.type === 'withdraw' || tx.type === 'service' ? '-' : '+'}{tx.amount}
                        </p>
                        <p className="text-slate-500 text-xs">{tx.currency}</p>
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
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 space-y-5 border border-slate-700/50">
                <h3 className="text-xl sm:text-2xl font-bold text-white">Deposit Funds</h3>
                
                {/* Method Selection */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2.5">Select Method</label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                      onClick={() => setDepositMethod('usdt')}
                      className={`p-3 sm:p-4 rounded-lg transition-all ${
                        depositMethod === 'usdt'
                          ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/30 ring-2 ring-blue-500'
                          : 'bg-slate-900/50 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl mb-1.5">💵</div>
                      <p className="text-white font-semibold text-xs sm:text-sm">USDT</p>
                      <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">TRC20 / ERC20</p>
                    </button>

                    <button
                      onClick={() => setDepositMethod('inr')}
                      className={`p-3 sm:p-4 rounded-lg transition-all ${
                        depositMethod === 'inr'
                          ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 ring-2 ring-purple-500'
                          : 'bg-slate-900/50 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl mb-1.5">🇮🇳</div>
                      <p className="text-white font-semibold text-xs sm:text-sm">INR</p>
                      <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">UPI / Bank</p>
                    </button>

                    <button
                      onClick={() => setDepositMethod('crypto')}
                      className={`p-3 sm:p-4 rounded-lg transition-all ${
                        depositMethod === 'crypto'
                          ? 'bg-gradient-to-br from-orange-600/30 to-yellow-600/30 ring-2 ring-orange-500'
                          : 'bg-slate-900/50 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl mb-1.5">₿</div>
                      <p className="text-white font-semibold text-xs sm:text-sm">Crypto</p>
                      <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">BTC / ETH</p>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2.5">Enter Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full px-4 py-3 sm:px-5 sm:py-4 rounded-lg bg-slate-900/50 text-white text-xl sm:text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs sm:text-sm">
                      {depositMethod.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {[10, 50, 100, 500].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setDepositAmount(amount.toString())}
                        className="px-3 py-1.5 rounded-lg bg-slate-900/50 text-slate-300 text-xs sm:text-sm hover:bg-slate-900/70 transition-all"
                      >
                        +{amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-3.5 sm:p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex gap-2.5">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-white font-semibold mb-1.5 text-xs sm:text-sm">Deposit Instructions</p>
                      <ul className="text-slate-300 text-xs space-y-0.5">
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
                  className={`w-full py-3 sm:py-3.5 rounded-lg font-semibold text-base transition-all ${
                    !depositAmount || parseFloat(depositAmount) <= 0 || isProcessing
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 space-y-5 border border-slate-700/50">
                <h3 className="text-xl sm:text-2xl font-bold text-white">Withdraw Funds</h3>
                
                {/* Method Selection */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2.5">Select Method</label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                      onClick={() => setWithdrawMethod('bank')}
                      className={`p-3 sm:p-4 rounded-lg transition-all ${
                        withdrawMethod === 'bank'
                          ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/30 ring-2 ring-blue-500'
                          : 'bg-slate-900/50 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl mb-1.5">🏦</div>
                      <p className="text-white font-semibold text-xs sm:text-sm">Bank</p>
                      <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">Direct transfer</p>
                    </button>

                    <button
                      onClick={() => setWithdrawMethod('usdt')}
                      className={`p-3 sm:p-4 rounded-lg transition-all ${
                        withdrawMethod === 'usdt'
                          ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 ring-2 ring-purple-500'
                          : 'bg-slate-900/50 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl mb-1.5">💵</div>
                      <p className="text-white font-semibold text-xs sm:text-sm">USDT</p>
                      <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">TRC20 / ERC20</p>
                    </button>

                    <button
                      onClick={() => setWithdrawMethod('crypto')}
                      className={`p-3 sm:p-4 rounded-lg transition-all ${
                        withdrawMethod === 'crypto'
                          ? 'bg-gradient-to-br from-orange-600/30 to-yellow-600/30 ring-2 ring-orange-500'
                          : 'bg-slate-900/50 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl mb-1.5">₿</div>
                      <p className="text-white font-semibold text-xs sm:text-sm">Crypto</p>
                      <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">BTC / ETH</p>
                    </button>
                  </div>
                </div>

                {/* Available Balance */}
                <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-600/10 border border-emerald-500/20">
                  <p className="text-slate-400 text-xs sm:text-sm mb-1">Available Balance</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">${wallet.usdt.toFixed(2)} USDT</p>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2.5">Enter Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full px-4 py-3 sm:px-5 sm:py-4 rounded-lg bg-slate-900/50 text-white text-xl sm:text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all pr-16"
                    />
                    <button
                      onClick={() => setWithdrawAmount(wallet.usdt.toString())}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/30 transition-all"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Wallet Address / Account Details */}
                {withdrawMethod === 'bank' ? (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2">Account Number</label>
                      <input
                        type="text"
                        placeholder="Enter account number"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="Enter IFSC code"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-2">Wallet Address</label>
                    <input
                      type="text"
                      placeholder="Enter wallet address"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                )}

                {/* Warning */}
                <div className="p-3.5 sm:p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex gap-2.5">
                    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-white font-semibold mb-1.5 text-xs sm:text-sm">Important Notes</p>
                      <ul className="text-slate-300 text-xs space-y-0.5">
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
                  className={`w-full py-3 sm:py-3.5 rounded-lg font-semibold text-base transition-all ${
                    !withdrawAmount || parseFloat(withdrawAmount) <= 0 || isProcessing
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50">
              <div className="p-4 sm:p-5 border-b border-slate-700/50">
                <h3 className="text-xl sm:text-2xl font-bold text-white">Transaction History</h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">View all your wallet transactions</p>
              </div>
              
              <div className="divide-y divide-slate-700/50">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-3.5 sm:p-4 hover:bg-slate-900/30 transition-all">
                    <div className="flex items-start gap-3">
                      {getTypeIcon(tx.type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-xs sm:text-sm truncate">{tx.description}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {tx.date}
                              </span>
                              <span className="capitalize px-2 py-0.5 rounded bg-slate-900/50 text-xs">
                                {tx.type}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <p className={`text-sm sm:text-base font-bold ${tx.type === 'withdraw' || tx.type === 'service' ? 'text-red-400' : 'text-emerald-400'}`}>
                              {tx.type === 'withdraw' || tx.type === 'service' ? '-' : '+'}{tx.amount}
                            </p>
                            <p className="text-slate-500 text-xs">{tx.currency}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${getStatusColor(tx.status)}`}>
                            {tx.status.toUpperCase()}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <button className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                              Details
                            </button>
                            {tx.status === 'completed' && (
                              <>
                                <span className="text-slate-700">•</span>
                                <button className="text-xs text-slate-400 hover:text-white font-medium transition-colors">
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

              <div className="p-4 flex justify-center border-t border-slate-700/50">
                <button className="px-5 py-2.5 rounded-lg bg-slate-900/50 text-white text-sm font-medium hover:bg-slate-900/70 transition-all">
                  Load More Transactions
                </button>
              </div>
            </div>
          )}

          {/* Auto-update Notice */}
          <div className="rounded-lg bg-blue-500/10 p-3.5 border border-blue-500/20">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs sm:text-sm text-slate-300">
                Balances auto-update periodically. Click "Refresh" for instant updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}