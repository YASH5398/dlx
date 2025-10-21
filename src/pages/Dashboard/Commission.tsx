import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { firestore } from '../../firebase';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';

type Rank = {
  name: 'DLX Associate' | 'DLX Executive' | 'DLX Director' | 'DLX President' | string;
  minReferrals: number;
  minVolume: number; // in USD
  commission: number; // percent
  reward: string;
  image: string;
};

const DEFAULT_RANKS: Rank[] = [
  {
    name: 'DLX Associate',
    minReferrals: 8,
    minVolume: 400,
    commission: 25,
    reward: 'Smart Watch',
    image: 'https://images.unsplash.com/photo-1518443871495-1f3f23227460?q=80&w=640&auto=format&fit=crop'
  },
  {
    name: 'DLX Executive',
    minReferrals: 25,
    minVolume: 2000,
    commission: 30,
    reward: 'Laptop',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=640&auto=format&fit=crop'
  },
  {
    name: 'DLX Director',
    minReferrals: 50,
    minVolume: 10000,
    commission: 35,
    reward: 'Bullet Bike',
    image: 'https://images.unsplash.com/photo-1518655048521-f58c3a2b1aa5?q=80&w=640&auto=format&fit=crop'
  },
  {
    name: 'DLX President',
    minReferrals: 100,
    minVolume: 50000,
    commission: 45,
    reward: 'Tata Car',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=640&auto=format&fit=crop'
  }
];

const formatUsd = (n: number) => `$${Number(n).toLocaleString()}`;

const ProgressBar: React.FC<{ label: string; value: number; total: number }> = ({ label, value, total }) => {
  const pct = Math.min(100, Math.round(((total ? value / total : 0) * 100)));
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs sm:text-sm text-slate-400">
        <span>{label}</span>
        <span className="font-semibold text-slate-200">{pct}%</span>
      </div>
      <div className="h-3 rounded-full bg-slate-700/50 overflow-hidden ring-1 ring-slate-600/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const CriteriaContent: React.FC = () => (
  <div className="space-y-4 text-slate-300 text-sm">
    <div>
      <div className="font-semibold text-slate-200 mb-1">Rank Qualification Process</div>
    </div>
    <div>
      <div className="font-medium text-slate-200">1️⃣ Volume Generation</div>
      <p>- Your total volume is calculated from the sales of digital products and services made by you and your direct referrals.</p>
      <p>- Every product or service purchase contributes to your team volume.</p>
    </div>
    <div>
      <div className="font-medium text-slate-200">2️⃣ Active Referral</div>
      <p>- A referral becomes ‘Active’ when they make their first product or service purchase.</p>
      <p>- Inactive users (no purchase) are not counted in active referrals.</p>
    </div>
    <div>
      <div className="font-medium text-slate-200">3️⃣ Commission Distribution</div>
      <p>- You earn commission on every direct and indirect sale based on your rank percentage.</p>
      <p>- Example: DLX Executive = 30% commission on total eligible volume.</p>
    </div>
    <div>
      <div className="font-medium text-slate-200">4️⃣ Reward Unlock</div>
      <p>- Once the required referrals and volume are completed, your rank reward (like Smartwatch, Laptop, Bike, or Car) will be unlocked.</p>
    </div>
    <div>
      <div className="font-medium text-slate-200">5️⃣ Rank Upgrade</div>
      <p>- Higher ranks automatically unlock when both referral & volume conditions are met.</p>
      <p>- Progress is visible in real time through Firebase data.</p>
    </div>
  </div>
);

