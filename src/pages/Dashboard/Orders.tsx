import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase';
import { ref, onValue, set } from 'firebase/database';
import { useUser } from '../../context/UserContext';

// Local Order shape extends stored fields for UI purposes
type Status = 'paid' | 'pending' | 'failed' | 'refunded';
interface OrderItem {
  id: string;
  title: string;
  priceInUsd: number;
  priceInInr: number;
  status: Status;
  type?: 'Service' | 'Digital' | 'Subscription';
  purchaseDate?: string; // ISO date string
  method?: 'USDT' | 'DLX' | 'Card' | 'Bank' | 'UPI';
  transactionId?: string;
  buyer?: string;
  downloadUrl?: string | null;
}

const formatCurrency = (n: number, currency: 'USD' | 'INR' = 'USD') =>
  currency === 'USD' ? `$${n.toFixed(2)}` : `₹${n.toFixed(2)}`;

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : '—');

const statusBadge = (s: Status) => {
  switch (s) {
    case 'paid':
      return 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30';
    case 'pending':
      return 'bg-yellow-500/15 text-yellow-300 ring-yellow-400/30';
    case 'failed':
      return 'bg-rose-500/15 text-rose-300 ring-rose-400/30';
    case 'refunded':
      return 'bg-sky-500/15 text-sky-300 ring-sky-400/30';
  }
};

