import React from 'react';

const features = [
  { title: 'Verified Smart Contracts' },
  { title: 'ISO 27001' },
  { title: '$50M+ Market Cap' },
  { title: 'Ethereum' },
  { title: 'AI' },
  { title: 'Mobile' },
  { title: 'Cloud' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="container-padded py-10 animate-fade-in">
      <h2 className="section-title">Trusted Features</h2>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {features.map((f) => (
          <div key={f.title} className="card text-center">
            <div className="mx-auto h-10 w-10 rounded bg-sky-100" />
            <div className="mt-2 text-sm font-semibold text-gray-300">{f.title}</div>
          </div>
        ))}
      </div>
    </section>
  );
}