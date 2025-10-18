import React from 'react';

export default function ReferralCard() {
  return (
    <div className="card animate-fade-in">
      <h3 className="text-lg font-semibold text-white">Referral Program</h3>
      <ol className="mt-3 space-y-2 text-sm text-gray-300 list-decimal list-inside">
        <li>Share your unique referral link</li>
        <li>Your friends purchase services</li>
        <li>You earn 20–30% commissions</li>
      </ol>
    </div>
  );
}