import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import AdminUser from '../models/AdminUser.js';
import AdminInvite from '../models/AdminInvite.js';
import AuditLog from '../models/AuditLog.js';
import ensureAdmin from '../middleware/ensureAdmin.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import argon2 from 'argon2';
import Ticket from '../models/Ticket.js';
import { auth, firestore, rtdb } from '../firebaseAdmin.js';

const router = express.Router();

// Middleware: cookies + basic rate limiting for auth endpoints
router.use(cookieParser());
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

// Helpers
async function log(actorId, action, meta = {}, targetType = undefined, targetId = undefined) {
  try { await AuditLog.create({ actor_id: actorId, action, meta, target_type: targetType, target_id: targetId }); } catch {}
}

function issueAdminCookie(res, admin) {
  // This function is no longer needed with Firebase Auth
  // Session management is handled by Firebase Auth tokens
}

// --- Auth ---
router.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: 'Missing ID token' });

    const decodedToken = await auth.verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    let admin = await AdminUser.findById(firebaseUid);

    if (!admin) {
      // If admin user doesn't exist in Firestore, create one based on Firebase Auth user
      admin = await AdminUser.create({ id: firebaseUid, email: decodedToken.email, name: decodedToken.name || '', is_active: true });
    }

    // Optionally, you might want to check if the user is active or has admin privileges in your Firestore AdminUser model
    if (!admin.is_active) return res.status(401).json({ error: 'Admin account is not active' });

    admin.last_login_at = new Date();
    await admin.save();

    // Return the ID token to the client. The client will store it and send it in subsequent requests.
    await log(admin.id, 'admin_login', { email: admin.email });
    return res.json({ ok: true, admin: { id: admin.id, email: admin.email, name: admin.name }, idToken });
  } catch (e) {
    console.error('Firebase Auth login failed:', e);
    return res.status(401).json({ error: 'Authentication failed' });
  }
});

router.post('/auth/logout', authLimiter, async (req, res) => {
  try {
    // Client-side handles Firebase logout. No server-side session to clear.
    const id = req.admin?.id;
    if (id) await log(id, 'admin_logout');
    return res.json({ ok: true });
  } catch {
    return res.json({ ok: true });
  }
});

