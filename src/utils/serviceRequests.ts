import { db } from '../firebase';
import { ref, set, get } from 'firebase/database';

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