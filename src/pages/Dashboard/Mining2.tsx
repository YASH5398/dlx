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
} from 'firebase/firestore';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function Mining2() {
  const { user } = useUser();
  const navigate = useNavigate();
  const uid = user?.id;

  const [status, setStatus] = useState<'active'|'inactive'>('inactive');
  const [lastClaimAt, setLastClaimAt] = useState<number | null>(null);
  const [miningBalance, setMiningBalance] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [now, setNow] = useState<number>(() => Date.now());
  const [infoOpen, setInfoOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

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

  // Ensure active after purchase
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        // If already active, skip
        const uref = doc(firestore, 'users', uid);
        const usnap = await getDoc(uref);
        const udata: any = usnap.data() || {};
        if (udata.status === 'active') return;
        // Check orders
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

  const baseReward = status === 'active' ? 15 : 10;
  const nextAt = (lastClaimAt ?? 0) + DAY_MS;
  const remainingMs = Math.max(0, nextAt - now);
  const canClaim = remainingMs <= 0;
  const progress = useMemo(() => {
    if (!lastClaimAt) return 0;
    const elapsed = now - lastClaimAt;
    return Math.max(0, Math.min(100, Math.floor((elapsed / DAY_MS) * 100)));
  }, [now, lastClaimAt]);

  const claimReward = async () => {
    if (!uid) return toast.error('Not authenticated');
    if (!canClaim) return toast.info('You can claim once every 24 hours');
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
        // If claimed within 48h of last claim (i.e., next day), continue streak
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

  return (
    <div className="min-h-screen w-full bg-[#0a0e1f] text-white p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Mining</h1>
          <button
            className={`px-3 py-1.5 rounded-md text-sm ${status==='active' ? 'bg-emerald-600' : 'bg-red-600'} hover:opacity-90`}
            onClick={() => status==='inactive' ? setInfoOpen(true) : undefined}
          >
            {status === 'active' ? 'Active ✅' : 'Inactive ❌'}
          </button>
        </div>

        {/* Claim card */}
        <div className="rounded-xl bg-[#0b122b] border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-300">Base Reward</div>
              <div className="text-2xl font-bold">{baseReward} DLX / day</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-300">Mining Balance</div>
              <div className="text-2xl font-bold text-emerald-400">{miningBalance}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 text-sm text-gray-400">
              {canClaim ? 'Ready to claim' : `Next claim in ${new Date(remainingMs).toISOString().slice(11,19)}`}
            </div>
          </div>

          <div className="mt-4">
            <button
              disabled={!canClaim || isClaiming}
              onClick={claimReward}
              className={`w-full px-4 py-2 rounded-md ${canClaim ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-white/10 text-gray-400'} transition`}
            >
              {isClaiming ? 'Claiming…' : canClaim ? 'Claim Now' : 'Locked'}
            </button>
            <div className="mt-1 text-xs text-gray-400">Claim once per 24 hours</div>
          </div>

          <div className="mt-4 text-sm text-gray-300">Streak: <span className="font-semibold">{streak} days</span> {streak>0 && streak%7===0 && <span className="text-amber-400">(+20 bonus)</span>}</div>
        </div>

        {/* Tasks shortcut */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-300">Daily Tasks</div>
            <div className="text-lg font-semibold">Earn extra 1–5 DLX</div>
          </div>
          <button className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500" onClick={() => navigate('/dashboard/tasks')}>View Tasks</button>
        </div>
      </div>

      {/* Inactive info modal */}
      <Transition appear show={infoOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setInfoOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-sm rounded-xl bg-[#0b122b] border border-white/10 p-4">
                  <Dialog.Title className="text-base font-semibold mb-2">Activate your account</Dialog.Title>
                  <p className="text-sm text-gray-300">To activate your account, purchase any digital product or service from the DigiLinex store. Once purchased, your account will automatically become Active, and you’ll start earning daily rewards and unlock tasks.</p>
                  <div className="mt-4 flex justify-end gap-2">
                    <button className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm" onClick={() => setInfoOpen(false)}>Close</button>
                    <button className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm text-white" onClick={() => navigate('/dashboard/digital-products')}>Go to Products</button>
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