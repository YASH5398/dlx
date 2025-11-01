import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, orderBy, where } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useUser } from '../context/UserContext';
import { useReferralIncome } from '../hooks/useReferralIncome';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CurrencyDollarIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface DLXWalletCardProps {
  className?: string;
}

interface MiningTransaction {
  id: string;
  amount: number;
  type: 'mining' | 'referral' | 'bonus';
  description: string;
  timestamp: number;
  date: string;
}

interface DLXWalletData {
  totalMinedDLX: number;
  totalReferralDLX: number;
  totalDLX: number;
  usdValue: number;
  inrValue: number;
  miningHistory: MiningTransaction[];
}

interface PriceData {
  dlxToUsd: number;
  usdToInr: number;
}

const DLXWalletCard: React.FC<DLXWalletCardProps> = ({ className = '' }) => {
  const { user } = useUser();
  
  const {
    incomeData: referralIncomeData,
    loading: referralIncomeLoading,
    getTotalEarnings: getReferralTotalEarnings,
    getLevel1Earnings: getReferralLevel1Earnings,
    getJoinBonus,
    getActiveReferralsCount: getReferralCounts
  } = useReferralIncome();
  
  const [dlxData, setDlxData] = useState<DLXWalletData>({
    totalMinedDLX: 0,
    totalReferralDLX: 0,
    totalDLX: 0,
    usdValue: 0,
    inrValue: 0,
    miningHistory: []
  });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [priceData, setPriceData] = useState<PriceData>({
    dlxToUsd: 0.1, // Default fallback rate
    usdToInr: 83.0 // Default fallback rate
  });

  // Fetch real-time price data
  const fetchPriceData = async () => {
    try {
      // Fetch DLX price and USD to INR rate
      const [dlxResponse, usdInrResponse] = await Promise.all([
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=digilinex&vs_currencies=usd'),
        fetch('https://api.exchangerate-api.com/v4/latest/USD')
      ]);

      if (dlxResponse.ok && usdInrResponse.ok) {
        const dlxData = await dlxResponse.json();
        const usdInrData = await usdInrResponse.json();
        
        setPriceData({
          dlxToUsd: dlxData.digilinex?.usd || 0.1,
          usdToInr: usdInrData.rates?.INR || 83.0
        });
      }
    } catch (error) {
      console.warn('Failed to fetch price data, using fallback rates:', error);
      // Keep default rates if API fails
    }
  };

  // Fetch price data on component mount and every 5 minutes
  useEffect(() => {
    fetchPriceData();
    const priceInterval = setInterval(fetchPriceData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(priceInterval);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const userId = user.id;
    
    // Listen to user document for DLX data
    const userDocRef = doc(firestore, 'users', userId);
    const unsubscribeUser = onSnapshot(userDocRef, (userSnap) => {
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const totalMinedDLX = userData.wallet?.miningBalance || 0;
        const totalReferralDLX = userData.totalReferralDLX || 0;
        const totalDLX = totalMinedDLX + totalReferralDLX;
        
        setDlxData(prev => ({
          ...prev,
          totalMinedDLX,
          totalReferralDLX,
          totalDLX,
          usdValue: totalDLX * priceData.dlxToUsd,
          inrValue: totalDLX * priceData.dlxToUsd * priceData.usdToInr
        }));
        setIsLoading(false);
      } else {
        // If no user document exists, show sample data for demo
        const sampleMinedDLX = 150.75;
        const sampleReferralDLX = 25.50;
        const sampleTotalDLX = sampleMinedDLX + sampleReferralDLX;
        
        setDlxData(prev => ({
          ...prev,
          totalMinedDLX: sampleMinedDLX,
          totalReferralDLX: sampleReferralDLX,
          totalDLX: sampleTotalDLX,
          usdValue: sampleTotalDLX * priceData.dlxToUsd,
          inrValue: sampleTotalDLX * priceData.dlxToUsd * priceData.usdToInr
        }));
        setIsLoading(false);
      }
    });

    // Listen to mining transactions
    const miningQuery = query(
      collection(firestore, 'users', userId, 'miningTransactions'),
      orderBy('timestamp', 'desc')
    );
    const unsubscribeMining = onSnapshot(miningQuery, (miningSnap) => {
      const history: MiningTransaction[] = [];
      miningSnap.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          amount: data.amount || 0,
          type: data.type || 'mining',
          description: data.description || 'Mining reward',
          timestamp: data.timestamp || 0,
          date: data.timestamp ? new Date(data.timestamp).toLocaleString() : ''
        });
      });
      
      setDlxData(prev => ({
        ...prev,
        miningHistory: history
      }));
    });

    return () => {
      unsubscribeUser();
      unsubscribeMining();
    };
  }, [user?.id, priceData.dlxToUsd, priceData.usdToInr]);

  // Recalculate values when price data changes
  useEffect(() => {
    if (dlxData.totalDLX > 0) {
      setDlxData(prev => ({
        ...prev,
        usdValue: prev.totalDLX * priceData.dlxToUsd,
        inrValue: prev.totalDLX * priceData.dlxToUsd * priceData.usdToInr
      }));
    }
  }, [priceData.dlxToUsd, priceData.usdToInr, dlxData.totalDLX]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'mining':
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <CurrencyDollarIcon className="w-4 h-4 text-white" />
          </div>
        );
      case 'referral':
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <UserGroupIcon className="w-4 h-4 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <CurrencyDollarIcon className="w-4 h-4 text-white" />
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/20 backdrop-blur-xl p-6 shadow-2xl ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-32 bg-gray-700 rounded"></div>
            <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-700 rounded"></div>
            <div className="h-8 w-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/20 backdrop-blur-xl p-6 shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105 group ${className}`}>
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -z-10" />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-lg">DLX</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">DLX Wallet</h3>
              <p className="text-cyan-300 text-sm">DigiLinex Token</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsDetailsOpen(true)}
            className="p-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300 hover:scale-110 group"
          >
            <svg className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>

        {/* Token Balance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-cyan-300 text-sm">Total DLX</span>
            <div className="text-right">
              <span className="text-3xl font-bold text-white">{formatNumber(dlxData.totalDLX)}</span>
              <div className="text-xs text-cyan-300">${priceData.dlxToUsd.toFixed(4)} per DLX</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-cyan-300 mb-1">USD Value</div>
              <div className="text-lg font-semibold text-white">${formatNumber(dlxData.usdValue)}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-cyan-300 mb-1">INR Value</div>
              <div className="text-lg font-semibold text-white">₹{formatNumber(dlxData.inrValue)}</div>
            </div>
          </div>
        </div>


        {/* Referral Income Summary */}
        {!referralIncomeLoading && (referralIncomeData.totalIncome.total > 0 || getJoinBonus('total') > 0) && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 text-sm font-medium">Referral Income Summary</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                <div className="text-cyan-300 mb-1">Commission DLX</div>
                <div className="text-white font-semibold">{getReferralTotalEarnings('DLX').toFixed(2)}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                <div className="text-cyan-300 mb-1">Join Bonus DLX</div>
                <div className="text-white font-semibold">{getJoinBonus('total').toFixed(2)}</div>
              </div>
            </div>
            
            {/* Join Bonus Breakdown */}
            {getJoinBonus('total') > 0 && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-green-500/20">
                <div className="text-green-300 text-xs font-medium mb-2">Join Bonus Breakdown</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-gray-400">Level 1 (+10 DLX each)</div>
                    <div className="text-white font-semibold">{getJoinBonus('level1').toFixed(0)} DLX</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* DLX Details Modal */}
      <Transition appear show={isDetailsOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsDetailsOpen(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/20 p-6 text-left align-middle shadow-2xl transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold">DLX</span>
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-xl font-bold text-white">
                          DLX Wallet Details
                        </Dialog.Title>
                        <p className="text-cyan-300 text-sm">Your token overview</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsDetailsOpen(false)}
                      className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Balance Summary */}
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 mb-6 border border-cyan-500/20">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">{formatNumber(dlxData.totalDLX)}</div>
                      <div className="text-cyan-300 text-sm mb-3">Total DLX Tokens</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">USD Value</div>
                          <div className="text-white font-semibold">${formatNumber(dlxData.usdValue)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">INR Value</div>
                          <div className="text-white font-semibold">₹{formatNumber(dlxData.inrValue)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                          <CurrencyDollarIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">Mined DLX</div>
                          <div className="text-cyan-300 text-sm">From mining activities</div>
                        </div>
                      </div>
                      <div className="text-white font-bold">{formatNumber(dlxData.totalMinedDLX)}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                          <UserGroupIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">Referral DLX</div>
                          <div className="text-green-300 text-sm">From referrals</div>
                        </div>
                      </div>
                      <div className="text-white font-bold">{formatNumber(dlxData.totalReferralDLX)}</div>
                    </div>
                  </div>

                  {/* Mining History */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-cyan-400" />
                      Recent Activity
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
                      {dlxData.miningHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-500 text-sm">No mining activity yet</div>
                        </div>
                      ) : (
                        dlxData.miningHistory.slice(0, 10).map((transaction) => (
                          <div key={transaction.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors">
                            {getTransactionIcon(transaction.type)}
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate">{transaction.description}</div>
                              <div className="text-gray-400 text-xs">{transaction.date}</div>
                            </div>
                            <div className="text-cyan-400 font-semibold text-sm">+{formatNumber(transaction.amount)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default DLXWalletCard;
