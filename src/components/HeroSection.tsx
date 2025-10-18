import React from 'react';
import Button from './Button';

export default function HeroSection() {
  return (
    <section className="container-padded pt-10 pb-8 md:pt-16 md:pb-12 text-white">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight heading-gradient">Transforming Ideas into Digital Reality</h1>
          <p className="mt-4 text-lg text-gray-300">Blockchain | AI | Websites | Mobile Apps | Business Automation</p>
          <p className="mt-2 text-sm text-gray-400">Trusted by 200+ founders & teams globally.</p>
          <div className="mt-6 flex gap-3">
            <Button to="/contact">Start Your Project</Button>
            <Button variant="outline" to="/contact">Get Free Consultation</Button>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="rounded-xl bg-gradient-to-br from-[#0a0f1f] to-black border border-white/20 backdrop-blur-xl shadow-[0_0_40px_rgba(236,72,153,0.15)] h-64" />
        </div>
      </div>
    </section>
  );
}