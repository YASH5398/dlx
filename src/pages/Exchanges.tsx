import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Exchanges() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container-padded py-10">
        <h1 className="section-title">Exchanges</h1>
        <p className="text-sm text-gray-300 mt-2">Listings on PancakeSwap, Uniswap and major platforms.</p>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="card"><p className="font-semibold">PancakeSwap</p><p className="text-sm text-gray-300 mt-1">ACTIVE</p></div>
          <div className="card"><p className="font-semibold">Uniswap</p><p className="text-sm text-gray-300 mt-1">LIVE</p></div>
          <div className="card"><p className="font-semibold">CoinMarketCap</p><p className="text-sm text-gray-300 mt-1">LISTED</p></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}