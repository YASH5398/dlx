import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, db } from '../firebase.ts';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, signOut, RecaptchaVerifier, signInWithPhoneNumber, sendPasswordResetEmail, } from 'firebase/auth';
import { ref, set, update, get } from 'firebase/database';
import { logActivity } from '../utils/activity';
import { randomSecret, otpauthURI, qrCodeUrlFromOtpauth, verifyTOTP, sha256Hex } from '../utils/totp';
const UserContext = createContext(undefined);
export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const [confirmation, setConfirmation] = useState(null);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaVerified, setMfaVerified] = useState(false);
    useEffect(() => {
        // Seed from localStorage immediately to avoid redirect flicker before Firebase hydrates
        try {
            const raw = localStorage.getItem('dlx-auth');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.user) {
                    setUser(parsed.user);
                    setToken(parsed.token ?? null);
                }
            }
        }
        catch { }
        const unsub = onAuthStateChanged(auth, async (fu) => {
            if (fu) {
                const u = { id: fu.uid, name: fu.displayName ?? fu.email ?? 'User', email: fu.email ?? '', phone: fu.phoneNumber ?? undefined };
                setUser(u);
                try {
                    const t = await fu.getIdToken();
                    setToken(t);
                    localStorage.setItem('dlx-auth', JSON.stringify({ user: u, token: t, ts: Date.now() }));
                }
                catch {
                    setToken(null);
                    localStorage.setItem('dlx-auth', JSON.stringify({ user: u, token: null, ts: Date.now() }));
                }
                // Refresh MFA status on login
                refreshMfaStatus(fu.uid).catch(() => { });
            }
            else {
                setUser(null);
                setToken(null);
                setMfaRequired(false);
                setMfaVerified(false);
                try {
                    localStorage.removeItem('dlx-auth');
                }
                catch { }
            }
            setInitialized(true);
        });
        return () => unsub();
    }, []);
    const isAuthenticated = !!user;
    const ensureUserNode = async (uid, data) => {
        const userRef = ref(db, `users/${uid}`);
        await update(userRef, { profile: data ?? {}, createdAt: Date.now() });
        // seed wallet if not present
        await update(ref(db, `users/${uid}/wallet`), { dlx: 100, usdt: 500, inr: 10000 });
        // ensure referrals node exists
        try {
            const referralsSnap = await get(ref(db, `users/${uid}/referrals`));
            if (!referralsSnap.exists()) {
                await set(ref(db, `users/${uid}/referrals`), { total: 0, tier: 1 });
            }
        }
        catch { }
        // ensure orders collection exists
        try {
            const ordersSnap = await get(ref(db, `users/${uid}/orders`));
            if (!ordersSnap.exists()) {
                await set(ref(db, `users/${uid}/orders`), {});
            }
        }
        catch { }
        // ensure wallet transactions list exists
        try {
            const txSnap = await get(ref(db, `users/${uid}/wallet/transactions`));
            if (!txSnap.exists()) {
                await set(ref(db, `users/${uid}/wallet/transactions`), {});
            }
        }
        catch { }
    };
    const login = async (email, password) => {
        const res = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserNode(res.user.uid);
        await logActivity(res.user.uid, 'login', { method: 'password' });
    };
    const signup = async (name, email, password, phone, referralCode) => {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (name)
            await updateProfile(res.user, { displayName: name });
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
    const sendPhoneOtp = async (phone10) => {
        const phone = `+91${phone10}`;
        // Recaptcha container should exist in Login page
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        const confirmationRes = await signInWithPhoneNumber(auth, phone, verifier);
        setConfirmation(confirmationRes);
    };
    const verifyPhoneOtp = async (code) => {
        if (!confirmation)
            throw new Error('OTP not sent yet');
        const res = await confirmation.confirm(code);
        await ensureUserNode(res.user.uid);
        setConfirmation(null);
        await logActivity(res.user.uid, 'login', { method: 'phone_otp' });
    };
    const logout = async () => {
        const uid = user?.id;
        if (uid)
            await logActivity(uid, 'logout');
        await signOut(auth);
        setUser(null);
        setToken(null);
        try {
            localStorage.removeItem('dlx-auth');
            Object.keys(localStorage).forEach((k) => {
                if (k.startsWith('firebase:') || k.startsWith('dlx-') || k.toLowerCase().includes('auth') || k.toLowerCase().includes('session')) {
                    try {
                        localStorage.removeItem(k);
                    }
                    catch { }
                }
            });
            Object.keys(sessionStorage).forEach((k) => {
                try {
                    sessionStorage.removeItem(k);
                }
                catch { }
            });
        }
        catch { }
        if (import.meta.env.DEV) {
            const raw = localStorage.getItem('dlx-auth');
            if (raw) {
                console.warn('Post-logout: dlx-auth still present. Clearing again.', raw);
                try {
                    localStorage.removeItem('dlx-auth');
                }
                catch { }
            }
        }
    };
    const resetPassword = async (email) => {
        await sendPasswordResetEmail(auth, email);
    };
    const refreshMfaStatus = async (uid) => {
        const snap = await get(ref(db, `users/${uid}/security/mfa`));
        const val = snap.val();
        const enabled = !!val?.enabled;
        setMfaRequired(enabled);
        setMfaVerified(false);
    };
    const setupTOTP = async () => {
        if (!user)
            throw new Error('Not authenticated');
        const uid = user.id;
        const secret = randomSecret(20);
        const backupCodesPlain = [];
        for (let i = 0; i < 8; i++)
            backupCodesPlain.push((await sha256Hex(`${uid}:${Date.now()}:${Math.random()}:${i}`)).slice(0, 10));
        const backupCodesHashed = await Promise.all(backupCodesPlain.map((c) => sha256Hex(c)));
        await set(ref(db, `users/${uid}/security/mfa`), { secret, enabled: false, backupCodes: backupCodesHashed, createdAt: Date.now() });
        const account = user.email || user.name || 'user';
        const otpauth = otpauthURI({ secret, account, issuer: 'DLX' });
        const qr = qrCodeUrlFromOtpauth(otpauth);
        return { secret, otpauth, qr, backupCodes: backupCodesPlain };
    };
    const enableMfa = async (code) => {
        if (!user)
            throw new Error('Not authenticated');
        const uid = user.id;
        const mfaRef = ref(db, `users/${uid}/security/mfa`);
        const snap = await get(mfaRef);
        const val = snap.val();
        const secret = val?.secret;
        if (!secret)
            throw new Error('MFA not set up');
        const ok = await verifyTOTP(secret, code);
        if (!ok)
            return false;
        await update(mfaRef, { enabled: true, enabledAt: Date.now() });
        setMfaVerified(true);
        setMfaRequired(false);
        await logActivity(uid, 'mfa_enabled');
        return true;
    };
    const disableMfa = async () => {
        if (!user)
            throw new Error('Not authenticated');
        const uid = user.id;
        const mfaRef = ref(db, `users/${uid}/security/mfa`);
        await update(mfaRef, { enabled: false, disabledAt: Date.now() });
        setMfaRequired(false);
        setMfaVerified(false);
        await logActivity(uid, 'mfa_disabled');
    };
    const verifyMfa = async (code) => {
        if (!user)
            return false;
        const uid = user.id;
        const mfaRef = ref(db, `users/${uid}/security/mfa`);
        const snap = await get(mfaRef);
        const val = snap.val();
        const secret = val?.secret;
        const bcodes = Array.isArray(val?.backupCodes) ? val.backupCodes : [];
        let ok = false;
        if (secret && /^\d{6}$/.test(code.trim())) {
            ok = await verifyTOTP(secret, code.trim());
        }
        else {
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
    return (_jsx(UserContext.Provider, { value: value, children: children }));
}
export function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx)
        throw new Error('useUser must be used within UserProvider');
    return ctx;
}
