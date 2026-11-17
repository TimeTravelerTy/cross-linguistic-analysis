import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { FamilyInfo } from '../types';

interface Props {
  selectedFamilies: string[];
  onChange: (families: string[]) => void;
}

export default function FamilySelector({ selectedFamilies, onChange }: Props) {
  const { data: families = [], isLoading } = useQuery<FamilyInfo[]>({
    queryKey: ['families'],
    queryFn: () => apiClient.getFamilies(),
    staleTime: Infinity,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState('');

  const toggle = (name: string) =>
    onChange(
      selectedFamilies.includes(name)
        ? selectedFamilies.filter(f => f !== name)
        : [...selectedFamilies, name],
    );

  const visibleFamilies = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? families.filter(f => f.name.toLowerCase().includes(q)) : families;
  }, [families, filter]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg text-slate-900">Language families</h3>
          <p className="mt-0.5 text-sm text-slate-600">
            {selectedFamilies.length > 0
              ? `Language-level results limited to ${selectedFamilies.length} ${selectedFamilies.length === 1 ? 'family' : 'families'}.`
              : `All ${families.length || ''} families included. Optionally focus on a few.`}
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-stone-50 sm:self-auto"
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Done' : 'Choose families'}
          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {selectedFamilies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedFamilies.map(name => (
            <button
              key={name}
              onClick={() => toggle(name)}
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-100"
              title={`Remove ${name}`}
            >
              {name}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={() => onChange([])}
            className="rounded-full px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Clear all
          </button>
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 border-t border-stone-200/70 pt-4">
          <div className="relative mb-3 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter families…"
              className="atlas-input py-2 pl-9 text-sm"
            />
          </div>

          {isLoading ? (
            <p className="py-2 text-sm text-slate-400">Loading families…</p>
          ) : (
            <div className="atlas-scroll flex max-h-64 flex-wrap gap-2 overflow-y-auto pr-1">
              {visibleFamilies.map(({ name, language_count }) => {
                const selected = selectedFamilies.includes(name);
                return (
                  <button
                    key={name}
                    onClick={() => toggle(name)}
                    aria-pressed={selected}
                    className={[
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                      selected
                        ? 'border-sky-300 bg-sky-100 text-sky-950'
                        : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300 hover:bg-stone-50',
                    ].join(' ')}
                  >
                    {name}
                    <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      {language_count}
                    </span>
                  </button>
                );
              })}
              {visibleFamilies.length === 0 && (
                <p className="text-sm text-slate-400">No family matches “{filter}”.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
