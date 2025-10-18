import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../firebase';
import { ref, onValue } from 'firebase/database';

type ServiceRequest = {
  id: string;
  serviceName: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: number;
  steps: { title: string; fields: { name: string; label: string; type: string }[] }[];
  answers: Record<string, any>;
};

export default function AdminServices() {
  const [requests, setRequests] = useState<Record<string, ServiceRequest>>({});
  const [query, setQuery] = useState('');
  const [svcFilter, setSvcFilter] = useState<string>('all');

  useEffect(() => {
    const unsub = onValue(ref(db, 'serviceRequests'), (snap) => {
      const val = snap.val() || {};
      setRequests(val);
    });
    return () => unsub();
  }, []);

  const list = useMemo(() => {
    const arr = Object.values(requests);
    const q = query.trim().toLowerCase();
    return arr.filter((r) => {
      const matchesSvc = svcFilter === 'all' || r.serviceName === svcFilter;
      const matchesQuery = !q || r.userName.toLowerCase().includes(q) || r.userEmail.toLowerCase().includes(q) || r.serviceName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      return matchesSvc && matchesQuery;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [requests, query, svcFilter]);

  const serviceOptions = useMemo(() => {
    const s = Array.from(new Set(Object.values(requests).map((r) => r.serviceName)));
    return s;
  }, [requests]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Service Requests</span>
            </h1>
            <p className="text-gray-300 text-sm">All user-submitted service requests with details</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-52">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by user/service/id"
                className="w-full px-3 py-2 pl-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔎</span>
            </div>
            <select value={svcFilter} onChange={(e) => setSvcFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <option value="all">All Services</option>
              {serviceOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Table */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <table className="w-full text-left">
          <thead>
            <tr>
              {['ID','Service','User','Email','Date/Time','Actions'].map((h) => (
                <th key={h} className="px-3 py-2 text-sm font-semibold text-white/90">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-400">No requests found.</td></tr>
            )}
            {list.map((r) => (
              <React.Fragment key={r.id}>
                <tr className="odd:bg-white/[0.03]">
                  <td className="px-3 py-2 text-sm text-gray-300">{r.id}</td>
                  <td className="px-3 py-2 text-sm">{r.serviceName}</td>
                  <td className="px-3 py-2 text-sm">{r.userName}</td>
                  <td className="px-3 py-2 text-sm text-gray-300">{r.userEmail}</td>
                  <td className="px-3 py-2 text-sm text-gray-300">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => setExpandedId((id) => id === r.id ? null : r.id)} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-sm">
                      {expandedId === r.id ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>
                {expandedId === r.id && (
                  <tr>
                    <td colSpan={6} className="px-3 py-3">
                      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-300 font-semibold mb-2">User Info</div>
                            <div className="text-xs text-gray-400">ID: {r.userId}</div>
                            <div className="text-xs text-gray-400">Name: {r.userName}</div>
                            <div className="text-xs text-gray-400">Email: {r.userEmail}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-300 font-semibold mb-2">Summary</div>
                            <div className="text-xs text-gray-400">Service: {r.serviceName}</div>
                            <div className="text-xs text-gray-400">Submitted: {new Date(r.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm text-gray-300 font-semibold mb-2">Step-wise Answers</div>
                          <div className="space-y-3">
                            {r.steps.map((s, idx) => (
                              <div key={idx} className="rounded-lg bg-white/5 border border-white/10 p-3">
                                <div className="text-xs font-semibold text-white mb-2">{idx + 1}. {s.title}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {s.fields.map((f) => (
                                    <div key={f.name} className="text-xs text-gray-300">
                                      <span className="text-gray-400">{f.label}: </span>
                                      <span className="text-white/90 break-all">{String(r.answers[f.name] ?? '')}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}