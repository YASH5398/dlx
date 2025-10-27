import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, firestore } from '../firebase.ts';
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
import { doc, setDoc, updateDoc, getDoc, serverTimestamp, getDocs, query, collection, where, increment } from 'firebase/firestore';
import { logActivity } from '../utils/activity';
import { randomSecret, otpauthURI, qrCodeUrlFromOtpauth, verifyTOTP, sha256Hex } from '../utils/totp';

// Declare Google API types
declare global {
  interface Window {
    gapi?: {
      auth2?: {
        getAuthInstance: () => {
          signOut: () => void;
        };
      };
    };
  }
}

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

export const UserContext = createContext<UserContextType | undefined>(undefined);

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

    // Listen for storage changes to handle cross-tab logout
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dlx-auth' && e.newValue === null) {
        // User was logged out in another tab
        setUser(null);
        setToken(null);
        setMfaRequired(false);
        setMfaVerified(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const unsub = onAuthStateChanged(auth, async (fu) => {
      try {
        if (fu) {
          // User is signed in
          const u: User = { id: fu.uid, name: fu.displayName ?? fu.email ?? 'User', email: fu.email ?? '', phone: fu.phoneNumber ?? undefined };
          setUser(u);
          
          try {
            const t = await fu.getIdToken();
            setToken(t);
            localStorage.setItem('dlx-auth', JSON.stringify({ user: u, token: t, ts: Date.now() }));
          } catch (error) {
            console.warn('Failed to get ID token:', error);
            setToken(null);
            localStorage.setItem('dlx-auth', JSON.stringify({ user: u, token: null, ts: Date.now() }));
          }
          
          // Refresh MFA status on login
          refreshMfaStatus(fu.uid).catch(() => {});
        } else {
          // User is signed out - ensure complete cleanup
          setUser(null);
          setToken(null);
          setMfaRequired(false);
          setMfaVerified(false);
          
          // Clear auth data from localStorage
          try { 
            localStorage.removeItem('dlx-auth'); 
          } catch (error) {
            console.warn('Failed to remove dlx-auth from localStorage:', error);
          }
          
          // Additional cleanup for any remaining auth data
          try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes('firebase') || key.includes('auth') || key.includes('session') || key.includes('token'))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => {
              try { localStorage.removeItem(key); } catch {}
            });
          } catch (error) {
            console.warn('Failed to clear additional auth data on logout:', error);
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        // On error, assume user is logged out
        setUser(null);
        setToken(null);
        setMfaRequired(false);
        setMfaVerified(false);
        try { localStorage.removeItem('dlx-auth'); } catch {}
      } finally {
        setInitialized(true);
      }
    });
    
    return () => {
      unsub();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const isAuthenticated = !!user;

  // Generate unique referral code for new users
  const generateReferralCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'DLX';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const ensureUserNode = async (uid: string, data?: Record<string, any>) => {
    const userRef = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create complete user document if missing
      await setDoc(userRef, {
        name: data?.name ?? 'User',
        email: data?.email ?? '',
        phone: data?.phone ?? '',
        role: 'user',
        rank: 'starter',
        status: 'inactive',
        banned: false,
        referralCode: generateReferralCode(),
        referrerCode: data?.referrerCode ?? '',
        miningStreak: 0,
        telegramTask: {
          clicked: false,
          clickedAt: null,
          username: '',
          completed: false,
          claimed: false
        },
        twitterTask: {
          clicked: false,
          clickedAt: null,
          username: '',
          completed: false,
          claimed: false
        },
        preferences: {
          theme: 'dark',
          language: 'English',
          notifEmail: true,
          notifSms: false,
          notifPush: true
        },
        wallet: {
          main: 0,
          purchase: 0,
          miningBalance: 0
        },
        referralCount: 0,
        totalEarningsUsd: 0,
        totalOrders: 0,
        activeReferrals: 0,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
    } else {
      // Update lastLoginAt for existing users
      await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
    }

    // Ensure wallet document exists in wallets collection
    const walletRef = doc(firestore, 'wallets', uid);
    const walletSnap = await getDoc(walletRef);
    if (!walletSnap.exists()) {
      console.log('Creating wallet document for user:', uid);
      await setDoc(walletRef, {
        usdt: {
          mainUsdt: 0,
          purchaseUsdt: 0
        },
        inr: {
          mainInr: 0,
          purchaseInr: 0
        },
        dlx: 0, // Changed from 100 to 0 for consistency
        walletUpdatedAt: serverTimestamp()
      });
      console.log('Wallet document created successfully');
    } else {
      console.log('Wallet document already exists for user:', uid);
    }
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
    
    // Create complete user document in Firestore
    await setDoc(doc(firestore, 'users', uid), {
      name,
      email,
      phone: phone ?? '',
      role: 'user',
      rank: 'starter',
      status: 'inactive',
      banned: false,
      referralCode: generateReferralCode(),
      referrerCode: referralCode ?? '',
      miningStreak: 0,
      telegramTask: {
        clicked: false,
        clickedAt: null,
        username: '',
        completed: false,
        claimed: false
      },
      twitterTask: {
        clicked: false,
        clickedAt: null,
        username: '',
        completed: false,
        claimed: false
      },
      preferences: {
        theme: 'dark',
        language: 'English',
        notifEmail: true,
        notifSms: false,
        notifPush: true
      },
      wallet: {
        main: 0,
        purchase: 0,
        miningBalance: 0
      },
      referralCount: 0,
      totalEarningsUsd: 0,
      totalOrders: 0,
      activeReferrals: 0,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });

    // Create separate wallet document in wallets collection
    await setDoc(doc(firestore, 'wallets', uid), {
      usdt: {
        mainUsdt: 0,
        purchaseUsdt: 0
      },
      inr: {
        mainInr: 0,
        purchaseInr: 0
      },
      dlx: 100,
      walletUpdatedAt: serverTimestamp()
    });

    // Handle referral system - update referrer's count if valid referral code
    if (referralCode) {
      try {
        const referrerQuery = await getDocs(query(collection(firestore, 'users'), where('referralCode', '==', referralCode)));
        if (!referrerQuery.empty) {
          const referrerDoc = referrerQuery.docs[0];
          const referrerId = referrerDoc.id;
          
          // Update referrer's count
          await updateDoc(doc(firestore, 'users', referrerId), {
            referralCount: increment(1),
            activeReferrals: increment(1)
          });
          
          // Track referral signup with join bonus
          const { trackReferralSignup } = await import('../utils/referralTracking');
          await trackReferralSignup(referrerId, uid, email, name);
        }
      } catch (error) {
        console.error('Error updating referrer count:', error);
      }
    }

    await logActivity(uid, 'signup', { referralCode: referralCode ?? null });
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    await ensureUserNode(res.user.uid, {
      name: res.user.displayName ?? res.user.email ?? 'User',
      email: res.user.email ?? '',
      phone: res.user.phoneNumber ?? ''
    });
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
    await ensureUserNode(res.user.uid, {
      name: res.user.displayName ?? res.user.email ?? 'User',
      email: res.user.email ?? '',
      phone: res.user.phoneNumber ?? ''
    });
    setConfirmation(null);
    await logActivity(res.user.uid, 'login', { method: 'phone_otp' });
  };

  const logout = async () => {
    try {
      const uid = user?.id;
      
      // Log activity first (before clearing state)
      if (uid) {
        try {
          await logActivity(uid, 'logout');
        } catch (error) {
          console.warn('Failed to log logout activity:', error);
        }
      }
      
      // Clear user state immediately to prevent UI flicker
      setUser(null);
      setToken(null);
      setMfaRequired(false);
      setMfaVerified(false);
      
      // Clear all storage immediately
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.warn('Failed to clear storage:', error);
      }
      
      // Sign out from Firebase Auth (this will trigger onAuthStateChanged)
      try {
        await signOut(auth);
        
        // Additional cleanup for Google sign-in
        // Clear any Google-related tokens or sessions
        try {
          // Clear Google OAuth tokens if they exist
          if (window.gapi) {
            window.gapi.auth2?.getAuthInstance()?.signOut();
          }
        } catch (error) {
          console.warn('Failed to clear Google OAuth tokens:', error);
        }
        
      } catch (error) {
        console.error('Firebase signOut failed:', error);
        // Continue with cleanup even if signOut fails
      }
      
      // Additional cleanup for any remaining auth data
      try {
        // Clear any remaining Firebase/auth related data
        const keysToRemove = [];
        
        // Check localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('firebase') || key.includes('auth') || key.includes('session') || key.includes('token'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => {
          try { localStorage.removeItem(key); } catch {}
        });
        
        // Check sessionStorage
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.includes('firebase') || key.includes('auth') || key.includes('session') || key.includes('token'))) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach(key => {
          try { sessionStorage.removeItem(key); } catch {}
        });
      } catch (error) {
        console.warn('Failed to clear additional auth data:', error);
      }
      
      // Force redirect to login page
      // Use replace to prevent back button issues
      window.location.replace('/login');
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Emergency cleanup - clear everything and force redirect
      try {
        setUser(null);
        setToken(null);
        setMfaRequired(false);
        setMfaVerified(false);
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      
      // Force redirect even if everything fails
      window.location.replace('/login');
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshMfaStatus = async (uid: string) => {
    const mfaRef = doc(firestore, 'users', uid, 'security', 'mfa');
    const snap = await getDoc(mfaRef);
    const val = snap.data();
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
    await setDoc(doc(firestore, 'users', uid, 'security', 'mfa'), { secret, enabled: false, backupCodes: backupCodesHashed, createdAt: serverTimestamp() });
    const account = user.email || user.name || 'user';
    const otpauth = otpauthURI({ secret, account, issuer: 'DLX' });
    const qr = qrCodeUrlFromOtpauth(otpauth);
    return { secret, otpauth, qr, backupCodes: backupCodesPlain };
  };

  const enableMfa = async (code: string) => {
    if (!user) throw new Error('Not authenticated');
    const uid = user.id;
    const mfaRef = doc(firestore, 'users', uid, 'security', 'mfa');
    const snap = await getDoc(mfaRef);
    const val = snap.data();
    const secret = val?.secret;
    if (!secret) throw new Error('MFA not set up');
    const ok = await verifyTOTP(secret, code);
    if (!ok) return false;
    await updateDoc(mfaRef, { enabled: true, enabledAt: serverTimestamp() });
    setMfaVerified(true);
    setMfaRequired(false);
    await logActivity(uid, 'mfa_enabled');
    return true;
  };

  const disableMfa = async () => {
    if (!user) throw new Error('Not authenticated');
    const uid = user.id;
    const mfaRef = doc(firestore, 'users', uid, 'security', 'mfa');
    await updateDoc(mfaRef, { enabled: false, disabledAt: serverTimestamp() });
    setMfaRequired(false);
    setMfaVerified(false);
    await logActivity(uid, 'mfa_disabled');
  };

  const verifyMfa = async (code: string) => {
    if (!user) return false;
    const uid = user.id;
    const mfaRef = doc(firestore, 'users', uid, 'security', 'mfa');
    const snap = await getDoc(mfaRef);
    const val = snap.data();
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
        await updateDoc(mfaRef, { backupCodes: bcodes, lastBackupUsedAt: serverTimestamp() });
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