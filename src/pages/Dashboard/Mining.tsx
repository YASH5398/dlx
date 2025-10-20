import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase';
import { ref, onValue, update, push, set, runTransaction, off } from 'firebase/database';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';

// Types for claim records
type ClaimRecord = {
  id: string;
  amount: number; // in DLX
  type: 'self' | 'team' | 'telegram' | 'twitter';
  createdAt: number; // epoch ms
  fromUserId?: string;
  fromName?: string;
};

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLAIM_AMOUNT = 10; // 10 DLX per daily claim
const SOCIAL_CLAIM_AMOUNT = 25; // 25 DLX per social claim

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600).toString().padStart(2, '0');
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(total % 60).toString().padStart(2, '0');
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
  const [telegramClaimed, setTelegramClaimed] = useState(false);
  const [twitterClaimed, setTwitterClaimed] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [twitterUsername, setTwitterUsername] = useState('');
  const [isSocialClaiming, setIsSocialClaiming] = useState({ telegram: false, twitter: false });
  const [showTelegramInput, setShowTelegramInput] = useState(false);
  const [showTwitterInput, setShowTwitterInput] = useState(false);

  // Subscriptions
  useEffect(() => {
    if (!uid) return;

    const rLast = ref(db, `users/${uid}/mining/lastClaimAt`);
    const rClaims = ref(db, `users/${uid}/mining/claims`);
    const rTeam = ref(db, `users/${uid}/mining/teamClaims`);
    const rTelegramClaimed = ref(db, `users/${uid}/mining/telegramClaimed`);
    const rTwitterClaimed = ref(db, `users/${uid}/mining/twitterClaimed`);

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
    const unsubTelegram = onValue(rTelegramClaimed, (snap) => setTelegramClaimed(snap.val() ?? false));
    const unsubTwitter = onValue(rTwitterClaimed, (snap) => setTwitterClaimed(snap.val() ?? false));

    return () => {
      off(rLast);
      off(rClaims);
      off(rTeam);
      off(rTelegramClaimed);
      off(rTwitterClaimed);
      try { unsubLast(); } catch {}
      try { unsubClaims(); } catch {}
      try { unsubTeam(); } catch {}
      try { unsubTelegram(); } catch {}
      try { unsubTwitter(); } catch {}
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

      await Promise.all([
        set(idRef, record),
        update(ref(db, `users/${uid}/mining`), { lastClaimAt: ts }),
        runTransaction(ref(db, `users/${uid}/wallet/dlx`), (curr) => (typeof curr === 'number' ? curr : 0) + CLAIM_AMOUNT),
      ]);

      try {
        await addNotification({ type: 'mining', message: `Mined ${CLAIM_AMOUNT} DLX. +${CLAIM_AMOUNT} DLX added to wallet.`, route: '/wallet' }, true);
      } catch {
        document.dispatchEvent(new CustomEvent('notifications:add', { detail: { type: 'mining', message: `Mined ${CLAIM_AMOUNT} DLX. +${CLAIM_AMOUNT} DLX added to wallet.` } }));
      }
    } catch (e: any) {
      try {
        await addNotification({ type: 'error', message: e?.message ?? 'Mining failed. Please try again.' }, false);
      } catch {}
    } finally {
      setIsClaiming(false);
    }
  };

  const handleSocialClaim = async (type: 'telegram' | 'twitter', username: string) => {
    if (!uid || isSocialClaiming[type] || username.trim() === '') return;
    setIsSocialClaiming((prev) => ({ ...prev, [type]: true }));
    const ts = Date.now();
    try {
      const idRef = push(ref(db, `users/${uid}/mining/claims`));
      const record: ClaimRecord = {
        id: idRef.key as string,
        amount: SOCIAL_CLAIM_AMOUNT,
        type: type,
        createdAt: ts,
      };

      await Promise.all([
        set(idRef, record),
        update(ref(db, `users/${uid}/mining`), { [`${type}Claimed`]: true }),
        runTransaction(ref(db, `users/${uid}/wallet/dlx`), (curr) => (typeof curr === 'number' ? curr : 0) + SOCIAL_CLAIM_AMOUNT),
        set(ref(db, `users/${uid}/social/${type}Username`), username),
      ]);

      try {
        await addNotification({ type: 'mining', message: `Claimed ${SOCIAL_CLAIM_AMOUNT} DLX for ${type.charAt(0).toUpperCase() + type.slice(1)}. +${SOCIAL_CLAIM_AMOUNT} DLX added to wallet.`, route: '/wallet' }, true);
      } catch {
        document.dispatchEvent(new CustomEvent('notifications:add', { detail: { type: 'mining', message: `Claimed ${SOCIAL_CLAIM_AMOUNT} DLX for ${type.charAt(0).toUpperCase() + type.slice(1)}. +${SOCIAL_CLAIM_AMOUNT} DLX added to wallet.` } }));
      }

      if (type === 'telegram') {
        setTelegramClaimed(true);
        setShowTelegramInput(false);
      }
      if (type === 'twitter') {
        setTwitterClaimed(true);
        setShowTwitterInput(false);
      }
    } catch (e: any) {
      try {
        await addNotification({ type: 'error', message: e?.message ?? 'Social claim failed. Please try again.' }, false);
      } catch {}
    } finally {
      setIsSocialClaiming((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSocialJoin = (type: 'telegram' | 'twitter') => {
    const url = type === 'telegram' ? 'https://t.me/digilinex' : 'https://x.com/digilinex?t=kXHRX97aPMrzzETGcN928w&s=09';
    window.open(url, '_blank', 'noopener,noreferrer');
    if (type === 'telegram') setShowTelegramInput(true);
    if (type === 'twitter') setShowTwitterInput(true);
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
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-900 to-blue-600 text-white flex flex-col items-center justify-start p-4 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">DLX</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">DLX Coin</h1>
            <p className="text-sm text-gray-300">Speed: 10 DLX / 24h</p>
          </div>
        </div>

        {/* Daily Claim Card */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-48 h-48 rounded-full bg-blue-800/50 border-8 border-purple-500 flex items-center justify-center shadow-xl animate-pulse">
            <span className="text-2xl font-mono">
              {canClaim ? "00:00:00" : formatCountdown(remainingMs)}
            </span>
          </div>
          <button
            onClick={handleClaim}
            disabled={!canClaim || isClaiming}
            className={
              'w-48 rounded-full py-3 font-bold text-lg transition-all duration-300 ' +
              (canClaim && !isClaiming
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-orange-500 hover:to-yellow-400 shadow-orange-500/50'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed')
            }
          >
            {isClaiming ? 'Mining...' : canClaim ? 'Mine' : 'Locked'}
          </button>
          <p className="text-sm text-gray-300">24-hour mining cycle</p>
        </div>

        {/* Social Rewards Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-center">Boost Your Earnings</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Telegram Card */}
            <div className="flex flex-col items-center space-y-2">
              {telegramClaimed ? (
                <p className="text-green-400 font-bold">Claimed</p>
              ) : showTelegramInput ? (
                <div className="w-full space-y-2">
                  <input
                    type="text"
                    placeholder="Telegram Username"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    className="w-full rounded-full px-4 py-2 bg-blue-800/50 border border-purple-500 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 text-sm"
                  />
                  <button
                    onClick={() => handleSocialClaim('telegram', telegramUsername)}
                    disabled={isSocialClaiming.telegram || telegramUsername.trim() === ''}
                    className={
                      'w-full rounded-full py-2 font-bold text-sm transition-all duration-300 ' +
                      (telegramUsername.trim() !== '' && !isSocialClaiming.telegram
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/50'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed')
                    }
                  >
                    {isSocialClaiming.telegram ? 'Claiming...' : 'Claim'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleSocialJoin('telegram')}
                  className="w-32 rounded-full py-2 bg-gradient-to-r from-blue-500 to-cyan-500 font-bold text-sm hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/50 transition-all duration-300"
                >
                  Telegram Boost
                </button>
              )}
            </div>

            {/* Twitter Card */}
            <div className="flex flex-col items-center space-y-2">
              {twitterClaimed ? (
                <p className="text-green-400 font-bold">Claimed</p>
              ) : showTwitterInput ? (
                <div className="w-full space-y-2">
                  <input
                    type="text"
                    placeholder="Twitter Username"
                    value={twitterUsername}
                    onChange={(e) => setTwitterUsername(e.target.value)}
                    className="w-full rounded-full px-4 py-2 bg-blue-800/50 border border-purple-500 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 text-sm"
                  />
                  <button
                    onClick={() => handleSocialClaim('twitter', twitterUsername)}
                    disabled={isSocialClaiming.twitter || twitterUsername.trim() === ''}
                    className={
                      'w-full rounded-full py-2 font-bold text-sm transition-all duration-300 ' +
                      (twitterUsername.trim() !== '' && !isSocialClaiming.twitter
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/50'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed')
                    }
                  >
                    {isSocialClaiming.twitter ? 'Claiming...' : 'Claim'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleSocialJoin('twitter')}
                  className="w-32 rounded-full py-2 bg-gradient-to-r from-blue-500 to-cyan-500 font-bold text-sm hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/50 transition-all duration-300"
                >
                  Twitter Boost
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Latest Claims (7 days) */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-center">Earnings</h2>
          {latest7Days.length === 0 ? (
            <p className="text-center text-gray-300">No earnings yet. Start mining!</p>
          ) : (
            <div className="space-y-2">
              {latest7Days.slice(0, visibleCount).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-blue-800/50 border border-purple-500/50"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      r.type === 'self' ? 'bg-yellow-500/50' :
                      r.type === 'team' ? 'bg-green-500/50' :
                      r.type === 'telegram' ? 'bg-blue-500/50' : 'bg-purple-500/50'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={r.type === 'self' ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : r.type === 'team' ? "M17 20h5-20" : "M13 10V3L4 14h7v7l9-11h-7z"} />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">{r.type.charAt(0).toUpperCase() + r.type.slice(1)} Mine</p>
                      <p className="text-xs text-gray-300">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-400">+{r.amount}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Older Claims */}
        {showOlder && olderItems.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center">Older Earnings</h2>
            <div className="space-y-2">
              {olderItems.slice(0, olderVisibleCount).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-blue-800/50 border border-purple-500/50"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      r.type === 'self' ? 'bg-yellow-500/50' :
                      r.type === 'team' ? 'bg-green-500/50' :
                      r.type === 'telegram' ? 'bg-blue-500/50' : 'bg-purple-500/50'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={r.type === 'self' ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : r.type === 'team' ? "M17 20h5-20" : "M13 10V3L4 14h7v7l9-11h-7z"} />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">{r.type.charAt(0).toUpperCase() + r.type.slice(1)} Mine</p>
                      <p className="text-xs text-gray-300">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-400">+{r.amount}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View More */}
        {canViewMore && (
          <button
            onClick={onViewMore}
            className="w-full rounded-full py-3 bg-purple-500/50 text-white font-bold hover:bg-purple-600/50 transition-all duration-300"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}