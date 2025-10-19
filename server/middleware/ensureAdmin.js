import { auth, firestore } from '../firebaseAdmin.js';

export default async function ensureAdmin(req, res, next) {
  try {
    const token = req.cookies?.admin_session || req.cookies?.admin_jwt;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // Verify Firebase session cookie (prefer) or fall back to JWT for legacy
    let decoded;
    let fromFirebase = false;
    try {
      decoded = await auth.verifySessionCookie(token, true);
      fromFirebase = true;
    } catch (e) {
      // Legacy fallback: reject if not Firebase session
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const uid = decoded.uid;
    // Check admin via custom claim or Firestore registry
    const user = await auth.getUser(uid);
    const isAdminClaim = !!(user.customClaims && (user.customClaims.admin === true || user.customClaims.role === 'admin'));
    let isAdmin = isAdminClaim;
    if (!isAdmin) {
      const adminDoc = await firestore.collection('admin_users').doc(uid).get();
      isAdmin = adminDoc.exists;
    }
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    req.admin = { id: uid, email: user.email || decoded.email, name: user.displayName };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}