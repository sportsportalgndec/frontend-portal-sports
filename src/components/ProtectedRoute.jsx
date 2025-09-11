import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import { LoadingPage } from './ui/loading';

const ProtectedRoute = ({ children, role }) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await API.get('/auth/me', { withCredentials: true });
        const user = res.data.user;

        // ✅ check activeRole or roles array
        if (user.activeRole === role || (user.roles && user.roles.includes(role))) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [role, location.pathname]); // Re-check on route change

  // Prevent back button access after logout
  useEffect(() => {
    if (!authorized && !loading) {
      // Clear browser history to prevent back button access
      window.history.replaceState(null, '', '/');
    }
  }, [authorized, loading]);

  if (loading) return <LoadingPage message="Verifying authentication..." />;
  return authorized ? children : <Navigate to="/" replace />; // Use replace to prevent back button
};

export default ProtectedRoute;
