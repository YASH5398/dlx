import { firestore } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface CreateOrderInput {
  userId: string;
  userEmail?: string;
  serviceTitle: string;
  requestId: string;
  priceInUsd?: number;
  priceInInr?: number;
}

const ordersCol = collection(firestore, 'orders');

export async function createPendingOrderFromRequest(input: CreateOrderInput) {
  const orderId = crypto.randomUUID();
  const ref = doc(ordersCol, orderId);
  const payload: any = {
    userId: input.userId,
    userEmail: input.userEmail || '',
    productTitle: `Service: ${input.serviceTitle}`,
    title: `Service: ${input.serviceTitle}`,
    type: 'Service',
    amountUsd: Number(input.priceInUsd || 0),
    amountInr: Number(input.priceInInr || 0),
    priceInUsd: Number(input.priceInUsd || 0),
    priceInInr: Number(input.priceInInr || 0),
    status: 'Pending', // payment status
    orderStatus: 'processing', // order flow status
    paymentMode: null,
    transactionId: input.requestId, // initial link; will be overwritten by UPI UTR if provided
    timestamp: serverTimestamp(),
    createdAt: serverTimestamp(),
    serviceRequestId: input.requestId,
    features: [],
    steps: [],
    updates: [],
    release: {},
    chatId: null,
  };
  await setDoc(ref, payload);
  return orderId;
}