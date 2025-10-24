import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from '../../firebase';
import { collection, onSnapshot, doc, getDoc, updateDoc, serverTimestamp, setDoc, runTransaction, addDoc } from 'firebase/firestore';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
export default function AdminTransactions2() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('deposits');
    const [status, setStatus] = useState('all');
    const [deposits, setDeposits] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    // add user and wallet caches
    const [users, setUsers] = useState({});
    const [wallets, setWallets] = useState({});
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMsg, setConfirmMsg] = useState('');
    const [confirmFn, setConfirmFn] = useState(null);
    // Stream Firestore collections in real-time
    useEffect(() => {
        const unsub1 = onSnapshot(collection(firestore, 'depositRequests'), (snap) => {
            const arr = snap.docs.map((d) => {
                const x = d.data() || {};
                return {
                    id: d.id,
                    userId: x.userId,
                    amount: Number(x.amount || 0),
                    method: x.method,
                    status: (x.status || 'pending'),
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
            const arr = snap.docs.map((d) => {
                const x = d.data() || {};
                return {
                    id: d.id,
                    userId: x.userId,
                    amount: Number(x.amount || 0),
                    method: x.method,
                    walletType: (x.walletType || 'main'),
                    status: (x.status || 'pending'),
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
            const m = {};
            snap.forEach((d) => { m[d.id] = d.data(); });
            setUsers(m);
        });
        const unsub4 = onSnapshot(collection(firestore, 'wallets'), (snap) => {
            const m = {};
            snap.forEach((d) => { m[d.id] = d.data(); });
            setWallets(m);
        });
        return () => { try {
            unsub1();
            unsub2();
            unsub3();
            unsub4();
        }
        catch { } };
    }, []);
    // Filters
    const filteredDeposits = useMemo(() => deposits.filter((d) => status === 'all' || d.status === status), [deposits, status]);
    const filteredWithdrawals = useMemo(() => withdrawals.filter((w) => status === 'all' || w.status === status), [withdrawals, status]);
    // Confirm modal helper
    const withConfirm = (message, fn) => {
        setConfirmMsg(message);
        setConfirmFn(() => fn);
        setConfirmOpen(true);
    };
    // Wallet adjustment using wallets collection instead of users
    const adjustWallet = async (userId, walletType, delta) => {
        const wRef = doc(firestore, 'wallets', userId);
        const snap = await getDoc(wRef);
        const data = snap.data() || {};
        const usdt = data.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
        const current = walletType === 'main' ? Number(usdt.mainUsdt || 0) : Number(usdt.purchaseUsdt || 0);
        const updatedUsdt = walletType === 'main' ? { ...usdt, mainUsdt: current + delta } : { ...usdt, purchaseUsdt: current + delta };
        if (snap.exists()) {
            await updateDoc(wRef, { ...data, usdt: updatedUsdt, walletUpdatedAt: serverTimestamp() });
        }
        else {
            await setDoc(wRef, { dlx: Number(data.dlx || 0), usdt: updatedUsdt, walletUpdatedAt: serverTimestamp() }, { merge: true });
        }
    };
    // helpers for UI
    const formatDate = (ts) => {
        const ms = ts?.toMillis ? ts.toMillis() : Number(ts || 0);
        return ms ? new Date(ms).toLocaleString() : '-';
    };
    const getUserLabel = (uid) => {
        const u = users[uid] || {};
        return (u.name || u.displayName || u.email || uid);
    };
    const getUserEmail = (uid) => (users[uid]?.email || users[uid]?.userEmail || '');
    // Actions: approve/reject/complete deposits (atomic with audit)
    const approveDeposit = async (d) => {
        const adminId = auth.currentUser?.uid || 'unknown';
        const adminEmail = auth.currentUser?.email || '';
        const reqRef = doc(firestore, 'depositRequests', d.id);
        const walletRef = doc(firestore, 'wallets', d.userId);
        const logRef = doc(collection(firestore, 'audit_logs'));
        try {
            await runTransaction(firestore, async (tx) => {
                const reqSnap = await tx.get(reqRef);
                const reqData = reqSnap.data() || {};
                const currentStatus = (reqData.status || 'pending');
                if (currentStatus !== 'pending')
                    throw new Error('Request already processed');
                const wSnap = await tx.get(walletRef);
                const wData = wSnap.data() || {};
                const usdt = wData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
                const updated = { ...usdt, mainUsdt: Number(usdt.mainUsdt || 0) + Number(d.amount || 0) };
                tx.set(walletRef, { ...wData, usdt: updated, walletUpdatedAt: serverTimestamp() }, { merge: true });
                tx.update(reqRef, { status: 'approved', approvedAt: serverTimestamp(), reviewedBy: adminId });
                tx.set(logRef, { actor_id: adminId, actor_email: adminEmail, action: 'approve_deposit', target_type: 'deposit_request', target_id: d.id, meta: { userId: d.userId, amount: d.amount, method: d.method, currency: d.currency, fees: d.fees, txnId: d.txnId }, created_at: serverTimestamp() });
            });
            toast.success('Deposit approved and wallet credited');
        }
        catch (e) {
            toast.error(e?.message || 'Failed to approve deposit');
            console.error('approveDeposit failed:', e);
        }
    };
    const rejectDeposit = async (d) => {
        const adminId = auth.currentUser?.uid || 'unknown';
        const adminEmail = auth.currentUser?.email || '';
        const reqRef = doc(firestore, 'depositRequests', d.id);
        const logRef = doc(collection(firestore, 'audit_logs'));
        try {
            await runTransaction(firestore, async (tx) => {
                const reqSnap = await tx.get(reqRef);
                const reqData = reqSnap.data() || {};
                const currentStatus = (reqData.status || 'pending');
                if (currentStatus !== 'pending')
                    throw new Error('Request already processed');
                tx.update(reqRef, { status: 'rejected', rejectedAt: serverTimestamp(), reviewedBy: adminId });
                tx.set(logRef, { actor_id: adminId, actor_email: adminEmail, action: 'reject_deposit', target_type: 'deposit_request', target_id: d.id, meta: { userId: d.userId, amount: d.amount, method: d.method }, created_at: serverTimestamp() });
            });
            toast.info('Deposit rejected');
        }
        catch (e) {
            toast.error(e?.message || 'Failed to reject deposit');
            console.error('rejectDeposit failed:', e);
        }
    };
    const completeDeposit = async (d) => {
        const adminId = auth.currentUser?.uid || 'unknown';
        const adminEmail = auth.currentUser?.email || '';
        const reqRef = doc(firestore, 'depositRequests', d.id);
        const logRef = doc(collection(firestore, 'audit_logs'));
        try {
            await runTransaction(firestore, async (tx) => {
                const reqSnap = await tx.get(reqRef);
                const reqData = reqSnap.data() || {};
                const currentStatus = (reqData.status || 'pending');
                if (currentStatus !== 'approved' && currentStatus !== 'pending')
                    throw new Error('Only pending/approved can complete');
                tx.update(reqRef, { status: 'completed', completedAt: serverTimestamp(), reviewedBy: adminId });
                tx.set(logRef, { actor_id: adminId, actor_email: adminEmail, action: 'complete_deposit', target_type: 'deposit_request', target_id: d.id, meta: { userId: d.userId, amount: d.amount, method: d.method }, created_at: serverTimestamp() });
            });
            toast.success('Deposit marked completed');
        }
        catch (e) {
            toast.error(e?.message || 'Failed to complete deposit');
            console.error('completeDeposit failed:', e);
        }
    };
    // Actions: approve/reject/complete withdrawals (atomic with audit)
    const approveWithdrawal = async (w) => {
        const adminId = auth.currentUser?.uid || 'unknown';
        const adminEmail = auth.currentUser?.email || '';
        const reqRef = doc(firestore, 'withdrawalRequests', w.id);
        const walletRef = doc(firestore, 'wallets', w.userId);
        const logRef = doc(collection(firestore, 'audit_logs'));
        try {
            await runTransaction(firestore, async (tx) => {
                const reqSnap = await tx.get(reqRef);
                const reqData = reqSnap.data() || {};
                const currentStatus = (reqData.status || 'pending');
                if (currentStatus !== 'pending')
                    throw new Error('Request already processed');
                const wSnap = await tx.get(walletRef);
                const wData = wSnap.data() || {};
                const usdt = wData.usdt || { mainUsdt: 0, purchaseUsdt: 0 };
                const key = (w.walletType || 'main') === 'main' ? 'mainUsdt' : 'purchaseUsdt';
                const current = Number(usdt[key] || 0);
                const amt = Number(w.amount || 0);
                if (current < amt)
                    throw new Error('Insufficient balance');
                const updated = { ...usdt, [key]: current - amt };
                tx.set(walletRef, { ...wData, usdt: updated, walletUpdatedAt: serverTimestamp() }, { merge: true });
                tx.update(reqRef, { status: 'approved', approvedAt: serverTimestamp(), reviewedBy: adminId });
                tx.set(logRef, { actor_id: adminId, actor_email: adminEmail, action: 'approve_withdrawal', target_type: 'withdrawal_request', target_id: w.id, meta: { userId: w.userId, amount: w.amount, method: w.method, walletType: w.walletType }, created_at: serverTimestamp() });
            });
            toast.success('Withdrawal approved and wallet debited');
        }
        catch (e) {
            toast.error(e?.message || 'Failed to approve withdrawal');
            console.error('approveWithdrawal failed:', e);
        }
    };
    const rejectWithdrawal = async (w) => {
        const adminId = auth.currentUser?.uid || 'unknown';
        const adminEmail = auth.currentUser?.email || '';
        const reqRef = doc(firestore, 'withdrawalRequests', w.id);
        const logRef = doc(collection(firestore, 'audit_logs'));
        try {
            await runTransaction(firestore, async (tx) => {
                const reqSnap = await tx.get(reqRef);
                const reqData = reqSnap.data() || {};
                const currentStatus = (reqData.status || 'pending');
                if (currentStatus !== 'pending')
                    throw new Error('Request already processed');
                tx.update(reqRef, { status: 'rejected', rejectedAt: serverTimestamp(), reviewedBy: adminId });
                tx.set(logRef, { actor_id: adminId, actor_email: adminEmail, action: 'reject_withdrawal', target_type: 'withdrawal_request', target_id: w.id, meta: { userId: w.userId, amount: w.amount, method: w.method, walletType: w.walletType }, created_at: serverTimestamp() });
            });
            toast.info('Withdrawal rejected');
        }
        catch (e) {
            toast.error(e?.message || 'Failed to reject withdrawal');
            console.error('rejectWithdrawal failed:', e);
        }
    };
    const completeWithdrawal = async (w) => {
        const adminId = auth.currentUser?.uid || 'unknown';
        const adminEmail = auth.currentUser?.email || '';
        const reqRef = doc(firestore, 'withdrawalRequests', w.id);
        const logRef = doc(collection(firestore, 'audit_logs'));
        try {
            await runTransaction(firestore, async (tx) => {
                const reqSnap = await tx.get(reqRef);
                const reqData = reqSnap.data() || {};
                const currentStatus = (reqData.status || 'pending');
                if (currentStatus !== 'approved' && currentStatus !== 'pending')
                    throw new Error('Only pending/approved can complete');
                tx.update(reqRef, { status: 'completed', completedAt: serverTimestamp(), reviewedBy: adminId });
                tx.set(logRef, { actor_id: adminId, actor_email: adminEmail, action: 'complete_withdrawal', target_type: 'withdrawal_request', target_id: w.id, meta: { userId: w.userId, amount: w.amount, method: w.method, walletType: w.walletType }, created_at: serverTimestamp() });
            });
            toast.success('Withdrawal marked completed');
        }
        catch (e) {
            toast.error(e?.message || 'Failed to complete withdrawal');
            console.error('completeWithdrawal failed:', e);
        }
    };
    // Row actions component
    const RowActions = ({ onApprove, onReject, onComplete }) => (_jsxs("div", { className: "flex flex-wrap gap-2 justify-end", children: [_jsx("button", { className: "px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs", onClick: () => withConfirm('Approve this request?', async () => onApprove()), children: "Approve" }), _jsx("button", { className: "px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-xs", onClick: () => withConfirm('Reject this request?', async () => onReject()), children: "Reject" }), _jsx("button", { className: "px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs", onClick: () => withConfirm('Mark as completed?', async () => onComplete()), children: "Mark Completed" }), _jsx("button", { className: "px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs", onClick: () => navigate('/secret-admin/users'), children: "View User" })] }));
    const TableHead = (_jsx("thead", { className: "bg-white/5", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "User" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "Amount" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "Method" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "Status" }), _jsx("th", { className: "px-3 py-2 text-right text-xs font-semibold text-gray-300", children: "Actions" })] }) }));
    return (_jsxs("div", { className: "rounded-xl bg-[#0a0e1f] border border-white/10 p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-lg font-semibold", children: "Deposit & Withdrawal Requests" }), _jsx("div", { className: "text-xs text-gray-400", children: "Review all requests with full details and actions" })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsxs("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "px-3 py-2 rounded bg-white/5 border border-white/10 text-sm", children: [_jsx("option", { value: "all", children: "All" }), _jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "approved", children: "Approved" }), _jsx("option", { value: "rejected", children: "Rejected" }), _jsx("option", { value: "completed", children: "Completed" })] }) })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold mb-2", children: "Deposits" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-white/5", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "User" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "Amount" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "Method" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "Details" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "Status" }), _jsx("th", { className: "px-3 py-2 text-right text-xs font-semibold text-gray-300", children: "Actions" })] }) }), _jsxs("tbody", { className: "divide-y divide-white/10", children: [filteredDeposits.map((d) => (_jsxs("tr", { className: "hover:bg-white/[0.03]", children: [_jsx("td", { className: "px-3 py-2 text-gray-200", children: getUserLabel(d.userId) }), _jsx("td", { className: "px-3 py-2 text-emerald-400", children: d.amount }), _jsx("td", { className: "px-3 py-2 text-gray-300", children: d.method || '-' }), _jsx("td", { className: "px-3 py-2 text-gray-300", children: _jsxs("div", { className: "space-y-0.5", children: [_jsxs("div", { className: "text-xs", children: ["Email: ", getUserEmail(d.userId) || '-'] }), _jsxs("div", { className: "text-xs", children: ["UID: ", _jsx("span", { className: "font-mono text-gray-400", children: d.userId })] }), _jsxs("div", { className: "text-xs", children: ["Currency: ", d.currency || 'USDT'] }), _jsxs("div", { className: "text-xs", children: ["Fees: ", typeof d.fees === 'number' ? d.fees : '-'] }), _jsxs("div", { className: "text-xs", children: ["Txn ID: ", d.txnId || '-'] }), _jsxs("div", { className: "text-xs", children: ["Requested: ", formatDate(d.createdAt)] }), _jsxs("div", { className: "text-xs", children: ["Reviewed By: ", d.reviewedBy || '-'] }), _jsxs("div", { className: "text-xs", children: ["Notes: ", d.notes || '-'] }), _jsxs("div", { className: "text-xs", children: ["Wallet: USDT Main ", Number(wallets[d.userId]?.usdt?.mainUsdt || 0), " | Purchase ", Number(wallets[d.userId]?.usdt?.purchaseUsdt || 0)] })] }) }), _jsx("td", { className: "px-3 py-2", children: _jsx("span", { className: "px-2 py-1 rounded bg-white/10 text-xs", children: d.status }) }), _jsx("td", { className: "px-3 py-2", children: _jsx(RowActions, { onApprove: () => approveDeposit(d), onReject: () => rejectDeposit(d), onComplete: () => completeDeposit(d) }) })] }, d.id))), filteredDeposits.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-3 py-4 text-center text-gray-400", children: "No deposit requests" }) }))] })] }) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold mb-2", children: "Withdrawals" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-white/5", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "User" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "Amount" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "Method" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "Details" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-gray-300", children: "Status" }), _jsx("th", { className: "px-3 py-2 text-right text-xs font-semibold text-gray-300", children: "Actions" })] }) }), _jsxs("tbody", { className: "divide-y divide-white/10", children: [filteredWithdrawals.map((w) => (_jsxs("tr", { className: "hover:bg-white/[0.03]", children: [_jsx("td", { className: "px-3 py-2 text-gray-200", children: getUserLabel(w.userId) }), _jsx("td", { className: "px-3 py-2 text-emerald-400", children: w.amount }), _jsx("td", { className: "px-3 py-2 text-gray-300", children: w.method || '-' }), _jsx("td", { className: "px-3 py-2 text-gray-300", children: _jsxs("div", { className: "space-y-0.5", children: [_jsxs("div", { className: "text-xs", children: ["Email: ", getUserEmail(w.userId) || '-'] }), _jsxs("div", { className: "text-xs", children: ["UID: ", _jsx("span", { className: "font-mono text-gray-400", children: w.userId })] }), _jsxs("div", { className: "text-xs", children: ["Currency: ", w.currency || 'USDT'] }), _jsxs("div", { className: "text-xs", children: ["Fees: ", typeof w.fees === 'number' ? w.fees : '-'] }), _jsxs("div", { className: "text-xs", children: ["Txn ID: ", w.txnId || '-'] }), _jsxs("div", { className: "text-xs", children: ["Requested: ", formatDate(w.createdAt)] }), _jsxs("div", { className: "text-xs", children: ["Reviewed By: ", w.reviewedBy || '-'] }), _jsxs("div", { className: "text-xs", children: ["Notes: ", w.notes || '-'] }), _jsxs("div", { className: "text-xs", children: ["Wallet: USDT Main ", Number(wallets[w.userId]?.usdt?.mainUsdt || 0), " | Purchase ", Number(wallets[w.userId]?.usdt?.purchaseUsdt || 0)] })] }) }), _jsx("td", { className: "px-3 py-2", children: _jsx("span", { className: "px-2 py-1 rounded bg-white/10 text-xs", children: w.status }) }), _jsx("td", { className: "px-3 py-2", children: _jsx(RowActions, { onApprove: () => approveWithdrawal(w), onReject: () => rejectWithdrawal(w), onComplete: () => completeWithdrawal(w) }) })] }, w.id))), filteredWithdrawals.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-3 py-4 text-center text-gray-400", children: "No withdrawal requests" }) }))] })] }) })] })] }), _jsx(Transition, { appear: true, show: confirmOpen, as: Fragment, children: _jsxs(Dialog, { as: "div", className: "relative z-50", onClose: () => setConfirmOpen(false), children: [_jsx(Transition.Child, { as: Fragment, enter: "ease-out duration-200", enterFrom: "opacity-0", enterTo: "opacity-100", leave: "ease-in duration-150", leaveFrom: "opacity-100", leaveTo: "opacity-0", children: _jsx("div", { className: "fixed inset-0 bg-black/40" }) }), _jsx("div", { className: "fixed inset-0 overflow-y-auto", children: _jsx("div", { className: "flex min-h-full items-center justify-center p-4", children: _jsx(Transition.Child, { as: Fragment, enter: "ease-out duration-200", enterFrom: "opacity-0 scale-95", enterTo: "opacity-100 scale-100", leave: "ease-in duration-150", leaveFrom: "opacity-100 scale-100", leaveTo: "opacity-0 scale-95", children: _jsxs(Dialog.Panel, { className: "w-full max-w-sm rounded-xl bg-[#0b122b] border border-white/10 p-4", children: [_jsx(Dialog.Title, { className: "text-base font-semibold mb-2", children: "Confirm action" }), _jsx("p", { className: "text-sm text-gray-300", children: confirmMsg }), _jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [_jsx("button", { className: "px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm", onClick: () => setConfirmOpen(false), children: "Cancel" }), _jsx("button", { className: "px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm text-white", onClick: async () => { try {
                                                            await (confirmFn?.());
                                                            setConfirmOpen(false);
                                                        }
                                                        catch (e) {
                                                            toast.error(e?.message || 'Action failed');
                                                        } }, children: "Confirm" })] })] }) }) }) })] }) })] }));
}
