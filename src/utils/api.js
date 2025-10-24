import { db } from '../firebase.ts';
import { ref, set, get, remove } from 'firebase/database';
export async function getOrders(userId) {
    if (!userId)
        return [];
    const snap = await get(ref(db, `users/${userId}/orders`));
    const val = snap.val() || {};
    return Object.keys(val).map((id) => ({ id, ...val[id] }));
}
export async function addOrder(o, userId) {
    if (!userId)
        return;
    const id = crypto.randomUUID();
    await set(ref(db, `users/${userId}/orders/${id}`), { ...o, id });
}
export async function clearOrders(userId) {
    if (!userId)
        return;
    await remove(ref(db, `users/${userId}/orders`));
}
