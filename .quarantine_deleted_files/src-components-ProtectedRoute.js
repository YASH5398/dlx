import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, initialized, mfaRequired, mfaVerified } = useUser();
    const location = useLocation();
    // Wait for auth to hydrate before making a redirect decision
    if (!initialized) {
        return null; // or a loader component
    }
    if (!isAuthenticated) {
        if (import.meta.env.DEV) {
            const raw = localStorage.getItem('dlx-auth');
            if (raw)
                console.warn('ProtectedRoute: unauthenticated but dlx-auth present. Redirecting to /login.', raw);
        }
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: location } });
    }
    if (mfaRequired && !mfaVerified && location.pathname !== '/otp') {
        return _jsx(Navigate, { to: "/otp", replace: true, state: { from: location } });
    }
    return _jsx(_Fragment, { children: children });
};
export default ProtectedRoute;
