import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, initialized, mfaRequired, mfaVerified } = useUser() as any;
  const location = useLocation();

  // Wait for auth to hydrate before making a redirect decision
  if (!initialized) {
    return null; // or a loader component
  }

  if (!isAuthenticated) {
    if (import.meta.env.DEV) {
      const raw = localStorage.getItem('dlx-auth');
      if (raw) console.warn('ProtectedRoute: unauthenticated but dlx-auth present. Redirecting to /login.', raw);
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (mfaRequired && !mfaVerified && location.pathname !== '/otp') {
    return <Navigate to="/otp" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;