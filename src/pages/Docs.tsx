import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Docs() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container-padded py-10">
        <h1 className="section-title">Docs</h1>
        <p className="text-sm text-gray-300 mt-2">Technical documentation and process overview.</p>
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="card"><h3 className="font-semibold text-white">Process</h3><p className="text-sm text-gray-300 mt-1">Token → Website → Listing → Growth</p></div>
          <div className="card"><h3 className="font-semibold text-white">Compliance</h3><p className="text-sm text-gray-300 mt-1">ISO 27001, Verified Smart Contracts</p></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}