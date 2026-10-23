import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Inbox, RefreshCw } from 'lucide-react';

import CategoryChart from '../components/dashboard/CategoryChart.jsx';
import ComplaintTrend from '../components/dashboard/ComplaintTrend.jsx';
import CriticalComplaints from '../components/dashboard/CriticalComplaints.jsx';
import RecentComplaints from '../components/dashboard/RecentComplaints.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Loading from '../components/common/Loading.jsx';

import * as api from '../services/api.js';

/**
 * Dashboard — KPIs, trend, category split, critical/SLA-breached and recent
 * complaints all come from /api/dashboard/*.
 */
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [critical, setCritical] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, complaintsRes, categoriesRes] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardComplaints({ days: 14 }),
        api.getDashboardCategories(),
      ]);
      setStats(statsRes);
      setTrends(complaintsRes.trends);
      setCategories(categoriesRes);
      // Critical + SLA-breached rows, de-duplicated, worst first.
      const merged = [...complaintsRes.slaBreached, ...complaintsRes.critical];
      const seen = new Set();
      setCritical(
        merged
          .filter((c) => {
            if (seen.has(c.uuid)) return false;
            seen.add(c.uuid);
            return true;
          })
          .sort((a, b) => b.daysOverdue - a.daysOverdue)
          .slice(0, 6)
      );
      setRecent(complaintsRes.recent.slice(0, 8));
    } catch (err) {
      setError(err?.message || 'Unable to load dashboard data.');
      setStats(null);
      setTrends([]);
      setCategories([]);
      setCritical([]);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <Loading label="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            title="Unable to load the dashboard."
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
      </div>
    );
  }

  const resolvedTotal = (stats?.resolved || 0) + (stats?.closed || 0);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500">Complaint overview across all institutions</p>
        </div>
        <span className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600">
          Live data
        </span>
      </div>

      {/* 1. Complaint Overview — KPI cards */}
      <section aria-label="Complaint overview">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Complaint Overview
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Complaints"
            value={(stats?.total || 0).toLocaleString('en-IN')}
            icon={<Inbox className="h-5 w-5" />}
            tone="blue"
          />
          <StatCard
            title="Pending Complaints"
            value={(stats?.pending || 0).toLocaleString('en-IN')}
            icon={<Clock className="h-5 w-5" />}
            tone="amber"
          />
          <StatCard
            title="Resolved Complaints"
            value={resolvedTotal.toLocaleString('en-IN')}
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="green"
          />
          <StatCard
            title="Critical Complaints"
            value={(stats?.critical || 0).toLocaleString('en-IN')}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="red"
          />
        </div>
      </section>

      {/* 2. Complaint Analytics — charts */}
      <section aria-label="Complaint analytics" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ComplaintTrend data={trends} />
        <CategoryChart data={categories} />
      </section>

      {/* 3. Critical / SLA Breached */}
      <section aria-label="Critical and SLA breached complaints">
        <CriticalComplaints complaints={critical} />
      </section>

      {/* 4. Recent Complaints */}
      <section aria-label="Recent complaints">
        <RecentComplaints complaints={recent} />
      </section>
    </div>
  );
}
