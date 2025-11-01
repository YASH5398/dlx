import React, { useEffect, useMemo, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, orderBy, query } from 'firebase/firestore';

interface Item {
  id: string;
  title: string;
  description?: string;
  price?: string; // legacy combined
  priceUsd?: number;
  priceInr?: number;
  contactCount?: number;
  imageUrl?: string;
  linkUrl?: string;
  createdAt?: any;
}

export default function AdminMarketingCategories() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<Partial<Item>>({});

  useEffect(() => {
    const q = query(collection(firestore, 'marketingCategories'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: Item[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setItems(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const resetForm = () => { setEditing(null); setForm({}); };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      title: form.title || 'Untitled',
      description: form.description || '',
      price: form.price || '',
      priceUsd: typeof form.priceUsd === 'number' ? form.priceUsd : (form.priceUsd ? Number(form.priceUsd) : undefined),
      priceInr: typeof form.priceInr === 'number' ? form.priceInr : (form.priceInr ? Number(form.priceInr) : undefined),
      contactCount: typeof form.contactCount === 'number' ? form.contactCount : (form.contactCount ? Number(form.contactCount) : undefined),
      imageUrl: form.imageUrl || '',
      linkUrl: form.linkUrl || '',
      createdAt: serverTimestamp(),
    };
    if (editing) {
      await updateDoc(doc(firestore, 'marketingCategories', editing.id), payload);
    } else {
      await addDoc(collection(firestore, 'marketingCategories'), payload);
    }
    resetForm();
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await deleteDoc(doc(firestore, 'marketingCategories', id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Marketing Categories (Admin)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={onSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="text-white font-semibold">{editing ? 'Edit Item' : 'Add Item'}</div>
          <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Contacts (e.g., 22000)" value={form.contactCount as any || ''} onChange={(e) => setForm({ ...form, contactCount: Number(e.target.value) })} />
            <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Price USD (e.g., 20)" value={form.priceUsd as any || ''} onChange={(e) => setForm({ ...form, priceUsd: Number(e.target.value) })} />
            <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Price INR (e.g., 1700)" value={form.priceInr as any || ''} onChange={(e) => setForm({ ...form, priceInr: Number(e.target.value) })} />
          </div>
          <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Image URL" value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <input className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Redirect URL" value={form.linkUrl || ''} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded bg-emerald-600 text-white" type="submit">{editing ? 'Update' : 'Add'}</button>
            {editing && (
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded bg-slate-700 text-white">Cancel</button>
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
                    {it.imageUrl ? (
                      <img src={it.imageUrl} alt={it.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-white font-semibold line-clamp-2">{it.title}</div>
                    <div className="text-slate-300 text-sm mt-1">{typeof it.contactCount === 'number' ? it.contactCount.toLocaleString() : '—'} contacts</div>
                    <div className="text-emerald-400 text-sm font-bold mt-1">{formatPrice(it)}</div>
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1.5 rounded bg-blue-600 text-white" onClick={() => { setEditing(it); setForm(it); }}>Edit</button>
                      <button className="px-3 py-1.5 rounded bg-red-600 text-white" onClick={() => onDelete(it.id)}>Delete</button>
                      {it.linkUrl && <a href={it.linkUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded bg-slate-700 text-white">Open</a>}
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

function formatPrice(it: Partial<Item>): string {
  const usd = typeof it.priceUsd === 'number' ? it.priceUsd : undefined;
  const inr = typeof it.priceInr === 'number' ? it.priceInr : undefined;
  if (usd && inr) return `$${usd} / ₹${inr.toLocaleString('en-IN')}`;
  if (usd) return `$${usd}`;
  if (inr) return `₹${inr.toLocaleString('en-IN')}`;
  return it.price || '';
}


