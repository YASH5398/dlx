import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import rateLimit from 'express-rate-limit';
import AdminUser from '../models/AdminUser.js';
import AdminInvite from '../models/AdminInvite.js';
import AuditLog from '../models/AuditLog.js';
import ensureAdmin from '../middleware/ensureAdmin.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Middleware: cookies + basic rate limiting for auth endpoints
router.use(cookieParser());
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

// Helpers
function issueAdminCookie(res, admin) {
  const secret = process.env.ADMIN_JWT_SECRET;
  const token = jwt.sign({ sub: admin._id.toString(), email: admin.email, role: 'admin' }, secret, { expiresIn: '2h' });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('admin_jwt', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 2 * 60 * 60 * 1000,
  });
}

async function log(actorId, action, meta = {}, targetType = undefined, targetId = undefined) {
  try { await AuditLog.create({ actor_id: actorId, action, meta, target_type: targetType, target_id: targetId }); } catch {}
}

// --- Auth ---
router.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
    const admin = await AdminUser.findOne({ email: email.toLowerCase() });
    if (!admin || !admin.is_active) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await argon2.verify(admin.password_hash, password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    admin.last_login_at = new Date();
    await admin.save();
    issueAdminCookie(res, admin);
    await log(admin._id, 'admin_login', { email });
    return res.json({ ok: true, admin: { id: admin._id, email: admin.email, name: admin.name } });
  } catch (e) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/auth/logout', authLimiter, async (req, res) => {
  try {
    res.clearCookie('admin_jwt', { path: '/' });
    const id = req.admin?.id;
    if (id) await log(id, 'admin_logout');
    return res.json({ ok: true });
  } catch {
    return res.json({ ok: true });
  }
});

router.get('/session', async (req, res) => {
  try {
    const token = req.cookies?.admin_jwt;
    if (!token) return res.status(401).json({ error: 'No session' });
    const secret = process.env.ADMIN_JWT_SECRET;
    const payload = jwt.verify(token, secret);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const admin = await AdminUser.findById(payload.sub).select('_id email name');
    if (!admin) return res.status(401).json({ error: 'Invalid session' });
    return res.json({ ok: true, admin });
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
    await log(req.admin.id, 'invite_created', { email }, 'AdminInvite', inv._id.toString());
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
    const inv = await AdminInvite.findOne({ token });
    if (!inv || inv.used) return res.status(400).json({ error: 'Invalid invite' });
    if (new Date(inv.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Invite expired' });
    const exists = await AdminUser.findOne({ email: inv.email });
    if (exists) return res.status(400).json({ error: 'Admin already exists' });
    const hash = await argon2.hash(password);
    const admin = await AdminUser.create({ email: inv.email, name: name || '', password_hash: hash });
    inv.used = true;
    inv.used_at = new Date();
    await inv.save();
    await log(admin._id, 'invite_accepted', { email: admin.email }, 'AdminUser', admin._id.toString());
    issueAdminCookie(res, admin);
    return res.json({ ok: true, admin: { id: admin._id, email: admin.email, name: admin.name } });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// --- Promote existing user to admin ---
router.post('/promote', ensureAdmin, async (req, res) => {
  try {
    const { email, confirm } = req.body || {};
    if (!email || confirm !== true) return res.status(400).json({ error: 'Confirmation required' });
    const exists = await AdminUser.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ error: 'Already an admin' });
    // In a real app, we'd lookup the user record in primary users DB and set a random password + force reset.
    const randomPass = uuidv4();
    const hash = await argon2.hash(randomPass);
    const admin = await AdminUser.create({ email: email.toLowerCase(), password_hash: hash, promoted_from_user_id: 'external' });
    await log(req.admin.id, 'admin_promoted', { email }, 'AdminUser', admin._id.toString());
    return res.json({ ok: true, admin: { id: admin._id, email: admin.email }, tempPassword: randomPass });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to promote user' });
  }
});

// --- Protected admin data endpoints (stubs) ---
router.get('/stats', ensureAdmin, async (req, res) => {
  try {
    const users = await AdminUser.countDocuments();
    const tickets = await (await import('../models/Ticket.js')).default.countDocuments();
    const orders = 12; // stub metric
    const revenue = 3499; // stub metric
    return res.json({ users, tickets, orders, revenue });
  } catch {
    return res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/logs', ensureAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ created_at: -1 }).limit(100);
    return res.json(logs);
  } catch {
    return res.status(500).json({ error: 'Failed to load logs' });
  }
});

// Example stubs for pages
router.get('/users', ensureAdmin, async (req, res) => {
  const admins = await AdminUser.find({}).select('_id email name created_at last_login_at');
  res.json(admins);
});

router.get('/orders', ensureAdmin, async (req, res) => {
  res.json([{ id: 'ord_1', user: 'john@doe.com', total: 199, status: 'paid' }]);
});

router.get('/products', ensureAdmin, async (req, res) => {
  res.json([{ id: 'prod_1', name: 'DLX Pro', price: 299 }]);
});

router.get('/transactions', ensureAdmin, async (req, res) => {
  res.json([{ id: 'txn_1', amount: 299, method: 'card', status: 'captured' }]);
});

router.get('/support', ensureAdmin, async (req, res) => {
  const Ticket = (await import('../models/Ticket.js')).default;
  const tickets = await Ticket.find({}).sort({ created_at: -1 }).limit(20);
  res.json(tickets);
});

router.get('/settings', ensureAdmin, async (req, res) => {
  res.json({ auth: 'jwt_cookie', hashing: 'argon2', invites: true });
});

export default router;