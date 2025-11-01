import { useEffect, useState } from 'react';
import { firestore } from '../firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

export interface MarketingCategoryItem {
  id: string;
  title: string;
  description?: string;
  price?: string; // legacy combined price text
  priceUsd?: number;
  priceInr?: number;
  imageUrl?: string;
  linkUrl?: string;
  createdAt?: any;
}

export function useMarketingCategories() {
  const [items, setItems] = useState<MarketingCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(firestore, 'marketingCategories'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      try {
        const list: MarketingCategoryItem[] = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            title: v.title ?? v.name ?? 'Untitled',
            description: v.description ?? '',
            price: v.price ?? v.priceINR ?? v.priceUSD ?? v.priceRange ?? '',
            priceUsd: typeof v.priceUsd === 'number' ? v.priceUsd : (typeof v.priceUSD === 'number' ? v.priceUSD : undefined),
            priceInr: typeof v.priceInr === 'number' ? v.priceInr : (typeof v.priceINR === 'number' ? v.priceINR : undefined),
            imageUrl: v.imageUrl ?? v.image ?? '',
            linkUrl: v.linkUrl ?? v.url ?? v.redirectUrl ?? '',
            createdAt: v.createdAt,
          };
        });
        setItems(list);
        setLoading(false);
        setError(null);
      } catch (e: any) {
        setItems([]);
        setLoading(false);
        setError(e?.message || 'Failed to load marketing categories');
      }
    }, (err) => {
      setItems([]);
      setLoading(false);
      setError(err?.message || 'Failed to load marketing categories');
    });
    return () => unsub();
  }, []);

  return { items, loading, error };
}


