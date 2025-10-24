import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
export default function AdminProducts() {
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState({ name: '', title: '', description: '', price: 0, link: '', image: '', status: 'active' });
    const [editingId, setEditingId] = useState(null);
    useEffect(() => {
        const col = collection(firestore, 'products');
        const unsub = onSnapshot(col, (snap) => {
            const arr = [];
            snap.forEach((docSnap) => {
                const d = docSnap.data() || {};
                arr.push({ id: docSnap.id, name: d.name || d.title || '-', title: d.title || '', description: d.description || '', price: Number(d.price || d.priceUsd || 0), link: d.link || d.downloadUrl || '', image: d.image || d.thumbnailUrl || '', status: (d.status || 'active') });
            });
            setRows(arr);
        }, (err) => {
            console.error('Failed to stream products:', err);
            toast.error('Failed to load products');
        });
        return () => { try {
            unsub();
        }
        catch { } };
    }, []);
    const resetForm = () => { setForm({ name: '', title: '', description: '', price: 0, link: '', image: '', status: 'active' }); setEditingId(null); };
    const onEdit = (p) => {
        setEditingId(p.id);
        setForm({ name: p.name || '', title: p.title || '', description: p.description || '', price: Number(p.price || 0), link: p.link || '', image: p.image || '', status: p.status || 'active' });
    };
    const saveProduct = async () => {
        const data = { name: form.name.trim(), title: form.title.trim(), description: form.description.trim(), price: Number(form.price || 0), link: form.link.trim(), image: form.image.trim(), status: form.status, updatedAt: serverTimestamp() };
        try {
            if (!data.name) {
                toast.error('Name is required');
                return;
            }
            if (editingId) {
                await updateDoc(doc(firestore, 'products', editingId), data);
                toast.success('Product updated');
            }
            else {
                const docRef = await addDoc(collection(firestore, 'products'), { ...data, createdAt: serverTimestamp() });
                toast.success('Product created');
                // ensure id field exists if used elsewhere
                await setDoc(doc(firestore, 'products', docRef.id), { id: docRef.id }, { merge: true });
            }
            resetForm();
        }
        catch (e) {
            console.error(e);
            toast.error('Failed to save product');
        }
    };
    const removeProduct = async (id) => {
        if (!confirm('Delete this product?'))
            return;
        try {
            await deleteDoc(doc(firestore, 'products', id));
            toast.success('Product deleted');
            if (editingId === id)
                resetForm();
        }
        catch (e) {
            console.error(e);
            toast.error('Failed to delete product');
        }
    };
    const toggleStatus = async (p) => {
        try {
            const next = (p.status === 'active') ? 'inactive' : 'active';
            await updateDoc(doc(firestore, 'products', p.id), { status: next, updatedAt: serverTimestamp() });
            toast.success(`Product ${next}`);
        }
        catch (e) {
            console.error(e);
            toast.error('Failed to update status');
        }
    };
    return (_jsxs("div", { className: "rounded-xl bg-[#0a0e1f] border border-white/10 p-4 space-y-4", children: [_jsx("div", { className: "text-lg font-semibold", children: "Products" }), _jsxs("div", { className: "rounded-lg bg-white/5 border border-white/10 p-3 space-y-2", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: [_jsx("input", { value: form.name, onChange: (e) => setForm(f => ({ ...f, name: e.target.value })), placeholder: "Name", className: "px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" }), _jsx("input", { value: form.title, onChange: (e) => setForm(f => ({ ...f, title: e.target.value })), placeholder: "Title", className: "px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" }), _jsx("input", { value: form.price, onChange: (e) => setForm(f => ({ ...f, price: Number(e.target.value || 0) })), placeholder: "Price", type: "number", className: "px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" }), _jsx("input", { value: form.link, onChange: (e) => setForm(f => ({ ...f, link: e.target.value })), placeholder: "Download/Link", className: "px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" }), _jsx("input", { value: form.image, onChange: (e) => setForm(f => ({ ...f, image: e.target.value })), placeholder: "Image URL", className: "px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" }), _jsxs("select", { value: form.status, onChange: (e) => setForm(f => ({ ...f, status: e.target.value })), className: "px-3 py-2 rounded bg-[#0a0e1f] border border-white/10", children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" })] })] }), _jsx("textarea", { value: form.description, onChange: (e) => setForm(f => ({ ...f, description: e.target.value })), placeholder: "Description", className: "w-full px-3 py-2 rounded bg-[#0a0e1f] border border-white/10" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: saveProduct, className: "px-4 py-2 rounded bg-emerald-600/30 border border-emerald-400/40", children: [editingId ? 'Update' : 'Create', " Product"] }), editingId && (_jsx("button", { onClick: resetForm, className: "px-4 py-2 rounded bg-white/10 border border-white/20", children: "Cancel" }))] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: [rows.map((p) => (_jsxs("div", { className: "rounded-lg bg-white/5 border border-white/10 p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: p.name }), _jsx("div", { className: "text-xs text-gray-400", children: p.title || '' })] }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${p.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/20 text-yellow-300'}`, children: p.status || 'active' })] }), p.image && (_jsx("img", { src: p.image, alt: p.title || p.name, className: "w-full h-28 object-cover rounded" })), _jsx("div", { className: "text-sm text-gray-300 line-clamp-3", children: p.description }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-emerald-400 font-bold", children: ["$", Number(p.price || 0).toFixed(2)] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => onEdit(p), className: "px-3 py-1 rounded bg-white/10 border border-white/20", children: "Edit" }), _jsx("button", { onClick: () => toggleStatus(p), className: "px-3 py-1 rounded bg-white/10 border border-white/20", children: p.status === 'active' ? 'Deactivate' : 'Activate' }), _jsx("button", { onClick: () => removeProduct(p.id), className: "px-3 py-1 rounded bg-red-600/20 border border-red-500/40 text-red-300", children: "Delete" })] })] }), p.link && (_jsx("a", { href: p.link, target: "_blank", rel: "noreferrer", className: "text-xs text-blue-300 underline", children: "Open Link" }))] }, p.id))), rows.length === 0 && (_jsx("div", { className: "text-sm text-gray-400", children: "No products found." }))] })] }));
}
