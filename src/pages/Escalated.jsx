import { AlertTriangle, Clock, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState.jsx';
import ComplaintPriorityBadge from '../components/complaints/ComplaintPriorityBadge.jsx';
import ComplaintStatusBadge from '../components/complaints/ComplaintStatusBadge.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';

// Mock data import — replace with api.complaints.list({ flag: 'escalated' }) later.
import { COMPLAINTS, getEscalatedComplaints } from '../data/mockData.js';

/**
 * Escalated page: SLA-breached complaints, escalated complaints and
 * critical complaints requiring intervention. Opens ComplaintDetails on View.
 */
export default function Escalated() {
  const complaints = getEscalatedComplaints();

  const slaBreached = COMPLAINTS.filter((c) => c.slaBreached && c.status !== 'Resolved').length;
  const escalated = COMPLAINTS.filter((c) => c.status === 'Escalated').length;
  const critical = COMPLAINTS.filter((c) => c.priority === 'Critical' && c.status !== 'Resolved').length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Escalated</h2>
        <p className="text-sm text-slate-500">
          SLA breaches, escalated complaints and critical issues needing intervention
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="SLA Breached"
          value={slaBreached}
          icon={<Clock className="h-5 w-5" />}
          tone="red"
        />
        <StatCard
          title="Escalated"
          value={escalated}
          icon={<Flame className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          title="Critical Requiring Intervention"
          value={critical}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="red"
        />
      </div>

      {complaints.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            title="No escalated complaints"
            message="Nothing is breached, escalated or critical right now."
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Complaint ID</th>
                <th className="px-5 py-3 font-medium">Complaint</th>
                <th className="px-5 py-3 font-medium">Institution</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Assigned Officer</th>
                <th className="px-5 py-3 font-medium">Days Overdue</th>
                <th className="px-5 py-3 font-medium">Escalation Reason</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-blue-700">{c.id}</td>
                  <td className="max-w-56 px-5 py-3 text-slate-800">
                    <p className="truncate" title={c.title}>{c.title}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{c.institution.shortName}</td>
                  <td className="px-5 py-3"><ComplaintPriorityBadge priority={c.priority} /></td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                    {c.assignedOfficer ? c.assignedOfficer.name : <span className="text-slate-400">Unassigned</span>}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {c.daysOverdue > 0 ? (
                      <span className="font-semibold text-red-600">{c.daysOverdue} days</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="max-w-56 px-5 py-3 text-slate-600">
                    <p className="truncate" title={c.escalationReason || ''}>
                      {c.escalationReason || '—'}
                    </p>
                  </td>
                  <td className="px-5 py-3"><ComplaintStatusBadge status={c.status} /></td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={`/admin/complaints/${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
