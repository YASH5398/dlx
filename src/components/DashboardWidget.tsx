import React from 'react';

type Props = {
  label: string;
  value: string | number;
  sublabel?: string;
};

export default function DashboardWidget({ label, value, sublabel }: Props) {
  return (
    <div className="card animate-fade-in">
      <div className="text-sm text-gray-300">{label}</div>
      <div className="text-2xl font-bold mt-1 shimmer-text">{value}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-2">{sublabel}</div>}
    </div>
  );
}