import { useEffect, useState, useRef } from 'react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { firestore } from '../firebase';

export interface ReviewerPreview {
  id: string;
  name: string;
  avatar?: string;
}

export function useReviewPreview(serviceId: string | null) {
  const [reviewers, setReviewers] = useState<ReviewerPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const fallbackUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!serviceId) {
      setReviewers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Use createdAtServer if available, otherwise createdAt (handled in error callback)
    const q = query(
      collection(firestore, 'services', serviceId, 'reviews'),
      orderBy('createdAtServer', 'desc'),
      limit(4)
    );

    const processSnapshot = (snapshot: any) => {
      const list: ReviewerPreview[] = [];
      snapshot.forEach((doc: any) => {
        const data: any = doc.data();
        const name = data?.userName || '';
        // Only include reviewers with names (hide anonymous/missing)
        if (name && name.trim()) {
          list.push({
            id: doc.id,
            name: name.trim(),
            avatar: typeof data?.avatarUrl === 'string' && data.avatarUrl ? data.avatarUrl : undefined,
          });
        }
      });
      setReviewers(list.slice(0, 4));
      setLoading(false);
    };

    const unsubscribe = onSnapshot(
      q,
      processSnapshot,
      (error) => {
        // If createdAtServer doesn't exist, try createdAt instead
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
          const fallbackQ = query(
            collection(firestore, 'services', serviceId, 'reviews'),
            orderBy('createdAt', 'desc'),
            limit(4)
          );
          fallbackUnsubRef.current = onSnapshot(
            fallbackQ,
            processSnapshot,
            (fallbackError) => {
              console.error('Review preview fallback error:', fallbackError);
              setReviewers([]);
              setLoading(false);
            }
          );
        } else {
          console.error('Review preview error:', error);
          setReviewers([]);
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribe();
      if (fallbackUnsubRef.current) {
        fallbackUnsubRef.current();
        fallbackUnsubRef.current = null;
      }
    };
  }, [serviceId]);

  return { reviewers, loading };
}

