import { CheckCircle2, Clock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const StatusTimeline = ({ history = [] }) => {
  if (!history.length) {
    return (
      <p className="text-sm text-slate-500">
        No status updates recorded yet.
      </p>
    );
  }

  return (
    <ol className="relative border-l-2 border-slate-200 ml-3 space-y-6">
      {history.map((entry, idx) => {
        const isLatest = idx === history.length - 1;
        return (
          <li key={entry._id || idx} className="ml-6">
            <span
              className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white ${
                isLatest
                  ? 'bg-emerald-600 text-white'
                  : 'bg-civic-700 text-white'
              }`}
            >
              {isLatest ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
            </span>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge status={entry.status} />
                <span className="text-xs text-slate-500">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>

              {entry.remarks && (
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  {entry.remarks}
                </p>
              )}

              <p className="mt-2 text-xs text-slate-500">
                Updated by:{' '}
                <span className="font-semibold text-slate-700">
                  {entry.updatedBy?.name || 'System'}
                </span>{' '}
                (<span className="capitalize">{entry.updatedByRole}</span>)
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default StatusTimeline;
