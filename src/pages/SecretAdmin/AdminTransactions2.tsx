import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { firestore } from '../../firebase';
import { collection, onSnapshot, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';

// Types
 type Status = 'pending' | 'approved' | 'rejected' | 'completed';
 interface DepositReq { id: string; userId: string; amount: number; method?: string; status: Status; createdAt?: any }
 interface WithdrawalReq { id: string; userId: string; amount: number; method?: string; walletType?: 'main'|'purchase'; status: Status; createdAt?: any }

export default function AdminTransactions2() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [status, setStatus] = useState<'all' | Status>('all');
  const [deposits, setDeposits] = useState<DepositReq[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalReq[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [confirmFn, setConfirmFn] = useState<null | (() => Promise<void>)>(null);

  // Stream Firestore collections in real-time
  useEffect(() => {
    const unsub1 = onSnapshot(collection(firestore, 'depositRequests'), (snap) => {
      const arr: DepositReq[] = snap.docs.map((d) => ({
        id: d.id,
        userId: (d.data() as any).userId,
        amount: Number((d.data() as any).amount || 0),
        method: (d.data() as any).method,
        status: ((d.data() as any).status || 'pending') as Status,
        createdAt: (d.data() as any).createdAt,
      }));
      setDeposits(arr);
    }, (err) => console.error('Deposit stream failed', err));

    const unsub2 = onSnapshot(collection(firestore, 'withdrawalRequests'), (snap) => {
      const arr: WithdrawalReq[] = snap.docs.map((d) => ({
        id: d.id,
        userId: (d.data() as any).userId,
        amount: Number((d.data() as any).amount || 0),
        method: (d.data() as any).method,
        walletType: ((d.data() as any).walletType || 'main') as 'main'|'purchase',
        status: ((d.data() as any).status || 'pending') as Status,
        createdAt: (d.data() as any).createdAt,
      }));
      setWithdrawals(arr);
    }, (err) => console.error('Withdrawal stream failed', err));

    return () => { try { unsub1(); unsub2(); } catch {} };
  }, []);

  // Filters
  const filteredDeposits = useMemo(() => deposits.filter((d) => status === 'all' || d.status === status), [deposits, status]);
  const filteredWithdrawals = useMemo(() => withdrawals.filter((w) => status === 'all' || w.status === status), [withdrawals, status]);

  // Confirm modal helper
  const withConfirm = (message: string, fn: () => Promise<void>) => {
    setConfirmMsg(message);
    setConfirmFn(() => fn);
    setConfirmOpen(true);
  };

  // Wallet adjustment
  const adjustWallet = async (userId: string, walletType: 'main'|'purchase', delta: number) => {
    const userRef = doc(firestore, 'users', userId);
    const snap = await getDoc(userRef);
    const data: any = snap.data() || {};
    const wallet = data.wallet || { main: 0, purchase: 0 };
    const current = Number(wallet[walletType] || 0);
    const updated = { ...wallet, [walletType]: current + delta };
    await updateDoc(userRef, { wallet: updated, walletUpdatedAt: serverTimestamp() });
  };

  // Actions: approve/reject/complete deposits
  const approveDeposit = async (d: DepositReq) => {
    await adjustWallet(d.userId, 'main', d.amount);
    await updateDoc(doc(firestore, 'depositRequests', d.id), { status: 'approved', approvedAt: serverTimestamp() });
    toast.success('Deposit approved and wallet credited');
  };
  const rejectDeposit = async (d: DepositReq) => {
    await updateDoc(doc(firestore, 'depositRequests', d.id), { status: 'rejected', rejectedAt: serverTimestamp() });
    toast.info('Deposit rejected');
  };
  const completeDeposit = async (d: DepositReq) => {
    await updateDoc(doc(firestore, 'depositRequests', d.id), { status: 'completed', completedAt: serverTimestamp() });
    toast.success('Deposit marked completed');
  };

  // Actions: approve/reject/complete withdrawals
  const approveWithdrawal = async (w: WithdrawalReq) => {
    await adjustWallet(w.userId, w.walletType || 'main', -w.amount);
    await updateDoc(doc(firestore, 'withdrawalRequests', w.id), { status: 'approved', approvedAt: serverTimestamp() });
    toast.success('Withdrawal approved and wallet debited');
  };
  const rejectWithdrawal = async (w: WithdrawalReq) => {
    await updateDoc(doc(firestore, 'withdrawalRequests', w.id), { status: 'rejected', rejectedAt: serverTimestamp() });
    toast.info('Withdrawal rejected');
  };
  const completeWithdrawal = async (w: WithdrawalReq) => {
    await updateDoc(doc(firestore, 'withdrawalRequests', w.id), { status: 'completed', completedAt: serverTimestamp() });
    toast.success('Withdrawal marked completed');
  };

  // Row actions component
  const RowActions = ({ onApprove, onReject, onComplete }: { onApprove: () => void; onReject: () => void; onComplete: () => void }) => (
    <div className="flex flex-wrap gap-2 justify-end">
      <button className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs" onClick={() => withConfirm('Approve this request?', async () => onApprove())}>Approve</button>
      <button className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-xs" onClick={() => withConfirm('Reject this request?', async () => onReject())}>Reject</button>
      <button className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs" onClick={() => withConfirm('Mark as completed?', async () => onComplete())}>Mark Completed</button>
      <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs" onClick={() => navigate('/secret-admin/users')}>View User</button>
    </div>
  );

  const TableHead = (
    <thead className="bg-white/5">
      <tr>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">User</th>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">Amount</th>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">Method</th>
        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">Status</th>
        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-300">Actions</th>
      </tr>
    </thead>
  );

  return (
    <div className="rounded-xl bg-[#0a0e1f] border border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold">Transactions</div>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="px-3 py-2 rounded bg-white/5 border border-white/10 text-sm">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button className={`px-3 py-1.5 rounded-md text-sm ${tab==='deposits' ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`} onClick={() => setTab('deposits')}>Deposits</button>
        <button className={`px-3 py-1.5 rounded-md text-sm ${tab==='withdrawals' ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`} onClick={() => setTab('withdrawals')}>Withdrawals</button>
      </div>

      {/* Deposits table/cards */}
      {tab === 'deposits' ? (
        <div>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              {TableHead}
              <tbody className="divide-y divide-white/10">
                {filteredDeposits.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.03]">
                    <td className="px-3 py-2 text-gray-200">{d.userId}</td>
                    <td className="px-3 py-2 text-emerald-400">{d.amount}</td>
                    <td className="px-3 py-2 text-gray-300">{d.method || '-'}</td>
                    <td className="px-3 py-2"><span className="px-2 py-1 rounded bg-white/10 text-xs">{d.status}</span></td>
                    <td className="px-3 py-2">
                      <RowActions onApprove={() => approveDeposit(d)} onReject={() => rejectDeposit(d)} onComplete={() => completeDeposit(d)} />
                    </td>
                  </tr>
                ))}
                {filteredDeposits.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400">No deposit requests</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {filteredDeposits.map((d) => (
              <div key={d.id} className="rounded-lg bg-white/5 border border-white/10 p-3">
                <div className="flex justify-between">
                  <div className="font-semibold">{d.userId}</div>
                  <div className="text-emerald-400">{d.amount}</div>
                </div>
                <div className="text-xs text-gray-400">{d.method || '-'} • {d.status}</div>
                <div className="mt-2"><RowActions onApprove={() => approveDeposit(d)} onReject={() => rejectDeposit(d)} onComplete={() => completeDeposit(d)} /></div>
              </div>
            ))}
            {filteredDeposits.length === 0 && (
              <div className="text-sm text-gray-400">No deposit requests</div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              {TableHead}
              <tbody className="divide-y divide-white/10">
                {filteredWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-white/[0.03]">
                    <td className="px-3 py-2 text-gray-200">{w.userId}</td>
                    <td className="px-3 py-2 text-emerald-400">{w.amount}</td>
                    <td className="px-3 py-2 text-gray-300">{w.method || '-'} ({w.walletType})</td>
                    <td className="px-3 py-2"><span className="px-2 py-1 rounded bg-white/10 text-xs">{w.status}</span></td>
                    <td className="px-3 py-2">
                      <RowActions onApprove={() => approveWithdrawal(w)} onReject={() => rejectWithdrawal(w)} onComplete={() => completeWithdrawal(w)} />
                    </td>
                  </tr>
                ))}
                {filteredWithdrawals.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400">No withdrawal requests</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {filteredWithdrawals.map((w) => (
              <div key={w.id} className="rounded-lg bg-white/5 border border-white/10 p-3">
                <div className="flex justify-between">
                  <div className="font-semibold">{w.userId}</div>
                  <div className="text-emerald-400">{w.amount}</div>
                </div>
                <div className="text-xs text-gray-400">{w.method || '-'} ({w.walletType}) • {w.status}</div>
                <div className="mt-2"><RowActions onApprove={() => approveWithdrawal(w)} onReject={() => rejectWithdrawal(w)} onComplete={() => completeWithdrawal(w)} /></div>
              </div>
            ))}
            {filteredWithdrawals.length === 0 && (
              <div className="text-sm text-gray-400">No withdrawal requests</div>
            )}
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <Transition appear show={confirmOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setConfirmOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-sm rounded-xl bg-[#0b122b] border border-white/10 p-4">
                  <Dialog.Title className="text-base font-semibold mb-2">Confirm action</Dialog.Title>
                  <p className="text-sm text-gray-300">{confirmMsg}</p>
                  <div className="mt-4 flex justify-end gap-2">
                    <button className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm" onClick={() => setConfirmOpen(false)}>Cancel</button>
                    <button className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm text-white" onClick={async () => { try { await (confirmFn?.()); setConfirmOpen(false); } catch (e: any) { toast.error(e?.message || 'Action failed'); } }}>Confirm</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}