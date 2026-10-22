import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import ComplaintFilters from '../components/complaints/ComplaintFilters.jsx';
import ComplaintTable from '../components/complaints/ComplaintTable.jsx';

// Mock data import — replace with api.complaints.list(params) later.
import { COMPLAINTS } from '../data/mockData.js';

const PAGE_SIZE = 10;

const INITIAL_FILTERS = {
  search: '',
  status: '',
  priority: '',
  category: '',
  institution: '',
};

export default function Complaints() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);

  const handleFiltersChange = (next) => {
    setFilters(next);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return COMPLAINTS.filter((c) => {
      if (filters.status && c.status !== filters.status) return false;
      if (filters.priority && c.priority !== filters.priority) return false;
      if (filters.category && c.category !== filters.category) return false;
      if (filters.institution && c.institution.id !== filters.institution) return false;
      if (query) {
        const haystack = `${c.id} ${c.title} ${c.institution.name} ${c.category}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const rangeFrom = filtered.length === 0 ? 0 : startIndex + 1;
  const rangeTo = Math.min(startIndex + PAGE_SIZE, filtered.length);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Complaints</h2>
          <p className="text-sm text-slate-500">
            {filtered.length.toLocaleString('en-IN')} complaint{filtered.length === 1 ? '' : 's'} found
          </p>
        </div>
      </div>

      <ComplaintFilters filters={filters} onChange={handleFiltersChange} />

      <ComplaintTable complaints={pageItems} />

      {/* Pagination */}
      {filtered.length > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-700">{rangeFrom}</span>–
            <span className="font-medium text-slate-700">{rangeTo}</span> of{' '}
            <span className="font-medium text-slate-700">{filtered.length}</span> complaints
          </p>

          <nav className="flex items-center gap-1" aria-label="Complaints pagination">
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>

            {pageNumbers.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-current={n === currentPage ? 'page' : undefined}
                className={`min-w-9 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  n === currentPage
                    ? 'border-blue-700 bg-blue-700 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
