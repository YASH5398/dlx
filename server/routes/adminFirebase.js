import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import ensureAdmin from '../middleware/ensureAdmin.js';
import { auth, firestore, rtdb, col, doc } from '../firebaseAdmin.js';

const router = express.Router();
router.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

// --- Auth: login via Firebase Auth REST to issue session cookie ---
router.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server missing FIREBASE_WEB_API_KEY' });

    const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return res.status(401).json({ error: err?.error?.message || 'Invalid credentials' });
    }
    const data = await resp.json();
    const idToken = data.idToken;
    const expiresInMs = 2 * 60 * 60 * 1000; // 2h
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: expiresInMs });

    // Verify admin status via custom claims or Firestore admin registry
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const user = await auth.getUser(uid);
    const isAdminClaim = !!(user.customClaims && (user.customClaims.admin === true || user.customClaims.role === 'admin'));
    let isAdmin = isAdminClaim;
    if (!isAdmin) {
      const adminDoc = await firestore.collection('admin_users').doc(uid).get();
      isAdmin = adminDoc.exists;
    }
    if (!isAdmin) return res.status(403).json({ error: 'Not an admin' });

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('admin_session', sessionCookie, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: expiresInMs,
    });
    return res.json({ ok: true, admin: { id: uid, email: user.email, name: user.displayName } });
  } catch (e) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/auth/logout', async (req, res) => {
  try {
    res.clearCookie('admin_session', { path: '/' });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/session', async (req, res) => {
  try {
    const token = req.cookies?.admin_session;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = await auth.verifySessionCookie(token, true);
    const uid = decoded.uid;
    const user = await auth.getUser(uid);
    return res.json({ ok: true, admin: { id: uid, email: user.email, name: user.displayName } });
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }
});

// --- Invite system (Firestore) ---
router.post('/invite/generate', ensureAdmin, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required' });
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    await col('admin_invites').doc(token).set({ token, email: String(email).toLowerCase(), created_by: req.admin.id, created_at: Date.now(), expires_at: expiresAt, used: false });
    const link = `${process.env.PUBLIC_URL || 'http://localhost:5173'}/secret-admin/invite/${token}`;
    return res.json({ ok: true, token, expires_at: expiresAt, link });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to generate invite' });
  }
});

router.post('/invite/accept', async (req, res) => {
  try {
    const { token, name, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Missing fields' });
    const snap = await col('admin_invites').doc(token).get();
    if (!snap.exists) return res.status(400).json({ error: 'Invalid invite' });
    const inv = snap.data();
    if (inv.used) return res.status(400).json({ error: 'Invite already used' });
    if (Number(inv.expires_at) < Date.now()) return res.status(400).json({ error: 'Invite expired' });

    const exists = await auth.getUserByEmail(inv.email).catch(() => null);
    if (exists) return res.status(400).json({ error: 'Admin already exists' });

    const user = await auth.createUser({ email: inv.email, password, displayName: name || '' });
    await auth.setCustomUserClaims(user.uid, { admin: true, role: 'admin' });
    await col('admin_users').doc(user.uid).set({ email: inv.email, name: name || '', created_at: Date.now() });
    await col('admin_invites').doc(token).update({ used: true, used_at: Date.now() });

    // Issue session cookie
    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server missing FIREBASE_WEB_API_KEY' });
    const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inv.email, password, returnSecureToken: true }),
    });
    if (!resp.ok) return res.status(500).json({ error: 'Failed to create session' });
    const data = await resp.json();
    const sessionCookie = await auth.createSessionCookie(data.idToken, { expiresIn: 2 * 60 * 60 * 1000 });
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('admin_session', sessionCookie, { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/', maxAge: 2 * 60 * 60 * 1000 });

    return res.json({ ok: true, admin: { id: user.uid, email: inv.email, name: name || '' } });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// --- Promote existing Firebase user to admin ---
router.post('/promote', ensureAdmin, async (req, res) => {
  try {
    const { email, confirm } = req.body || {};
    if (!email || confirm !== true) return res.status(400).json({ error: 'Confirmation required' });
    const user = await auth.getUserByEmail(String(email).toLowerCase()).catch(() => null);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await auth.setCustomUserClaims(user.uid, { admin: true, role: 'admin' });
    await col('admin_users').doc(user.uid).set({ email: user.email, name: user.displayName || '', promoted_at: Date.now() }, { merge: true });
    return res.json({ ok: true, admin: { id: user.uid, email: user.email } });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to promote user' });
  }
});

// --- Protected admin data endpoints ---
router.get('/stats', ensureAdmin, async (req, res) => {
  try {
    // Aggregate from RTDB
    const usersSnap = await rtdb.ref('users').get();
    const usersVal = usersSnap.val() || {};
    const userIds = Object.keys(usersVal);
    const users = userIds.length;

    let orders = 0;
    let revenue = 0;
    for (const uid of userIds) {
      const o = (usersVal[uid]?.orders) || {};
      const os = Object.values(o);
      orders += os.length;
      for (const anyOrder of os) {
        const status = anyOrder?.status;
        const priceUsd = Number(anyOrder?.priceInUsd || 0);
        if (status === 'paid') revenue += priceUsd;
      }
    }

    const ticketsSnap = await rtdb.ref('support/tickets').get();
    const ticketsVal = ticketsSnap.val() || {};
    const tickets = Object.keys(ticketsVal).length;

    return res.json({ users, tickets, orders, revenue });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/logs', ensureAdmin, async (req, res) => {
  try {
    const logsSnap = await col('audit_logs').orderBy('created_at', 'desc').limit(100).get().catch(() => null);
    const logs = logsSnap ? logsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
    return res.json(logs);
  } catch {
    return res.status(500).json({ error: 'Failed to load logs' });
  }
});

router.get('/users', ensureAdmin, async (req, res) => {
  try {
    const adminsSnap = await col('admin_users').get();
    const admins = adminsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json(admins);
  } catch {
    return res.status(500).json({ error: 'Failed to load users' });
  }
});

router.get('/support', ensureAdmin, async (req, res) => {
  try {
    const tSnap = await rtdb.ref('support/tickets').get();
    const tVal = tSnap.val() || {};
    const rows = Object.keys(tVal).map((id) => ({ id, ...tVal[id] }));
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Failed to load support' });
  }
});

router.get('/orders', ensureAdmin, async (req, res) => {
  try {
    const usersSnap = await rtdb.ref('users').get();
    const usersVal = usersSnap.val() || {};
    const rows = [];
    for (const uid of Object.keys(usersVal)) {
      const o = (usersVal[uid]?.orders) || {};
      for (const id of Object.keys(o)) {
        rows.push({ uid, id, ...o[id] });
      }
    }
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.get('/products', ensureAdmin, async (req, res) => {
  return res.json([]);
});

router.get('/transactions', ensureAdmin, async (req, res) => {
  try {
    const usersSnap = await rtdb.ref('users').get();
    const usersVal = usersSnap.val() || {};
    const rows = [];
    for (const uid of Object.keys(usersVal)) {
      const txs = (usersVal[uid]?.wallet?.transactions) || {};
      for (const id of Object.keys(txs)) {
        rows.push({ uid, id, ...txs[id] });
      }
    }
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Failed to load transactions' });
  }
});

router.get('/settings', ensureAdmin, async (req, res) => {
  const docSnap = await doc('admin_settings', 'default').get().catch(() => null);
  const val = docSnap?.exists ? docSnap.data() : { theme: 'dark', notifications: true };
  return res.json(val);
});

export default router;