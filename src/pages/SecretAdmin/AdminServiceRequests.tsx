import React, { useEffect, useState } from 'react';
import {
  subscribePendingRequests,
  updateAdminNotes,
  setPrice,
  updateStatus,
  sendNotification,
  setExpectedCompletion,
} from '../../utils/serviceRequestsFirestore';
import type { ServiceRequestDoc, NotificationType, ServiceRequestStatus } from '../../utils/serviceRequestsFirestore';

interface Item extends ServiceRequestDoc { id: string }

const statusOptions: ServiceRequestStatus[] = ['pending','reviewed','paid','processing','completed'];
const noteTypes: NotificationType[] = ['message','notification','link'];

export default function AdminServiceRequests() {
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState<{[id:string]: boolean}>({});
  const [notesDraft, setNotesDraft] = useState<{[id:string]: string}>({});
  const [priceDraft, setPriceDraft] = useState<{[id:string]: string}>({});
  const [statusDraft, setStatusDraft] = useState<{[id:string]: ServiceRequestStatus}>({});
  const [notifDraft, setNotifDraft] = useState<{[id:string]: { type: NotificationType, content: string } }>({});
  const [completionDraft, setCompletionDraft] = useState<{[id:string]: string}>({});

  useEffect(() => {
    const unsub = subscribePendingRequests((list) => {
      setItems(list);
      // initialize drafts
      const nd: {[id:string]: string} = {}; const pd: {[id:string]: string} = {}; const sd: {[id:string]: ServiceRequestStatus} = {}; const cd: {[id:string]: string} = {}; const ndraft: {[id:string]: {type: NotificationType, content: string}} = {};
      list.forEach((it) => {
        nd[it.id] = it.adminNotes || '';
        pd[it.id] = String(it.price ?? 0);
        sd[it.id] = it.status ?? 'pending';
        cd[it.id] = it.expectedCompletion || '';
        ndraft[it.id] = { type: 'message', content: '' };
      });
      setNotesDraft(nd); setPriceDraft(pd); setStatusDraft(sd); setCompletionDraft(cd); setNotifDraft(ndraft);
    });
    return () => unsub();
  }, []);

  async function saveNotes(id: string) {
    setSaving((s) => ({...s, [id]: true}));
    await updateAdminNotes(id, notesDraft[id] || '');
    setSaving((s) => ({...s, [id]: false}));
  }
  async function savePrice(id: string) {
    setSaving((s) => ({...s, [id]: true}));
    const price = Number(priceDraft[id] || 0);
    await setPrice(id, price);
    setSaving((s) => ({...s, [id]: false}));
  }
  async function saveStatus(id: string) {
    setSaving((s) => ({...s, [id]: true}));
    await updateStatus(id, statusDraft[id] || 'pending');
    setSaving((s) => ({...s, [id]: false}));
  }
  async function sendNotif(id: string) {
    setSaving((s) => ({...s, [id]: true}));
    const n = notifDraft[id];
    if (n && n.content.trim()) {
      await sendNotification(id, n.type, n.content.trim());
      setNotifDraft((d) => ({...d, [id]: { ...d[id], content: '' }}));
    }
    setSaving((s) => ({...s, [id]: false}));
  }
  async function saveExpectedCompletion(id: string) {
    setSaving((s) => ({...s, [id]: true}));
    await setExpectedCompletion(id, completionDraft[id] || '');
    setSaving((s) => ({...s, [id]: false}));
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Pending Service Requests</h1>
      {items.length === 0 && (
        <div className="text-gray-600">No pending requests.</div>
      )}
      <div className="space-y-6">
        {items.map((it) => (
          <div key={it.id} className="border rounded-lg p-4 shadow-sm bg-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-medium">{it.serviceTitle}</div>
                <div className="text-sm text-gray-600">{it.serviceId}</div>
              </div>
              <div className="text-sm text-gray-500">Created: {/* Timestamp to date string */}{/* handled client-side via Firestore converter typically */}</div>
            </div>
            <div className="mt-2 text-sm">
              <div><span className="font-medium">User:</span> {it.userName} ({it.userEmail})</div>
              <div><span className="font-medium">User ID:</span> {it.userId}</div>
              <div><span className="font-medium">Website:</span> <a className="text-blue-600 hover:underline" href={it.userWebsiteLink} target="_blank" rel="noreferrer">{it.userWebsiteLink}</a></div>
              <div><span className="font-medium">Details:</span> {it.requestDetails}</div>
              <div><span className="font-medium">Password:</span> <span className="px-2 py-0.5 bg-gray-200 rounded">••••••••</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Admin Notes</label>
                <textarea className="w-full border rounded p-2" rows={3} value={notesDraft[it.id] || ''} onChange={(e) => setNotesDraft((d)=>({...d,[it.id]: e.target.value}))} />
                <button className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded" onClick={() => saveNotes(it.id)} disabled={!!saving[it.id]}>
                  {saving[it.id] ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input type="number" className="w-full border rounded p-2" value={priceDraft[it.id] || ''} onChange={(e) => setPriceDraft((d)=>({...d,[it.id]: e.target.value}))} />
                <button className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded" onClick={() => savePrice(it.id)} disabled={!!saving[it.id]}>
                  {saving[it.id] ? 'Saving...' : 'Set Price'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select className="w-full border rounded p-2" value={statusDraft[it.id] || 'pending'} onChange={(e)=> setStatusDraft((d)=>({...d,[it.id]: e.target.value as ServiceRequestStatus}))}>
                  {statusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                <button className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded" onClick={() => saveStatus(it.id)} disabled={!!saving[it.id]}>
                  {saving[it.id] ? 'Saving...' : 'Update Status'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Send Notification</label>
                <div className="flex gap-2">
                  <select className="border rounded p-2" value={notifDraft[it.id]?.type || 'message'} onChange={(e)=> setNotifDraft((d)=> ({...d, [it.id]: { ...d[it.id], type: e.target.value as NotificationType }}))}>
                    {noteTypes.map((t)=>(<option key={t} value={t}>{t}</option>))}
                  </select>
                  <input className="flex-1 border rounded p-2" placeholder="Message or link" value={notifDraft[it.id]?.content || ''} onChange={(e)=> setNotifDraft((d)=> ({...d, [it.id]: { ...d[it.id], content: e.target.value }}))} />
                  <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => sendNotif(it.id)} disabled={!!saving[it.id]}>Send</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expected Completion (date string)</label>
                <input className="w-full border rounded p-2" placeholder="YYYY-MM-DD" value={completionDraft[it.id] || ''} onChange={(e)=> setCompletionDraft((d)=> ({...d, [it.id]: e.target.value}))} />
                <button className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded" onClick={() => saveExpectedCompletion(it.id)} disabled={!!saving[it.id]}>
                  {saving[it.id] ? 'Saving...' : 'Set Expected Completion'}
                </button>
              </div>
            </div>

            {it.notifications?.length ? (
              <div className="mt-4">
                <div className="text-sm font-medium mb-1">Notifications</div>
                <ul className="space-y-1 text-sm">
                  {it.notifications.map((n, idx) => (
                    <li key={idx} className="flex justify-between">
                      <div>
                        <span className="font-medium">[{n.type}]</span> {n.content}
                      </div>
                      <div className="text-gray-500">{/* n.timestamp.toDate?.() */}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}