import { useEffect, useState } from 'react';
import { firestore } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export interface DatabaseMarketingCategory {
  id: string;
  name: string;
  description: string;
  image?: string; // Full URL to thumbnail image
  priceINR?: string; // may be number or range or string with symbol
  priceUSD?: string; // may be number or range or string with symbol
  priceRange?: string;
  contactCount?: number;
  category?: string; // slug or grouping key
  createdAt?: any; // Firestore Timestamp
}

export function useDatabaseMarketingCategories() {
  const [categories, setCategories] = useState<DatabaseMarketingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(firestore, 'databaseMarketingCategories'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const data: DatabaseMarketingCategory[] = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            name: v.name ?? 'Untitled',
            description: v.description ?? '',
            image: v.image ?? '',
            priceINR: v.priceINR ?? v.priceRange ?? '',
            priceUSD: v.priceUSD ?? '',
            priceRange: v.priceRange ?? '',
            contactCount: typeof v.contactCount === 'number' ? v.contactCount : undefined,
            category: v.category ?? '',
            createdAt: v.createdAt,
          };
        });
        if (!isMounted) return;
        try { console.log('[useDatabaseMarketingCategories] fetched', data.length, 'items', data.slice(0, 2)); } catch {}
        setCategories(data);
        setError(null);
      } catch (err: any) {
        console.error('[useDatabaseMarketingCategories] getDocs error:', err);
        if (!isMounted) return;
        setError(err?.message || 'Failed to load categories');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => { isMounted = false; };
  }, []);

  return { categories, loading, error };
}


