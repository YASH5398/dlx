import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { firestore } from '../../firebase';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { getRankInfo, getRankDisplayName, RANK_DEFINITIONS } from '../../utils/rankSystem';
import { useUserRank } from '../../hooks/useUserRank';

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
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'DLX Executive',
    minReferrals: 25,
    minVolume: 2000,
    commission: 30,
    reward: 'Laptop',
    image: 'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'DLX Director',
    minReferrals: 50,
    minVolume: 10000,
    commission: 35,
    reward: 'Bullet Bike',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'DLX President',
    minReferrals: 100,
    minVolume: 50000,
    commission: 45,
    reward: 'Luxury Car',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop'
  }
];

const formatUsd = (n: number) => `$${Number(n).toLocaleString()}`;

const ProgressBar: React.FC<{ label: string; value: number; total: number }> = ({ label, value, total }) => {
  const pct = Math.min(100, Math.round((total ? value / total : 0) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm text-gray-300">
        <span>{label}</span>
        <span className="font-medium text-gray-100">{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden ring-1 ring-gray-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const CriteriaContent: React.FC = () => (
  <div className="space-y-5 text-gray-200 text-sm leading-relaxed">
    <div>
      <h4 className="font-semibold text-gray-100 mb-2">Rank Qualification Process</h4>
    </div>
    <div>
      <h5 className="font-medium text-gray-100">1️⃣ Volume Generation</h5>
      <p>- Your total volume is calculated from the sales of digital products and services made by you and your direct referrals.</p>
      <p>- Every purchase contributes to your team volume, tracked in real-time.</p>
    </div>
    <div>
      <h5 className="font-medium text-gray-100">2️⃣ Active Referral</h5>
      <p>- A referral is ‘Active’ after their first product or service purchase.</p>
      <p>- Inactive users (no purchases) are not counted toward active referrals.</p>
    </div>
    <div>
      <h5 className="font-medium text-gray-100">3️⃣ Commission Distribution</h5>
      <p>- Earn commissions on direct and indirect sales based on your rank percentage.</p>
      <p>- Example: DLX Executive earns 30% commission on eligible volume.</p>
    </div>
    <div>
      <h5 className="font-medium text-gray-100">4️⃣ Reward Unlock</h5>
      <p>- Achieve the required referrals and volume to unlock rewards like a Smart Watch, Laptop, Bike, or Luxury Car.</p>
    </div>
    <div>
      <h5 className="font-medium text-gray-100">5️⃣ Rank Upgrade</h5>
      <p>- Automatically unlock higher ranks when referral and volume conditions are met.</p>
      <p>- Track your progress live via Firebase integration.</p>
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
    <div className={`group relative rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 ${unlocked ? 'hover:border-teal-500/50' : 'hover:border-purple-500/50'}`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-teal-500/20 to-purple-500/20" />
      
      <div className="p-5 flex items-start gap-5">
        <img 
          src={rank.image} 
          alt={rank.reward} 
          className="w-20 h-20 rounded-lg object-cover border border-gray-600/50 shadow-sm" 
        />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-100">{rank.name}</h3>
            {isCurrent && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-400/30">Current</span>
            )}
            <span className={`text-xs px-2.5 py-1 rounded-full border ${unlocked ? 'bg-green-500/10 text-green-300 border-green-400/30' : 'bg-red-500/10 text-red-300 border-red-400/30'}`}>
              {unlocked ? 'Unlocked' : 'Locked'}
            </span>
          </div>
          <div className="mt-1.5 text-sm text-gray-400">Commission: {rank.commission}% • Reward: {rank.reward}</div>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-4">
        <ProgressBar 
          label={`Active Referrals (${activeReferrals} / ${rank.minReferrals})`} 
          value={activeReferrals} 
          total={rank.minReferrals} 
        />
        <ProgressBar 
          label={`Volume (${formatUsd(totalVolume)} / ${formatUsd(rank.minVolume)})`} 
          value={totalVolume} 
          total={rank.minVolume} 
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-3">
            <div className="text-xs text-gray-400">Active Referrals</div>
            <div className="mt-1 text-sm font-semibold text-gray-100">{activeReferrals}</div>
          </div>
          <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-3">
            <div className="text-xs text-gray-400">Total Volume</div>
            <div className="mt-1 text-sm font-semibold text-gray-100">{formatUsd(totalVolume)}</div>
          </div>
        </div>
        <button 
          onClick={() => setOpen((v) => !v)} 
          className="w-full h-10 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium hover:from-teal-400 hover:to-blue-400 transition-all duration-300"
        >
          {open ? 'Hide Criteria' : 'View Criteria'}
        </button>
        <div className={`rounded-lg bg-gray-800/50 border border-gray-700 p-4 transition-all duration-500 ease-in-out ${open ? 'opacity-100 max-h-[900px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          <CriteriaContent />
        </div>
      </div>
    </div>
  );
};

export default function Commission() {
  const { user } = useUser();
  const { userRankInfo } = useUserRank();
  const uid = user?.id;

  const [ranks, setRanks] = useState<Rank[]>(DEFAULT_RANKS);
  const [activeReferrals, setActiveReferrals] = useState<number>(0);
  const [totalVolume, setTotalVolume] = useState<number>(0);

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
      const order = ['DLX Associate', 'DLX Executive', 'DLX Director', 'DLX President'];
      const sorted = rows.length > 0 ? rows.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name)) : DEFAULT_RANKS;
      setRanks(sorted);
    }, () => setRanks(DEFAULT_RANKS));
    return () => { try { unsub(); } catch {} };
  }, []);

  // Stream user stats: activeReferrals, totalVolume
  useEffect(() => {
    if (!uid) return;

    const userDoc = doc(firestore, 'users', uid);
    const unsubUser = onSnapshot(userDoc, (snap) => {
      const data = (snap.data() as any) || {};
      setActiveReferrals(Number(data.activeReferrals || 0));
      setTotalVolume(Number(data.totalVolume || 0));
    });

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
      setTotalVolume((prev) => (prev > 0 ? prev : Number(vol.toFixed(2))));
      setActiveReferrals((prev) => (prev > 0 ? prev : activeUsers.size));
    });

    return () => {
      try { unsubUser(); } catch {}
      try { unsubOrders(); } catch {}
    };
  }, [uid]);

  const headerTitle = useMemo(() => 'DLX Rewards & Ranks', []);
  const headerSubtitle = useMemo(() => 'Track your progress, unlock exclusive rewards, and boost your earnings.', []);

  return (
    <div className="space-y-8 p-4 md:p-6 animate-in fade-in duration-700">
      <section className="relative rounded-3xl bg-gradient-to-br from-teal-500/10 via-blue-500/10 to-purple-500/10 border border-gray-700/50 p-6 md:p-8 backdrop-blur-xl shadow-lg">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          <span className="bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            {headerTitle}
          </span>
        </h2>
        <p className="text-gray-300 text-base md:text-lg max-w-2xl mb-6">{headerSubtitle}</p>
        
        {/* Current Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Volume</p>
                <p className="text-xl font-bold text-white">{formatUsd(totalVolume)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Referrals</p>
                <p className="text-xl font-bold text-white">{activeReferrals}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <span className="text-xl">🏆</span>
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Rank</p>
                <p className="text-xl font-bold text-white">{userRankInfo.displayName}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {ranks.map((rk) => (
          <RankCard key={rk.name} rank={rk} activeReferrals={activeReferrals} totalVolume={totalVolume} currentRank={userRankInfo.rank} />
        ))}
      </section>
    </div>
  );
}