import { db } from '../config/supabase.js';
import {
  badRequest,
  handleSupabaseError,
  notFoundError,
} from '../middleware/error.middleware.js';

const ALLOWED_ROLES = ['CITIZEN', 'OFFICER', 'BUREAU_HEAD', 'ADMIN'];
const PUBLIC_ROLES = ['CITIZEN', 'OFFICER'];

/**
 * passwords are handled by Supabase Auth (bcrypt on the Supabase side).
 * The `users.password_hash` column is NOT NULL in the schema, so local
 * rows store a marker instead of any credential — never a plaintext password.
 */
const PASSWORD_HASH_MARKER = 'SUPABASE_AUTH_MANAGED';

/** Never expose password_hash in API responses. */
function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

/**
 * POST /api/auth/register
 * body: { name, email, password, role?, institution_id?, bureau_id? }
 */
export async function register(req, res) {
  const { name, email, password, role, institution_id, bureau_id } = req.body || {};

  if (!name || !String(name).trim()) throw badRequest('name is required');
  if (!email || !String(email).trim()) throw badRequest('email is required');
  if (!password || String(password).length < 8) {
    throw badRequest('password must be at least 8 characters');
  }

  const finalRole = role || 'CITIZEN';
  if (!ALLOWED_ROLES.includes(finalRole)) {
    throw badRequest(
      `role must be one of: ${ALLOWED_ROLES.join(', ')}`
    );
  }
  if (!PUBLIC_ROLES.includes(finalRole)) {
    throw badRequest(
      `${finalRole} accounts are created by an administrator, not by self-registration`
    );
  }

  const client = db();

  const { data: authData, error: authError } = await client.auth.signUp({
    email: String(email).trim().toLowerCase(),
    password: String(password),
    options: { data: { name: String(name).trim(), role: finalRole } },
  });
  if (authError) throw badRequest(authError.message);
  if (!authData?.user) throw badRequest('Registration failed');

  const { data: inserted, error: insertError } = await client
    .from('users')
    .insert([
      {
        id: authData.user.id,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        password_hash: PASSWORD_HASH_MARKER,
        role: finalRole,
        institution_id: institution_id || null,
        bureau_id: bureau_id || null,
      },
    ])
    .select('id, name, email, role, institution_id, bureau_id, created_at')
    .single();

  if (insertError) throw handleSupabaseError(insertError);

  res.status(201).json({
    success: true,
    message: authData.session
      ? 'Registration successful'
      : 'Registration successful. Check your email to confirm the account.',
    data: {
      user: publicUser(inserted),
      access_token: authData.session?.access_token || null,
    },
  });
}

/**
 * POST /api/auth/login
 * body: { email, password }
 */
export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) throw badRequest('email and password are required');

  const client = db();

  const { data, error } = await client.auth.signInWithPassword({
    email: String(email).trim().toLowerCase(),
    password: String(password),
  });
  if (error) throw badRequest(error.message || 'Invalid credentials');

  const { data: profile, error: profileError } = await client
    .from('users')
    .select('id, name, email, role, institution_id, bureau_id, created_at')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profileError) throw handleSupabaseError(profileError);
  if (!profile) throw notFoundError('User profile not found');

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: publicUser(profile),
      access_token: data.session.access_token,
      expires_at: data.session.expires_at,
    },
  });
}

/**
 * POST /api/auth/logout
 * Supabase JWTs are stateless: the token was already verified by the
 * authenticate middleware; the client discards its token on success.
 */
export async function logout(req, res) {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: {},
  });
}

/** GET /api/auth/me */
export async function getMe(req, res) {
  res.status(200).json({
    success: true,
    message: 'Profile fetched successfully',
    data: { user: publicUser(req.user) },
  });
}