const RankCard: React.FC<{
  rank: Rank;
  activeReferrals: number;
  totalVolume: number;
  currentRank?: string | null;
}> = ({ rank, activeReferrals, totalVolume, currentRank }) => {
  const [open, setOpen] = useState(false);
  const referralPct = Math.min(100, Math.round((activeReferrals / rank.minReferrals) * 100));
  const volumePct = Math.min(100, Math.round((totalVolume / rank.minVolume) * 100));
  const unlocked = referralPct >= 100 && volumePct >= 100;
  const isCurrent = currentRank && currentRank.toLowerCase().includes(rank.name.split(' ')[1]?.toLowerCase() || '');

  return (
    <div className={`group relative flex flex-col rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 ring-1 ring-white/10 shadow-xl transition-all duration-300 ${unlocked ? 'hover:shadow-emerald-500/20 hover:ring-emerald-400/30' : 'hover:shadow-2xl hover:ring-violet-500/30'}`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute -top-20 -left-20 size-48 rounded-full bg-cyan-500/10 blur-2xl" />
        <div className="absolute -bottom-20 -right-20 size-48 rounded-full bg-fuchsia-500/10 blur-2xl" />
      </div>

      <div className="p-4 flex items-start gap-4">
        <img src={rank.image} alt={rank.name} className="size-16 sm:size-20 rounded-lg ring-1 ring-white/15 object-cover" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-semibold text-slate-100">{rank.name}</h3>
            {isCurrent && (
              <span className="text-xs px-2 py-1 rounded-full ring-1 bg-cyan-500/15 text-cyan-300 ring-cyan-400/30">Current</span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ring-1 ${unlocked ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30' : 'bg-rose-500/10 text-rose-300 ring-rose-400/30'}`}>{unlocked ? 'Unlocked' : 'Locked'}</span>
          </div>
          <div className="mt-1 text-xs sm:text-sm text-slate-400">Commission {rank.commission}% • Reward: {rank.reward}</div>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-4">
        <ProgressBar label={`Active Referrals (${activeReferrals} / ${rank.minReferrals})`} value={activeReferrals} total={rank.minReferrals} />
        <ProgressBar label={`Volume (${formatUsd(totalVolume)} / ${formatUsd(rank.minVolume)})`} value={totalVolume} total={rank.minVolume} />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3">
            <div className="text-xs text-slate-400">Active Referrals</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-100">{activeReferrals}</div>
          </div>
          <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3">
            <div className="text-xs text-slate-400">Total Volume</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-100">{formatUsd(totalVolume)}</div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={() => setOpen((v) => !v)} className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white hover:from-indigo-500 hover:to-fuchsia-500 transition-colors px-3">
            Read Full Criteria
          </button>
        </div>
        <div className={`rounded-xl bg-white/5 ring-1 ring-white/10 p-4 transition-all duration-300 overflow-hidden ${open ? 'opacity-100 max-h-[800px]' : 'opacity-0 max-h-0'}`}>
          <CriteriaContent />
        </div>
      </div>
    </div>
  );
};

export default function Commission() {
  const { user } = useUser();
  const uid = user?.id;

  const [ranks, setRanks] = useState<Rank[]>(DEFAULT_RANKS);
  const [activeReferrals, setActiveReferrals] = useState<number>(0);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [currentRank, setCurrentRank] = useState<string | null>(null);

  // Stream ranks from Firestore (fallback to defaults)
  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, 'ranks'), (snap) => {
      const rows: Rank[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        rows.push({
          name: String(data.name || d.id),
          minReferrals: Number(data.minReferrals ?? 0),
          minVolume: Number(data.minVolume ?? 0),
          commission: Number(data.commission ?? 0),
          reward: String(data.reward || ''),
          image: String(data.image || '')
        });
      });
      // Ensure expected order: Associate, Executive, Director, President
      const order = ['DLX Associate', 'DLX Executive', 'DLX Director', 'DLX President'];
      const sorted = rows.length > 0 ? rows.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name)) : DEFAULT_RANKS;
      setRanks(sorted);
    }, () => setRanks(DEFAULT_RANKS));
    return () => { try { unsub(); } catch {} };
  }, []);

  // Stream user stats: activeReferrals, totalVolume, currentRank
  useEffect(() => {
    if (!uid) return;

    const userDoc = doc(firestore, 'users', uid);
    const unsubUser = onSnapshot(userDoc, (snap) => {
      const data = (snap.data() as any) || {};
      setActiveReferrals(Number(data.activeReferrals || 0));
      setTotalVolume(Number(data.totalVolume || 0));
      setCurrentRank(String(data.currentRank || '') || null);
    });

    // Also compute volume from orders for real-time progress if not present
    const ordersQ = query(collection(firestore, 'orders'), where('affiliateId', '==', uid));
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      let vol = 0;
      const activeUsers = new Set<string>();
      snap.forEach((docSnap) => {
        const d = docSnap.data() as any;
        const amt = Number(d.amountUsd || 0);
        const status = String(d.status || '');
        if (status.toLowerCase() === 'completed') {
          vol += amt;
          if (d.userId) activeUsers.add(String(d.userId));
        }
      });
      // Prefer explicit user doc value; otherwise fallback to computed
      setTotalVolume((prev) => (prev > 0 ? prev : Number(vol.toFixed(2))));
      setActiveReferrals((prev) => (prev > 0 ? prev : activeUsers.size));
    });

    return () => {
      try { unsubUser(); } catch {}
      try { unsubOrders(); } catch {}
    };
  }, [uid]);

  const headerTitle = useMemo(() => 'DLX Commission & Ranks', []);
  const headerSubtitle = useMemo(() => 'Track your growth, unlock rewards, and earn higher commissions.', []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 size-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {headerTitle}
          </span>
        </h2>
        <p className="text-gray-300 text-sm md:text-base">{headerSubtitle}</p>
      </section>

      {/* Rank Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        {ranks.map((rk) => (
          <RankCard key={rk.name} rank={rk} activeReferrals={activeReferrals} totalVolume={totalVolume} currentRank={currentRank} />
        ))}
      </section>
    </div>
  );
}