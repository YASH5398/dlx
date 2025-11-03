import { firestore } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

export type ServiceRequestStatus =
  | 'pending'
  | 'reviewed'
  | 'paid'
  | 'processing'
  | 'completed';

export type NotificationType = 'message' | 'notification' | 'link';

export interface ServiceRequestDoc {
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceTitle: string;
  requestDetails: object | string; // Support both object (new) and string (legacy) for backward compatibility
  adminNotes: string;
  price: number;
  status: ServiceRequestStatus;
  notifications: {
    type: NotificationType;
    content: string;
    timestamp: Timestamp;
  }[];
  userWebsiteLink: string;
  userPassword: string; // sensitive; ensure admin-only access in UI
  expectedCompletion: string; // date string
  createdAt: Timestamp;
  orderId?: string;
}

const requestsCol = collection(firestore, 'serviceRequests');

export async function createUserServiceRequest(input: Omit<ServiceRequestDoc, 'createdAt' | 'adminNotes' | 'price' | 'status' | 'notifications' | 'orderId'>) {
  const id = crypto.randomUUID();
  const ref = doc(requestsCol, id);
  const payload: ServiceRequestDoc = {
    ...input,
    adminNotes: '',
    price: 0,
    status: 'pending',
    notifications: [],
    createdAt: serverTimestamp() as unknown as Timestamp,
  };
  await setDoc(ref, payload);
  return id;
}

export async function linkOrderToRequest(reqId: string, orderId: string) {
  await updateDoc(doc(requestsCol, reqId), { orderId });
}

export async function updateAdminNotes(id: string, notes: string) {
  await updateDoc(doc(requestsCol, id), { adminNotes: notes });
}
export async function setPrice(id: string, price: number) {
  await updateDoc(doc(requestsCol, id), { price });
}
export async function updateStatus(id: string, status: ServiceRequestStatus) {
  await updateDoc(doc(requestsCol, id), { status });
}
export async function setExpectedCompletion(id: string, dateString: string) {
  await updateDoc(doc(requestsCol, id), { expectedCompletion: dateString });
}
export async function sendNotification(id: string, type: NotificationType, content: string) {
  const note = { type, content, timestamp: serverTimestamp() as unknown as Timestamp };
  await updateDoc(doc(requestsCol, id), { notifications: arrayUnion(note) });
}

export function subscribePendingRequests(cb: (items: (ServiceRequestDoc & { id: string })[]) => void) {
  const q = query(requestsCol, where('status', '==', 'pending'));
  const unsub = onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as ServiceRequestDoc) }));
    cb(items);
  });
  return unsub;
}

export async function getPendingRequestsOnce(): Promise<(ServiceRequestDoc & { id: string })[]> {
  const q = query(requestsCol, where('status', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ServiceRequestDoc) }));
}