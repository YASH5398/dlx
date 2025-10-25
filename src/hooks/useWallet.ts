import { useEffect, useState } from 'react';
import { firestore } from '../firebase.ts';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { useUser } from '../context/UserContext';

export type WalletState = { dlx: number; usdt: number; inr: number };

export function useWallet() {
  const { user } = useUser();
  const [wallet, setWallet] = useState<WalletState>({ dlx: 0, usdt: 0, inr: 0 });

  useEffect(() => {
    if (!user?.id) return;
    const uid = user.id;

    // Stream balances from Firestore
    const walletsDoc = doc(firestore, 'wallets', uid);
    const usersDoc = doc(firestore, 'users', uid);

    const unsubWallets = onSnapshot(walletsDoc, (snap) => {
      const d = (snap.data() as any) || {};
      const usdt = d.usdt || {};
      const inr = d.inr || {};
      const usdtTotal = Number(usdt.mainUsdt || 0) + Number(usdt.purchaseUsdt || 0);
      const inrTotal = Number(inr.mainInr || 0) + Number(inr.purchaseInr || 0);
      setWallet((prev: WalletState) => ({ ...prev, usdt: usdtTotal, inr: inrTotal }));
      
      console.log('useWallet updated (canonical):', { 
        usdtTotal, 
        inrTotal,
        usdt: usdt,
        inr: inr
      });
    }, () => {
      setWallet((prev: WalletState) => ({ ...prev, usdt: 0, inr: 0 }));
    });

    const unsubUsers = onSnapshot(usersDoc, (snap) => {
      const d = (snap.data() as any) || {};
      const dlx = Number(d.wallet?.miningBalance ?? 0);
      setWallet((prev: WalletState) => ({ ...prev, dlx }));
    }, () => {
      setWallet((prev: WalletState) => ({ ...prev, dlx: 0 }));
    });

    return () => {
      try { unsubWallets(); } catch {}
      try { unsubUsers(); } catch {}
    };
  }, [user?.id]);

  const refresh = async () => {
    if (!user?.id) return;
    const uid = user.id;
    const walletsDoc = doc(firestore, 'wallets', uid);
    const usersDoc = doc(firestore, 'users', uid);

    const [wSnap, uSnap] = await Promise.all([getDoc(walletsDoc), getDoc(usersDoc)]);

    const wData = wSnap.exists() ? (wSnap.data() as any) : {};
    const uData = uSnap.exists() ? (uSnap.data() as any) : {};

    const usdt = wData.usdt || {};
    const inr = wData.inr || {};
    const usdtTotal = Number(usdt.mainUsdt || 0) + Number(usdt.purchaseUsdt || 0);
    const inrTotal = Number(inr.mainInr || 0) + Number(inr.purchaseInr || 0);
    const dlx = Number(uData.wallet?.miningBalance ?? 0);

    setWallet({ dlx, usdt: usdtTotal, inr: inrTotal });
  };

  return { wallet, refresh };
}