import { db } from '../firebase.ts';
import { ref, push, set, onValue, off, update, get, DataSnapshot, remove } from 'firebase/database';
export async function createTicket(userId, data) {
    const tRef = push(ref(db, 'support/tickets'));
    const ticket = {
        id: tRef.key,
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
export function subscribeUserTickets(userId, cb) {
    const r = ref(db, `users/${userId}/tickets`);
    const handler = (snap) => {
        const val = snap.val() || {};
        const list = Object.keys(val).map((id) => ({ ...val[id], id }));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        cb(list);
    };
    onValue(r, handler);
    return () => off(r, 'value', handler);
}
export async function updateTicketStatus(ticketId, status, userId) {
    const globalRef = ref(db, `support/tickets/${ticketId}`);
    await update(globalRef, { status, updatedAt: Date.now() });
    let uid = userId;
    if (!uid) {
        const snap = await get(globalRef);
        uid = snap.val()?.userId ?? undefined;
    }
    if (uid)
        await update(ref(db, `users/${uid}/tickets/${ticketId}`), { status, updatedAt: Date.now() });
}
export async function createChat(userId) {
    const cRef = push(ref(db, 'support/chats'));
    await set(cRef, { id: cRef.key, userId, status: 'active', createdAt: new Date().toISOString() });
    await set(ref(db, `users/${userId}/chats/${cRef.key}`), { status: 'active', createdAt: Date.now() });
    return cRef.key;
}
export function subscribeMessages(chatId, cb) {
    const r = ref(db, `support/messages/${chatId}`);
    const handler = (snap) => {
        const val = snap.val() || {};
        const list = Object.keys(val).map((id) => ({ id, ...val[id] }));
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        cb(list);
    };
    onValue(r, handler);
    return () => off(r, 'value', handler);
}
export async function sendMessage(chatId, message) {
    const mRef = push(ref(db, `support/messages/${chatId}`));
    await set(mRef, message);
    await update(ref(db, `support/chats/${chatId}`), { lastMessageAt: message.timestamp });
}
export function subscribeAgentAvailability(cb) {
    const r = ref(db, 'support/agents/available');
    const handler = (snap) => cb(!!snap.val());
    onValue(r, handler);
    return () => off(r, 'value', handler);
}
export async function saveCommonQA(question, answer) {
    const qaRef = push(ref(db, 'support/ai/qa'));
    await set(qaRef, { question, answer, createdAt: new Date().toISOString() });
}
export async function logAiConversation(userId, question, answer, suggestTicket) {
    const convRef = push(ref(db, `support/ai/conversations/${userId}`));
    await set(convRef, { question, answer, suggestTicket, createdAt: new Date().toISOString() });
}
export function subscribeAllTickets(cb) {
    const r = ref(db, 'support/tickets');
    const handler = (snap) => {
        const val = snap.val() || {};
        const list = Object.keys(val).map((id) => ({ id, ...val[id] }));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        cb(list);
    };
    onValue(r, handler);
    return () => off(r, 'value', handler);
}
export async function sendTicketMessage(ticketId, message, adminId) {
    const uRef = push(ref(db, `support/tickets/${ticketId}/updates`));
    await set(uRef, { date: new Date().toISOString(), message, adminId: adminId || 'admin' });
}
export async function deleteTicket(ticketId) {
    await remove(ref(db, `support/tickets/${ticketId}`));
    await remove(ref(db, `support/messages/${ticketId}`));
}