router.get('/session', async (req, res) => {
  try {
    // The ensureAdmin middleware already populates req.admin if a valid token is present.
    if (req.admin) {
      return res.json({ ok: true, admin: { id: req.admin.id, email: req.admin.email, name: req.admin.name } });
    } else {
      return res.status(401).json({ error: 'No session' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }
});

// --- Invite system ---
router.post('/invite/generate', ensureAdmin, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required' });
    const token = uuidv4();
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const inv = await AdminInvite.create({ email: email.toLowerCase(), token, expires_at, created_by: req.admin.id });
    await log(req.admin.id, 'invite_created', { email }, 'AdminInvite', inv.id);
    const link = `${process.env.PUBLIC_URL || 'http://localhost:5173'}/secret-admin/invite/${token}`;
    return res.json({ ok: true, token, expires_at, link });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to generate invite' });
  }
});

router.post('/invite/accept', async (req, res) => {
  try {
    const { token, name, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Missing fields' });
    const inv = await AdminInvite.findByToken(token);
    if (!inv || inv.used) return res.status(400).json({ error: 'Invalid invite' });
    if (new Date(inv.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Invite expired' });
    const exists = await AdminUser.findByEmail(inv.email);
    if (exists) return res.status(400).json({ error: 'Admin already exists' });
    const hash = await argon2.hash(password);
    const admin = await AdminUser.create({ email: inv.email, name: name || '', password_hash: hash });
    inv.used = true;
    inv.used_at = new Date();
    await inv.save();
    await log(admin.id, 'invite_accepted', { email: admin.email }, 'AdminUser', admin.id);
    issueAdminCookie(res, admin);
    return res.json({ ok: true, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// --- Promote existing user to admin ---
router.post('/promote', ensureAdmin, async (req, res) => {
  try {
    const { email, confirm } = req.body || {};
    if (!email || confirm !== true) return res.status(400).json({ error: 'Confirmation required' });
    const exists = await AdminUser.findByEmail(email.toLowerCase());
    if (exists) return res.status(400).json({ error: 'Already an admin' });
    // In a real app, we'd lookup the user record in primary users DB and set a random password + force reset.
    const randomPass = uuidv4();
    const hash = await argon2.hash(randomPass);
    const admin = await AdminUser.create({ email: email.toLowerCase(), password_hash: hash, promoted_from_user_id: 'external' });
    await log(req.admin.id, 'admin_promoted', { email }, 'AdminUser', admin.id);
    return res.json({ ok: true, admin: { id: admin.id, email: admin.email }, tempPassword: randomPass });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to promote user' });
  }
});

// --- Protected admin data endpoints ---
router.get('/stats', ensureAdmin, async (req, res) => {
  try {
    // Get users count from Firestore
    const usersSnapshot = await firestore.collection('users').get();
    const users = usersSnapshot.size;

    // Get tickets count from Firestore
    const ticketsSnapshot = await firestore.collection('tickets').get();
    const tickets = ticketsSnapshot.size;

    // Get orders and revenue from RTDB
    const usersSnap = await rtdb.ref('users').get();
    const usersVal = usersSnap.val() || {};
    const userIds = Object.keys(usersVal);
    
    let orders = 0;
    let revenue = 0;
    for (const uid of userIds) {
      const userOrders = usersVal[uid]?.orders || {};
      const orderValues = Object.values(userOrders);
      orders += orderValues.length;
      for (const order of orderValues) {
        if (order.status === 'paid' && order.priceInUsd) {
          revenue += Number(order.priceInUsd) || 0;
        }
      }
    }

    return res.json({ users, tickets, orders, revenue });
  } catch (error) {
    console.error('Failed to load stats:', error);
    return res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/logs', ensureAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find({}, { sort: { created_at: -1 }, limit: 100 });
    return res.json(logs);
  } catch {
    return res.status(500).json({ error: 'Failed to load logs' });
  }
});

// Example stubs for pages
router.get('/users', ensureAdmin, async (req, res) => {
  try {
    const admins = await AdminUser.findAll();
    res.json(admins.map(admin => ({ 
      id: admin.id, 
      email: admin.email, 
      name: admin.name, 
      created_at: admin.created_at, 
      last_login_at: admin.last_login_at 
    })));
  } catch (error) {
    console.error('Failed to load users:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.get('/orders', ensureAdmin, async (req, res) => {
  try {
    const usersSnap = await rtdb.ref('users').get();
    const usersVal = usersSnap.val() || {};
    const orders = [];
    
    for (const uid of Object.keys(usersVal)) {
      const userOrders = usersVal[uid]?.orders || {};
      for (const orderId of Object.keys(userOrders)) {
        const order = userOrders[orderId];
        orders.push({
          id: orderId,
          user: usersVal[uid]?.email || 'Unknown',
          total: order.priceInUsd || 0,
          status: order.status || 'pending'
        });
      }
    }
    
    res.json(orders);
  } catch (error) {
    console.error('Failed to load orders:', error);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.get('/products', ensureAdmin, async (req, res) => {
  try {
    // Get products from Firestore
    const productsSnapshot = await firestore.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Unknown Product',
      price: doc.data().price || 0
    }));
    res.json(products);
  } catch (error) {
    console.error('Failed to load products:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

router.get('/transactions', ensureAdmin, async (req, res) => {
  try {
    const usersSnap = await rtdb.ref('users').get();
    const usersVal = usersSnap.val() || {};
    const transactions = [];
    
    for (const uid of Object.keys(usersVal)) {
      const userTransactions = usersVal[uid]?.wallet?.transactions || {};
      for (const txnId of Object.keys(userTransactions)) {
        const txn = userTransactions[txnId];
        transactions.push({
          id: txnId,
          amount: txn.amount || 0,
          method: txn.method || 'unknown',
          status: txn.status || 'pending'
        });
      }
    }
    
    res.json(transactions);
  } catch (error) {
    console.error('Failed to load transactions:', error);
    res.status(500).json({ error: 'Failed to load transactions' });
  }
});

router.get('/support', ensureAdmin, async (req, res) => {
  try {
    const tickets = await Ticket.find({}, { sort: { created_at: -1 }, limit: 20 });
    res.json(tickets);
  } catch (error) {
    console.error('Failed to load support tickets:', error);
    res.status(500).json({ error: 'Failed to load support tickets' });
  }
});

router.get('/settings', ensureAdmin, async (req, res) => {
  try {
    const settingsDoc = await firestore.collection('admin_settings').doc('default').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : { 
      auth: 'firebase', 
      hashing: 'firebase_auth', 
      invites: true,
      theme: 'dark',
      notifications: true
    };
    res.json(settings);
  } catch (error) {
    console.error('Failed to load settings:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

export default router;