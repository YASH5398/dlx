import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, db } from '../firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { ref, set, update, get } from 'firebase/database';
import { logActivity } from '../utils/activity';
import { randomSecret, otpauthURI, qrCodeUrlFromOtpauth, verifyTOTP, sha256Hex } from '../utils/totp';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

type UserContextType = {
  user: User | null;
  isAuthenticated: boolean;
  initialized: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string, referralCode?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPhoneOtp: (phone10: string) => Promise<void>;
  verifyPhoneOtp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  mfaRequired: boolean;
  mfaVerified: boolean;
  setupTOTP: () => Promise<{ secret: string; otpauth: string; qr: string; backupCodes: string[] }>;
  enableMfa: (code: string) => Promise<boolean>;
  disableMfa: () => Promise<void>;
  verifyMfa: (code: string) => Promise<boolean>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [confirmation, setConfirmation] = useState<import('firebase/auth').ConfirmationResult | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);

  useEffect(() => {
    // Seed from localStorage immediately to avoid redirect flicker before Firebase hydrates
    try {
      const raw = localStorage.getItem('dlx-auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user) {
          setUser(parsed.user as User);
          setToken(parsed.token ?? null);
        }
      }
    } catch {}

    const unsub = onAuthStateChanged(auth, async (fu) => {
      if (fu) {
        const u: User = { id: fu.uid, name: fu.displayName ?? fu.email ?? 'User', email: fu.email ?? '', phone: fu.phoneNumber ?? undefined };
        setUser(u);
        try {
          const t = await fu.getIdToken();
          setToken(t);
          localStorage.setItem('dlx-auth', JSON.stringify({ user: u, token: t, ts: Date.now() }));
        } catch {
          setToken(null);
          localStorage.setItem('dlx-auth', JSON.stringify({ user: u, token: null, ts: Date.now() }));
        }
        // Refresh MFA status on login
        refreshMfaStatus(fu.uid).catch(() => {});
      } else {
        setUser(null);
        setToken(null);
        setMfaRequired(false);
        setMfaVerified(false);
        try { localStorage.removeItem('dlx-auth'); } catch {}
      }
      setInitialized(true);
    });
    return () => unsub();
  }, []);

  const isAuthenticated = !!user;

  const ensureUserNode = async (uid: string, data?: Record<string, any>) => {
    const userRef = ref(db, `users/${uid}`);
    await update(userRef, { profile: data ?? {}, createdAt: Date.now() });
    // seed wallet if not present
    await update(ref(db, `users/${uid}/wallet`), { dlx: 100, usdt: 500, inr: 10000 });
  };

  const login = async (email: string, password: string) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserNode(res.user.uid);
    await logActivity(res.user.uid, 'login', { method: 'password' });
  };

  const signup = async (name: string, email: string, password: string, phone?: string, referralCode?: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(res.user, { displayName: name });
    const uid = res.user.uid;
    await set(ref(db, `users/${uid}`), {
      profile: { name, email, phone: phone ?? '', referralCode: referralCode ?? '' },
      wallet: { dlx: 100, usdt: 500, inr: 10000 },
      referrals: { total: 0, tier: 1 },
      orders: {},
      createdAt: Date.now(),
    });
    await logActivity(uid, 'signup', { referralCode: referralCode ?? null });
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    await ensureUserNode(res.user.uid);
    await logActivity(res.user.uid, 'login', { method: 'google' });
  };

  const sendPhoneOtp = async (phone10: string) => {
    const phone = `+91${phone10}`;
    // Recaptcha container should exist in Login page
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    const confirmationRes = await signInWithPhoneNumber(auth, phone, verifier);
    setConfirmation(confirmationRes);
  };

  const verifyPhoneOtp = async (code: string) => {
    if (!confirmation) throw new Error('OTP not sent yet');
    const res = await confirmation.confirm(code);
    await ensureUserNode(res.user.uid);
    setConfirmation(null);
    await logActivity(res.user.uid, 'login', { method: 'phone_otp' });
  };

  const logout = async () => {
    const uid = user?.id;
    if (uid) await logActivity(uid, 'logout');
    await signOut(auth);
    setUser(null);
    setToken(null);
    try { localStorage.removeItem('dlx-auth'); } catch {}
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshMfaStatus = async (uid: string) => {
    const snap = await get(ref(db, `users/${uid}/security/mfa`));
    const val = snap.val();
    const enabled = !!val?.enabled;
    setMfaRequired(enabled);
    setMfaVerified(false);
  };

  const setupTOTP = async () => {
    if (!user) throw new Error('Not authenticated');
    const uid = user.id;
    const secret = randomSecret(20);
    const backupCodesPlain: string[] = [];
    for (let i = 0; i < 8; i++) backupCodesPlain.push((await sha256Hex(`${uid}:${Date.now()}:${Math.random()}:${i}`)).slice(0, 10));
    const backupCodesHashed = await Promise.all(backupCodesPlain.map((c) => sha256Hex(c)));
    await set(ref(db, `users/${uid}/security/mfa`), { secret, enabled: false, backupCodes: backupCodesHashed, createdAt: Date.now() });
    const account = user.email || user.name || 'user';
    const otpauth = otpauthURI({ secret, account, issuer: 'DLX' });
    const qr = qrCodeUrlFromOtpauth(otpauth);
    return { secret, otpauth, qr, backupCodes: backupCodesPlain };
  };

  const enableMfa = async (code: string) => {
    if (!user) throw new Error('Not authenticated');
    const uid = user.id;
    const mfaRef = ref(db, `users/${uid}/security/mfa`);
    const snap = await get(mfaRef);
    const val = snap.val();
    const secret = val?.secret;
    if (!secret) throw new Error('MFA not set up');
    const ok = await verifyTOTP(secret, code);
    if (!ok) return false;
    await update(mfaRef, { enabled: true, enabledAt: Date.now() });
    setMfaVerified(true);
    setMfaRequired(false);
    await logActivity(uid, 'mfa_enabled');
    return true;
  };

  const disableMfa = async () => {
    if (!user) throw new Error('Not authenticated');
    const uid = user.id;
    const mfaRef = ref(db, `users/${uid}/security/mfa`);
    await update(mfaRef, { enabled: false, disabledAt: Date.now() });
    setMfaRequired(false);
    setMfaVerified(false);
    await logActivity(uid, 'mfa_disabled');
  };

  const verifyMfa = async (code: string) => {
    if (!user) return false;
    const uid = user.id;
    const mfaRef = ref(db, `users/${uid}/security/mfa`);
    const snap = await get(mfaRef);
    const val = snap.val();
    const secret = val?.secret as string | undefined;
    const bcodes: string[] = Array.isArray(val?.backupCodes) ? val.backupCodes : [];
    let ok = false;
    if (secret && /^\d{6}$/.test(code.trim())) {
      ok = await verifyTOTP(secret, code.trim());
    } else {
      const hash = await sha256Hex(code.trim());
      const idx = bcodes.indexOf(hash);
      if (idx >= 0) {
        ok = true;
        bcodes.splice(idx, 1);
        await update(mfaRef, { backupCodes: bcodes, lastBackupUsedAt: Date.now() });
      }
    }
    if (ok) {
      setMfaVerified(true);
      setMfaRequired(false);
      await logActivity(uid, 'mfa_verified');
    }
    return ok;
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    initialized,
    token,
    login,
    signup,
    loginWithGoogle,
    sendPhoneOtp,
    verifyPhoneOtp,
    logout,
    resetPassword,
    mfaRequired,
    mfaVerified,
    setupTOTP,
    enableMfa,
    disableMfa,
    verifyMfa,
  }), [user, isAuthenticated, initialized, token, mfaRequired, mfaVerified]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}