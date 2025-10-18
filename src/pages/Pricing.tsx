import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';

const plans = [
  { name: 'Startup', price: '$999', features: ['Landing Page', 'Basic Support'] },
  { name: 'Growth', price: '$2,499', features: ['Website + Blog', 'Priority Support'] },
  { name: 'Enterprise', price: '$4,999', features: ['Full Suite', 'Dedicated Team'] },
];

export default function Pricing() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container-padded py-10">
        <h1 className="section-title">Pricing</h1>
        <p className="text-sm text-gray-300 mt-2">Transparent plans tailored to your business.</p>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.name} className="card">
              <h3 className="text-lg font-semibold text-white">{p.name}</h3>
              <p className="text-sm text-gray-300 mt-1">{p.price}</p>
              <ul className="mt-3 space-y-1 text-sm text-gray-300">
                {p.features.map((f) => (<li key={f}>• {f}</li>))}
              </ul>
              <div className="mt-4"><Button>Start Your Project</Button></div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}