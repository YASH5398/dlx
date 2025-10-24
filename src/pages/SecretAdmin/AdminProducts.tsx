import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

type Product = { id: string; name: string; title?: string; description?: string; price: number; link?: string; image?: string; status?: 'active'|'inactive' };

export default function AdminProducts() {
  const [rows, setRows] = useState<Product[]>([]);
  const [form, setForm] = useState<{ name: string; title: string; description: string; price: number; link: string; image: string; status: 'active'|'inactive' }>({ name: '', title: '', description: '', price: 0, link: '', image: '', status: 'active' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const col = collection(firestore, 'products');
    const unsub = onSnapshot(col, (snap) => {
      const arr: Product[] = [];
      snap.forEach((docSnap) => {
        const d: any = docSnap.data() || {};
        arr.push({ id: docSnap.id, name: d.name || d.title || '-', title: d.title || '', description: d.description || '', price: Number(d.price || d.priceUsd || 0), link: d.link || d.downloadUrl || '', image: d.image || d.thumbnailUrl || '', status: (d.status || 'active') });
      });
      setRows(arr);
    }, (err) => {
      console.error('Failed to stream products:', err);
      toast.error('Failed to load products');
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  const resetForm = () => { setForm({ name: '', title: '', description: '', price: 0, link: '', image: '', status: 'active' }); setEditingId(null); };

  const onEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ name: p.name || '', title: p.title || '', description: p.description || '', price: Number(p.price||0), link: p.link || '', image: p.image || '', status: (p.status as any) || 'active' });
  };

  const saveProduct = async () => {
    const data = { name: form.name.trim(), title: form.title.trim(), description: form.description.trim(), price: Number(form.price || 0), link: form.link.trim(), image: form.image.trim(), status: form.status, updatedAt: serverTimestamp() };
    try {
      if (!data.name) { toast.error('Name is required'); return; }
      if (editingId) {
        await updateDoc(doc(firestore, 'products', editingId), data);
        toast.success('Product updated');
      } else {
        const docRef = await addDoc(collection(firestore, 'products'), { ...data, createdAt: serverTimestamp() });
        toast.success('Product created');
        // ensure id field exists if used elsewhere
        await setDoc(doc(firestore, 'products', docRef.id), { id: docRef.id }, { merge: true });
      }
      resetForm();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save product');
    }
  };

  const removeProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteDoc(doc(firestore, 'products', id));
      toast.success('Product deleted');
      if (editingId === id) resetForm();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete product');
    }
  };

  const toggleStatus = async (p: Product) => {
    try {
      const next = (p.status === 'active') ? 'inactive' : 'active';
      await updateDoc(doc(firestore, 'products', p.id), { status: next, updatedAt: serverTimestamp() });
      toast.success(`Product ${next}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4 space-y-4">
      <div className="text-lg font-semibold">Products</div>

      {/* Form */}
      <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} placeholder="Name" className="px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" />
          <input value={form.title} onChange={(e)=>setForm(f=>({...f,title:e.target.value}))} placeholder="Title" className="px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" />
          <input value={form.price} onChange={(e)=>setForm(f=>({...f,price:Number(e.target.value||0)}))} placeholder="Price" type="number" className="px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" />
          <input value={form.link} onChange={(e)=>setForm(f=>({...f,link:e.target.value}))} placeholder="Download/Link" className="px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" />
          <input value={form.image} onChange={(e)=>setForm(f=>({...f,image:e.target.value}))} placeholder="Image URL" className="px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" />
          <select value={form.status} onChange={(e)=>setForm(f=>({...f,status:e.target.value as any}))} className="px-3 py-2 rounded bg-[#0a0e1f] border border-white/10">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <textarea value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description" className="w-full px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" />
        <div className="flex items-center gap-2">
          <button onClick={saveProduct} className="px-4 py-2 rounded bg-emerald-600/30 border border-emerald-400/40">{editingId? 'Update':'Create'} Product</button>
          {editingId && (<button onClick={resetForm} className="px-4 py-2 rounded bg-white/10 border border-white/20">Cancel</button>)}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((p) => (
          <div key={p.id} className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-gray-400">{p.title || ''}</div>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${p.status==='active'?'bg-emerald-500/20 text-emerald-300':'bg-yellow-500/20 text-yellow-300'}`}>{p.status || 'active'}</span>
            </div>
            {p.image && (<img src={p.image} alt={p.title||p.name} className="w-full h-28 object-cover rounded" />)}
            <div className="text-sm text-gray-300 line-clamp-3">{p.description}</div>
            <div className="flex items-center justify-between">
              <div className="text-emerald-400 font-bold">${Number(p.price||0).toFixed(2)}</div>
              <div className="flex items-center gap-2">
                <button onClick={()=>onEdit(p)} className="px-3 py-1 rounded bg-white/10 border border-white/20">Edit</button>
                <button onClick={()=>toggleStatus(p)} className="px-3 py-1 rounded bg-white/10 border border-white/20">{p.status==='active'?'Deactivate':'Activate'}</button>
                <button onClick={()=>removeProduct(p.id)} className="px-3 py-1 rounded bg-red-600/20 border border-red-500/40 text-red-300">Delete</button>
              </div>
            </div>
            {p.link && (<a href={p.link} target="_blank" rel="noreferrer" className="text-xs text-blue-300 underline">Open Link</a>)}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-sm text-gray-400">No products found.</div>
        )}
      </div>
    </div>
  );
}