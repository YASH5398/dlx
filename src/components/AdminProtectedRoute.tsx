import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

type Props = { children: ReactNode };

export default function AdminProtectedRoute({ children }: Props) {
  const [initialized, setInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('http://localhost:4000/api/admin/session', {
          credentials: 'include',
        });
        setIsAdmin(res.ok);
      } catch {
        setIsAdmin(false);
      } finally {
        if (mounted) setInitialized(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!initialized) return null;
  if (!isAdmin) {
    return <Navigate to="/secret-admin/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}