import React from 'react';
import { useWallet } from '../../hooks/useWallet';

export default function Wallet() {
  const { wallet, refresh } = useWallet();

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-lg font-semibold">Wallet Balances</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card"><p className="text-sm text-gray-300">DLX</p><p className="text-2xl font-bold shimmer-text">{wallet.dlx.toFixed(2)}</p></div>
        <div className="card"><p className="text-sm text-gray-300">USDT</p><p className="text-2xl font-bold shimmer-text">{wallet.usdt.toFixed(2)}</p></div>
        <div className="card"><p className="text-sm text-gray-300">INR</p><p className="text-2xl font-bold shimmer-text">₹{wallet.inr.toFixed(2)}</p></div>
      </div>
      <button onClick={refresh} className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#0070f3] to-[#00d4ff] text-white shadow-[0_0_16px_rgba(0,212,255,0.25)]">Refresh</button>
      <p className="text-sm text-gray-300">Balances auto-update periodically to simulate real-time data.</p>
    </div>
  );
}