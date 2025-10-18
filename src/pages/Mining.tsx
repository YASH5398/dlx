import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Wallet, Share2, Settings } from 'lucide-react';
import { syncMiningBalanceToWallet } from '../utils/wallet';

export default function Mining() {
  const [telegramJoined, setTelegramJoined] = useState(false);
  const [twitterJoined, setTwitterJoined] = useState(false);
  const [miningActive, setMiningActive] = useState(false);
  const [balance, setBalance] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const canStart = telegramJoined && twitterJoined;

  useEffect(() => {
    if (miningActive) {
      // Simulate 24h with 10s interval crediting 10 DLX
      intervalRef.current = window.setInterval(() => {
        setBalance((b) => b + 10);
      }, 10_000);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [miningActive]);

  useEffect(() => {
    syncMiningBalanceToWallet(balance);
  }, [balance]);
  const handleTap = () => {
    if (!canStart) {
      alert('Please join Telegram and Twitter first to start mining.');
      return;
    }
    setMiningActive(true);
  };

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-[#0a0f1f] to-[#101a3b] text-white flex items-center justify-center p-4">
      {/* Mobile-centered container */}
      <div className="w-full max-w-[375px] mx-auto relative">
        {/* Top balance */}
        <div className="mb-3 text-xs text-indigo-200/80">Balance: <span className="font-semibold text-indigo-100">{balance} DLX</span></div>

        {/* Speed text */}
        <div className="text-center text-sm text-white/90">Speed :10 DLX/Day</div>

        {/* Center circle */}
        <div className="mt-4 flex items-center justify-center">
          <motion.button
            onClick={handleTap}
            className="relative w-56 h-56 rounded-full flex flex-col items-center justify-center select-none"
            animate={miningActive ? { scale: [1, 1.06, 1], boxShadow: ['0 0 0px rgba(0,0,0,0)', '0 0 40px rgba(0,234,255,0.35)', '0 0 0px rgba(0,0,0,0)'] } : { scale: 1 }}
            transition={miningActive ? { duration: 2, repeat: Infinity } : { duration: 0.2 }}
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,234,255,0.12) 0%, rgba(0,0,0,0) 60%)',
            }}
          >
            {/* Neon ring */}
            <div className="absolute inset-0 rounded-full ring-2 ring-cyan-400/40 shadow-[0_0_60px_rgba(0,234,255,0.25)]" />
            {/* Inner circle */}
            <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-[#0f1f47] to-[#0b1432] shadow-inner" />
            <div className="relative z-10 text-center">
              <div className="text-3xl">⛏️</div>
              <div className="mt-2 text-sm font-medium">
                {canStart ? 'Tap to Start Mining' : 'Join to Unlock Mining'}
              </div>
            </div>
          </motion.button>
        </div>

        {/* Status */}
        <div className="mt-4 text-center text-xs">
          {!miningActive && <span className="text-white/75">Inactive</span>}
          {miningActive && <span className="text-cyan-300">Mining Active — 10 DLX every 24 hours</span>}
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <div className="text-center text-[11px] text-indigo-200/70">claim 50 DLX instant</div>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => {
                if (!telegramJoined) {
                  const u = prompt('Enter your Telegram username');
                  // simulate submit username
                }
                setTelegramJoined(true);
              }}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition-all ring-1 ${telegramJoined ? 'bg-emerald-600/20 ring-emerald-400/30 text-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.25)]' : 'bg-white/5 ring-white/10 text-white hover:bg-white/10 shadow-[0_0_24px_rgba(99,102,241,0.25)]'}`}
            >
              {telegramJoined ? 'Telegram Joined ✓' : 'Join Telegram'}
            </button>
            <button
              onClick={() => {
                if (!twitterJoined) {
                  const u = prompt('Enter your Twitter/X username');
                }
                setTwitterJoined(true);
              }}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition-all ring-1 ${twitterJoined ? 'bg-emerald-600/20 ring-emerald-400/30 text-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.25)]' : 'bg-white/5 ring-white/10 text-white hover:bg-white/10 shadow-[0_0_24px_rgba(99,102,241,0.25)]'}`}
            >
              {twitterJoined ? 'Twitter Joined ✓' : 'Join Twitter'}
            </button>
          </div>
        </div>

        {/* Bottom nav */}
        <nav className="mt-8 rounded-3xl bg-white/[0.06] ring-1 ring-white/10 backdrop-blur-xl p-2 shadow-[0_0_40px_rgba(99,102,241,0.25)]">
          <ul className="grid grid-cols-4 gap-2">
            <li>
              <button className="w-full flex flex-col items-center gap-1 rounded-2xl px-3 py-2 bg-indigo-600/20 text-indigo-200 ring-1 ring-indigo-400/30 shadow-[0_0_24px_rgba(99,102,241,0.35)]">
                <Home className="size-4" />
                <span className="text-[11px]">Home</span>
              </button>
            </li>
            <li>
              <button className="w-full flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-white/80 hover:bg-white/10">
                <Wallet className="size-4" />
                <span className="text-[11px]">Wallet</span>
              </button>
            </li>
            <li>
              <button className="w-full flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-white/80 hover:bg-white/10">
                <Share2 className="size-4" />
                <span className="text-[11px]">Share</span>
              </button>
            </li>
            <li>
              <button className="w-full flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-white/80 hover:bg-white/10">
                <Settings className="size-4" />
                <span className="text-[11px]">Settings</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}