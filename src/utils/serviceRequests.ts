import { db } from '../firebase.ts';
import { ref, set, get, update } from 'firebase/database';

export interface StepFieldDef {
  name: string;
  label: string;
  type: string;
  required?: boolean;
}
export interface StepDef {
  title: string;
  fields: StepFieldDef[];
}

export interface ServiceRequest {
  id: string;
  serviceName: string;
  userId: string;
  userName: string;
  userEmail: string;
  steps: StepDef[];
  answers: Record<string, any>;
  createdAt: number;
  orderId?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
}

// Admin workflow helpers
export async function updateRequestStatus(
  requestId: string,
  status: 'Pending' | 'Approved' | 'Rejected'
): Promise<void> {
  const reqSnap = await get(ref(db, `serviceRequests/${requestId}`));
  const req = reqSnap.val() as ServiceRequest | null;
  if (!req) return;
  await update(ref(db, `serviceRequests/${requestId}`), { status });
  if (req.userId && req.orderId) {
    await update(ref(db, `users/${req.userId}/orders/${req.orderId}`), { orderStatus: status === 'Approved' ? 'processing' : status === 'Rejected' ? 'cancelled' : 'processing' });
  }
}

export async function updateRequestPrice(
  requestId: string,
  priceInUsd: number,
  priceInInr: number
): Promise<void> {
  const reqSnap = await get(ref(db, `serviceRequests/${requestId}`));
  const req = reqSnap.val() as ServiceRequest | null;
  if (!req) return;
  if (req.userId && req.orderId) {
    await update(ref(db, `users/${req.userId}/orders/${req.orderId}`), {
      priceInUsd: Number(priceInUsd) || 0,
      priceInInr: Number(priceInInr) || 0,
      type: 'Service',
    });
  }
}

export function subscribeServiceRequests(cb: (items: ServiceRequest[]) => void): () => void {
  const r = ref(db, 'serviceRequests');
  const handler = (snap: any) => {
    const val = snap.val() || {};
    const list: ServiceRequest[] = Object.values(val) as ServiceRequest[];
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

export async function submitServiceRequest(input: {
  serviceName: string;
  userId: string;
  userName: string;
  userEmail: string;
  steps: StepDef[];
  answers: Record<string, any>;
}): Promise<string> {
  const id = crypto.randomUUID();
  const req: ServiceRequest = {
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

export async function getAllServiceRequests(): Promise<ServiceRequest[]> {
  const snap = await get(ref(db, 'serviceRequests'));
  const val = snap.val() || {};
  return Object.values(val) as ServiceRequest[];
}