import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { exportToCsv } from '../../utils/csv';

interface ActivityRow {
  uid: string;
  ts: number;
  type: string;
  meta?: Record<string, any>;
}

export default function AdminActivities() {
  const [raw, setRaw] = useState<Record<string, Record<string, any>>>({});
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  useEffect(() => {
    const unsub = onValue(ref(db, 'activities'), (snap) => {
      setRaw(snap.val() || {});
    });
    return () => unsub();
  }, []);

  const rows: ActivityRow[] = useMemo(() => {
    const all: ActivityRow[] = [];
    for (const [uid, items] of Object.entries(raw)) {
      for (const [ts, entry] of Object.entries(items)) {
        const e: ActivityRow = { uid, ts: Number(ts), type: (entry as any).type ?? 'unknown', meta: (entry as any).meta };
        all.push(e);
      }
    }
    return all.sort((a, b) => b.ts - a.ts);
  }, [raw]);

  const filtered = useMemo(() => {
    const fromMs = from ? new Date(from).getTime() : 0;
    const toMs = to ? new Date(to).getTime() : Infinity;
    return rows.filter((r) => {
      if (typeFilter && r.type !== typeFilter) return false;
      if (r.ts < fromMs || r.ts > toMs) return false;
      if (query) {
        const hay = `${r.uid} ${r.type} ${JSON.stringify(r.meta ?? {})}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, typeFilter, query, from, to]);

  const exportCsv = () => {
    const header = ['uid','timestamp','type','detail'];
    const rows = filtered.map((t) => [t.uid, t.ts, t.type, JSON.stringify(t.meta ?? {})]);
    exportToCsv(`activities_export_${Date.now()}`, header, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Activities</span>
            </h1>
            <p className="text-gray-300 text-sm">Filter and review all user activities</p>
          </div>
          <button onClick={exportCsv} className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15">Export CSV</button>
        </div>

        {/* Filters */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search (uid/type/meta)" className="w-full px-3 py-2 pl-9 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
            <span className="absolute left-3 top-2.5 text-gray-400">🔎</span>
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <option value="">All types</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="purchase">Service purchase</option>
            <option value="get_service">Get Service click</option>
            <option value="referral_register">Referral registered</option>
            <option value="commission">Commission earned</option>
            <option value="mining_reward">DLX reward</option>
            <option value="interaction">Interaction</option>
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10" />
        </div>
      </section>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
        <div className="grid grid-cols-5 gap-4 px-4 py-3 text-sm text-gray-300 border-b border-white/10 bg-gradient-to-r from-white/[0.06] to-transparent">
          <div>Time</div>
          <div>User</div>
          <div>Type</div>
          <div>Detail</div>
          <div>Actions</div>
        </div>
        <div className="divide-y divide-white/10">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-gray-400">No activities match filters.</div>
          )}
          {filtered.map((r) => (
            <div key={`${r.uid}-${r.ts}`} className="grid grid-cols-5 gap-4 px-4 py-3 text-sm">
              <div className="text-gray-300">{new Date(r.ts).toLocaleString()}</div>
              <div className="text-gray-300 truncate">{r.uid}</div>
              <div className="font-semibold">{r.type}</div>
              <div className="text-gray-400 truncate">{r.meta ? JSON.stringify(r.meta) : '-'}</div>
              <div>
                <Link to={`/admin/users/${r.uid}`} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15">View User</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}