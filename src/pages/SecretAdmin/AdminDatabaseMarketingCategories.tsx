import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';

interface DbItem {
  id: string;
  name: string;
  category?: string;
  contactCount?: number;
  description?: string;
  image?: string;
  priceUSD?: string;
  priceINR?: string;
  orderLink?: string;
  createdAt?: any;
}

export default function AdminDatabaseMarketingCategories() {
  const [items, setItems] = useState<DbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DbItem | null>(null);
  const [form, setForm] = useState<Partial<DbItem>>({});

  useEffect(() => {
    const q = query(collection(firestore, 'databaseMarketingCategories'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: DbItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setItems(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const reset = () => { setEditing(null); setForm({}); };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name || 'Untitled',
      category: form.category || '',
      contactCount: typeof form.contactCount === 'number' ? form.contactCount : (form.contactCount ? Number(form.contactCount) : undefined),
      description: form.description || '',
      image: form.image || '',
      priceUSD: form.priceUSD || '',
      priceINR: form.priceINR || '',
      orderLink: form.orderLink || '',
      createdAt: serverTimestamp(),
    };
    if (editing) {
      await updateDoc(doc(firestore, 'databaseMarketingCategories', editing.id), payload);
    } else {
      await addDoc(collection(firestore, 'databaseMarketingCategories'), payload);
    }
    reset();
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await deleteDoc(doc(firestore, 'databaseMarketingCategories', id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Database Marketing Categories (Admin)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={onSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="text-white font-semibold">{editing ? 'Edit Item' : 'Add Item'}</div>
          <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Contacts (e.g., 22000)" value={form.contactCount as any || ''} onChange={(e) => setForm({ ...form, contactCount: Number(e.target.value) })} />
            <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Price USD (e.g., 20 or 9-38)" value={form.priceUSD || ''} onChange={(e) => setForm({ ...form, priceUSD: e.target.value })} />
            <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Price INR (e.g., 1700 or 700-3200)" value={form.priceINR || ''} onChange={(e) => setForm({ ...form, priceINR: e.target.value })} />
          </div>
          <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Image URL" value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Order Link" value={form.orderLink || ''} onChange={(e) => setForm({ ...form, orderLink: e.target.value })} />
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded bg-emerald-600 text-white" type="submit">{editing ? 'Update' : 'Add'}</button>
            {editing && (
              <button type="button" onClick={reset} className="px-4 py-2 rounded bg-slate-700 text-white">Cancel</button>
            )}
          </div>
        </form>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-slate-300">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((it) => (
                <div key={it.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="w-full aspect-video bg-slate-800">
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-white font-semibold line-clamp-2">{it.name}</div>
                    <div className="text-slate-300 text-sm mt-1">{typeof it.contactCount === 'number' ? it.contactCount.toLocaleString('en-IN') : '—'} contacts</div>
                    <div className="text-emerald-400 text-sm font-bold mt-1">{formatBothCurrencies(it.priceUSD, it.priceINR)}</div>
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1.5 rounded bg-blue-600 text-white" onClick={() => { setEditing(it); setForm(it); }}>Edit</button>
                      <button className="px-3 py-1.5 rounded bg-red-600 text-white" onClick={() => onDelete(it.id)}>Delete</button>
                      {it.orderLink && <a href={it.orderLink} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded bg-slate-700 text-white">Open</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatBothCurrencies(usd?: string, inr?: string): string {
  const fmt = (val?: string, sym?: '$' | '₹') => {
    if (!val) return '';
    const s = String(val).replace(/[,\s]/g, '');
    if (s.includes('-')) {
      const [a, b] = s.split('-');
      return sym === '$' ? `$${a}–$${b}` : `₹${Number(b).toLocaleString('en-IN')}` && `₹${Number(a).toLocaleString('en-IN')}–₹${Number(b).toLocaleString('en-IN')}`;
    }
    if (sym === '$') return `$${s}`;
    const n = Number(s);
    return `₹${Number.isFinite(n) ? n.toLocaleString('en-IN') : s}`;
  };
  if (usd && inr) return `${fmt(usd, '$')} / ${fmt(inr, '₹')}`;
  if (usd) return fmt(usd, '$');
  if (inr) return fmt(inr, '₹');
  return '';
}


