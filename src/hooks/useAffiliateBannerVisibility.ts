import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function useAffiliateBannerVisibility() {
  const { user } = useUser();
  const [shouldHideBanners, setShouldHideBanners] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(firestore, 'users', user.id), (doc) => {
      try {
        if (doc.exists()) {
          const data = doc.data();
          // Hide banners if user is an approved affiliate
          const isApprovedAffiliate = data.affiliateApproved || data.affiliateStatus === 'approved';
          setShouldHideBanners(isApprovedAffiliate);
        } else {
          setShouldHideBanners(false);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking affiliate status:', error);
        setLoading(false);
      }
    }, (err) => {
      console.error('Affiliate status stream failed:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  return {
    shouldHideBanners,
    loading
  };
}
