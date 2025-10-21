import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { auth, firestore } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

type Props = { children: ReactNode };

export default function AdminProtectedRoute({ children }: Props) {
  const [initialized, setInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', u.uid));
          const data = userDoc.data() as any || {};
          const role = (data.role || data.userRole || '').toLowerCase();
          setIsAdmin(userDoc.exists() && role === 'admin');
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setInitialized(true);
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  if (!initialized) return null;
  if (!isAdmin) {
    return <Navigate to="/secret-admin/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}