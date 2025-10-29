import { useEffect, useMemo, useState, useCallback } from 'react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useUser } from '../context/UserContext';

export interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatar: string;
  createdAt?: string;
  userId?: string;
}

const REVIEW_AVATARS = [
  '/assets/reviewers/avatar1.svg',
  '/assets/reviewers/avatar2.svg',
  '/assets/reviewers/avatar3.svg',
  '/assets/reviewers/avatar4.svg',
];

const REVIEW_TEXTS = [
  "Outstanding app! Helped boost my affiliate business 🚀",
  "Perfectly managed system, Digi Linex support is awesome 💪",
  "Very professional service, increased my online sales significantly 💼",
  "Flawless experience, 5-star for the team 🌟",
  "Amazing results! My business growth has been incredible 📈",
  "Top-notch quality and excellent customer support 🎯",
  "Exceeded expectations, highly recommend to everyone ⭐",
  "Game-changer for my business, worth every penny 💎",
  "Outstanding service delivery and communication 🔥",
  "Professional team, delivered exactly what was promised ✨",
  "Incredible value for money, transformed my business 🚀",
  "Best decision I made for my business growth 💯",
  "Exceptional quality and attention to detail 🎨",
  "Outstanding support team, always available to help 🤝",
  "Perfect implementation, exceeded all expectations 🏆",
  "Amazing experience from start to finish 🌟",
  "Highly professional and reliable service 💪",
  "Game-changing solution for my business needs 🚀",
  "Outstanding results, highly recommend! ⭐",
  "Perfect execution and excellent communication 💼"
];

const REVIEWER_NAMES = [
  "Sarah Johnson",
  "Michael Chen",
  "Emily Rodriguez",
  "David Thompson",
  "Lisa Wang",
  "James Wilson",
  "Maria Garcia",
  "Robert Brown",
  "Jennifer Lee",
  "Christopher Davis",
  "Amanda Taylor",
  "Daniel Martinez",
  "Jessica Anderson",
  "Matthew White",
  "Ashley Thomas",
  "Ryan Jackson",
  "Nicole Harris",
  "Kevin Moore",
  "Stephanie Clark",
  "Brandon Lewis"
];

function generateDummyReviews(serviceName: string, min = 12, max = 18): Review[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const list: Review[] = [];
  for (let i = 0; i < count; i++) {
    const name = REVIEWER_NAMES[Math.floor(Math.random() * REVIEWER_NAMES.length)];
    const text = REVIEW_TEXTS[Math.floor(Math.random() * REVIEW_TEXTS.length)];
    const avatar = REVIEW_AVATARS[Math.floor(Math.random() * REVIEW_AVATARS.length)];
    const rating = Math.round((Math.random() * 0.5 + 4.5) * 10) / 10;
    list.push({ id: `dummy-${serviceName}-${i}`, name, text, rating, avatar });
  }
  return list;
}

async function checkReviewEligibility(userId: string, serviceId: string, serviceName: string): Promise<boolean> {
  try {
    // Prefer explicit serviceId matching
    const q1 = query(collection(firestore, 'orders'), where('userId', '==', userId), where('serviceId', '==', serviceId), where('reviewAllowed', '==', true));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) return true;

    // Fallback: productName/title contains serviceName and reviewAllowed true
    const q2 = query(collection(firestore, 'orders'), where('userId', '==', userId), where('reviewAllowed', '==', true));
    const snap2 = await getDocs(q2);
    for (const d of snap2.docs) {
      const data: any = d.data();
      const title = String(data?.title || data?.productName || '').toLowerCase();
      if (serviceName && title.includes(serviceName.toLowerCase())) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export const useReviews = (serviceId: string | null, serviceName: string) => {
  const { user } = useUser();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [firestoreReviews, setFirestoreReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canWriteReview, setCanWriteReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Stream Firestore reviews
  useEffect(() => {
    if (!serviceId) return;
    setLoading(true);
    setError(null);
    const q = collection(firestore, 'services', serviceId, 'reviews');
    const unsub = onSnapshot(q, (snap) => {
      const list: Review[] = [];
      snap.forEach((doc) => {
        const d: any = doc.data();
        list.push({
          id: doc.id,
          name: d?.userName || 'Anonymous',
          text: d?.review || '',
          rating: Number(d?.rating || 0),
          avatar: REVIEW_AVATARS[(doc.id.length + (d?.userId?.length || 0)) % REVIEW_AVATARS.length],
          createdAt: d?.createdAt,
          userId: d?.userId,
        });
      });
      setFirestoreReviews(list);
      setLoading(false);
    }, (err) => {
      setError('Failed to load reviews');
      setLoading(false);
      console.error('Reviews stream error:', err);
    });
    return () => unsub();
  }, [serviceId]);

  // Eligibility check
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id || !serviceId) { setCanWriteReview(false); return; }
      const ok = await checkReviewEligibility(user.id, serviceId, serviceName);
      if (!cancelled) setCanWriteReview(ok);
    })();
    return () => { cancelled = true; };
  }, [user?.id, serviceId, serviceName]);

  const dummy = useMemo(() => generateDummyReviews(serviceName), [serviceName]);

  const mergedReviews = useMemo(() => {
    // Real first, then dummy; keep cap around 18-24 to maintain UX density
    const combined = [...firestoreReviews, ...dummy];
    return combined.slice(0, 24);
  }, [firestoreReviews, dummy]);

  const averageRating = useMemo(() => {
    if (firestoreReviews.length === 0) return 4.8; // baseline from dummy
    const sum = firestoreReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = sum / firestoreReviews.length;
    return Math.round(avg * 10) / 10;
  }, [firestoreReviews]);

  const openReviewModal = () => setIsReviewModalOpen(true);
  const closeReviewModal = () => setIsReviewModalOpen(false);

  const submitReview = useCallback(async (rating: number, text: string) => {
    if (!user?.id || !user?.name || !user?.email || !serviceId) {
      throw new Error('Not authenticated or service unavailable');
    }
    if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');
    if (!text || text.trim().length < 10) throw new Error('Please write at least 10 characters');

    setSubmitting(true);
    try {
      const payload = {
        userId: user.id,
        userName: user.name || 'Anonymous',
        userEmail: user.email || '',
        rating: Number(rating),
        review: text.trim(),
        createdAt: new Date().toISOString(),
        // Also include server timestamp for ordering if needed
        createdAtServer: serverTimestamp(),
      };
      await addDoc(collection(firestore, 'services', serviceId, 'reviews'), payload);
      // Optimistic: Firestore stream will update; no manual list mutation required
    } finally {
      setSubmitting(false);
    }
  }, [user?.id, user?.name, user?.email, serviceId]);

  return {
    isReviewModalOpen,
    openReviewModal,
    closeReviewModal,
    reviews: mergedReviews,
    averageRating,
    realReviewsCount: firestoreReviews.length,
    loading,
    error,
    canWriteReview,
    submitting,
    submitReview,
  };
};
