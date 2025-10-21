import React from 'react';
import Button from './Button';

export default function CTASection() {
  return (
    <section className="container-padded py-12 animate-fade-in">
      <div className="card text-center">
        <h3 className="text-xl font-bold text-white">Ready to build?</h3>
        <p className="text-sm text-gray-300 mt-2">Start Your Project or Get Free Consultation</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button to="/contact">Start Your Project</Button>
        </div>
        <p className="text-xs text-gray-400 mt-4">Contact: hello@digilinex.com</p>
      </div>
    </section>
  );
}