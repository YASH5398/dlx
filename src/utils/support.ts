import { db } from '../firebase';
import { ref, push, set, onValue, off, update, get, DataSnapshot } from 'firebase/database';

export type TicketStatus = 'Open' | 'Pending' | 'Resolved';
export type TicketCategory = 'Technical' | 'Payment' | 'Other';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export type Ticket = {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updates?: { date: string; message: string; adminId?: string }[];
};

export type ChatMessage = {
  id: string;
  chatId: string;
  senderType: 'USER' | 'AGENT' | 'AI';
  content: string;
  timestamp: string; // ISO
};

export async function createTicket(userId: string, data: Omit<Ticket, 'id' | 'userId' | 'status' | 'createdAt'>) {
  const tRef = push(ref(db, 'support/tickets'));
  const ticket: Ticket = {
    id: tRef.key!,
    userId,
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
    status: 'Open',
    createdAt: new Date().toISOString(),
    updates: [],
  };
  await set(tRef, ticket);
  await set(ref(db, `users/${userId}/tickets/${ticket.id}`), ticket);
  return ticket;
}

export function subscribeUserTickets(userId: string, cb: (tickets: Ticket[]) => void) {
  const r = ref(db, `users/${userId}/tickets`);
  const handler = (snap: DataSnapshot) => {
    const val = snap.val() || {};
    const list: Ticket[] = Object.keys(val).map((id) => ({ ...(val[id] as any), id }));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    cb(list);
  };
  onValue(r, handler);
  return () => off(r, 'value', handler);
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus, userId?: string) {
  const globalRef = ref(db, `support/tickets/${ticketId}`);
  await update(globalRef, { status, updatedAt: Date.now() });
  let uid = userId;
  if (!uid) {
    const snap = await get(globalRef);
    uid = (snap.val()?.userId as string | undefined) ?? undefined;
  }
  if (uid) await update(ref(db, `users/${uid}/tickets/${ticketId}`), { status, updatedAt: Date.now() });
}

export async function createChat(userId: string): Promise<string> {
  const cRef = push(ref(db, 'support/chats'));
  await set(cRef, { id: cRef.key, userId, status: 'active', createdAt: new Date().toISOString() });
  await set(ref(db, `users/${userId}/chats/${cRef.key}`), { status: 'active', createdAt: Date.now() });
  return cRef.key!;
}

export function subscribeMessages(chatId: string, cb: (messages: ChatMessage[]) => void) {
  const r = ref(db, `support/messages/${chatId}`);
  const handler = (snap: DataSnapshot) => {
    const val = snap.val() || {};
    const list: ChatMessage[] = Object.keys(val).map((id) => ({ id, ...(val[id] as any) }));
    list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    cb(list);
  };
  onValue(r, handler);
  return () => off(r, 'value', handler);
}

export async function sendMessage(chatId: string, message: ChatMessage) {
  const mRef = push(ref(db, `support/messages/${chatId}`));
  await set(mRef, message);
  await update(ref(db, `support/chats/${chatId}`), { lastMessageAt: message.timestamp });
}

export function subscribeAgentAvailability(cb: (available: boolean) => void) {
  const r = ref(db, 'support/agents/available');
  const handler = (snap: DataSnapshot) => cb(!!snap.val());
  onValue(r, handler);
  return () => off(r, 'value', handler);
}

export async function saveCommonQA(question: string, answer: string) {
  const qaRef = push(ref(db, 'support/ai/qa'));
  await set(qaRef, { question, answer, createdAt: new Date().toISOString() });
}

export async function logAiConversation(userId: string, question: string, answer: string, suggestTicket: boolean) {
  const convRef = push(ref(db, `support/ai/conversations/${userId}`));
  await set(convRef, { question, answer, suggestTicket, createdAt: new Date().toISOString() });
}