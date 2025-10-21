import React, { useEffect, useMemo, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { Dialog } from '@headlessui/react';

// Simplified Users Management with pagination, filters, modal, CSV, ban/unban
export default function AdminUsers() {
  type UserDoc = { email?: string; name?: string; role?: string; lastLoginAt?: any; banned?: boolean };
  type WalletDoc = { dlx?: number; usdt?: { mainUsdt?: number; purchaseUsdt?: number } };

  const [users, setUsers] = useState<Record<string, UserDoc>>({});
  const [wallets, setWallets] = useState<Record<string, WalletDoc>>({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all'|'active'|'inactive'|'banned'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [viewUid, setViewUid] = useState<string|null>(null);

  useEffect(() => {
    const uUnsub = onSnapshot(query(collection(firestore, 'users')), (snap) => {
      const next: Record<string, UserDoc> = {};
      snap.forEach((d) => { const x = d.data() as any; next[d.id] = { email: x.email||x.userEmail||'', name: x.name||x.displayName||'', role: (x.role||x.userRole||'user').toLowerCase(), lastLoginAt: x.lastLoginAt||x.lastActiveAt, banned: !!x.banned }; });
      setUsers(next);
    });
    const wUnsub = onSnapshot(query(collection(firestore, 'wallets')), (snap) => {
      const next: Record<string, WalletDoc> = {};
      snap.forEach((d) => { const x = d.data() as any; next[d.id] = { dlx: Number(x.dlx||0), usdt: { mainUsdt: Number(x.usdt?.mainUsdt||0), purchaseUsdt: Number(x.usdt?.purchaseUsdt||0) } }; });
      setWallets(next);
    });
    return () => { try{uUnsub();}catch{} try{wUnsub();}catch{} };
  }, []);

  const now = Date.now();
  const rows = useMemo(() => {
    const arr = Object.entries(users).map(([uid,u]) => {
      const w = wallets[uid]||{}; const last = u.lastLoginAt?.toMillis ? u.lastLoginAt.toMillis() : Number(u.lastLoginAt||0);
      const active = last ? now - last < 24*60*60*1000 : false;
      return { uid, name: u.name||u.email||'User', email: u.email||'', role: u.role||'user', active, banned: !!u.banned, dlx: Number(w.dlx||0), mainUsdt: Number(w.usdt?.mainUsdt||0), purchaseUsdt: Number(w.usdt?.purchaseUsdt||0) };
    });
    const q = search.trim().toLowerCase();
    let f = arr.filter(r => !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    if (status==='active') f = f.filter(r => r.active && !r.banned);
    if (status==='inactive') f = f.filter(r => !r.active && !r.banned);
    if (status==='banned') f = f.filter(r => r.banned);
    return f.sort((a,b)=>a.name.localeCompare(b.name));
  }, [users, wallets, search, status, now]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

  const toggleBan = async (uid: string, banned: boolean) => {
    try { await updateDoc(doc(firestore, 'users', uid), { banned: !banned, bannedAt: !banned ? Date.now() : null }); }
    catch (e) { console.error(e); alert('Failed to update user'); }
  };

  const exportCsv = () => {
    const header = ['name','email','role','status','dlx','mainUsdt','purchaseUsdt'];
    const lines = rows.map(r => [r.name, r.email, r.role, r.banned?'banned':(r.active?'active':'inactive'), r.dlx.toFixed(2), r.mainUsdt.toFixed(2), r.purchaseUsdt.toFixed(2)].join(','));
    const blob = new Blob([[header.join(',')].concat(lines).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='users.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex items-center gap-2">
          <input value={search} onChange={(e)=>{setPage(1);setSearch(e.target.value);}} placeholder="Search name/email..." className="px-3 py-2 rounded-lg bg-[#0a0e1f] border border-white/10 text-sm w-56" />
          {['all','active','inactive','banned'].map(s => (
            <button key={s} onClick={()=>{setPage(1);setStatus(s as any);}} className={`px-3 py-2 rounded-lg border text-sm ${status===s?'bg-white/[0.08] border-white/30':'bg-transparent border-white/10 hover:bg-white/[0.04]'}`}>{s[0].toUpperCase()+s.slice(1)}</button>
          ))}
          <button onClick={exportCsv} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20">Export CSV</button>
        </div>
      </div>

      {/* Table (desktop) */}
      <div className="rounded-xl bg-white/5 border border-white/10 overflow-x-auto hidden md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-300">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">DLX</th>
              <th className="px-4 py-3">Main USDT</th>
              <th className="px-4 py-3">Purchase USDT</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(r => (
              <tr key={r.uid} className={`border-t border-white/10 ${r.banned?'opacity-60':''}`}>
                <td className="px-4 py-3"><div className="font-medium">{r.name}</div><div className="text-xs text-gray-400">{r.email}</div></td>
                <td className="px-4 py-3 capitalize">{r.role}</td>
                <td className="px-4 py-3">{r.banned? <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs">Banned</span> : <span className={`px-2 py-1 rounded text-xs ${r.active?'bg-emerald-500/20 text-emerald-400':'bg-yellow-500/20 text-yellow-400'}`}>{r.active?'Active':'Inactive'}</span>}</td>
                <td className="px-4 py-3">{r.dlx.toFixed(2)}</td>
                <td className="px-4 py-3">${r.mainUsdt.toFixed(2)}</td>
                <td className="px-4 py-3">${r.purchaseUsdt.toFixed(2)}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><button onClick={()=>setViewUid(r.uid)} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20">View</button>{r.banned? <button onClick={()=>toggleBan(r.uid,true)} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20">Unban</button> : <button onClick={()=>toggleBan(r.uid,false)} className="px-3 py-1 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300">Ban</button>}</div></td>
              </tr>
            ))}
            {pageRows.length===0 && (<tr><td className="px-4 py-6 text-center text-gray-400" colSpan={7}>No users match filters.</td></tr>)}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden space-y-3">
        {pageRows.map(r => (
          <div key={r.uid} className="rounded-lg bg-white/5 border border-white/10 p-3">
            <div className="flex items-center justify-between"><div><div className="font-medium">{r.name}</div><div className="text-xs text-gray-400">{r.email}</div></div><div className="text-right"><div className="text-xs capitalize">{r.role}</div>{r.banned? <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs">Banned</span> : <span className={`px-2 py-1 rounded text-xs ${r.active?'bg-emerald-500/20 text-emerald-400':'bg-yellow-500/20 text-yellow-400'}`}>{r.active?'Active':'Inactive'}</span>}</div></div>
            <div className="mt-2 text-xs text-gray-300">DLX {r.dlx.toFixed(2)} • USDT ${r.mainUsdt.toFixed(2)} (P ${r.purchaseUsdt.toFixed(2)})</div>
            <div className="mt-2 flex items-center gap-2"><button onClick={()=>setViewUid(r.uid)} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20">View</button>{r.banned? <button onClick={()=>toggleBan(r.uid,true)} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20">Unban</button> : <button onClick={()=>toggleBan(r.uid,false)} className="px-3 py-1 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300">Ban</button>}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">Page {page} of {totalPages} • {rows.length} users</div>
        <div className="flex items-center gap-2"><button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 disabled:opacity-50">Prev</button><button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 disabled:opacity-50">Next</button></div>
      </div>

      <Dialog open={!!viewUid} onClose={()=>setViewUid(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-xl bg-[#101435] border border-white/10 p-5">
            {viewUid && (
              <>
                <Dialog.Title className="text-lg font-semibold">User Profile</Dialog.Title>
                <div className="mt-3 text-sm text-gray-300">
                  <div><span className="text-gray-400">Name:</span> {users[viewUid]?.name || users[viewUid]?.email}</div>
                  <div><span className="text-gray-400">Email:</span> {users[viewUid]?.email}</div>
                  <div><span className="text-gray-400">Role:</span> {(users[viewUid]?.role||'user')}</div>
                  <div className="mt-2"><span className="text-gray-400">DLX:</span> {Number(wallets[viewUid]?.dlx||0).toFixed(2)}</div>
                  <div><span className="text-gray-400">Main USDT:</span> {Number(wallets[viewUid]?.usdt?.mainUsdt||0).toFixed(2)}</div>
                  <div><span className="text-gray-400">Purchase USDT:</span> {Number(wallets[viewUid]?.usdt?.purchaseUsdt||0).toFixed(2)}</div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2"><button onClick={()=>setViewUid(null)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20">Close</button></div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}