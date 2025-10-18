import React from 'react';

type Props = {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
};

export default function StatsCard({ title, value, icon }: Props) {
  return (
    <div className="card flex items-center gap-4 animate-fade-in">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0070f3] to-[#00d4ff] text-white/90 flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.35)] animate-glow">
        {icon ?? <span className="font-bold">★</span>}
      </div>
      <div>
        <div className="text-sm text-gray-300">{title}</div>
        <div className="text-2xl font-bold shimmer-text">{value}</div>
      </div>
    </div>
  );
}