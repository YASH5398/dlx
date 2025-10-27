import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';

export interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  priceUsd: number;
  thumbnailUrl: string;
  downloadUrl: string;
  status: string;
  createdBy?: string;
  createdAt?: any;
  category?: string;
}

export function useDigitalProducts() {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productsRef = collection(firestore, 'digitalProducts');
    const q = query(productsRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const productsList: DigitalProduct[] = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            priceUsd: Number(data.priceUsd ?? data.price ?? 0),
            thumbnailUrl: data.thumbnailUrl ?? data.image ?? '',
            downloadUrl: data.downloadUrl ?? data.productLink ?? '',
            status: data.status ?? 'approved',
            createdBy: data.createdBy,
            createdAt: data.createdAt,
            category: data.category || 'General',
          };
        });
        
        // Filter only approved products
        const approvedProducts = productsList.filter(product => product.status === 'approved');
        setProducts(approvedProducts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching digital products:', error);
        setProducts([]);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error fetching digital products:', error);
      setProducts([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { products, loading };
}
