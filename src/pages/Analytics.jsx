import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import CategoryChart from '../components/dashboard/CategoryChart.jsx';
import ComplaintTrend from '../components/dashboard/ComplaintTrend.jsx';

// Mock data import — replace with api.analytics.trends() later.
import { ANALYTICS, MONTHLY_TREND, OFFICERS } from '../data/mockData.js';

const BLUE = '#1d4ed8';
const GREEN = '#16a34a';
const AMBER = '#d97706';
const RED = '#dc2626';

const TOOLTIP_STYLE = {
  contentStyle: { borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 },
  labelStyle: { color: '#0f172a', fontWeight: 600 },
};

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ChartBox({ height = 300, children }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

const officerData = OFFICERS.map((o) => ({
  name: o.name.split(' ').slice(-1)[0],
  resolved: o.resolved,
  pending: o.pending,
}));

export default function Analytics() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Analytics</h2>
        <p className="text-sm text-slate-500">
          Complaint trends, SLA performance and officer workload across the platform
        </p>
      </div>

      {/* Row 1: trends + category */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ComplaintTrend title="Complaint Trends" />
        <CategoryChart title="Complaint Volume by Category" />
      </div>

      {/* Row 2: by institution + pending vs resolved */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Complaint Volume by Institution"
          subtitle="Top institutions by total complaints received"
        >
          <ChartBox height={320}>
            <BarChart data={ANALYTICS.institutionVolume} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis type="category" dataKey="name" width={105} interval={0} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} {...TOOLTIP_STYLE} />
              <Bar dataKey="complaints" name="Complaints" fill={BLUE} radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ChartBox>
        </ChartCard>

        <ChartCard title="Pending vs Resolved" subtitle="Current complaint load split">
          <ChartBox height={320}>
            <PieChart>
              <Pie
                data={ANALYTICS.pendingVsResolved}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {ANALYTICS.pendingVsResolved.map((entry, index) => (
                  <Cell key={entry.name} fill={index === 0 ? AMBER : GREEN} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ChartBox>
        </ChartCard>
      </div>

      {/* Row 3: resolution rate + SLA performance */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Resolution Rate" subtitle="Share of complaints resolved, last 12 months (%)">
          <ChartBox height={300}>
            <LineChart data={ANALYTICS.resolutionRateTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis domain={[50, 80]} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="rate" name="Resolution rate" stroke={GREEN} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ChartBox>
        </ChartCard>

        <ChartCard title="SLA Performance" subtitle="Complaints closed within SLA vs breached (%)">
          <ChartBox height={300}>
            <BarChart data={ANALYTICS.slaPerformance} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="withinSla" name="Within SLA" stackId="sla" fill={GREEN} radius={[0, 0, 0, 0]} />
              <Bar dataKey="breached" name="Breached" stackId="sla" fill={RED} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartBox>
        </ChartCard>
      </div>

      {/* Row 4: officer performance */}
      <ChartCard
        title="Officer Performance"
        subtitle="Resolved vs pending complaints per officer"
      >
        <ChartBox height={340}>
          <BarChart data={officerData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval={0} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="resolved" name="Resolved" fill={GREEN} radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" name="Pending" fill={AMBER} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartBox>
      </ChartCard>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Avg. Resolution</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">6.2 days</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Resolution Rate</p>
          <p className="mt-1 text-xl font-semibold text-green-600">69.4%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">SLA Compliance</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">88%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total This Year</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {MONTHLY_TREND.reduce((sum, m) => sum + m.submitted, 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}
