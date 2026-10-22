/** KPI card used in the dashboard's Complaint Overview section. */
export default function StatCard({ title, value, icon = null, delta = null, deltaLabel = '', tone = 'blue' }) {
  const TONES = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-600',
  };

  const deltaPositive = typeof delta === 'string' && delta.startsWith('+');
  const deltaNegative = typeof delta === 'string' && delta.startsWith('-');

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
        </div>
        {icon ? (
          <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg ${TONES[tone] || TONES.blue}`}>
            {icon}
          </span>
        ) : null}
      </div>
      {delta ? (
        <p className="mt-3 text-xs text-slate-500">
          <span
            className={`font-medium ${
              deltaPositive ? 'text-green-600' : deltaNegative ? 'text-red-600' : 'text-slate-600'
            }`}
          >
            {delta}
          </span>{' '}
          {deltaLabel}
        </p>
      ) : null}
    </div>
  );
}
