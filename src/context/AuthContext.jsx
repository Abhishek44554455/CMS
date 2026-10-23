import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as api from '../services/api.js';

const AuthContext = createContext(null);

/**
 * Single source of truth for the signed-in user.
 * Pages/Header use useAuth() instead of duplicating session logic.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.getStoredUser());
  const [initializing, setInitializing] = useState(() => Boolean(api.getToken()));

  // Revalidate a stored session on first mount (token may have expired).
  useEffect(() => {
    let cancelled = false;
    if (!api.getToken()) {
      setInitializing(false);
      return () => {};
    }
    api
      .getCurrentUser()
      .then((fresh) => {
        if (!cancelled) {
          if (fresh) setUser(fresh);
          else {
            api.clearSession();
            setUser(null);
          }
        }
      })
      .catch((err) => {
        // Only an invalid/expired token signs the user out; a server outage
        // keeps the cached session so the UI can report the real error.
        if (!cancelled && (err?.status === 401 || err?.status === 403)) {
          api.clearSession();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const nextUser = await api.login({ email, password });
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (payload) => {
    const nextUser = await api.register(payload);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
