import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

import ComplaintFilters from '../components/complaints/ComplaintFilters.jsx';
import ComplaintTable from '../components/complaints/ComplaintTable.jsx';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Loading from '../components/common/Loading.jsx';

import * as api from '../services/api.js';

const PAGE_SIZE = 10;

const INITIAL_FILTERS = {
  search: '',
  status: '',
  priority: '',
  category: '',
  institution: '',
};

/**
 * Complaints list — data comes from GET /api/complaints (server-side
 * search, filters and pagination). The table, filters and pagination
 * keep their original design.
 */
export default function Complaints() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [institutions, setInstitutions] = useState([]);

  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const handleFiltersChange = (next) => {
    setFilters(next);
    setPage(1);
  };

  // Institution options for the filter dropdown (public endpoint).
  useEffect(() => {
    let cancelled = false;
    api
      .getInstitutions({ limit: 100 })
      .then((res) => {
        if (!cancelled) setInstitutions(res.institutions);
      })
      .catch(() => {
        // Filter falls back to the built-in list; the table still loads.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api
      .getComplaints({
        search: filters.search.trim() || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        category: filters.category || undefined,
        institution_id: filters.institution || undefined,
        page,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        setComplaints(res.complaints);
        setTotal(res.pagination.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setComplaints([]);
        setTotal(0);
        setError(err?.message || 'Unable to load complaints.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, page, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const rangeFrom = total === 0 ? 0 : startIndex + 1;
  const rangeTo = Math.min(startIndex + PAGE_SIZE, total);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Complaints</h2>
          <p className="text-sm text-slate-500">
            {loading ? 'Loading complaints…' : (
              <>
                {total.toLocaleString('en-IN')} complaint{total === 1 ? '' : 's'} found
              </>
            )}
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => setReloadKey((k) => k + 1)}
        >
          Refresh
        </Button>
      </div>

      <ComplaintFilters
        filters={filters}
        onChange={handleFiltersChange}
        institutions={institutions.length > 0 ? institutions : undefined}
      />

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <Loading label="Loading complaints..." />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            title="Unable to load complaints."
            message={error}
            action={
              <Button
                variant="secondary"
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={() => setReloadKey((k) => k + 1)}
              >
                Try again
              </Button>
            }
          />
        </div>
      ) : (
        <ComplaintTable complaints={complaints} />
      )}

      {/* Pagination */}
      {!loading && !error && total > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-700">{rangeFrom}</span>–
            <span className="font-medium text-slate-700">{rangeTo}</span> of{' '}
            <span className="font-medium text-slate-700">{total}</span> complaints
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
