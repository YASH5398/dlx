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
  };
  await set(ref(db, `serviceRequests/${id}`), req);
  await set(ref(db, `users/${input.userId}/serviceRequests/${id}`), req);
  return id;
}

export async function getAllServiceRequests(): Promise<ServiceRequest[]> {
  const snap = await get(ref(db, 'serviceRequests'));
  const val = snap.val() || {};
  return Object.values(val) as ServiceRequest[];
}