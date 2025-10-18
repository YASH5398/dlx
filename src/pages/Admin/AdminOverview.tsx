import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

export default function AdminOverview() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Record<string, any>>({});
  const [activities, setActivities] = useState<Record<string, Record<string, any>>>({});

  useEffect(() => {
    const unsubUsers = onValue(ref(db, 'users'), (snap) => setUsers(snap.val() || {}));
    const unsubActs = onValue(ref(db, 'activities'), (snap) => setActivities(snap.val() || {}));
    return () => {
      unsubUsers();
      unsubActs();
    };
  }, []);

  const totalUsers = useMemo(() => Object.keys(users).length, [users]);
  const totalDlxMined = useMemo(
    () => Object.values(users).reduce((sum, u: any) => sum + (u.wallet?.dlx ?? 0), 0),
    [users]
  );
  const activeUsers = useMemo(() => {
    const now = Date.now();
    let count = 0;
    for (const uid of Object.keys(activities)) {
      const act = activities[uid] || {};
      const times = Object.keys(act).map((t) => Number(t)).sort((a, b) => b - a);
      if (times.length && now - times[0] < 24 * 60 * 60 * 1000) count++;
    }
    return count;
  }, [activities]);

  const topAffiliates = useMemo(() => {
    const arr = Object.entries(users).map(([uid, u]: [string, any]) => ({
      uid,
      name: u.profile?.name ?? 'User',
      total: u.referrals?.total ?? 0,
    }));
    return arr.sort((a, b) => b.total - a.total).slice(0, 5);
  }, [users]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <button onClick={() => navigate('/admin/users')} className="px-4 py-2 rounded-xl bg-white/10 border border-white/20">Go to Users</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
            <div className="text-sm text-gray-300">Total Users</div>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </div>
          <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
            <div className="text-sm text-gray-300">Total DLX Mined</div>
            <div className="text-2xl font-bold">{totalDlxMined.toFixed(2)} DLX</div>
          </div>
          <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
            <div className="text-sm text-gray-300">Active Users (24h)</div>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </div>
          <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
            <div className="text-sm text-gray-300">Top Affiliates</div>
            <div className="text-sm mt-2 space-y-1">
              {topAffiliates.map((a) => (
                <div key={a.uid} className="flex items-center justify-between">
                  <span>{a.name}</span>
                  <span className="text-gray-400">{a.total} referrals</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}