export default function Orders() {
  const { user } = useUser();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | NonNullable<OrderItem['type']>>('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [selected, setSelected] = useState<OrderItem | null>(null);

  useEffect(() => {
    if (!user) return;
    const ordersRef = ref(db, `users/${user.id}/orders`);
    const unsub = onValue(ordersRef, (snap) => {
      const val = snap.val() || {};
      const list: OrderItem[] = Object.keys(val).map((id) => {
        const raw = { id, ...val[id] } as any;
        // enrich with UI fields if missing
        const nowIso = new Date().toISOString();
        const type: OrderItem['type'] = /token|mlm|service/i.test(raw.title) ? 'Service' : /template|ebook|course/i.test(raw.title) ? 'Digital' : 'Service';
        const method: OrderItem['method'] = raw.status === 'paid' ? 'USDT' : 'Card';
        const isDigital = /template|ebook|course|digital/i.test(raw.title);
        return {
          id: raw.id,
          title: raw.title,
          priceInUsd: raw.priceInUsd,
          priceInInr: raw.priceInInr,
          status: (raw.status as Status) || 'pending',
          type,
          purchaseDate: raw.purchaseDate || nowIso,
          method,
          transactionId: raw.transactionId || `TX-${raw.id.slice(0, 8).toUpperCase()}`,
          buyer: user?.name || '—',
          downloadUrl: isDigital ? (raw.downloadUrl || null) : null,
        } as OrderItem;
      });
      setOrders(list);
      setPage(1);
    });
    return () => unsub();
  }, [user?.id]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;
      const matchesType = typeFilter === 'all' ? true : o.type === typeFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch = term
        ? [o.title, o.transactionId, o.buyer].some((x) => (x || '').toLowerCase().includes(term))
        : true;
      const withinDate = (() => {
        if (!fromDate && !toDate) return true;
        const t = o.purchaseDate ? new Date(o.purchaseDate).getTime() : 0;
        const f = fromDate ? new Date(fromDate).getTime() : -Infinity;
        const to = toDate ? new Date(toDate).getTime() : Infinity;
        return t >= f && t <= to;
      })();
      return matchesStatus && matchesType && matchesSearch && withinDate;
    });
  }, [orders, statusFilter, typeFilter, search, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleRefund = async (o: OrderItem) => {
    if (!user) return;
    const payload = { id: o.id, title: o.title, priceInUsd: o.priceInUsd, priceInInr: o.priceInInr, status: 'refunded' as Status };
    await set(ref(db, `users/${user.id}/orders/${o.id}`), payload);
  };
  const handleMarkCompleted = async (o: OrderItem) => {
    if (!user) return;
    const payload = { id: o.id, title: o.title, priceInUsd: o.priceInUsd, priceInInr: o.priceInInr, status: 'paid' as Status };
    await set(ref(db, `users/${user.id}/orders/${o.id}`), payload);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Orders & Purchases</span>
            </h2>
            <p className="text-gray-300 text-sm">Total orders: {orders.length}</p>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {(['all','paid','pending','failed','refunded'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s as any)} className={`px-3 py-1.5 rounded-xl text-sm ring-1 ring-white/10 transition-colors ${statusFilter===s? 'bg-white/15 text-white':'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
                {s==='all'?'All': s==='paid'?'Completed': s==='pending'?'Pending': s==='failed'?'Failed':'Refunded'}
              </button>
            ))}
          </div>
        </div>
        {/* Search & Extra Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by user, product, or transaction ID" className="md:col-span-2 w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60" />
          <select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value as any)} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white">
            <option value="all">All Types</option>
            <option value="Service">Service</option>
            <option value="Digital">Digital</option>
            <option value="Subscription">Subscription</option>
          </select>
          <div className="flex gap-2">
            <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white" />
            <input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
        </div>
      </section>

      {/* Wallet & Rewards Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-400/20 p-4">
          <p className="text-sm text-gray-300">Total Spent (USD)</p>
          <p className="text-2xl font-semibold">{formatCurrency(orders.reduce((s,o)=>s+o.priceInUsd,0),'USD')}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-400/20 p-4">
          <p className="text-sm text-gray-300">Total Spent (INR)</p>
          <p className="text-2xl font-semibold">{formatCurrency(orders.reduce((s,o)=>s+o.priceInInr,0),'INR')}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-400/20 p-4">
          <p className="text-sm text-gray-300">Estimated Reward Points</p>
          <p className="text-2xl font-semibold">{Math.floor(orders.reduce((s,o)=>s+o.priceInUsd,0)/10)}</p>
        </div>
      </section>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">Order ID</th>
              <th className="px-4 py-3 text-left">Product/Service</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Purchase Date</th>
              <th className="px-4 py-3 text-left">Payment Status</th>
              <th className="px-4 py-3 text-left">Payment Method</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {pageItems.map((o) => (
              <tr key={o.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-mono text-white/90">{o.transactionId}</td>
                <td className="px-4 py-3 text-white">{o.title}</td>
                <td className="px-4 py-3 text-gray-300">{o.type}</td>
                <td className="px-4 py-3 text-gray-300">{formatDate(o.purchaseDate)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ring-1 ${statusBadge(o.status)}`}>{o.status==='paid'?'Success':o.status==='pending'?'Pending':o.status==='failed'?'Failed':'Refunded'}</span>
                </td>
                <td className="px-4 py-3 text-gray-300">{o.method || '—'}</td>
                <td className="px-4 py-3 text-right text-white">{formatCurrency(o.priceInUsd,'USD')}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={()=>setSelected(o)} className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/15">View</button>
                    <button disabled={!o.downloadUrl} onClick={()=>o.downloadUrl && window.open(o.downloadUrl, '_blank')} className={`px-3 py-1.5 rounded-lg ${o.downloadUrl? 'bg-indigo-600 hover:bg-indigo-500 text-white':'bg-white/10 text-gray-400'}`}>Download</button>
                    <button onClick={()=>handleRefund(o)} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white">Refund</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {pageItems.map((o) => (
          <div key={o.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{o.title}</p>
              <span className={`text-xs px-2 py-1 rounded-full ring-1 ${statusBadge(o.status)}`}>{o.status==='paid'?'Success':o.status==='pending'?'Pending':o.status==='failed'?'Failed':'Refunded'}</span>
            </div>
            <div className="mt-2 text-xs text-gray-300">ID: <span className="font-mono">{o.transactionId}</span></div>
            <div className="mt-1 text-xs text-gray-300">Type: {o.type}</div>
            <div className="mt-1 text-xs text-gray-300">Date: {formatDate(o.purchaseDate)}</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white">{formatCurrency(o.priceInUsd,'USD')}</span>
              <div className="flex gap-2">
                <button onClick={()=>setSelected(o)} className="px-2.5 py-1 rounded-lg bg-white/10 text-white">View</button>
                <button disabled={!o.downloadUrl} onClick={()=>o.downloadUrl && window.open(o.downloadUrl, '_blank')} className={`px-2.5 py-1 rounded-lg ${o.downloadUrl? 'bg-indigo-600 text-white':'bg-white/10 text-gray-400'}`}>Download</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-300">Showing {(page-1)*pageSize + 1}-{Math.min(page*pageSize, filtered.length)} of {filtered.length}</p>
        <div className="flex gap-2">
          <button disabled={page===1} onClick={()=>setPage((p)=>Math.max(1,p-1))} className={`px-3 py-1.5 rounded-lg ${page===1?'bg-white/5 text-gray-400':'bg-white/10 text-white hover:bg-white/15'}`}>Prev</button>
          <button disabled={page===totalPages} onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} className={`px-3 py-1.5 rounded-lg ${page===totalPages?'bg-white/5 text-gray-400':'bg-white/10 text-white hover:bg-white/15'}`}>Next</button>
        </div>
      </div>

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setSelected(null)} />
          <div className="relative w-[95vw] max-w-lg rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 ring-1 ring-white/10 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Order Details</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-300">
              <div className="flex justify-between"><span>Order ID</span><span className="font-mono">{selected.transactionId}</span></div>
              <div className="flex justify-between"><span>Product/Service</span><span className="text-white">{selected.title}</span></div>
              <div className="flex justify-between"><span>Type</span><span>{selected.type}</span></div>
              <div className="flex justify-between"><span>Buyer</span><span>{selected.buyer || '—'}</span></div>
              <div className="flex justify-between"><span>Purchase Date</span><span>{formatDate(selected.purchaseDate)}</span></div>
              <div className="flex justify-between"><span>Payment Method</span><span>{selected.method || '—'}</span></div>
              <div className="flex justify-between"><span>Status</span><span>{selected.status}</span></div>
              <div className="flex justify-between"><span>Amount</span><span className="text-white">{formatCurrency(selected.priceInUsd,'USD')} / {formatCurrency(selected.priceInInr,'INR')}</span></div>
              {selected.downloadUrl && (
                <div className="flex justify-between"><span>Download</span><a className="text-indigo-300 hover:text-indigo-200" href={selected.downloadUrl} target="_blank" rel="noreferrer">Open link</a></div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>handleMarkCompleted(selected)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white">Mark Completed</button>
              <button onClick={()=>handleRefund(selected)} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white">Refund</button>
              <button onClick={()=>setSelected(null)} className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/15">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}