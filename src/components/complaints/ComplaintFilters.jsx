import { Search } from 'lucide-react';

import { CATEGORIES, INSTITUTIONS, PRIORITIES, STATUSES } from '../../data/mockData.js';

const SELECT_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600';

/**
 * Search + filter row for the Complaints page.
 * Controlled: `filters` + `onChange(nextFilters)` — no data fetching here.
 */
export default function ComplaintFilters({ filters, onChange }) {
  const setField = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => setField('search', e.target.value)}
            placeholder="Search by ID, title or institution…"
            aria-label="Search complaints"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => setField('status', e.target.value)}
          aria-label="Filter by status"
          className={SELECT_CLASS}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setField('priority', e.target.value)}
          aria-label="Filter by priority"
          className={SELECT_CLASS}
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(e) => setField('category', e.target.value)}
          aria-label="Filter by category"
          className={SELECT_CLASS}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filters.institution}
          onChange={(e) => setField('institution', e.target.value)}
          aria-label="Filter by institution"
          className={SELECT_CLASS}
        >
          <option value="">All Institutions</option>
          {INSTITUTIONS.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
