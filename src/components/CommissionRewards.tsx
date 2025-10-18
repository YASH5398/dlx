import React from 'react';

// Types
interface Stats {
  currentBadge: string;
  referrals: number;
  volume: number; // e.g., total sales volume in USD
  commissionPercent: number;
}

interface Badge {
  name: string;
  commissionRange: string;
  reward: string;
  referralsRequired: number;
  volumeRequired: number;
  image: string;
}

const formatVolume = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

const ProgressBar: React.FC<{ label: string; value: number; total: number }> = ({ label, value, total }) => {
  const pct = Math.min(100, Math.round((value / total) * 100));
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden ring-1 ring-slate-600/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
    <div className="text-xs text-slate-400">{label}</div>
    <div className="mt-1 text-lg font-semibold text-slate-100">{value}</div>
  </div>
);

const ShareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M15 8a3 3 0 1 0-3-3M6 12a3 3 0 1 0 3 3m3-9v8m0 0l3-3m-3 3l-3-3" />
  </svg>
);

const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.5" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M11 12h2v4h-2z" />
  </svg>
);

const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 text-yellow-300" {...props}>
    <path d="M11.48 3.5l2.07 4.2 4.64.68-3.36 3.27.79 4.62-4.14-2.18-4.14 2.18.79-4.62-3.36-3.27 4.64-.68 2.07-4.2z" />
  </svg>
);

const CurrentBadge: React.FC<{ stats: Stats }> = ({ stats }) => (
  <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 ring-1 ring-white/10 shadow-xl p-6">
    <div className="flex items-center gap-3">
      <div className="size-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-1 ring-white/20 flex items-center justify-center">
        <StarIcon />
      </div>
      <div>
        <div className="text-sm text-slate-400">Current Badge</div>
        <div className="text-lg font-semibold text-slate-100">{stats.currentBadge}</div>
      </div>
    </div>
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Stat label="Total Referrals" value={stats.referrals} />
      <Stat label="Total Volume" value={formatVolume(stats.volume)} />
      <Stat label="Commission" value={`${stats.commissionPercent}%`} />
    </div>
  </div>
);

const BadgeCard: React.FC<{ badge: Badge; stats: Stats }> = ({ badge, stats }) => {
  const referralPct = Math.min(100, Math.round((stats.referrals / badge.referralsRequired) * 100));
  const volumePct = Math.min(100, Math.round((stats.volume / badge.volumeRequired) * 100));
  const unlocked = referralPct >= 100 && volumePct >= 100;

  const handleShare = async () => {
    const shareData = {
      title: `Join me on ${badge.name}!`,
      text: `I'm aiming for ${badge.name} — commission ${badge.commissionRange} with ${badge.reward}.`,
      url: window.location.origin
    };
    try {
      if ((navigator as any).share) {
        await (navigator as any).share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Share text copied to clipboard!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDetails = () => {
    alert(`${badge.name}\n- Commission: ${badge.commissionRange}\n- Reward: ${badge.reward}\n- Referrals required: ${badge.referralsRequired}\n- Volume required: ${formatVolume(badge.volumeRequired)}`);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 ring-1 ring-white/10 shadow-xl hover:shadow-2xl hover:ring-violet-500/30 transition-all duration-300">
      <div className="p-4 flex items-start gap-4">
        <img src={badge.image} alt={badge.name} className="size-16 rounded-lg ring-1 ring-white/15 object-cover" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-100">{badge.name}</h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ring-1 ${
                unlocked
                  ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'
                  : 'bg-rose-500/10 text-rose-300 ring-rose-400/30'
              }`}
            >
              {unlocked ? 'Unlocked' : 'Locked'}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Commission {badge.commissionRange} • Reward: {badge.reward}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-4">
        <ProgressBar
          label={`Referrals (${stats.referrals}/${badge.referralsRequired})`}
          value={stats.referrals}
          total={badge.referralsRequired}
        />
        <ProgressBar
          label={`Volume (${formatVolume(stats.volume)}/${formatVolume(badge.volumeRequired)})`}
          value={stats.volume}
          total={badge.volumeRequired}
        />
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleShare}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white/5 ring-1 ring-white/10 text-slate-200 hover:bg-white/10 hover:ring-violet-400/30 transition-colors px-3 py-2"
          >
            <ShareIcon />
            Share
          </button>
          <button
            onClick={handleDetails}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white hover:from-indigo-500 hover:to-fuchsia-500 transition-colors px-3 py-2"
          >
            <InfoIcon />
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

const Instruction: React.FC = () => (
  <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 text-sm text-slate-300">
    You are currently at Starter rank. Begin referring and generating volume to unlock badges.
  </div>
);

const CommissionRewards: React.FC = () => {
  // Mock stats; you can wire real data via props or context
  const userStats: Stats = {
    currentBadge: 'Starter',
    referrals: 8,
    volume: 120000,
    commissionPercent: 22,
  };

  const badges: Badge[] = [
    {
      name: 'Rising Star',
      commissionRange: '25–30%',
      reward: 'Smartphone',
      referralsRequired: 10,
      volumeRequired: 200000,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop'
    },
    {
      name: 'Growth Champion',
      commissionRange: '30–35%',
      reward: 'Laptop',
      referralsRequired: 25,
      volumeRequired: 500000,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&auto=format&fit=crop'
    },
    {
      name: 'Elite Partner',
      commissionRange: '35–40%',
      reward: 'Bullet Bike',
      referralsRequired: 50,
      volumeRequired: 1000000,
      image: 'https://images.unsplash.com/photo-1518655048521-f58c3a2b1aa5?q=80&w=400&auto=format&fit=crop'
    },
    {
      name: 'Legend of Linex',
      commissionRange: '40–45%',
      reward: 'Car',
      referralsRequired: 100,
      volumeRequired: 2500000,
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=400&auto=format&fit=crop'
    }
  ];

  return (
    <section className="w-full space-y-6">
      <CurrentBadge stats={userStats} />

      <Instruction />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {badges.map((b) => (
          <BadgeCard key={b.name} badge={b} stats={userStats} />
        ))}
      </div>
    </section>
  );
};

export default CommissionRewards;