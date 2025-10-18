import React from 'react';
import CommissionRewards from '../../components/CommissionRewards';

export default function Commission() {
  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-6 backdrop-blur-xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Commission & Rewards
          </span>
        </h2>
        <p className="text-gray-300 text-sm">Track your badge progress, referrals, volume and rewards.</p>
      </section>

      <CommissionRewards />
    </div>
  );
}