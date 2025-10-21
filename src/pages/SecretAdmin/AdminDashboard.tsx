import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { get, ref } from 'firebase/database';

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ users: number; tickets: number; orders: number; revenue: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Aggregate simple stats from Realtime Database
        const usersSnap = await get(ref(db, 'users'));
        const usersVal = usersSnap.val() || {};
        const userIds = Object.keys(usersVal);
        const ordersCount = userIds.reduce((acc, uid) => acc + Object.keys(usersVal[uid]?.orders || {}).length, 0);
        // Tickets/revenue not tracked here; default to 0
        setStats({ users: userIds.length, orders: ordersCount, revenue: 0, tickets: 0 });
      } catch (error) {
        console.error('Failed to load admin stats from Firebase:', error);
        setStats({ users: 0, orders: 0, revenue: 0, tickets: 0 });
      }
    })();
  }, []);

  const cards = [
    { 
      label: 'Users', 
      value: stats?.users ?? 0, 
      icon: (
        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      gradient: 'from-blue-600/10 to-blue-900/10'
    },
    { 
      label: 'Orders', 
      value: stats?.orders ?? 0, 
      icon: (
        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: 'from-green-600/10 to-green-900/10'
    },
    { 
      label: 'Revenue', 
      value: `$${stats?.revenue ?? 0}`, 
      icon: (
        <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-yellow-600/10 to-yellow-900/10'
    },
    { 
      label: 'Tickets', 
      value: stats?.tickets ?? 0, 
      icon: (
        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      gradient: 'from-purple-600/10 to-purple-900/10'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-400 mt-2">Real-time overview of platform metrics</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c) => (
            <div
              key={c.label}
              className={`relative rounded-2xl bg-gradient-to-br ${c.gradient} border border-gray-800/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 font-semibold uppercase tracking-wider">{c.label}</div>
                  <div className="text-3xl font-bold mt-1">{c.value}</div>
                </div>
                <div className="opacity-60">{c.icon}</div>
              </div>
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gray-900/50 opacity-0 hover:opacity-10 transition-opacity duration-300"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}