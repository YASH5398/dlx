import React from 'react';

const testimonials = [
  { name: 'Founder A', quote: 'DigiLinex accelerated our token launch and growth.' },
  { name: 'Founder B', quote: 'World-class web and mobile team. Reliable and fast.' },
  { name: 'Founder C', quote: 'Their AI chatbot improved our support 24/7.' },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="container-padded py-10 animate-fade-in">
      <h2 className="section-title heading-gradient">Client Testimonials</h2>
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {testimonials.map((t) => (
          <figure key={t.name} className="card">
            <blockquote className="text-sm text-gray-300">“{t.quote}”</blockquote>
            <figcaption className="mt-3 text-xs text-gray-400">— {t.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}