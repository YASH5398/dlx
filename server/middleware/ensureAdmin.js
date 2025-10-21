import { auth, firestore } from '../firebaseAdmin.js';

export default async function ensureAdmin(req, res, next) {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized: No ID token provided' });

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check admin via custom claim or Firestore registry
    const user = await auth.getUser(uid);
    const isAdminClaim = !!(user.customClaims && (user.customClaims.admin === true || user.customClaims.role === 'admin'));
    let isAdmin = isAdminClaim;
    if (!isAdmin) {
      const adminDoc = await firestore.collection('admin_users').doc(uid).get();
      isAdmin = adminDoc.exists;
    }
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden: Not an admin' });

    req.admin = { id: uid, email: user.email || decodedToken.email, name: user.displayName };
    next();
  } catch (e) {
    console.error('Firebase Auth token verification failed:', e);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}