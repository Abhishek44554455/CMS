import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

import EmptyState from '../common/EmptyState.jsx';
import ComplaintPriorityBadge from './ComplaintPriorityBadge.jsx';
import ComplaintStatusBadge from './ComplaintStatusBadge.jsx';
import { formatDate } from '../../data/mockData.js';

/**
 * Complaints table with the standard admin columns.
 * The View button routes to the shared ComplaintDetails page (/admin/complaints/:id).
 */
export default function ComplaintTable({ complaints }) {
  if (complaints.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <EmptyState
          title="No complaints found"
          message="Try adjusting the search or filters to find what you are looking for."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 font-medium">ID</th>
            <th className="px-5 py-3 font-medium">Title</th>
            <th className="px-5 py-3 font-medium">Institution</th>
            <th className="px-5 py-3 font-medium">Category</th>
            <th className="px-5 py-3 font-medium">Priority</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Assigned Officer</th>
            <th className="px-5 py-3 font-medium">SLA</th>
            <th className="px-5 py-3 font-medium">Created Date</th>
            <th className="px-5 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {complaints.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-slate-50">
              <td className="whitespace-nowrap px-5 py-3 font-medium text-blue-700">{c.id}</td>
              <td className="max-w-60 px-5 py-3 text-slate-800">
                <p className="truncate" title={c.title}>{c.title}</p>
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-slate-600">{c.institution.shortName}</td>
              <td className="whitespace-nowrap px-5 py-3 text-slate-600">{c.category}</td>
              <td className="px-5 py-3"><ComplaintPriorityBadge priority={c.priority} /></td>
              <td className="px-5 py-3"><ComplaintStatusBadge status={c.status} /></td>
              <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                {c.assignedOfficer ? c.assignedOfficer.name : <span className="text-slate-400">Unassigned</span>}
              </td>
              <td className={`whitespace-nowrap px-5 py-3 ${c.slaBreached ? 'font-medium text-red-600' : 'text-slate-600'}`}>
                {formatDate(c.slaDueDate)}
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-slate-600">{formatDate(c.createdAt)}</td>
              <td className="px-5 py-3 text-right">
                <Link
                  to={`/admin/complaints/${c.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
