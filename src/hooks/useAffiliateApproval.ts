import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

export interface AffiliateDoc {
  approved?: boolean;
  clicks?: number;
  referrals?: number;
  sales?: number;
  earnings?: number;
  invitesSent?: number;
  slug?: string;
  ownerId?: string;
  [key: string]: any;
}

export function useAffiliateApproval() {
  const { user } = useUser();
  const [approved, setApproved] = useState<boolean>(false);
  const [affiliate, setAffiliate] = useState<AffiliateDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user?.id) {
      setApproved(false);
      setAffiliate(null);
      setLoading(false);
      return;
    }
    const d = doc(firestore, 'affiliates', user.id);
    const unsub = onSnapshot(d, (snap) => {
      const data = (snap.exists() ? (snap.data() as AffiliateDoc) : {}) || {};
      setAffiliate(data);
      setApproved(Boolean(data.approved));
      setLoading(false);
    });
    return () => { try { unsub(); } catch {} };
  }, [user?.id]);

  return { approved, affiliate, loading };
}