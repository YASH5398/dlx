import { useEffect, useState } from 'react';
import { DEFAULT_WALLET } from '../utils/constants';
import { firestore } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { useUser } from '../context/UserContext';

export type WalletState = { dlx: number; usdt: number; inr: number };

export function useWallet() {
  const { user } = useUser();
  const [wallet, setWallet] = useState<WalletState>(DEFAULT_WALLET);

  useEffect(() => {
    if (!user?.id) return;
    const walletDoc = doc(firestore, 'wallets', user.id);
    const unsub = onSnapshot(walletDoc, async (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        const usdt = Number(data.mainUsdt || 0) + Number(data.purchaseUsdt || 0);
        const inr = Number(data.mainInr || 0) + Number(data.purchaseInr || 0);
        const dlx = Number(data.dlx || 0);
        setWallet({ usdt, inr, dlx });
      } else {
        try {
          await setDoc(walletDoc, {
            mainUsdt: DEFAULT_WALLET.usdt,
            purchaseUsdt: 0,
            mainInr: DEFAULT_WALLET.inr,
            purchaseInr: 0,
            dlx: DEFAULT_WALLET.dlx,
            updatedAt: Date.now(),
          });
          setWallet(DEFAULT_WALLET);
        } catch {
          setWallet(DEFAULT_WALLET);
        }
      }
    });
    return () => {
      try { unsub(); } catch {}
    };
  }, [user?.id]);

  const refresh = async () => {
    if (!user?.id) return;
    const walletDoc = doc(firestore, 'wallets', user.id);
    const snap = await getDoc(walletDoc);
    if (snap.exists()) {
      const data = snap.data() as any;
      const usdt = Number(data.mainUsdt || 0) + Number(data.purchaseUsdt || 0);
      const inr = Number(data.mainInr || 0) + Number(data.purchaseInr || 0);
      const dlx = Number(data.dlx || 0);
      setWallet({ usdt, inr, dlx });
    }
  };

  return { wallet, refresh };
}