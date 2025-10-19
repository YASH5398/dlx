import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase';
import { ref, onValue, update, push, set, runTransaction, off } from 'firebase/database';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';

// Types for claim records
type ClaimRecord = {
  id: string;
  amount: number; // in DLX
  type: 'self' | 'team';
  createdAt: number; // epoch ms
  fromUserId?: string;
  fromName?: string;
};

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLAIM_AMOUNT = 10; // 10 DLX per claim

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((total % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(total % 60)
    .toString()
    .padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function Mining() {
  const { user } = useUser();
  const { addNotification } = useNotifications();
  const uid = user?.id;

  const [lastClaimAt, setLastClaimAt] = useState<number | null>(null);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [teamClaims, setTeamClaims] = useState<ClaimRecord[]>([]);
  const [now, setNow] = useState<number>(() => Date.now());
  const [isClaiming, setIsClaiming] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [olderVisibleCount, setOlderVisibleCount] = useState(5);
  const [showOlder, setShowOlder] = useState(false);

  // Subscriptions
  useEffect(() => {
    if (!uid) return;

    const rLast = ref(db, `users/${uid}/mining/lastClaimAt`);
    const rClaims = ref(db, `users/${uid}/mining/claims`);
    const rTeam = ref(db, `users/${uid}/mining/teamClaims`);

    const unsubLast = onValue(rLast, (snap) => setLastClaimAt(snap.val() ?? null));
    const unsubClaims = onValue(rClaims, (snap) => {
      const val = snap.val() || {};
      const arr = Object.values(val) as ClaimRecord[];
      arr.sort((a, b) => b.createdAt - a.createdAt);
      setClaims(arr);
    });
    const unsubTeam = onValue(rTeam, (snap) => {
      const val = snap.val() || {};
      const arr = Object.values(val) as ClaimRecord[];
      arr.sort((a, b) => b.createdAt - a.createdAt);
      setTeamClaims(arr);
    });

    return () => {
      off(rLast);
      off(rClaims);
      off(rTeam);
      try { unsubLast(); } catch {}
      try { unsubClaims(); } catch {}
      try { unsubTeam(); } catch {}
    };
  }, [uid]);

  // 1s timer for countdown
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Derived lists
  const merged = useMemo(() => {
    const all = [...claims, ...teamClaims];
    return all.sort((a, b) => b.createdAt - a.createdAt);
  }, [claims, teamClaims]);

  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const latest7Days = useMemo(() => merged.filter((r) => r.createdAt >= weekAgo), [merged, weekAgo]);
  const olderItems = useMemo(() => merged.filter((r) => r.createdAt < weekAgo), [merged, weekAgo]);

  const nextAt = (lastClaimAt ?? 0) + COOLDOWN_MS;
  const remainingMs = Math.max(0, nextAt - now);
  const canClaim = remainingMs <= 0;

  const handleClaim = async () => {
    if (!uid || !canClaim || isClaiming) return;
    setIsClaiming(true);
    const ts = Date.now();
    try {
      const idRef = push(ref(db, `users/${uid}/mining/claims`));
      const record: ClaimRecord = {
        id: idRef.key as string,
        amount: CLAIM_AMOUNT,
        type: 'self',
        createdAt: ts,
      };

      // Atomically increment wallet.dlx and set claim + lastClaimAt
      await Promise.all([
        set(idRef, record),
        update(ref(db, `users/${uid}/mining`), { lastClaimAt: ts }),
        runTransaction(ref(db, `users/${uid}/wallet/dlx`), (curr) => (typeof curr === 'number' ? curr : 0) + CLAIM_AMOUNT),
      ]);

      // Notify
      try {
        await addNotification({ type: 'mining', message: `Claimed ${CLAIM_AMOUNT} DLX. +${CLAIM_AMOUNT} DLX added to wallet.`, route: '/wallet' }, true);
      } catch {
        document.dispatchEvent(new CustomEvent('notifications:add', { detail: { type: 'mining', message: `Claimed ${CLAIM_AMOUNT} DLX. +${CLAIM_AMOUNT} DLX added to wallet.` } }));
      }
    } catch (e: any) {
      try {
        await addNotification({ type: 'error', message: e?.message ?? 'Claim failed. Please try again.' }, false);
      } catch {}
    } finally {
      setIsClaiming(false);
    }
  };

  const hasMoreLatest = visibleCount < latest7Days.length;
  const hasOlder = olderItems.length > 0;
  const canViewMore = hasMoreLatest || (!showOlder && hasOlder) || (showOlder && olderVisibleCount < olderItems.length);

  const onViewMore = () => {
    if (hasMoreLatest) {
      setVisibleCount((v) => Math.min(v + 5, latest7Days.length));
    } else if (!showOlder && hasOlder) {
      setShowOlder(true);
    } else if (showOlder && olderVisibleCount < olderItems.length) {
      setOlderVisibleCount((v) => Math.min(v + 5, olderItems.length));
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Daily Mining</h1>
            <p className="text-sm text-gray-400 mt-1">Claim 10 DLX every 24 hours</p>
          </div>
          <div className="rounded-lg bg-gray-700/50 border border-gray-600/30 px-3 py-1.5 text-xs text-gray-300">
            DLX wallet updates instantly
          </div>
        </div>

        {/* Claim Card */}
        <div className="rounded-2xl bg-gray-800/50 border border-gray-700/30 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-300">
              {canClaim ? (
                <span className="text-emerald-400 font-medium">Claim available now</span>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Next claim in</span>
                  <span className="font-mono text-cyan-400">{formatCountdown(remainingMs)}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleClaim}
              disabled={!canClaim || isClaiming}
              className={
                'w-full rounded-lg px-6 py-3 font-semibold text-base transition-all duration-200 ' +
                (canClaim && !isClaiming
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/30')
              }
            >
              {isClaiming ? 'Claiming...' : canClaim ? 'Claim 10 DLX' : 'Claim Locked'}
            </button>
            <p className="text-xs text-gray-400">Cooldown: 24 hours after each claim</p>
          </div>
        </div>

        {/* Latest Claims (7 days) */}
        <div className="rounded-2xl bg-gray-800/50 border border-gray-700/30 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Latest Claims (7 days)</h2>
            <span className="text-xs text-gray-400">{latest7Days.length} total</span>
          </div>
          {latest7Days.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">No claims yet. Make your first claim!</div>
          ) : (
            <div className="space-y-3">
              {latest7Days.slice(0, visibleCount).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200 border border-gray-600/20"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      r.type === 'self' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    <span className="text-lg">{r.type === 'self' ? '⛏️' : '👥'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {r.type === 'self' ? 'You claimed' : `${r.fromName || 'Team member'} claimed`} {r.amount} DLX
                    </p>
                    <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">+{r.amount} DLX</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Older section */}
        {showOlder && olderItems.length > 0 && (
          <div className="rounded-2xl bg-gray-800/50 border border-gray-700/30 backdrop-blur-sm p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Older Claims</h2>
              <span className="text-xs text-gray-400">{olderItems.length} records</span>
            </div>
            <div className="space-y-3">
              {olderItems.slice(0, olderVisibleCount).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200 border border-gray-600/20"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      r.type === 'self' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    <span className="text-lg">{r.type === 'self' ? '⛏️' : '👥'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {r.type === 'self' ? 'You claimed' : `${r.fromName || 'Team member'} claimed`} {r.amount} DLX
                    </p>
                    <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">+{r.amount} DLX</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View More */}
        {canViewMore && (
          <div className="flex justify-center">
            <button
              onClick={onViewMore}
              className="px-6 py-2.5 rounded-lg bg-gray-700/50 border border-gray-600/30 text-gray-300 hover:bg-gray-600/50 hover:text-white transition-all duration-200 text-sm"
            >
              View More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}