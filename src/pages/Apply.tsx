import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AffiliateProgram from './AffiliateProgram.jsx';

export default function Apply() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container-padded py-10">
        <h1 className="section-title">Apply</h1>
        <p className="text-sm text-gray-300 mt-2">
          Join the referral program and become a partner.
        </p>
        <div className="mt-6">
          <AffiliateProgram />
        </div>
      </main>
      <Footer />
    </div>
  );
}