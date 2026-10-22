import { BrainCircuit, FileText, GitMerge, ListChecks, Sparkles } from 'lucide-react';

const PLACEHOLDER_FEATURES = [
  {
    title: 'Duplicate Detection',
    description: 'Automatically flag complaints that appear to describe the same underlying issue.',
    icon: GitMerge,
  },
  {
    title: 'Complaint Classification',
    description: 'Auto-categorise incoming complaints and route them to the right bureau.',
    icon: ListChecks,
  },
  {
    title: 'Priority Prediction',
    description: 'Estimate urgency and SLA risk from complaint text and historical patterns.',
    icon: Sparkles,
  },
  {
    title: 'Automated Summaries',
    description: 'Generate concise summaries of long complaints and investigation notes.',
    icon: FileText,
  },
];

/**
 * AI Insights — placeholder only. No AI functionality is implemented yet.
 */
export default function AIInsights() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">AI Insights</h2>
        <p className="text-sm text-slate-500">
          AI-powered complaint analysis will be available in a future version.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
          <BrainCircuit className="h-7 w-7" />
        </span>
        <p className="text-base font-semibold text-slate-900">AI Insights coming soon</p>
        <p className="max-w-xl text-sm text-slate-500">
          This section will surface AI-generated analysis of complaints once AI features are
          enabled. Nothing on this page runs AI models today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLACEHOLDER_FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm opacity-90"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-sm font-semibold text-slate-800">{feature.title}</h3>
                </div>
                <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Coming Soon
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-500">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
