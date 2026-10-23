import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

import EmptyState from '../common/EmptyState.jsx';
import ComplaintPriorityBadge from '../complaints/ComplaintPriorityBadge.jsx';
import ComplaintStatusBadge from '../complaints/ComplaintStatusBadge.jsx';
import { formatDate, getRecentComplaints } from '../../data/mockData.js';

/** Dashboard section: latest complaints across all institutions. */
export default function RecentComplaints({ limit = 8, complaints = getRecentComplaints(limit) }) {

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Recent Complaints</h3>
          <p className="text-xs text-slate-500">Latest complaints received on the portal</p>
        </div>
        <Link
          to="/admin/complaints"
          className="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline"
        >
          View all complaints
        </Link>
      </div>

      {complaints.length === 0 ? (
        <EmptyState title="No complaints yet" message="New complaints will appear here." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Complaint ID</th>
                <th className="px-5 py-3 font-medium">Complaint</th>
                <th className="px-5 py-3 font-medium">Institution</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">SLA</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-blue-700">{c.id}</td>
                  <td className="max-w-64 px-5 py-3 text-slate-800">
                    <p className="truncate" title={c.title}>{c.title}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{c.institution.shortName}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{c.category}</td>
                  <td className="px-5 py-3"><ComplaintPriorityBadge priority={c.priority} /></td>
                  <td className="px-5 py-3"><ComplaintStatusBadge status={c.status} /></td>
                  <td className={`whitespace-nowrap px-5 py-3 ${c.slaBreached ? 'font-medium text-red-600' : 'text-slate-600'}`}>
                    {formatDate(c.slaDueDate)}
                  </td>
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
      )}
    </div>
  );
}
