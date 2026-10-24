import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShieldCheck, TriangleAlert } from 'lucide-react';

import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Loading from '../components/common/Loading.jsx';
import ComplaintPriorityBadge from '../components/complaints/ComplaintPriorityBadge.jsx';
import ComplaintStatusBadge from '../components/complaints/ComplaintStatusBadge.jsx';
import ComplaintTimeline from '../components/complaints/ComplaintTimeline.jsx';

import * as api from '../services/api.js';
import { formatDate } from '../data/mockData.js';

const EXAMPLE_IDS = ['CMP-10241', 'CMP-10245', 'CMP-10248'];

/**
 * Looks the complaint up on the backend (by complaint number) and maps its
 * history rows to timeline steps.
 */
async function resolveComplaint(value) {
  const number = String(value).trim();
  // Public endpoint — works signed in or signed out, returns complaint + timeline.
  const { complaint, timeline } = await api.trackComplaint(number);
  if (!complaint) throw new Error('Complaint not found');

  return {
    id: complaint.id,
    title: complaint.title,
    category: complaint.category,
    priority: complaint.priority,
    status: complaint.status,
    institutionName: complaint.institution.name,
    institutionCode: complaint.institutionCode,
    state: complaint.institution.state,
    district: complaint.institution.district,
    assignedOfficer: complaint.assignedOfficer,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    slaDueDate: complaint.slaDueDate,
    slaDays: complaint.slaDays,
    slaBreached: complaint.slaBreached,
    daysOverdue: complaint.daysOverdue,
    timeline,
  };
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
  const [error, setError] = useState(null);

  const runLookup = async (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setSearched(false);
    try {
      const found = await resolveComplaint(trimmed);
      setResult(found);
    } catch (err) {
      setError(err || new Error('Lookup failed'));
      setResult(null);
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  // Auto-track when arriving with ?id=CMP-xxxxx
  useEffect(() => {
    if (paramId) runLookup(paramId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

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
                Enter a complaint number above to fetch its live status from the complaint
                database.
              </p>
            </div>
          ) : null}

          {!loading && searched && !result ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <EmptyState
                title={
                  error?.status === 404
                    ? 'Complaint not found'
                    : error?.status === 400
                      ? 'Invalid complaint number'
                      : error?.status === 401 || error?.status === 403
                        ? 'Sign in required'
                        : 'Unable to look up complaint'
                }
                message={
                  error?.status === 404
                    ? `No complaint matches “${query}”. Check the number and try again.`
                    : error?.message || `No complaint matches “${query}”.`
                }
                action={
                  error?.status === 401 || error?.status === 403 ? (
                    <Link
                      to="/login"
                      className="inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                    >
                      Sign in
                    </Link>
                  ) : (
                    <Link
                      to="/submit-complaint"
                      className="inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                    >
                      Submit a new complaint
                    </Link>
                  )
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
                  <InfoField label="Assigned Officer">
                    {result.assignedOfficer ? (
                      <span>
                        {result.assignedOfficer.name}
                        {result.assignedOfficer.bureau ? (
                          <span className="text-slate-500"> · {result.assignedOfficer.bureau}</span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-slate-400">Not assigned yet</span>
                    )}
                  </InfoField>
                  <InfoField label="Submitted Date">{formatDate(result.createdAt)}</InfoField>
                  <InfoField label="Last Updated">{formatDate(result.updatedAt)}</InfoField>
                  <InfoField label="SLA Window">
                    {result.slaDays ? `${result.slaDays} days` : '—'}
                  </InfoField>
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
