import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from '../../firebase';
import { collection, onSnapshot, doc, getDoc, updateDoc, serverTimestamp, setDoc, runTransaction, addDoc } from 'firebase/firestore';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';

// Types
 type Status = 'pending' | 'approved' | 'rejected' | 'completed';
 interface DepositReq { id: string; userId: string; amount: number; method?: string; status: Status; createdAt?: any; currency?: string; fees?: number; txnId?: string; reviewedBy?: string; notes?: string }
 interface WithdrawalReq { id: string; userId: string; amount: number; method?: string; walletType?: 'main'|'purchase'; status: Status; createdAt?: any; currency?: string; fees?: number; txnId?: string; reviewedBy?: string; notes?: string }

export default function AdminTransactions2() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [status, setStatus] = useState<'all' | Status>('all');
  const [deposits, setDeposits] = useState<DepositReq[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalReq[]>([]);
  // add user and wallet caches
  const [users, setUsers] = useState<Record<string, any>>({});
  const [wallets, setWallets] = useState<Record<string, any>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [confirmFn, setConfirmFn] = useState<null | (() => Promise<void>)>(null);

  // Stream Firestore collections in real-time
  useEffect(() => {
    const unsub1 = onSnapshot(collection(firestore, 'depositRequests'), (snap) => {
      const arr: DepositReq[] = snap.docs.map((d) => {
        const x: any = d.data() || {};
        return {
          id: d.id,
          userId: x.userId,
          amount: Number(x.amount || 0),
          method: x.method,
          status: ((x.status || 'pending') as Status),
          createdAt: x.createdAt,
          currency: x.currency,
          fees: Number(x.fees || 0),
          txnId: x.txnId,
          reviewedBy: x.reviewedBy,
          notes: x.notes,
        };
      });
      setDeposits(arr);
    }, (err) => console.error('Deposit stream failed', err));

    const unsub2 = onSnapshot(collection(firestore, 'withdrawalRequests'), (snap) => {
      const arr: WithdrawalReq[] = snap.docs.map((d) => {
        const x: any = d.data() || {};
        return {
          id: d.id,
          userId: x.userId,
          amount: Number(x.amount || 0),
          method: x.method,
          walletType: ((x.walletType || 'main') as 'main'|'purchase'),
          status: ((x.status || 'pending') as Status),
          createdAt: x.createdAt,
          currency: x.currency,
          fees: Number(x.fees || 0),
          txnId: x.txnId,
          reviewedBy: x.reviewedBy,
          notes: x.notes,
        };
      });
      setWithdrawals(arr);
    }, (err) => console.error('Withdrawal stream failed', err));

    // stream users and wallets for label and email
    const unsub3 = onSnapshot(collection(firestore, 'users'), (snap) => {
      const m: Record<string, any> = {};
      snap.forEach((d) => { m[d.id] = d.data(); });
      setUsers(m);
    });
    const unsub4 = onSnapshot(collection(firestore, 'wallets'), (snap) => {
      const m: Record<string, any> = {};
      snap.forEach((d) => { m[d.id] = d.data(); });
      setWallets(m);
    });

    return () => { try { unsub1(); unsub2(); unsub3(); unsub4(); } catch {} };
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

  // Wallet adjustment using wallets collection instead of users
  const adjustWallet = async (userId: string, walletType: 'main'|'purchase', delta: number) => {
    const wRef = doc(firestore, 'wallets', userId);
    const snap = await getDoc(wRef);
    const data: any = snap.data() || {};
    const usdt = data.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
    const current = walletType === 'main' ? Number(usdt.mainUsdt || 0) : Number(usdt.purchaseUsdt || 0);
    const updatedUsdt = walletType === 'main' ? { ...usdt, mainUsdt: current + delta } : { ...usdt, purchaseUsdt: current + delta };
    if (snap.exists()) {
      await updateDoc(wRef, { ...data, usdt: updatedUsdt, walletUpdatedAt: serverTimestamp() });
    } else {
      await setDoc(wRef, { dlx: Number(data.dlx || 0), usdt: updatedUsdt, walletUpdatedAt: serverTimestamp() }, { merge: true });
    }
  };

  // helpers for UI
  const formatDate = (ts: any) => {
    const ms = ts?.toMillis ? ts.toMillis() : Number(ts || 0);
    return ms ? new Date(ms).toLocaleString() : '-';
  };
  const getUserLabel = (uid: string) => {
    const u = users[uid] || {};
    return (u.name || u.displayName || u.email || uid);
  };
  const getUserEmail = (uid: string) => (users[uid]?.email || users[uid]?.userEmail || '');

  // Actions: approve/reject/complete deposits (atomic with audit)
  const approveDeposit = async (d: DepositReq) => {
    const adminId = auth.currentUser?.uid || 'unknown';
    const adminEmail = auth.currentUser?.email || '';
    const reqRef = doc(firestore, 'depositRequests', d.id);
    const walletRef = doc(firestore, 'wallets', d.userId);
    const logRef = doc(collection(firestore, 'audit_logs'));
    try {
      await runTransaction(firestore, async (tx) => {
        const reqSnap = await tx.get(reqRef);
        const reqData: any = reqSnap.data() || {};
        const currentStatus: Status = (reqData.status || 'pending');
        if (currentStatus !== 'pending') throw new Error('Request already processed');
        const wSnap = await tx.get(walletRef);
        const wData: any = wSnap.data() || {};
        const usdt = wData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
        const updated = { ...usdt, mainUsdt: Number(usdt.mainUsdt || 0) + Number(d.amount || 0) };
        tx.set(walletRef, { ...wData, usdt: updated, walletUpdatedAt: serverTimestamp() }, { merge: true });
        tx.update(reqRef, { status: 'approved', approvedAt: serverTimestamp(), reviewedBy: adminId });
        tx.set(logRef, { actor_id: adminId, actor_email: adminEmail, action: 'approve_deposit', target_type: 'deposit_request', target_id: d.id, meta: { userId: d.userId, amount: d.amount, method: d.method, currency: d.currency, fees: d.fees, txnId: d.txnId }, created_at: serverTimestamp() });
      });
      toast.success('Deposit approved and wallet credited');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to approve deposit');
      console.error('approveDeposit failed:', e);
    }
  };
  const rejectDeposit = async (d: DepositReq) => {
    const adminId = auth.currentUser?.uid || 'unknown';
    const adminEmail = auth.currentUser?.email || '';
    const reqRef = doc(firestore, 'depositRequests', d.id);
    const logRef = doc(collection(firestore, 'audit_logs'));
    try {
      await runTransaction(firestore, async (tx) => {
        const reqSnap = await tx.get(reqRef);
        const reqData: any = reqSnap.data() || {};
        const currentStatus: Status = (reqData.status || 'pending');
        if (currentStatus !== 'pending') throw new Error('Request already processed');
        tx.update(reqRef, { status: 'rejected', rejectedAt: serverTimestamp(), reviewedBy: adminId });
        tx.set(logRef, { actor_id: adminId, actor_email: adminEmail, action: 'reject_deposit', target_type: 'deposit_request', target_id: d.id, meta: { userId: d.userId, amount: d.amount, method: d.method }, created_at: serverTimestamp() });
      });
      toast.info('Deposit rejected');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reject deposit');
      console.error('rejectDeposit failed:', e);
    }
  };
  const completeDeposit = async (d: DepositReq) => {
    const adminId = auth.currentUser?.uid || 'unknown';
    const adminEmail = auth.currentUser?.email || '';
    const reqRef = doc(firestore, 'depositRequests', d.id);
    const logRef = doc(collection(firestore, 'audit_logs'));
    try {
      await runTransaction(firestore, async (tx) => {
        const reqSnap = await tx.get(reqRef);
        const reqData: any = reqSnap.data() || {};
        const currentStatus: Status = (reqData.status || 'pending');
        if (currentStatus !== 'approved' && currentStatus !== 'pending') throw new Error('Only pending/approved can complete');
        tx.update(reqRef, { status: 'completed', completedAt: serverTimestamp(), reviewedBy: adminId });
        tx.set(logRef, { actor_id: adminId, actor_email: adminEmail, action: 'complete_deposit', target_type: 'deposit_request', target_id: d.id, meta: { userId: d.userId, amount: d.amount, method: d.method }, created_at: serverTimestamp() });
      });
      toast.success('Deposit marked completed');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to complete deposit');
      console.error('completeDeposit failed:', e);
    }
  };

  // Actions: approve/reject/complete withdrawals (atomic with audit)
  const approveWithdrawal = async (w: WithdrawalReq) => {
    const adminId = auth.currentUser?.uid || 'unknown';
    const adminEmail = auth.currentUser?.email || '';
    const reqRef = doc(firestore, 'withdrawalRequests', w.id);
    const walletRef = doc(firestore, 'wallets', w.userId);
    const logRef = doc(collection(firestore, 'audit_logs'));
    try {
      await runTransaction(firestore, async (tx) => {
        const reqSnap = await tx.get(reqRef);
        const reqData: any = reqSnap.data() || {};
        const currentStatus: Status = (reqData.status || 'pending');
        if (currentStatus !== 'pending') throw new Error('Request already processed');
        const wSnap = await tx.get(walletRef);
        const wData: any = wSnap.data() || {};
        const usdt = wData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
        const key = (w.walletType || 'main') === 'main' ? 'mainUsdt' : 'purchaseUsdt';
        const current = Number(usdt[key] || 0);
        const amt = Number(w.amount || 0);
        if (current < amt) throw new Error('Insufficient balance');
        const updated = { ...usdt, [key]: current - amt };
        tx.set(walletRef, { ...wData, usdt: updated, walletUpdatedAt: serverTimestamp() }, { merge: true });
        tx.update(reqRef, { status: 'approved', approvedAt: serverTimestamp(), reviewedBy: adminId });
        tx.set(logRef, { actor_id: adminId, actor_email: adminEmail, action: 'approve_withdrawal', target_type: 'withdrawal_request', target_id: w.id, meta: { userId: w.userId, amount: w.amount, method: w.method, walletType: w.walletType }, created_at: serverTimestamp() });
      });
      toast.success('Withdrawal approved and wallet debited');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to approve withdrawal');
      console.error('approveWithdrawal failed:', e);
    }
  };
  const rejectWithdrawal = async (w: WithdrawalReq) => {
    const adminId = auth.currentUser?.uid || 'unknown';
    const adminEmail = auth.currentUser?.email || '';
    const reqRef = doc(firestore, 'withdrawalRequests', w.id);
    const logRef = doc(collection(firestore, 'audit_logs'));
    try {
      await runTransaction(firestore, async (tx) => {
        const reqSnap = await tx.get(reqRef);
        const reqData: any = reqSnap.data() || {};
        const currentStatus: Status = (reqData.status || 'pending');
        if (currentStatus !== 'pending') throw new Error('Request already processed');
        tx.update(reqRef, { status: 'rejected', rejectedAt: serverTimestamp(), reviewedBy: adminId });
        tx.set(logRef, { actor_id: adminId, actor_email: adminEmail, action: 'reject_withdrawal', target_type: 'withdrawal_request', target_id: w.id, meta: { userId: w.userId, amount: w.amount, method: w.method, walletType: w.walletType }, created_at: serverTimestamp() });
      });
      toast.info('Withdrawal rejected');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reject withdrawal');
      console.error('rejectWithdrawal failed:', e);
    }
  };
  const completeWithdrawal = async (w: WithdrawalReq) => {
    const adminId = auth.currentUser?.uid || 'unknown';
    const adminEmail = auth.currentUser?.email || '';
    const reqRef = doc(firestore, 'withdrawalRequests', w.id);
    const logRef = doc(collection(firestore, 'audit_logs'));
    try {
      await runTransaction(firestore, async (tx) => {
        const reqSnap = await tx.get(reqRef);
        const reqData: any = reqSnap.data() || {};
        const currentStatus: Status = (reqData.status || 'pending');
        if (currentStatus !== 'approved' && currentStatus !== 'pending') throw new Error('Only pending/approved can complete');
        tx.update(reqRef, { status: 'completed', completedAt: serverTimestamp(), reviewedBy: adminId });
        tx.set(logRef, { actor_id: adminId, actor_email: adminEmail, action: 'complete_withdrawal', target_type: 'withdrawal_request', target_id: w.id, meta: { userId: w.userId, amount: w.amount, method: w.method, walletType: w.walletType }, created_at: serverTimestamp() });
      });
      toast.success('Withdrawal marked completed');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to complete withdrawal');
      console.error('completeWithdrawal failed:', e);
    }
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
        <div>
          <div className="text-lg font-semibold">Deposit & Withdrawal Requests</div>
          <div className="text-xs text-gray-400">Review all requests with full details and actions</div>
        </div>
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

      <div className="space-y-6">
        <div>
          <div className="text-sm font-semibold mb-2">Deposits</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">User</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">Method</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">Details</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">Status</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredDeposits.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.03]">
                    <td className="px-3 py-2 text-gray-200">{getUserLabel(d.userId)}</td>
                    <td className="px-3 py-2 text-emerald-400">{d.amount}</td>
                    <td className="px-3 py-2 text-gray-300">{d.method || '-'}</td>
                    <td className="px-3 py-2 text-gray-300">
                      <div className="space-y-0.5">
                        <div className="text-xs">Email: {getUserEmail(d.userId) || '-'}</div>
                        <div className="text-xs">UID: <span className="font-mono text-gray-400">{d.userId}</span></div>
                        <div className="text-xs">Currency: {d.currency || 'USDT'}</div>
                        <div className="text-xs">Fees: {typeof d.fees === 'number' ? d.fees : '-'}</div>
                        <div className="text-xs">Txn ID: {d.txnId || '-'}</div>
                        <div className="text-xs">Requested: {formatDate(d.createdAt)}</div>
                        <div className="text-xs">Reviewed By: {d.reviewedBy || '-'}</div>
                        <div className="text-xs">Notes: {d.notes || '-'}</div>
                        <div className="text-xs">Wallet: USDT Main {Number(wallets[d.userId]?.usdt?.mainUsdt||0)} | Purchase {Number(wallets[d.userId]?.usdt?.purchaseUsdt||0)}</div>
                      </div>
                    </td>
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
        </div>

        <div>
          <div className="text-sm font-semibold mb-2">Withdrawals</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">User</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">Method</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">Details</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">Status</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-white/[0.03]">
                    <td className="px-3 py-2 text-gray-200">{getUserLabel(w.userId)}</td>
                    <td className="px-3 py-2 text-emerald-400">{w.amount}</td>
                    <td className="px-3 py-2 text-gray-300">{w.method || '-'}</td>
                    <td className="px-3 py-2 text-gray-300">
                      <div className="space-y-0.5">
                        <div className="text-xs">Email: {getUserEmail(w.userId) || '-'}</div>
                        <div className="text-xs">UID: <span className="font-mono text-gray-400">{w.userId}</span></div>
                        <div className="text-xs">Currency: {w.currency || 'USDT'}</div>
                        <div className="text-xs">Fees: {typeof w.fees === 'number' ? w.fees : '-'}</div>
                        <div className="text-xs">Txn ID: {w.txnId || '-'}</div>
                        <div className="text-xs">Requested: {formatDate(w.createdAt)}</div>
                        <div className="text-xs">Reviewed By: {w.reviewedBy || '-'}</div>
                        <div className="text-xs">Notes: {w.notes || '-'}</div>
                        <div className="text-xs">Wallet: USDT Main {Number(wallets[w.userId]?.usdt?.mainUsdt||0)} | Purchase {Number(wallets[w.userId]?.usdt?.purchaseUsdt||0)}</div>
                      </div>
                    </td>
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
        </div>
      </div>

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