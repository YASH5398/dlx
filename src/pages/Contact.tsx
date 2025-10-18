import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!name || !email || !message) return alert('Please fill all fields');
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container-padded py-10">
        <h1 className="section-title">Contact Us</h1>
        <div className="card mt-6 grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="mt-1 w-full rounded border border-gray-300 p-2" value={name} onChange={(e)=>setName(e.target.value)} />
            <label className="block text-sm font-medium mt-4">Email</label>
            <input className="mt-1 w-full rounded border border-gray-300 p-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <label className="block text-sm font-medium mt-4">Message</label>
            <textarea className="mt-1 w-full rounded border border-gray-300 p-2" rows={4} value={message} onChange={(e)=>setMessage(e.target.value)} />
            <Button className="mt-4" onClick={submit}>Send</Button>
          </div>
          <div>
            <p className="text-sm text-gray-700">Email: hello@digilinex.com</p>
            <p className="text-sm text-gray-700">Support: support@digilinex.com</p>
          </div>
        </div>
        {submitted && <div className="card mt-4 text-sm text-green-700">Thanks! We’ll get back to you.</div>}
      </main>
      <Footer />
    </div>
  );
}