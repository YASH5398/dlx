import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
export default function AdminUsers() {
    const [admins, setAdmins] = useState([]);
    useEffect(() => {
        const q = query(collection(firestore, 'users'), where('role', '==', 'admin'));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    email: data.email || '',
                    name: data.name || data.displayName || '',
                };
            });
            setAdmins(list);
        });
        return () => { try {
            unsub();
        }
        catch { } };
    }, []);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h1", { className: "text-xl font-bold", children: "Admin Users" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: [admins.map((a) => (_jsxs("div", { className: "rounded-lg border border-white/10 bg-white/[0.03] p-4", children: [_jsx("div", { className: "font-semibold", children: a.name || a.email }), _jsx("div", { className: "text-xs text-gray-400", children: a.email })] }, a.id))), admins.length === 0 && (_jsx("div", { className: "text-sm text-gray-400", children: "No admins found" }))] })] }));
}
