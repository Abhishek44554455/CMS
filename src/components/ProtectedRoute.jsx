import { Navigate } from 'react-router-dom';

import Loading from './common/Loading.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ADMIN_ROLES } from '../services/auth.js';

/**
 * Guards the /admin console:
 *   - while the stored session is being validated -> loading state
 *   - not signed in                              -> /login
 *   - signed in but not a staff role              -> /
 *
 * Reused on the admin layout so no page has to duplicate the check.
 */
export default function ProtectedRoute({ children, roles = ADMIN_ROLES }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loading label="Checking your session…" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
