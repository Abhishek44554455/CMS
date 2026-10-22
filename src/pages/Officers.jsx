import { useMemo, useState } from 'react';
import { Eye, Mail, Search, UserRound } from 'lucide-react';

import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';

// Mock data import — replace with api.officers.list() later.
import { OFFICERS } from '../data/mockData.js';

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        status === 'Active'
          ? 'bg-green-50 text-green-700 ring-green-200'
          : 'bg-amber-50 text-amber-700 ring-amber-200'
      }`}
    >
      {status}
    </span>
  );
}

export default function Officers() {
  const [search, setSearch] = useState('');
  const [bureau, setBureau] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);

  const bureaus = useMemo(
    () => Array.from(new Set(OFFICERS.map((o) => o.bureau))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return OFFICERS.filter((o) => {
      if (bureau && o.bureau !== bureau) return false;
      if (status && o.status !== status) return false;
      if (query) {
        const haystack = `${o.name} ${o.email} ${o.bureau}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [search, bureau, status]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, o) => ({
          assigned: acc.assigned + o.assigned,
          pending: acc.pending + o.pending,
          resolved: acc.resolved + o.resolved,
          breaches: acc.breaches + o.slaBreaches,
        }),
        { assigned: 0, pending: 0, resolved: 0, breaches: 0 }
      ),
    [filtered]
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Officers</h2>
        <p className="text-sm text-slate-500">
          {filtered.length} officer{filtered.length === 1 ? '' : 's'} · {totals.assigned} assignments ·{' '}
          {totals.breaches} SLA breaches
        </p>
      </div>

      {/* Search + filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              aria-label="Search officers"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <select
            value={bureau}
            onChange={(e) => setBureau(e.target.value)}
            aria-label="Filter by bureau"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All Bureaus</option>
            {bureaus.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <EmptyState title="No officers found" message="Try adjusting the search or filters." />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Officer Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Bureau</th>
                <th className="px-5 py-3 font-medium">Assigned</th>
                <th className="px-5 py-3 font-medium">Pending</th>
                <th className="px-5 py-3 font-medium">Resolved</th>
                <th className="px-5 py-3 font-medium">SLA Breaches</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                        {o.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                      </span>
                      <span className="font-medium text-slate-800">{o.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{o.email}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{o.bureau}</td>
                  <td className="px-5 py-3 text-slate-700">{o.assigned}</td>
                  <td className="px-5 py-3 text-amber-600">{o.pending}</td>
                  <td className="px-5 py-3 text-green-600">{o.resolved}</td>
                  <td className="px-5 py-3">
                    {o.slaBreaches > 0 ? (
                      <span className="font-medium text-red-600">{o.slaBreaches}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="px-5 py-3"><StatusPill status={o.status} /></td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(o)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Officer details + assignment statistics */}
      <Modal
        open={Boolean(selected)}
        title={selected ? selected.name : 'Officer'}
        onClose={() => setSelected(null)}
        size="lg"
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">
                {selected.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                  <UserRound className="h-4 w-4 text-slate-400" />
                  {selected.name}
                </p>
                <p className="flex items-center gap-1.5 break-all text-sm text-slate-500">
                  <Mail className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  {selected.email}
                </p>
              </div>
              <div className="ml-auto"><StatusPill status={selected.status} /></div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Assignment Statistics</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-lg font-semibold text-slate-900">{selected.assigned}</p>
                  <p className="text-xs text-slate-500">Assigned</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-lg font-semibold text-amber-600">{selected.pending}</p>
                  <p className="text-xs text-slate-500">Pending</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-lg font-semibold text-green-600">{selected.resolved}</p>
                  <p className="text-xs text-slate-500">Resolved</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className={`text-lg font-semibold ${selected.slaBreaches > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    {selected.slaBreaches}
                  </p>
                  <p className="text-xs text-slate-500">SLA Breaches</p>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Bureau</dt>
                <dd className="mt-0.5 text-sm text-slate-800">{selected.bureau}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Resolution Rate</dt>
                <dd className="mt-0.5 text-sm text-slate-800">
                  {selected.assigned === 0
                    ? '—'
                    : `${Math.round((selected.resolved / selected.assigned) * 100)}%`}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
