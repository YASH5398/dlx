import React, { useEffect, useMemo, useState } from 'react';
import { collection, collectionGroup, doc, getDocs, onSnapshot, orderBy, query, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../firebase';
import { ServiceManager } from '../../utils/serviceManagement';

interface ReviewRow {
  id: string;
  serviceId: string;
  serviceName: string;
  userName: string;
  rating: number;
  review: string;
  createdAt?: string;
  isDummy?: boolean;
}

export default function AdminReviews() {
  const [servicesMap, setServicesMap] = useState<Map<string, string>>(new Map());
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState<string>('');
  const [filterRating, setFilterRating] = useState<string>('');
  const [editing, setEditing] = useState<ReviewRow | null>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<ReviewRow | null>(null);

  // Load services map (id -> title)
  useEffect(() => {
    (async () => {
      try {
        const services = await ServiceManager.getServices();
        const map = new Map<string, string>();
        services.forEach((s: any) => map.set(s.id, s.title || s.name || s.id));
        setServicesMap(map);
      } catch (e) {
        console.error('Failed to load services:', e);
      }
    })();
  }, []);

  // Stream all reviews via collectionGroup
  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collectionGroup(firestore, 'reviews'));
      const unsub = onSnapshot(q, (snap) => {
        const list: ReviewRow[] = [];
        snap.forEach((d) => {
          const data: any = d.data() || {};
          const parentService = d.ref.parent.parent; // services/{serviceId}
          const serviceId = parentService?.id || '';
          const serviceName = servicesMap.get(serviceId) || serviceId;
          let created = '';
          try {
            if (data?.createdAt?.toDate) created = data.createdAt.toDate().toISOString();
            else if (typeof data?.createdAt === 'string') created = new Date(data.createdAt).toISOString();
          } catch {}
          list.push({
            id: d.id,
            serviceId,
            serviceName,
            userName: data?.userName || 'Anonymous',
            rating: Number(data?.rating || 0),
            review: String(data?.review || ''),
            createdAt: created,
            isDummy: Boolean(data?.isDummy || false),
          });
        });
        // Sort by createdAt desc
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setRows(list);
        setLoading(false);
      }, (err) => {
        console.error('Reviews stream failed:', err);
        setError('Failed to load reviews');
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      console.error('Failed to stream reviews:', e);
      setError('Failed to stream reviews');
      setLoading(false);
    }
  }, [servicesMap]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch = search.trim().length === 0 || (
        r.userName.toLowerCase().includes(search.toLowerCase()) ||
        r.review.toLowerCase().includes(search.toLowerCase()) ||
        r.serviceName.toLowerCase().includes(search.toLowerCase())
      );
      const matchesService = !filterService || r.serviceId === filterService;
      const matchesRating = !filterRating || String(r.rating) === filterRating;
      return matchesSearch && matchesService && matchesRating;
    });
  }, [rows, search, filterService, filterRating]);

  // Handlers
  async function handleSaveEdit(payload: { reviewId?: string; serviceId: string; userName: string; rating: number; review: string; isDummy?: boolean; title?: string; }) {
    const { reviewId, serviceId, userName, rating, review, isDummy } = payload;
    if (!serviceId || !review || !rating) return;
    if (reviewId) {
      // update
      await updateDoc(doc(firestore, 'services', serviceId, 'reviews', reviewId), {
        userName,
        rating: Number(rating),
        review,
        isDummy: Boolean(isDummy),
        updatedAt: serverTimestamp(),
      });
    } else {
      // create
      await addDoc(collection(firestore, 'services', serviceId, 'reviews'), {
        userId: 'admin',
        userName,
        userEmail: 'admin@digilinex.com',
        rating: Number(rating),
        review,
        createdAt: serverTimestamp(),
        isDummy: Boolean(isDummy),
      });
    }
    setEditing(null);
    setCreating(false);
  }

  async function handleDelete(row: ReviewRow) {
    await deleteDoc(doc(firestore, 'services', row.serviceId, 'reviews', row.id));
    setDeleting(null);
  }

  const serviceOptions = Array.from(servicesMap.entries()).map(([id, name]) => ({ id, name }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Reviews Management</h1>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
        >
          + Add Review
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by service, user or text"
          className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm w-64"
        />
        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm"
        >
          <option value="">All Services</option>
          {serviceOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm"
        >
          <option value="">All Ratings</option>
          {[5,4,3].map((r) => (
            <option key={r} value={String(r)}>{r}★</option>
          ))}
        </select>
      </div>

      {loading && <div className="text-gray-400">Loading reviews...</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && (
        <div className="overflow-x-auto border border-gray-800 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left px-3 py-2">Review ID</th>
                <th className="text-left px-3 py-2">Service</th>
                <th className="text-left px-3 py-2">User</th>
                <th className="text-left px-3 py-2">Rating</th>
                <th className="text-left px-3 py-2">Review</th>
                <th className="text-left px-3 py-2">Created At</th>
                <th className="text-left px-3 py-2">IsDummy</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={`${r.serviceId}:${r.id}`} className="border-t border-gray-800 hover:bg-gray-900/50">
                  <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                  <td className="px-3 py-2">{r.serviceName}</td>
                  <td className="px-3 py-2">{r.userName}</td>
                  <td className="px-3 py-2">{r.rating}</td>
                  <td className="px-3 py-2 max-w-[360px] truncate" title={r.review}>{r.review}</td>
                  <td className="px-3 py-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</td>
                  <td className="px-3 py-2">{r.isDummy ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2 space-x-2">
                    <button onClick={() => setEditing(r)} className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white">Edit</button>
                    <button onClick={() => setDeleting(r)} className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white">Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-gray-500" colSpan={8}>No reviews found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit / Create Modal */}
      {(editing || creating) && (
        <EditCreateModal
          mode={editing ? 'edit' : 'create'}
          services={serviceOptions}
          initial={editing || undefined}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={async (payload) => {
            await handleSaveEdit(payload);
          }}
        />
      )}

      {/* Delete Modal */}
      {deleting && (
        <ConfirmModal
          title="Delete Review"
          message={`Are you sure you want to delete review ${deleting.id}? This cannot be undone.`}
          onCancel={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      )}
    </div>
  );
}

function EditCreateModal({ mode, services, initial, onClose, onSave }: { mode: 'edit' | 'create'; services: Array<{ id: string; name: string }>; initial?: ReviewRow; onClose: () => void; onSave: (p: { reviewId?: string; serviceId: string; userName: string; rating: number; review: string; isDummy?: boolean; title?: string; }) => Promise<void>; }) {
  const [serviceId, setServiceId] = useState<string>(initial?.serviceId || (services[0]?.id || ''));
  const [userName, setUserName] = useState<string>(initial?.userName || '');
  const [rating, setRating] = useState<number>(initial?.rating || 5);
  const [review, setReview] = useState<string>(initial?.review || '');
  const [isDummy, setIsDummy] = useState<boolean>(Boolean(initial?.isDummy));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-950 border border-gray-800 rounded-xl w-full max-w-xl p-6">
        <h3 className="text-lg font-semibold mb-4">{mode === 'edit' ? 'Edit Review' : 'Add Review'}</h3>

        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm">
            <span className="block mb-1 text-gray-300">Service</span>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm">
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-gray-300">User Name</span>
            <input value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm" />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-gray-300">Rating (1–5)</span>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm">
              {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-gray-300">Review Text</span>
            <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={5} className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm" />
          </label>
          <label className="text-sm inline-flex items-center gap-2">
            <input type="checkbox" checked={isDummy} onChange={(e) => setIsDummy(e.target.checked)} />
            <span>isDummy</span>
          </label>
        </div>

        {error && <div className="text-red-400 text-sm mt-2">{error}</div>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300">Cancel</button>
          <button
            onClick={async () => {
              try {
                setSaving(true);
                setError(null);
                await onSave({ reviewId: initial?.id, serviceId, userName: userName || 'Anonymous', rating, review, isDummy });
                onClose();
              } catch (e: any) {
                setError(e?.message || 'Failed to save');
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, onCancel, onConfirm }: { title: string; message: string; onCancel: () => void; onConfirm: () => Promise<void> | void; }) {
  const [working, setWorking] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-gray-950 border border-gray-800 rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-300 mb-4 text-sm">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300">Cancel</button>
          <button
            onClick={async () => { setWorking(true); await onConfirm(); setWorking(false); }}
            disabled={working}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
          >
            {working ? 'Working...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
