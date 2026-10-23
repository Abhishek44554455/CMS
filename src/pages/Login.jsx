import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

import Button from '../components/common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const INPUT_CLASS =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600';

/**
 * Login page — sends credentials to POST /api/auth/login, stores the session
 * (sessionStorage via AuthContext) and redirects to the admin dashboard.
 */
export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.password) nextErrors.password = 'Password is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setNotice('');
    try {
      const user = await login(form.email.trim(), form.password);
      if (user) navigate('/admin', { replace: true });
    } catch (err) {
      setNotice(err?.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Already signed in -> straight to the console.
  if (isAuthenticated) return <Navigate to="/admin" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-white">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            AICTE Complaint Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to the administration console</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="login-email">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-[13px] h-4 w-4 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="admin@aicte.gov.in"
                  className={`${INPUT_CLASS} pl-9`}
                />
              </div>
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-[13px] h-4 w-4 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder="••••••••"
                  className={`${INPUT_CLASS} pl-9`}
                />
              </div>
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-700" />
                Remember me
              </label>
              <button type="button" className="font-medium text-blue-700 hover:underline">
                Forgot password?
              </button>
            </div>

            <Button type="submit" fullWidth className="mt-6" size="lg" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          {notice ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {notice}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col items-center gap-3 border-t border-slate-200 pt-5 text-sm">
            <Link to="/submit-complaint" className="font-medium text-blue-700 hover:underline">
              Submit a complaint
            </Link>
            <Link to="/" className="text-slate-500 hover:text-slate-700">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
