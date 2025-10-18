import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Tutorials() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container-padded py-10">
        <h1 className="section-title">Tutorials</h1>
        <p className="text-sm text-gray-300 mt-2">Guides to help you build and launch faster.</p>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="card"><p className="font-semibold text-white">Token Creation</p><p className="text-sm text-gray-300 mt-1">Smart contract basics</p></div>
          <div className="card"><p className="font-semibold text-white">Website Setup</p><p className="text-sm text-gray-300 mt-1">Deploy with Vite + React</p></div>
          <div className="card"><p className="font-semibold text-white">DEX Listing</p><p className="text-sm text-gray-300 mt-1">PancakeSwap / Uniswap</p></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}