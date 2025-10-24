import { db } from '../firebase.ts';
import { ref, update } from 'firebase/database';
export async function logActivity(uid, type, meta) {
    if (!uid)
        return;
    const ts = Date.now();
    await update(ref(db, `activities/${uid}/${ts}`), { type, meta });
}
