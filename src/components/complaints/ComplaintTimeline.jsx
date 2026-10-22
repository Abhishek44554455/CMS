import { Check } from 'lucide-react';

import { formatDate } from '../../data/mockData.js';

/**
 * Vertical complaint timeline: Complaint Submitted → Reviewed → Officer Assigned →
 * Investigation → Status Updated → Resolved (steps vary per complaint state).
 */
export default function ComplaintTimeline({ timeline = [] }) {
  if (timeline.length === 0) return null;

  return (
    <ol className="relative space-y-6 pl-8">
      {timeline.map((step, index) => {
        const isLast = index === timeline.length - 1;
        const isCurrent = Boolean(step.current);

        return (
          <li key={`${step.title}-${index}`} className="relative">
            {/* Connector line */}
            {!isLast ? (
              <span
                className={`absolute -left-[25px] top-5 h-[calc(100%+4px)] w-px ${step.completed ? 'bg-blue-300' : 'bg-slate-200'}`}
                aria-hidden="true"
              />
            ) : null}

            {/* Dot */}
            <span
              className={`absolute -left-8 top-0 flex h-5 w-5 items-center justify-center rounded-full text-white ring-4 ring-white ${
                step.completed ? 'bg-blue-700' : 'bg-slate-300'
              } ${isCurrent ? 'ring-2 ring-blue-200 ring-offset-2 ring-offset-white' : ''}`}
              aria-hidden="true"
            >
              {step.completed ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            </span>

            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : 'text-slate-800'}`}>
                  {step.title}
                </p>
                <span className="text-xs text-slate-400">{formatDate(step.date)}</span>
                {isCurrent ? (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                    Current stage
                  </span>
                ) : null}
              </div>
              {step.description ? (
                <p className="mt-0.5 text-sm text-slate-500">{step.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
