import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function AdminUsers() {
  const [admins, setAdmins] = useState<Array<{ id: string; email: string; name?: string }>>([]);

  useEffect(() => {
    const q = query(collection(firestore, 'users'), where('role', '==', 'admin'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          email: data.email || '',
          name: data.name || data.displayName || '',
        };
      });
      setAdmins(list);
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Admin Users</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {admins.map((a) => (
          <div key={a.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="font-semibold">{a.name || a.email}</div>
            <div className="text-xs text-gray-400">{a.email}</div>
          </div>
        ))}
        {admins.length === 0 && (
          <div className="text-sm text-gray-400">No admins found</div>
        )}
      </div>
    </div>
  );
}