import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { firestore } from '../../firebase';
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  limit,
  getDocs,
  addDoc,
  increment,
} from 'firebase/firestore';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useReferral } from '../../hooks/useReferral';

const DAY_MS = 24 * 60 * 60 * 1000;

// Task interface
interface TaskState {
  clicked: boolean;
  clickedAt: number | null;
  username: string;
  completed: boolean;
  claimed: boolean;
}

export default function Mining2() {
  const { user } = useUser();
  const navigate = useNavigate();
  const uid = user?.id;
  const { activeReferrals } = useReferral() as any;

  const [status, setStatus] = useState<'active'|'inactive'>('inactive');
  const [lastClaimAt, setLastClaimAt] = useState<number | null>(null);
  const [miningBalance, setMiningBalance] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [now, setNow] = useState<number>(() => Date.now());
  const [infoOpen, setInfoOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [totalSwapUsd, setTotalSwapUsd] = useState<number>(0);
  
  // Task states
  const [telegramTask, setTelegramTask] = useState<TaskState>({
    clicked: false,
    clickedAt: null,
    username: '',
    completed: false,
    claimed: false
  });
  
  const [twitterTask, setTwitterTask] = useState<TaskState>({
    clicked: false,
    clickedAt: null,
    username: '',
    completed: false,
    claimed: false
  });

  // Tasks modal state
  const [showTasksModal, setShowTasksModal] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!uid) return;
    const userRef = doc(firestore, 'users', uid);
    const unsub = onSnapshot(userRef, (snap) => {
      const data: any = snap.data() || {};
      const st = (data.status || 'inactive') as 'active'|'inactive';
      setStatus(st);
      const lca = data.lastClaimAt?.toMillis?.() ?? data.lastClaimAt ?? null;
      setLastClaimAt(typeof lca === 'number' ? lca : null);
      const mb = Number(data.wallet?.miningBalance ?? 0);
      setMiningBalance(mb);
      setStreak(Number(data.miningStreak ?? 0));
    });
    return () => { try { unsub(); } catch {} };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const txQ = query(collection(firestore, 'wallets', uid, 'transactions'), where('type', '==', 'swap'));
    const unsub = onSnapshot(txQ, (snap) => {
      let sum = 0;
      snap.forEach((docSnap) => {
        const t = docSnap.data() as any;
        const status = String(t.status || 'pending');
        if (status !== 'failed') sum += Number(t.amount || 0);
      });
      setTotalSwapUsd(Number(sum.toFixed(2)));
    });
    return () => { try { unsub(); } catch {} };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const uref = doc(firestore, 'users', uid);
        const usnap = await getDoc(uref);
        const udata: any = usnap.data() || {};
        if (udata.status === 'active') return;
        const q = query(collection(firestore, 'orders'), where('userId', '==', uid), limit(1));
        const res = await getDocs(q);
        if (!res.empty) {
          await updateDoc(uref, { status: 'active', statusUpdatedAt: serverTimestamp() });
        }
      } catch (e) {
        // silently ignore
      }
    })();
  }, [uid]);

  // Load task states from user data
  useEffect(() => {
    if (!uid) return;
    
    const loadTaskStates = async () => {
      try {
        const userRef = doc(firestore, 'users', uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data() || {};
        
        // Load Telegram task state
        if (userData.telegramTask) {
          setTelegramTask(userData.telegramTask);
        }
        
        // Load Twitter task state
        if (userData.twitterTask) {
          setTwitterTask(userData.twitterTask);
        }
      } catch (error) {
        console.error('Error loading task states:', error);
      }
    };
    
    loadTaskStates();
  }, [uid]);

  // Handle Telegram task click
  const handleTelegramClick = async () => {
    if (!uid) return;
    
    const clickedAt = Date.now();
    const newState = {
      ...telegramTask,
      clicked: true,
      clickedAt
    };
    
    setTelegramTask(newState);
    
    // Save to Firestore
    try {
      const userRef = doc(firestore, 'users', uid);
      await updateDoc(userRef, {
        telegramTask: newState
      });
    } catch (error) {
      console.error('Error saving Telegram task state:', error);
    }
    
    // Open Telegram link
    window.open('https://t.me/digilinex', '_blank');
  };

  // Handle Twitter task click
  const handleTwitterClick = async () => {
    if (!uid) return;
    
    const clickedAt = Date.now();
    const newState = {
      ...twitterTask,
      clicked: true,
      clickedAt
    };
    
    setTwitterTask(newState);
    
    // Save to Firestore
    try {
      const userRef = doc(firestore, 'users', uid);
      await updateDoc(userRef, {
        twitterTask: newState
      });
    } catch (error) {
      console.error('Error saving Twitter task state:', error);
    }
    
    // Open Twitter link
    window.open('https://twitter.com/digilinex', '_blank');
  };

  // Handle username submission and reward claiming
  const handleUsernameSubmit = async (taskType: 'telegram' | 'twitter') => {
    if (!uid) return;
    
    const currentTask = taskType === 'telegram' ? telegramTask : twitterTask;
    const setCurrentTask = taskType === 'telegram' ? setTelegramTask : setTwitterTask;
    
    // Validate username
    if (!currentTask.username.trim()) {
      toast.error('Please enter your username');
      return;
    }
    
    // Check 10-second delay
    if (currentTask.clickedAt && (Date.now() - currentTask.clickedAt) < 10000) {
      toast.error('👉 It seems you haven\'t followed yet. Please try again after a few seconds.');
      return;
    }
    
    try {
      const userRef = doc(firestore, 'users', uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() || {};
      const wallet = userData.wallet || { main: 0, purchase: 0, miningBalance: 0 };
      
      // Update task state
      const newTaskState = {
        ...currentTask,
        completed: true,
        claimed: true
      };
      
      // Update wallet with 25 DLX reward
      const updatedWallet = {
        ...wallet,
        miningBalance: Number(wallet.miningBalance || 0) + 25
      };
      
      // Update user document
      const updateData: any = {
        wallet: updatedWallet,
        [`${taskType}Task`]: newTaskState
      };
      
      await updateDoc(userRef, updateData);
      
      // Log task completion
      await addDoc(collection(firestore, 'taskCompletions'), {
        userId: uid,
        taskType,
        username: currentTask.username,
        reward: 25,
        completedAt: serverTimestamp()
      });
      
      // Update local state
      setCurrentTask(newTaskState);
      
      toast.success(`🎉 Congratulations! You've earned 25 DLX for completing the ${taskType} task!`);
      
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      toast.error(error?.message || 'Failed to claim reward. Please try again.');
    }
  };

  const baseReward = status === 'active' ? 15 : 10;
  const nextAt = (lastClaimAt ?? 0) + DAY_MS;
  const remainingMs = Math.max(0, nextAt - now);
  const canClaim = remainingMs <= 0;
  const progress = useMemo(() => {
    if (!lastClaimAt) return 0;
    const elapsed = now - lastClaimAt;
    return Math.max(0, Math.min(100, Math.floor((elapsed / DAY_MS) * 100)));
  }, [now, lastClaimAt]);

  const formatCountdown = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600).toString().padStart(2, '0');
    const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(total % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const claimReward = async () => {
    if (!uid) return toast.error('Not authenticated');
    if (!canClaim) return toast.info('Please wait for the 24-hour cooldown');
    setIsClaiming(true);
    try {
      const uref = doc(firestore, 'users', uid);
      const usnap = await getDoc(uref);
      const udata: any = usnap.data() || {};
      const wallet = udata.wallet || { main: 0, purchase: 0, miningBalance: 0 };
      const prevLast = udata.lastClaimAt?.toMillis?.() ?? udata.lastClaimAt ?? null;
      const prevStreak = Number(udata.miningStreak ?? 0) || 0;
      let newStreak = 1;
      if (typeof prevLast === 'number') {
        const diff = Date.now() - prevLast;
        newStreak = diff <= 48 * 60 * 60 * 1000 ? prevStreak + 1 : 1;
      }
      const bonus = newStreak > 0 && newStreak % 7 === 0 ? 20 : 0;
      const amount = baseReward + bonus;
      const updatedWallet = { ...wallet, miningBalance: Number(wallet.miningBalance || 0) + amount };
      await updateDoc(uref, { wallet: updatedWallet, lastClaimAt: serverTimestamp(), miningStreak: newStreak });
      await addDoc(collection(firestore, 'miningHistory'), { userId: uid, amount, date: serverTimestamp(), status: 'claimed' });
      toast.success(`Claimed ${amount} DLX${bonus ? ` (incl. +${bonus} streak bonus)` : ''}`);
    } catch (e: any) {
      toast.error(e?.message || 'Claim failed');
    } finally {
      setIsClaiming(false);
    }
  };

  const buttonClasses = canClaim && !isClaiming 
    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-blue-500/25' 
    : 'bg-gray-700/50 text-gray-400 cursor-not-allowed';

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden font-sans">
      {/* Background Image */}
      {/* Removed decorative background image to eliminate island graphic */}
      
      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Header: Profile and Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
              {(user as any)?.name?.[0]?.toUpperCase() || 'D'}
            </div>
            <div>
              <div className="text-base sm:text-lg font-semibold text-white">
                {(user as any)?.name || 'DigiLinex User'}
              </div>
              <div className="text-sm text-gray-400">DLX Miner</div>
            </div>
          </div>
          <button
            className={`self-start sm:self-auto px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ring-0 focus:ring-2 focus:ring-offset-0 focus:ring-offset-gray-900 focus:ring-blue-500/50 ${
              status === 'active'
                ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30 text-emerald-400 hover:from-emerald-500/20 hover:to-emerald-600/20'
                : 'bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 text-red-400 hover:from-red-500/20 hover:to-red-600/20'
            }`}
            onClick={() => status === 'inactive' && setInfoOpen(true)}
          >
            {status === 'active' ? 'Active ✅' : 'Inactive ❌'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="group rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-700/50 p-4 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300">
            <div className="text-xs font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Next Claim</div>
            <div className="text-lg font-bold text-white mt-1">
              {canClaim ? 'Ready!' : formatCountdown(remainingMs)}
            </div>
          </div>
          <div className="group rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-700/50 p-4 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300">
            <div className="text-xs font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Total DLX</div>
            <div className="text-lg font-bold text-white mt-1">
              {miningBalance.toLocaleString()}
            </div>
          </div>
          <div className="group rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-700/50 p-4 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300">
            <div className="text-xs font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Referrals</div>
            <div className="text-lg font-bold text-white mt-1">
              {activeReferrals ?? 0}
            </div>
          </div>
          <div className="group rounded-xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-700/50 p-4 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300">
            <div className="text-xs font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Earned $ (Swaps)</div>
            <div className="text-lg font-bold text-white mt-1">
              ${totalSwapUsd.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Mining Circle Section */}
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-[300px] sm:max-w-[360px] md:max-w-[420px]">
            {/* Daily Reward */}
            <div className="flex justify-center items-center gap-2 text-sm font-semibold text-gray-300 mb-4 sm:mb-6">
              <span className="inline-block h-3 w-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg animate-pulse" />
              <span>{baseReward} DLX / day</span>
            </div>

            {/* Glow Aura */}
            <div className="absolute inset-0 rounded-full blur-xl bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-indigo-500/20 animate-pulse">
              <div className="mx-auto h-[300px] w-[300px] sm:h-[360px] sm:w-[360px] md:h-[380px] md:w-[380px] rounded-full bg-gradient-to-br from-blue-500/5 to-purple-600/5" />
            </div>

            {/* Ring Container */}
            <div className="relative mx-auto h-[300px] w-[300px] sm:h-[360px] sm:w-[360px] md:h-[380px] md:w-[380px] aspect-square flex items-center justify-center">
              {/* Rotating Accent Ring */}
              <div className="absolute inset-0 rounded-full p-2 animate-[spin_15s_linear_infinite] opacity-80">
                <div
                  className="h-full w-full rounded-full border-2 border-transparent"
                  style={{
                    background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6)',
                    WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 8px), black 0)',
                  }}
                />
              </div>

              {/* Progress Ring */}
              <div className="absolute inset-0 rounded-full p-4">
                <div
                  className="h-full w-full rounded-full relative overflow-hidden"
                  style={{
                    background: `conic-gradient(#4f46e5 0deg, #4f46e5 ${progress * 3.6}deg, #1e293b ${progress * 3.6}deg 360deg)`,
                  }}
                >
                  <div 
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50"
                    style={{
                      WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 24px), black 0)',
                      mask: 'radial-gradient(farthest-side, transparent calc(100% - 24px), black 0)',
                    }}
                  />
                </div>
              </div>

              {/* Central Logo Section */}
              <div className="relative z-10 w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] md:w-[300px] md:h-[300px] rounded-full overflow-hidden flex items-center justify-center p-2">
                {/* Replaced image logo with neutral gradient circle to remove island graphic */}
                <div
                  className="max-w-full max-h-full rounded-full bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight"
                  style={{ width: '100%', height: '100%' }}
                >
                  DLX
                </div>
              </div>

              {/* Time Text */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-gray-400 text-sm font-medium">
                
              </div>

              {/* Claim Button */}
              <div className="absolute -bottom-8 sm:-bottom-10 left-1/2 -translate-x-1/2 z-20">
                <button
                  disabled={!canClaim || isClaiming}
                  onClick={claimReward}
                  className={`
                    relative px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl font-semibold text-base sm:text-lg shadow-2xl transform transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-0 focus:ring-offset-gray-900 focus:ring-blue-500/30
                    ${buttonClasses}
                    disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed
                    hover:scale-105 active:scale-95
                  `}
                >
                  <span className="relative z-10">
                    {isClaiming ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Claiming...
                      </span>
                    ) : canClaim ? (
                      `${baseReward} DLX`
                    ) : (
                      formatCountdown(remainingMs)
                    )}
                  </span>
                  {canClaim && !isClaiming && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur opacity-0 hover:opacity-100 transition-opacity duration-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Balance & Rate Cards */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8">
          <div className="group rounded-2xl bg-gradient-to-r from-yellow-500/10 via-amber-600/5 to-yellow-500/10 border-2 border-gradient-to-r from-yellow-400/30 to-amber-500/30 px-4 sm:px-6 py-2 sm:py-3.5 flex items-center gap-2 sm:gap-3 shadow-lg hover:shadow-yellow-500/20 transition-all duration-300">
            <span className="inline-block h-2 sm:h-3 w-2 sm:w-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg" />
            <span className="text-sm font-bold text-yellow-300">{miningBalance.toLocaleString()} DLX</span>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 px-4 sm:px-6 py-2 sm:py-3.5 text-sm font-semibold text-gray-300">
            {baseReward} DLX Per Day
          </div>
        </div>

        {/* CTA Section */}
        <div className="rounded-2xl bg-gradient-to-br from-gray-800/70 via-gray-900/50 to-gray-800/70 border border-gray-700/50 p-4 sm:p-6 md:p-8 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 tracking-tight">
                Earn 25 DLX Per Task
              </h3>
              <p className="mt-2 text-sm font-medium text-gray-400">Complete simple tasks to boost your mining!</p>
            </div>
            <div className="flex flex-wrap justify-center lg:justify-end items-center gap-3 sm:gap-4">
              {/* Telegram Task */}
              {!telegramTask.clicked ? (
                <button
                  onClick={handleTelegramClick}
                  className="group relative px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                >
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                    <svg className="h-3 sm:h-4 w-3 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 24v-2.75a10.037 10.037 0 0 1 7.83-3.733 10.224 10.224 0 0 1-3.19 1.148 5.362 5.362 0 0 0 2.419-1.42 10.68 10.68 0 0 1-8.287 3.794 10.444 10.444 0 0 0 7.715-3.398A10.38 10.38 0 0 1 3.844 7.7v-.128a10.316 10.316 0 0 0 4.607 1.387A5.13 5.13 0 0 1 2.8 2.713a10.188 10.188 0 0 1 7.598 3.764 5.681 5.681 0 0 1 1.594-0.66 5.1 5.1 0 0 1 1.158 6.574 10.96 10.96 0 0 0-.302-.831 5.162 5.162 0 0 1 4.868 4.463 10.254 10.254 0 0 0 9.766-10.63 10.71 10.71 0 0 0 3.323-.518A10.988 10.988 0 0 0 24 12a12.56 12.56 0 0 1-8.29 3.106" />
                    </svg>
                    Join Telegram
                  </span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              ) : !telegramTask.claimed ? (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter Telegram username"
                    value={telegramTask.username}
                    onChange={(e) => setTelegramTask(prev => ({ ...prev, username: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-gray-800/50 border border-gray-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                  <button
                    onClick={() => handleUsernameSubmit('telegram')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                  >
                    Submit & Claim 25 DLX
                  </button>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 text-green-400 font-semibold text-sm">
                  ✅ Telegram Completed
                </div>
              )}

              {/* Twitter Task */}
              {!twitterTask.clicked ? (
                <button
                  onClick={handleTwitterClick}
                  className="group relative px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-sky-500/25 transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sky-500/30"
                >
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                    <svg className="h-3 sm:h-4 w-3 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Follow Twitter
                  </span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              ) : !twitterTask.claimed ? (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter Twitter username"
                    value={twitterTask.username}
                    onChange={(e) => setTwitterTask(prev => ({ ...prev, username: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-gray-800/50 border border-gray-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
                  />
                  <button
                    onClick={() => handleUsernameSubmit('twitter')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                  >
                    Submit & Claim 25 DLX
                  </button>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 text-green-400 font-semibold text-sm">
                  ✅ Twitter Completed
                </div>
              )}

              {/* View Tasks Button */}
              <button
                onClick={() => setShowTasksModal(true)}
                className="group relative px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
              >
                <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                  <svg className="h-3 sm:h-4 w-3 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View Tasks
                </span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Accessibility Hint */}
        <div className="text-center text-xs sm:text-sm text-gray-500 font-medium mt-4">
          ⌨️ Use Tab to navigate • Claim available every 24 hours
        </div>
      </div>

      {/* Tasks Modal */}
      <Transition appear show={showTasksModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowTasksModal(false)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700/50 p-6 shadow-2xl shadow-black/50">
                  <Dialog.Title className="text-2xl font-bold text-white mb-6 text-center">
                    🎯 Available Tasks
                  </Dialog.Title>
                  
                  <div className="space-y-4">
                    {/* Social Media Tasks */}
                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="text-blue-400">📱</span>
                        Social Media Tasks
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 24v-2.75a10.037 10.037 0 0 1 7.83-3.733 10.224 10.224 0 0 1-3.19 1.148 5.362 5.362 0 0 0 2.419-1.42 10.68 10.68 0 0 1-8.287 3.794 10.444 10.444 0 0 0 7.715-3.398A10.38 10.38 0 0 1 3.844 7.7v-.128a10.316 10.316 0 0 0 4.607 1.387A5.13 5.13 0 0 1 2.8 2.713a10.188 10.188 0 0 1 7.598 3.764 5.681 5.681 0 0 1 1.594-0.66 5.1 5.1 0 0 1 1.158 6.574 10.96 10.96 0 0 0-.302-.831 5.162 5.162 0 0 1 4.868 4.463 10.254 10.254 0 0 0 9.766-10.63 10.71 10.71 0 0 0 3.323-.518A10.988 10.988 0 0 0 24 12a12.56 12.56 0 0 1-8.29 3.106" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-white font-medium">Join Telegram Channel</div>
                              <div className="text-gray-400 text-sm">Follow our official Telegram for updates</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400 font-bold">25 DLX</span>
                            {telegramTask.claimed ? (
                              <span className="text-green-400 text-sm">✅ Completed</span>
                            ) : (
                              <span className="text-gray-400 text-sm">Pending</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-white font-medium">Follow Twitter Account</div>
                              <div className="text-gray-400 text-sm">Follow us on Twitter for latest news</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400 font-bold">25 DLX</span>
                            {twitterTask.claimed ? (
                              <span className="text-green-400 text-sm">✅ Completed</span>
                            ) : (
                              <span className="text-gray-400 text-sm">Pending</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Daily Tasks */}
                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="text-green-400">🎯</span>
                        Daily Tasks
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-white font-medium">Daily Mining Claim</div>
                              <div className="text-gray-400 text-sm">Claim your daily mining rewards</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400 font-bold">{baseReward} DLX</span>
                            <span className="text-blue-400 text-sm">Daily</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setShowTasksModal(false)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-semibold transition-all duration-300"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal for Inactive Status */}
      <Transition appear show={infoOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setInfoOpen(false)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700/50 p-4 sm:p-6 md:p-8 shadow-2xl shadow-black/50">
                  <Dialog.Title className="text-lg sm:text-xl font-bold text-white mb-4 text-center">
                    🚀 Activate Your Miner
                  </Dialog.Title>
                  <div className="text-sm font-medium text-gray-300 mb-4 sm:mb-6 text-center leading-relaxed">
                    <p>Purchase any digital product from the DigiLinex store to activate your account.</p>
                    <p className="mt-2 font-semibold text-emerald-400">You'll unlock 15 DLX/day + exclusive tasks!</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
                    <button
                      type="button"
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 font-semibold text-sm sm:text-base transition-all duration-300 border border-gray-600/30 hover:border-gray-500/50"
                      onClick={() => setInfoOpen(false)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
                      onClick={() => {
                        setInfoOpen(false);
                        navigate('/dashboard');
                      }}
                    >
                      🛒 Go to Store
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}