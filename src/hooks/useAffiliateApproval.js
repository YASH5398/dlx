import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';
export function useAffiliateApproval() {
    const { user } = useUser();
    const [approved, setApproved] = useState(false);
    const [affiliate, setAffiliate] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!user?.id) {
            setApproved(false);
            setAffiliate(null);
            setLoading(false);
            return;
        }
        const d = doc(firestore, 'affiliates', user.id);
        const unsub = onSnapshot(d, (snap) => {
            const data = (snap.exists() ? snap.data() : {}) || {};
            setAffiliate(data);
            setApproved(Boolean(data.approved));
            setLoading(false);
        });
        return () => { try {
            unsub();
        }
        catch { } };
    }, [user?.id]);
    return { approved, affiliate, loading };
}
