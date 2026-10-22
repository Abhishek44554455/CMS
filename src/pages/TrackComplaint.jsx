import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShieldCheck, TriangleAlert } from 'lucide-react';

import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Loading from '../components/common/Loading.jsx';
import ComplaintPriorityBadge from '../components/complaints/ComplaintPriorityBadge.jsx';
import ComplaintStatusBadge from '../components/complaints/ComplaintStatusBadge.jsx';
import ComplaintTimeline from '../components/complaints/ComplaintTimeline.jsx';

// Mock data import — lookup uses the central dataset plus locally submitted complaints.
import { formatDate, getComplaintById } from '../data/mockData.js';

const SUBMISSIONS_KEY = 'aicte_complaint_submissions';

const EXAMPLE_IDS = ['CMP-10245', 'CMP-10230', 'CMP-10215'];

function fromMock(c) {
  return {
    id: c.id,
    title: c.title,
    category: c.category,
    priority: c.priority,
    status: c.status,
    institutionName: c.institution.name,
    institutionCode: c.institutionCode,
    state: c.institution.state,
    district: c.institution.district,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    slaDueDate: c.slaDueDate,
    slaDays: c.slaDays,
    slaBreached: c.slaBreached,
    daysOverdue: c.daysOverdue,
    timeline: c.timeline,
  };
}

function fromLocal(r) {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    priority: r.priority,
    status: r.status,
    institutionName: r.institutionName,
    institutionCode: r.institutionCode,
    state: r.state,
    district: r.district,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    slaDueDate: r.slaDueDate,
    slaDays: r.slaDays,
    slaBreached: Boolean(r.slaBreached),
    daysOverdue: r.daysOverdue || 0,
    timeline: [
      {
        title: 'Complaint Submitted',
        date: r.createdAt,
        description: 'Complaint registered on the AICTE grievance portal.',
        completed: true,
        current: r.status !== 'Resolved',
      },
    ],
  };
}

function resolveComplaint(value) {
  const query = value.trim().toUpperCase();
  const mock = getComplaintById(query);
  if (mock) return fromMock(mock);

  try {
    const submissions = JSON.parse(window.localStorage.getItem(SUBMISSIONS_KEY) || '[]');
    const found = submissions.find((r) => String(r.id).toUpperCase() === query);
    if (found) return fromLocal(found);
  } catch {
    // Ignore storage errors.
  }
  return null;
}

function InfoField({ label, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 text-sm text-slate-800">{children}</div>
    </div>
  );
}

/** Public complaint tracking — look up by complaint number (mock + local submissions). */
export default function TrackComplaint() {
  const [searchParams] = useSearchParams();
  const paramId = searchParams.get('id') || '';

  const [query, setQuery] = useState(paramId);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const runLookup = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    setSearched(false);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setResult(resolveComplaint(trimmed));
      setSearched(true);
      setLoading(false);
    }, 400);
  };

  // Auto-track when arriving with ?id=CMP-xxxxx
  useEffect(() => {
    if (paramId) runLookup(paramId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

  // Clear any pending lookup timer on unmount.
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleSubmit = (event) => {
    event.preventDefault();
    runLookup(query);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Public header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-slate-900">AICTE CMS</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <Link to="/submit-complaint" className="hover:text-slate-700">Submit</Link>
            <Link to="/login" className="hover:text-slate-700">Login</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Track Your Complaint</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your complaint number to view status, SLA and timeline
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="track-id" className="block text-sm font-medium text-slate-700">
            Complaint Number
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="track-id"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. CMP-10245"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-mono text-sm uppercase tracking-wide text-slate-700 placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <Button type="submit" size="lg" icon={<Search className="h-4 w-4" />} disabled={loading}>
              Track Complaint
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>Try:</span>
            {EXAMPLE_IDS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setQuery(ex);
                  runLookup(ex);
                }}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-slate-600 hover:border-blue-300 hover:text-blue-700"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>

        {/* States */}
        <div className="mt-6">
          {loading ? <Loading label="Looking up complaint…" /> : null}

          {!loading && !searched ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-700">No complaint looked up yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Enter a complaint number above. Complaints submitted on this device are tracked
                locally in this demo.
              </p>
            </div>
          ) : null}

          {!loading && searched && !result ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <EmptyState
                title="Complaint not found"
                message={`No complaint matches “${query}”. Check the number and try again.`}
                action={
                  <Link
                    to="/submit-complaint"
                    className="inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                  >
                    Submit a new complaint
                  </Link>
                }
              />
            </div>
          ) : null}

          {!loading && searched && result ? (
            <div className="space-y-5">
              {/* Result header */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-blue-700">{result.id}</span>
                  <ComplaintStatusBadge status={result.status} />
                  <ComplaintPriorityBadge priority={result.priority} />
                  {result.slaBreached ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                      <TriangleAlert className="h-3 w-3" />
                      SLA Breached
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">{result.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {result.category} · {result.institutionName}
                </p>
              </div>

              {/* Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">Complaint Details</h3>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoField label="Complaint ID"><span className="font-medium">{result.id}</span></InfoField>
                  <InfoField label="Title">{result.title}</InfoField>
                  <InfoField label="Institution">{result.institutionName}</InfoField>
                  <InfoField label="Institution Code">{result.institutionCode}</InfoField>
                  <InfoField label="State / District">{result.district}, {result.state}</InfoField>
                  <InfoField label="Category">{result.category}</InfoField>
                  <InfoField label="Priority"><ComplaintPriorityBadge priority={result.priority} /></InfoField>
                  <InfoField label="Status"><ComplaintStatusBadge status={result.status} /></InfoField>
                  <InfoField label="Submitted Date">{formatDate(result.createdAt)}</InfoField>
                  <InfoField label="Last Updated">{formatDate(result.updatedAt)}</InfoField>
                  <InfoField label="SLA Due Date">
                    <span className={result.slaBreached ? 'font-medium text-red-600' : ''}>
                      {formatDate(result.slaDueDate)}
                    </span>
                  </InfoField>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-sm font-semibold text-slate-900">Complaint Timeline</h3>
                <ComplaintTimeline timeline={result.timeline} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
