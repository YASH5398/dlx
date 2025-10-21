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
    { label: 'Users', value: stats?.users ?? 0 },
    { label: 'Orders', value: stats?.orders ?? 0 },
    { label: 'Revenue', value: `$${stats?.revenue ?? 0}` },
    { label: 'Tickets', value: stats?.tickets ?? 0 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4 shadow-lg">
          <div className="text-sm text-gray-400">{c.label}</div>
          <div className="text-2xl font-bold mt-1">{c.value}</div>
        </div>
      ))}
    </div>
  );
}