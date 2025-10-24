import { db } from '../firebase.ts';
import { ref, set } from 'firebase/database';
export async function notifyAdminNewServiceRequest(payload) {
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
export async function notifyAdminPayment(payload) {
    const nid = payload.id;
    await set(ref(db, `notifications/admin/${nid}`), {
        id: nid,
        type: payload.method === 'REQUEST' ? 'order_request' : 'payment',
        title: payload.method === 'REQUEST' ? `New order request: ${payload.orderId}` : `Payment for order ${payload.orderId}`,
        message: payload.method === 'REQUEST'
            ? `User ${payload.userId} submitted an additional request for order ${payload.orderId}`
            : `User ${payload.userId} paid ${payload.amountUsd} USD via ${payload.method}`,
        createdAt: Date.now(),
        userId: payload.userId,
        orderId: payload.orderId,
    });
}
