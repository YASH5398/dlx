import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase';
import { ref, onValue, update } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

type SortBy = 'name' | 'email' | 'level' | 'dlx' | 'usdt' | 'inr' | 'referrals' | 'commission';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Record<string, any>>({});
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const unsub = onValue(ref(db, 'users'), (snap) => setUsers(snap.val() || {}));
    return () => unsub();
  }, []);

  const rows = useMemo(() => {
    const arr = Object.entries(users).map(([uid, u]: [string, any]) => {
      const name = u.profile?.name ?? 'User';
      const email = u.profile?.email ?? '';
      const tier = u.referrals?.tier ?? 1;
      const level = tier === 1 ? 'Starter' : tier === 2 ? 'Silver' : 'Gold';
      const dlx = u.wallet?.dlx ?? 0;
      const usdt = u.wallet?.usdt ?? 0;
      const inr = u.wallet?.inr ?? 0;
      const referrals = u.referrals?.total ?? 0;
      const commission = u.referrals?.commissionEarned ?? 0; // optional field
      return { uid, name, email, level, dlx, usdt, inr, referrals, commission };
    });

    const q = query.trim().toLowerCase();
    const filtered = arr.filter((r) => {
      const matchesQuery = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      const matchesLevel = levelFilter === 'all' || r.level.toLowerCase() === levelFilter.toLowerCase();
      return matchesQuery && matchesLevel;
    });

    const sorted = filtered.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });

    return sorted;
  }, [users, query, levelFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: SortBy) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else setSortBy(key);
  };

  const handleEditLevel = async (uid: string, level: 'Starter' | 'Silver' | 'Gold') => {
    const tier = level === 'Starter' ? 1 : level === 'Silver' ? 2 : 3;
    await update(ref(db, `users/${uid}/referrals`), { tier });
  };

  const exportCsv = () => {
    const header = ['Name','Email','Level','DLX Mined','USDT','INR','Referrals Count','Commission Earned'];
    const lines = rows.map((r) => [r.name, r.email, r.level, r.dlx, r.usdt, r.inr, r.referrals, r.commission].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Users Management</h1>
        <div className="flex items-center gap-3">
          <button onClick={exportCsv} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20">Export CSV</button>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search by name or email"
          className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-gray-400"
        />
        <select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20">
          <option value="all">All Levels</option>
          <option value="Starter">Starter</option>
          <option value="Silver">Silver</option>
          <option value="Gold">Gold</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              {[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'level', label: 'Level' },
                { key: 'dlx', label: 'DLX Mined' },
                { key: 'usdt', label: 'USDT' },
                { key: 'inr', label: 'INR' },
                { key: 'referrals', label: 'Referrals Count' },
                { key: 'commission', label: 'Commission Earned' },
                { key: 'actions', label: 'Actions' },
              ].map((c) => (
                <th key={c.key as string} className="text-left px-4 py-3 font-semibold">
                  {c.key !== 'actions' ? (
                    <button onClick={() => toggleSort(c.key as SortBy)} className="hover:underline">
                      {c.label}
                      {sortBy === c.key && <span className="ml-1 text-xs text-gray-400">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.uid} className="odd:bg-white/[0.03]">
                <td className="px-4 py-2">
                  <button onClick={() => navigate(`/admin/users/${r.uid}`)} className="hover:underline">
                    {r.name}
                  </button>
                </td>
                <td className="px-4 py-2">{r.email}</td>
                <td className="px-4 py-2">
                  <select value={r.level} onChange={(e) => handleEditLevel(r.uid, e.target.value as any)} className="bg-transparent">
                    <option value="Starter">Starter</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                  </select>
                </td>
                <td className="px-4 py-2">{r.dlx.toFixed(2)}</td>
                <td className="px-4 py-2">{r.usdt.toFixed(2)}</td>
                <td className="px-4 py-2">₹{r.inr.toFixed(2)}</td>
                <td className="px-4 py-2">{r.referrals}</td>
                <td className="px-4 py-2">${r.commission.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/admin/users/${r.uid}`)} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20">View</button>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-center text-gray-400" colSpan={9}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">Page {page} of {totalPages}</div>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 disabled:opacity-50">Prev</button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}