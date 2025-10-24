import React, { useEffect, useState } from 'react';
import { db, firestore } from '../../firebase';
import { get, ref } from 'firebase/database';
import { collection, onSnapshot } from 'firebase/firestore';
import SeederButton from './SeederButton'; // ✅ Correct local import

export default function AdminDashboard() {
  console.log('AdminDashboard loaded'); // ✅ Console verification
  const [stats, setStats] = useState<{ users: number; tickets: number; orders: number; revenue: number; products: number; referrals: number; walletUsdt: number } | null>(null);
  const defaultStats = { users: 0, orders: 0, revenue: 0, tickets: 0, products: 0, referrals: 0, walletUsdt: 0 };

  useEffect(() => {
    (async () => {
      try {
        const usersSnap = await get(ref(db, 'users'));
        const usersVal = usersSnap.val() || {};
        const userIds = Object.keys(usersVal);
        const ordersCount = userIds.reduce((acc, uid) => acc + Object.keys(usersVal[uid]?.orders || {}).length, 0);
        setStats((prev) => ({
          ...defaultStats,
          ...(prev || {}),
          users: userIds.length,
          orders: ordersCount,
        }));
      } catch (error) {
        console.error('Failed to load admin stats from Firebase RTDB:', error);
      }
    })();

    const unsubs: Array<() => void> = [];

    unsubs.push(onSnapshot(collection(firestore, 'users'), (snap: any) => {
      setStats((prev) => ({ ...defaultStats, ...(prev || {}), users: snap.size }));
    }));

    unsubs.push(onSnapshot(collection(firestore, 'products'), (snap: any) => {
      setStats((prev) => ({ ...defaultStats, ...(prev || {}), products: snap.size }));
    }));

    unsubs.push(onSnapshot(collection(firestore, 'orders'), (snap: any) => {
      let orders = 0; let revenue = 0; let referrals = 0;
      snap.forEach((d: any) => {
        const x = d.data() || {};
        orders += 1;
        revenue += Number(x.total || x.amountUsd || x.amount || 0);
        if (x.affiliateId || x.referrerId) referrals += 1;
      });
      setStats((prev) => ({ ...defaultStats, ...(prev || {}), orders, revenue, referrals }));
    }));

    try {
      unsubs.push(onSnapshot(collection(firestore, 'referrals'), (snap: any) => {
        setStats((prev) => ({ ...defaultStats, ...(prev || {}), referrals: snap.size }));
      }));
    } catch {}

    unsubs.push(onSnapshot(collection(firestore, 'wallets'), (snap: any) => {
      let usdt = 0;
      snap.forEach((d: any) => {
        const x = d.data() || {};
        const w = x.usdt || {};
        usdt += Number(w.mainUsdt || 0) + Number(w.purchaseUsdt || 0);
      });
      setStats((prev) => ({ ...defaultStats, ...(prev || {}), walletUsdt: usdt }));
    }));

    return () => { unsubs.forEach((u) => { try { u(); } catch {} }); };
  }, []);

  const cards = [
    { label: 'Users', value: stats?.users ?? 0 },
    { label: 'Orders', value: stats?.orders ?? 0 },
    { label: 'Products', value: stats?.products ?? 0 },
    { label: 'Revenue', value: `$${Number(stats?.revenue ?? 0).toFixed(2)}` },
    { label: 'Referrals', value: stats?.referrals ?? 0 },
    { label: 'Wallet USDT', value: `$${Number(stats?.walletUsdt ?? 0).toFixed(2)}` },
    { label: 'Tickets', value: stats?.tickets ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
              <p className="text-gray-400 mt-2">Real-time overview of platform metrics</p>
            </div>

            {/* ✅ SeederButton placed correctly */}
            <div className="mt-4">
              <SeederButton
                className="inline-flex items-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200"
                style={{ display: 'block', visibility: 'visible', opacity: 1, position: 'relative', zIndex: 9999, margin: 20 }}
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-lg">
              <div className="text-sm text-gray-400 font-semibold uppercase">{c.label}</div>
              <div className="text-3xl font-bold mt-1">{c.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
