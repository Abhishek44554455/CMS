/**
 * Frontend authentication helper.
 *
 * Uses Supabase Auth through the Express API (never directly):
 *   Login  -> POST /api/auth/login   -> { user, access_token }
 *   Logout -> POST /api/auth/logout
 *   Session-> token + profile kept in sessionStorage (per tab)
 *
 * React components consume this through src/context/AuthContext.jsx
 * instead of calling these functions ad hoc.
 */
import * as api from './api.js';

export async function signIn(email, password) {
  const user = await api.login({ email, password });
  return user;
}

export async function signUp(payload) {
  return api.register(payload);
}

export async function signOut() {
  await api.logout();
}

export function restoreSession() {
  return { user: api.getStoredUser(), token: api.getToken() };
}

export async function fetchCurrentUser() {
  return api.getCurrentUser();
}

/** Roles allowed into the /admin console. */
export const ADMIN_ROLES = ['ADMIN', 'BUREAU_HEAD', 'OFFICER'];

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}
