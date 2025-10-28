import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 bg-white/5 text-gray-100 border-t border-white/10">
      <div className="container-padded py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4 className="font-bold text-lg text-white">DigiLinex</h4>
          <p className="text-sm mt-2 text-gray-300">Premium Digital Solutions: Blockchain, AI, Websites, Mobile Apps, Automation.</p>
        </div>
        <div>
          <h5 className="font-semibold text-white">Contact</h5>
          <p className="text-sm mt-2 text-gray-300">Email: hello@digilinex.com</p>
          <p className="text-sm text-gray-300">Support: support@digilinex.com</p>
          <p className="text-sm text-gray-300">Address: Noida, India</p>
        </div>
        <div>
          <h5 className="font-semibold text-white">Quick Links</h5>
          <div className="flex flex-col mt-2 text-sm space-y-2">
            <Link to="/mining" className="hover:underline text-sky-300 hover:text-white">Mining</Link>
            <Link to="/about" className="hover:underline text-sky-300 hover:text-white">About Us</Link>
            <Link to="/terms" className="hover:underline text-sky-300 hover:text-white">Terms of Service</Link>
            <Link to="/privacy" className="hover:underline text-sky-300 hover:text-white">Privacy Policy</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-padded py-4 text-sm text-gray-300">© {new Date().getFullYear()} DigiLinex. All rights reserved.</div>
      </div>
    </footer>
  );
}