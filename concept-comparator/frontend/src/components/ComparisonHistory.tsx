import { Clock3, Trash2 } from 'lucide-react';
import { HistoryItem, sameStudy } from '../utils/history';

interface Props {
  history: HistoryItem[];
  active?: HistoryItem | null;
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export default function ComparisonHistory({ history, active, onSelect, onClear }: Props) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-stone-500" />
          <h3 className="text-lg text-slate-900">History</h3>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-slate-500">
          Studies you run appear here.
        </p>
      ) : (
        <ul className="atlas-scroll max-h-[22rem] space-y-2 overflow-y-auto pr-1">
          {history.map(item => {
            const isActive = !!active && sameStudy(active, item);
            const families = item.selectedFamilies.length;
            return (
              <li key={`${item.timestamp}`}>
                <button
                  onClick={() => onSelect(item)}
                  className={[
                    'w-full rounded-[16px] border px-3.5 py-3 text-left transition',
                    isActive
                      ? 'border-sky-300 bg-sky-50/80'
                      : 'border-stone-200/80 bg-white/70 hover:border-stone-300 hover:bg-white',
                  ].join(' ')}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {item.anchors.map(a => a.label).join(' · ')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {families > 0 ? `${families} ${families === 1 ? 'family' : 'families'}` : 'All families'}
                    {' · '}
                    {new Date(item.timestamp).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
