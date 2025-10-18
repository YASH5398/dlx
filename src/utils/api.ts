import { db } from '../firebase';
import { ref, set, get, remove } from 'firebase/database';

export type Order = { id: string; title: string; priceInUsd: number; priceInInr: number; status: 'paid' | 'pending' };

export async function getOrders(userId?: string): Promise<Order[]> {
  if (!userId) return [];
  const snap = await get(ref(db, `users/${userId}/orders`));
  const val = snap.val() || {};
  return Object.keys(val).map((id) => ({ id, ...val[id] }));
}

export async function addOrder(
  o: { title: string; priceInUsd: number; priceInInr: number; status: 'paid' | 'pending' },
  userId?: string,
): Promise<void> {
  if (!userId) return;
  const id = crypto.randomUUID();
  await set(ref(db, `users/${userId}/orders/${id}`), { ...o, id });
}

export async function clearOrders(userId?: string): Promise<void> {
  if (!userId) return;
  await remove(ref(db, `users/${userId}/orders`));
}