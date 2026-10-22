import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Paperclip, Search, Send, ShieldCheck, X } from 'lucide-react';

import Button from '../components/common/Button.jsx';

// Mock data import — institution options come from the central dataset.
import { CATEGORIES, INSTITUTIONS, PRIORITIES } from '../data/mockData.js';

const DRAFT_KEY = 'aicte_complaint_draft';
const SUBMISSIONS_KEY = 'aicte_complaint_submissions';

const SLA_DAYS_BY_PRIORITY = { Critical: 3, High: 5, Medium: 10, Low: 15 };

const INPUT_CLASS =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  institutionId: '',
  institutionCode: '',
  state: '',
  district: '',
  title: '',
  category: '',
  description: '',
  priority: 'Medium',
};

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDaysIso(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function Field({ label, required = false, error = '', hint = '', children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

/**
 * Public complaint submission form. Frontend validation only; submissions and
 * drafts are stored in localStorage until the Express backend is connected.
 */
export default function ComplaintSubmission() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [draftRestored, setDraftRestored] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);

  // Restore a saved draft (if any) on first load.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft === 'object') {
          setForm({ ...EMPTY_FORM, ...draft.form });
          setAttachments(draft.attachments || []);
          setDraftRestored(true);
        }
      }
    } catch {
      // Ignore corrupt drafts.
    }
  }, []);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleInstitutionChange = (institutionId) => {
    const institution = INSTITUTIONS.find((i) => i.id === institutionId);
    setForm((prev) => ({
      ...prev,
      institutionId,
      institutionCode: institution ? institution.code : '',
      state: institution ? institution.state : '',
      district: institution ? institution.district : '',
    }));
    setErrors((prev) => ({ ...prev, institutionId: '' }));
  };

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []);
    const next = files.map((file) => ({
      name: file.name,
      size: file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`,
    }));
    setAttachments((prev) => [...prev, ...next]);
    event.target.value = '';
  };

  const removeAttachment = (name) => {
    setAttachments((prev) => prev.filter((file) => file.name !== name));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.phone.trim()) next.phone = 'Phone is required.';
    else {
      const digits = form.phone.replace(/\D/g, '');
      if (digits.length < 10) next.phone = 'Enter a valid phone number (at least 10 digits).';
    }
    if (!form.institutionId) next.institutionId = 'Please select an institution.';
    if (!form.title.trim()) next.title = 'Complaint title is required.';
    else if (form.title.trim().length < 5) next.title = 'Title must be at least 5 characters.';
    if (!form.category) next.category = 'Please select a category.';
    if (!form.description.trim()) next.description = 'Description is required.';
    else if (form.description.trim().length < 20) next.description = 'Describe the issue in at least 20 characters.';
    if (!form.priority) next.priority = 'Please select a priority.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveDraft = () => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, attachments }));
      setDraftRestored(true);
    } catch {
      // Storage unavailable — ignore.
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const institution = INSTITUTIONS.find((i) => i.id === form.institutionId);
    const createdAt = todayIso();
    const slaDays = SLA_DAYS_BY_PRIORITY[form.priority];
    const id = `CMP-${String(Date.now()).slice(-5)}`;

    const record = {
      id,
      title: form.title.trim(),
      category: form.category,
      priority: form.priority,
      status: 'Pending',
      institutionId: form.institutionId,
      institutionName: institution ? institution.name : form.institutionId,
      institutionCode: form.institutionCode,
      state: form.state,
      district: form.district,
      complainant: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      },
      description: form.description.trim(),
      createdAt,
      updatedAt: createdAt,
      slaDueDate: addDaysIso(createdAt, slaDays),
      slaDays,
      daysOverdue: 0,
      slaBreached: false,
      attachments: attachments.map((a) => a.name),
    };

    try {
      const existing = JSON.parse(window.localStorage.getItem(SUBMISSIONS_KEY) || '[]');
      window.localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify([record, ...existing]));
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Storage unavailable — the success screen still shows the ID.
    }

    setSubmittedId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* Success screen */
  if (submittedId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Complaint submitted</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your complaint has been recorded. Keep this complaint number to track its progress:
          </p>
          <p className="mt-4 inline-block rounded-lg border border-dashed border-blue-300 bg-blue-50 px-5 py-2.5 font-mono text-lg font-semibold text-blue-700">
            {submittedId}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={`/track?id=${submittedId}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
            >
              <Search className="h-4 w-4" />
              Track This Complaint
            </Link>
            <Button
              variant="secondary"
              onClick={() => {
                setForm(EMPTY_FORM);
                setAttachments([]);
                setSubmittedId(null);
                setErrors({});
              }}
            >
              Submit Another
            </Button>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-5 text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  /* Form */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple public header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-slate-900">AICTE CMS</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-700">
            Cancel &amp; exit
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Submit a Complaint</h1>
          <p className="mt-1 text-sm text-slate-500">
            Fill in all required fields. All sections are marked with <span className="text-red-500">*</span>.
          </p>
        </div>

        {draftRestored && !submittedId ? (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <span>A saved draft was restored on this device.</span>
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM);
                setAttachments([]);
                setDraftRestored(false);
                try {
                  window.localStorage.removeItem(DRAFT_KEY);
                } catch {
                  // Ignore.
                }
              }}
              className="font-medium hover:underline"
            >
              Clear draft
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Complainant Information */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Complainant Information</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-3">
              <Field label="Name" required error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="Your full name"
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Email" required error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="you@example.com"
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Phone" required error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
          </section>

          {/* Institution Information */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Institution Information</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Institution" required error={errors.institutionId}>
                  <select
                    value={form.institutionId}
                    onChange={(e) => handleInstitutionChange(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="">Select an institution…</option>
                    {INSTITUTIONS.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Institution Code" hint="Auto-filled from the selected institution">
                <input
                  value={form.institutionCode}
                  onChange={(e) => setField('institutionCode', e.target.value)}
                  placeholder="AICTE-XX-0000"
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Type" hint="Derived from institution record">
                <input
                  readOnly
                  value={
                    (INSTITUTIONS.find((i) => i.id === form.institutionId) || {}).type || '—'
                  }
                  className={`${INPUT_CLASS} bg-slate-50 text-slate-500`}
                />
              </Field>
              <Field label="State" required>
                <input
                  value={form.state}
                  onChange={(e) => setField('state', e.target.value)}
                  placeholder="State"
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="District" required>
                <input
                  value={form.district}
                  onChange={(e) => setField('district', e.target.value)}
                  placeholder="District"
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
          </section>

          {/* Complaint Information */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Complaint Information</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Title" required error={errors.title}>
                  <input
                    value={form.title}
                    onChange={(e) => setField('title', e.target.value)}
                    placeholder="Brief summary of the complaint"
                    className={INPUT_CLASS}
                  />
                </Field>
              </div>
              <Field label="Category" required error={errors.category}>
                <select
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Select a category…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Priority" required error={errors.priority}>
                <div className="mt-1 flex flex-wrap gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setField('priority', p)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        form.priority === p
                          ? 'border-blue-700 bg-blue-50 text-blue-700'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Description"
                  required
                  error={errors.description}
                  hint="Include dates, locations and any reference numbers (min. 20 characters)."
                >
                  <textarea
                    rows={6}
                    value={form.description}
                    onChange={(e) => setField('description', e.target.value)}
                    placeholder="Describe the issue in detail…"
                    className={`${INPUT_CLASS} resize-y`}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Attachments */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Attachments</h2>
              <p className="text-xs text-slate-500">
                Optional — files are listed locally and uploaded only after the backend is connected.
              </p>
            </div>
            <div className="px-5 py-5">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-blue-400 hover:bg-blue-50/40">
                <Paperclip className="h-5 w-5 text-slate-400" />
                <span className="mt-2 text-sm font-medium text-slate-600">
                  Click to attach files
                </span>
                <span className="mt-0.5 text-xs text-slate-400">Images, PDF or documents</span>
                <input type="file" multiple onChange={handleFiles} className="hidden" />
              </label>

              {attachments.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {attachments.map((file) => (
                    <li
                      key={file.name}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                        <Paperclip className="h-4 w-4 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{file.name}</span>
                      </span>
                      <span className="flex flex-shrink-0 items-center gap-3">
                        <span className="text-xs text-slate-400">{file.size}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(file.name)}
                          aria-label={`Remove ${file.name}`}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => navigate('/')} type="button">
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft} type="button">
              Save Draft
            </Button>
            <Button type="submit" icon={<Send className="h-4 w-4" />}>
              Submit Complaint
            </Button>
          </div>

          <p className="flex items-center justify-end gap-1.5 pb-6 text-xs text-slate-400">
            After submitting you will receive a complaint number like
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium text-slate-500">CMP-10245</span>
            <Link to="/track" className="font-medium text-blue-700 hover:underline">
              (track it here)
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
