import { db } from '../firebase.ts';
import { ref, set, get, update } from 'firebase/database';
// Admin workflow helpers
export async function updateRequestStatus(requestId, status) {
    const reqSnap = await get(ref(db, `serviceRequests/${requestId}`));
    const req = reqSnap.val();
    if (!req)
        return;
    await update(ref(db, `serviceRequests/${requestId}`), { status });
    if (req.userId && req.orderId) {
        await update(ref(db, `users/${req.userId}/orders/${req.orderId}`), { orderStatus: status === 'Approved' ? 'processing' : status === 'Rejected' ? 'cancelled' : 'processing' });
    }
}
export async function updateRequestPrice(requestId, priceInUsd, priceInInr) {
    const reqSnap = await get(ref(db, `serviceRequests/${requestId}`));
    const req = reqSnap.val();
    if (!req)
        return;
    if (req.userId && req.orderId) {
        await update(ref(db, `users/${req.userId}/orders/${req.orderId}`), {
            priceInUsd: Number(priceInUsd) || 0,
            priceInInr: Number(priceInInr) || 0,
            type: 'Service',
        });
    }
}
export function subscribeServiceRequests(cb) {
    const r = ref(db, 'serviceRequests');
    const handler = (snap) => {
        const val = snap.val() || {};
        const list = Object.values(val);
        cb(list);
    };
    // @ts-ignore
    import('firebase/database').then(({ onValue, off }) => {
        onValue(r, handler);
        // Return unsubscribe
    });
    return () => {
        // Best-effort detach
    };
}
export async function submitServiceRequest(input) {
    const id = crypto.randomUUID();
    const req = {
        id,
        serviceName: input.serviceName,
        userId: input.userId,
        userName: input.userName,
        userEmail: input.userEmail,
        steps: input.steps,
        answers: input.answers,
        createdAt: Date.now(),
        status: 'Pending',
    };
    // Create linked order with default pending status
    const orderId = crypto.randomUUID();
    req.orderId = orderId;
    const order = {
        id: orderId,
        title: `Service: ${input.serviceName}`,
        priceInUsd: 0,
        priceInInr: 0,
        status: 'pending',
        orderStatus: 'processing',
        type: 'Service',
        purchaseDate: new Date().toISOString(),
        transactionId: id,
    };
    await set(ref(db, `serviceRequests/${id}`), req);
    await set(ref(db, `users/${input.userId}/serviceRequests/${id}`), req);
    await set(ref(db, `users/${input.userId}/orders/${orderId}`), order);
    return id;
}
export async function getAllServiceRequests() {
    const snap = await get(ref(db, 'serviceRequests'));
    const val = snap.val() || {};
    return Object.values(val);
}
