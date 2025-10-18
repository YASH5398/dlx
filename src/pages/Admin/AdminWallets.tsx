import React from 'react';

export default function AdminWallets() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wallet Management</h1>
      <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
        <p className="text-gray-400">This section will allow administrators to manage user wallets, view transactions, and adjust balances.</p>
        <p className="text-gray-400 mt-2">Coming soon: Features to view all user wallets, transaction history, and manual balance adjustments with audit trails.</p>
      </div>
    </div>
  );
}