import { useEffect, useState } from 'react';
import { DEFAULT_WALLET } from '../utils/constants';
import { addOrder, getOrders } from '../utils/api';
import { db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import { useUser } from '../context/UserContext';

export type WalletState = { dlx: number; usdt: number; inr: number };

export function useWallet() {
  const { user } = useUser();
  const [wallet, setWallet] = useState<WalletState>(DEFAULT_WALLET);

  useEffect(() => {
    if (!user) return;
    const walletRef = ref(db, `users/${user.id}/wallet`);
    const unsub = onValue(walletRef, (snap) => {
      const val = snap.val();
      if (val) setWallet(val);
      else update(walletRef, DEFAULT_WALLET);
    });
    return () => unsub();
  }, [user?.id]);

  const refresh = () => {
    if (!user) return;
    const walletRef = ref(db, `users/${user.id}/wallet`);
    update(walletRef, wallet);
  };

  const payPartialDLX = (title: string, totalUsd: number, fiat: 'inr' | 'usdt') => {
    const fifty = totalUsd / 2;
    setWallet((prev) => {
      if (prev.dlx < fifty || prev[fiat] < fifty) throw new Error('Insufficient balance');
      const next = { ...prev, dlx: prev.dlx - fifty, [fiat]: prev[fiat] - fifty } as WalletState;
      if (user) update(ref(db, `users/${user.id}/wallet`), next);
      addOrder({ title, priceInUsd: totalUsd, priceInInr: Math.round(totalUsd * 83), status: 'paid' }, user?.id);
      return next;
    });
  };

  return { wallet, refresh, payPartialDLX, orders: getOrders(user?.id) };
}