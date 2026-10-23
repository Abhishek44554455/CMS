import { createClient } from '@supabase/supabase-js';

/**
 * Centralized Supabase access.
 *
 * Uses the SERVICE ROLE key and must only ever run on the server.
 * The key is read from backend/.env — never hardcoded, never sent to
 * the React frontend.
 *
 * The client is created lazily-safe: if the env vars are missing the
 * process still starts (health check works) and database calls fail
 * with a clear 503 through db().
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

/** Returns the configured client or throws a 503-style error. */
export function db() {
  if (!supabase) {
    const err = new Error(
      'Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env'
    );
    err.statusCode = 503;
    throw err;
  }
  return supabase;
}
