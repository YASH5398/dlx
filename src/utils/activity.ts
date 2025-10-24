import { db } from '../firebase.ts';
import { ref, update } from 'firebase/database';

export async function logActivity(uid: string, type: string, meta?: Record<string, any>) {
  if (!uid) return;
  const ts = Date.now();
  await update(ref(db, `activities/${uid}/${ts}`), { type, meta });
}