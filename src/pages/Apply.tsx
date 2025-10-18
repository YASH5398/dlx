import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';

export default function Apply() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container-padded py-10">
        <h1 className="section-title">Apply</h1>
        <p className="text-sm text-gray-300 mt-2">Join the referral program and become a partner.</p>
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-white">Partner Program</h3>
          <p className="text-sm text-gray-300 mt-2">Earn 20–30% commissions on every service you refer.</p>
          <div className="mt-4 flex gap-3">
            <Button to="/signup">Sign Up</Button>
            <Button variant="outline" to="/contact">Get Free Consultation</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}