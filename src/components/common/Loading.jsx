/** Loading indicator used while data or lookups are in progress. */
export default function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
