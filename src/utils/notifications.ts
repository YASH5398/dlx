import { db } from '../firebase';
import { ref, set } from 'firebase/database';

export async function notifyAdminNewServiceRequest(payload: { id: string; serviceName: string; userId: string; userName: string }) {
  const nid = payload.id;
  await set(ref(db, `notifications/admin/${nid}`), {
    id: nid,
    type: 'service_request',
    title: `New request: ${payload.serviceName}`,
    message: `${payload.userName} submitted a ${payload.serviceName} request`,
    createdAt: Date.now(),
    userId: payload.userId,
  });
}