import { db } from '../config/supabase.js';

/**
 * Verifies the bearer token with Supabase Auth, loads the profile from
 * the `users` table and attaches it to req.user.
 * Rejects unauthenticated requests with 401.
 */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { data: authData, error: authError } = await db().auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    const { data: profile, error: profileError } = await db()
      .from('users')
      .select('id, name, email, role, institution_id, bureau_id, created_at, updated_at')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      const err = new Error(profileError.message);
      err.statusCode = 500;
      throw err;
    }
    if (!profile) {
      return res.status(401).json({
        success: false,
        message: 'User profile not found for this account',
      });
    }

    req.user = profile;
    req.token = token;
    return next();
  } catch (err) {
    return next(err);
  }
}
