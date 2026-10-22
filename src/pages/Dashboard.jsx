import { AlertTriangle, CheckCircle2, Clock, Inbox } from 'lucide-react';

import CategoryChart from '../components/dashboard/CategoryChart.jsx';
import ComplaintTrend from '../components/dashboard/ComplaintTrend.jsx';
import CriticalComplaints from '../components/dashboard/CriticalComplaints.jsx';
import RecentComplaints from '../components/dashboard/RecentComplaints.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';

// Mock data import — replace with api.analyticsOverview() when the Express backend is ready.
import { DASHBOARD_STATS } from '../data/mockData.js';

export default function Dashboard() {
  const stats = DASHBOARD_STATS;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500">Complaint overview across all institutions</p>
        </div>
        <span className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600">
          Last 30 days
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
            value={stats.totalComplaints.toLocaleString('en-IN')}
            icon={<Inbox className="h-5 w-5" />}
            delta={stats.totalDelta}
            deltaLabel="vs last month"
            tone="blue"
          />
          <StatCard
            title="Pending Complaints"
            value={stats.pending.toLocaleString('en-IN')}
            icon={<Clock className="h-5 w-5" />}
            delta={stats.pendingDelta}
            deltaLabel="vs last month"
            tone="amber"
          />
          <StatCard
            title="Resolved Complaints"
            value={stats.resolved.toLocaleString('en-IN')}
            icon={<CheckCircle2 className="h-5 w-5" />}
            delta={stats.resolvedDelta}
            deltaLabel="vs last month"
            tone="green"
          />
          <StatCard
            title="Critical Complaints"
            value={stats.critical.toLocaleString('en-IN')}
            icon={<AlertTriangle className="h-5 w-5" />}
            delta={stats.criticalDelta}
            deltaLabel="vs last month"
            tone="red"
          />
        </div>
      </section>

      {/* 2. Complaint Analytics — charts */}
      <section aria-label="Complaint analytics" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ComplaintTrend />
        <CategoryChart />
      </section>

      {/* 3. Critical / SLA Breached */}
      <section aria-label="Critical and SLA breached complaints">
        <CriticalComplaints />
      </section>

      {/* 4. Recent Complaints */}
      <section aria-label="Recent complaints">
        <RecentComplaints />
      </section>
    </div>
  );
}
