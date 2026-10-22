import { Inbox } from 'lucide-react';

/** Empty state for tables, lookups and lists with no results. */
export default function EmptyState({ icon = null, title = 'Nothing here yet', message = '', action = null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {message ? <p className="max-w-sm text-sm text-slate-500">{message}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
