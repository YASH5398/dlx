import { useEffect, useState } from 'react';
import { firestore } from '../firebase.ts';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
export function useWallet() {
    const { user } = useUser();
    const [wallet, setWallet] = useState({ dlx: 0, usdt: 0, inr: 0 });
    useEffect(() => {
        if (!user?.id)
            return;
        const uid = user.id;
        // Stream balances from Firestore
        const walletsDoc = doc(firestore, 'wallets', uid);
        const usersDoc = doc(firestore, 'users', uid);
        const unsubWallets = onSnapshot(walletsDoc, (snap) => {
            const d = snap.data() || {};
            const usdt = Number(d.mainUsdt || 0) + Number(d.purchaseUsdt || 0);
            const inr = Number(d.mainInr || 0) + Number(d.purchaseInr || 0);
            setWallet((prev) => ({ ...prev, usdt, inr }));
        }, () => {
            setWallet((prev) => ({ ...prev, usdt: 0, inr: 0 }));
        });
        const unsubUsers = onSnapshot(usersDoc, (snap) => {
            const d = snap.data() || {};
            const dlx = Number(d.wallet?.miningBalance ?? 0);
            setWallet((prev) => ({ ...prev, dlx }));
        }, () => {
            setWallet((prev) => ({ ...prev, dlx: 0 }));
        });
        return () => {
            try {
                unsubWallets();
            }
            catch { }
            try {
                unsubUsers();
            }
            catch { }
        };
    }, [user?.id]);
    const refresh = async () => {
        if (!user?.id)
            return;
        const uid = user.id;
        const walletsDoc = doc(firestore, 'wallets', uid);
        const usersDoc = doc(firestore, 'users', uid);
        const [wSnap, uSnap] = await Promise.all([getDoc(walletsDoc), getDoc(usersDoc)]);
        const wData = wSnap.exists() ? wSnap.data() : {};
        const uData = uSnap.exists() ? uSnap.data() : {};
        const usdt = Number(wData.mainUsdt || 0) + Number(wData.purchaseUsdt || 0);
        const inr = Number(wData.mainInr || 0) + Number(wData.purchaseInr || 0);
        const dlx = Number(uData.wallet?.miningBalance ?? 0);
        setWallet({ dlx, usdt, inr });
    };
    return { wallet, refresh };
}
