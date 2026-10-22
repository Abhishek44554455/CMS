const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  'In Progress': 'bg-blue-50 text-blue-700 ring-blue-200',
  Resolved: 'bg-green-50 text-green-700 ring-green-200',
  Escalated: 'bg-orange-50 text-orange-700 ring-orange-200',
};

/** Status pill: Pending → amber, In Progress → blue, Resolved → green, Escalated → orange. */
export default function ComplaintStatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 ring-slate-200';
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {status}
    </span>
  );
}
