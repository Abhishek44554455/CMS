const PRIORITY_STYLES = {
  Critical: 'bg-red-50 text-red-700 ring-red-200',
  High: 'bg-orange-50 text-orange-700 ring-orange-200',
  Medium: 'bg-blue-50 text-blue-700 ring-blue-200',
  Low: 'bg-slate-100 text-slate-600 ring-slate-200',
};

/** Priority pill: Critical → red, High → orange, Medium → blue, Low → slate. */
export default function ComplaintPriorityBadge({ priority }) {
  const style = PRIORITY_STYLES[priority] || 'bg-slate-100 text-slate-600 ring-slate-200';
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {priority}
    </span>
  );
}
