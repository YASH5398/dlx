import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function About() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container-padded py-10">
        <h1 className="section-title">About DigiLinex</h1>
        <p className="mt-3 text-sm text-gray-700">We provide premium digital solutions across blockchain, AI, websites, mobile apps, and business automation.</p>
      </main>
      <Footer />
    </div>
  );
}