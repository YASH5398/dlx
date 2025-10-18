import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ServiceCard from '../components/ServiceCard';

const services = [
  { title: 'Crypto Token Creation', price: '$2,999' },
  { title: 'Smart Contract Development' },
  { title: 'Website Development', price: '$1,499' },
  { title: 'Chatbot', price: '$999' },
  { title: 'MLM Plan', price: '$3,999' },
  { title: 'Mobile App', price: '$4,999' },
  { title: 'Business Automation', price: '$1,999' },
  { title: 'Telegram Bot', price: '$799' },
  { title: 'Crypto Audit', price: '$2,499' },
];

export default function Services() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container-padded py-10">
        <h1 className="section-title">Our Services</h1>
        <p className="text-sm text-gray-600 mt-2">Choose a service and get started.</p>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {services.map((s) => (
            <ServiceCard key={s.title} title={s.title} price={s.price} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}