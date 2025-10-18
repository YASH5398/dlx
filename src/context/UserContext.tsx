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
import { ref, set, update } from 'firebase/database';
import { logActivity } from '../utils/activity';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

type UserContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string, referralCode?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPhoneOtp: (phone10: string) => Promise<void>;
  verifyPhoneOtp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [confirmation, setConfirmation] = useState<import('firebase/auth').ConfirmationResult | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fu) => {
      if (fu) {
        const u: User = { id: fu.uid, name: fu.displayName ?? fu.email ?? 'User', email: fu.email ?? '', phone: fu.phoneNumber ?? undefined };
        setUser(u);
      } else {
        setUser(null);
      }
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
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    login,
    signup,
    loginWithGoogle,
    sendPhoneOtp,
    verifyPhoneOtp,
    logout,
    resetPassword,
  }), [user, isAuthenticated]);

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