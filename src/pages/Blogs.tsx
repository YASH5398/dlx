import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const posts = [
  { title: 'Best Referral Program: Earn 20–30%', date: '2025-10-10' },
  { title: 'How to Launch Your Token in 1–2 Weeks', date: '2025-09-28' },
  { title: 'AI Chatbots for Business Automation', date: '2025-09-12' },
];

export default function Blogs() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container-padded py-10">
        <h1 className="section-title">Blogs</h1>
        <p className="text-sm text-gray-300 mt-2">Insights, tutorials, and success stories.</p>
        <div className="mt-6 space-y-3">
          {posts.map((p) => (
            <div key={p.title} className="card">
              <p className="text-sm text-gray-400">{p.date}</p>
              <h3 className="text-lg font-semibold text-white">{p.title}</h3>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}