import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, UserRound } from 'lucide-react';

import Button from '../components/common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as api from '../services/api.js';
import { ADMIN_ROLES } from '../services/auth.js';

const INPUT_CLASS =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrator (full admin dashboard)' },
  { value: 'BUREAU_HEAD', label: 'Bureau Head' },
  { value: 'OFFICER', label: 'Officer' },
  { value: 'CITIZEN', label: 'Citizen (submit & track complaints)' },
];

/**
 * Account creation for the admin dashboard.
 * POST /api/auth/register -> Supabase Auth + users profile row.
 */
export default function Signup() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN',
  });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.password) nextErrors.password = 'Password is required.';
    else if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setNotice('');
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      if (api.getToken()) {
        navigate(ADMIN_ROLES.includes(form.role) ? '/admin' : '/', { replace: true });
      } else {
        setNotice('Account created. Confirm your email address, then sign in.');
      }
    } catch (err) {
      setNotice(err?.message || 'Unable to create the account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-white">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register for the AICTE Complaint Management console
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="signup-name">
                Full name
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-[13px] h-4 w-4 text-slate-400" />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="Your full name"
                  className={`${INPUT_CLASS} pl-9`}
                />
              </div>
              {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700" htmlFor="signup-email">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-[13px] h-4 w-4 text-slate-400" />
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="you@example.com"
                  className={`${INPUT_CLASS} pl-9`}
                />
              </div>
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700" htmlFor="signup-password">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-[13px] h-4 w-4 text-slate-400" />
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder="At least 8 characters"
                  className={`${INPUT_CLASS} pl-9`}
                />
              </div>
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              ) : null}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700" htmlFor="signup-role">
                Role
              </label>
              <select
                id="signup-role"
                value={form.role}
                onChange={(e) => setField('role', e.target.value)}
                className={INPUT_CLASS}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" fullWidth className="mt-6" size="lg" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          {notice ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              {notice}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col items-center gap-3 border-t border-slate-200 pt-5 text-sm">
            <p className="text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="font-medium text-blue-700 hover:underline">
                Sign in
              </Link>
            </p>
            <Link to="/" className="text-slate-500 hover:text-slate-700">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
