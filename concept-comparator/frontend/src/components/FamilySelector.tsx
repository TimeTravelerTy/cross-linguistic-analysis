import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { FamilyInfo } from '../types';

interface Props {
  selectedFamilies: string[];
  onChange: (families: string[]) => void;
}

const FamilySelector: React.FC<Props> = ({ selectedFamilies, onChange }) => {
  const { data: families, isLoading } = useQuery<FamilyInfo[]>({
    queryKey: ['families'],
    queryFn: () => apiClient.getFamilies(),
    staleTime: Infinity,
  });

  const toggle = (name: string) => {
    if (selectedFamilies.includes(name)) {
      onChange(selectedFamilies.filter(f => f !== name));
    } else {
      onChange([...selectedFamilies, name]);
    }
  };

  const clearAll = () => onChange([]);

  const displayFamilies = useMemo(() => families ?? [], [families]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 border-b border-stone-200/70 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="atlas-label mb-1">Drill-in (optional)</p>
          <h3 className="text-2xl text-slate-900">Language family filter</h3>
          <p className="mt-1 text-sm text-slate-500">
            All families are shown in results. Select some to also see individual language evidence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="atlas-chip">
            <Globe2 className="h-3.5 w-3.5" />
            {selectedFamilies.length > 0 ? `${selectedFamilies.length} selected` : 'All'}
          </div>
          {selectedFamilies.length > 0 && (
            <button
              onClick={clearAll}
              className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-stone-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-2 py-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-8 rounded-full bg-stone-100 animate-pulse"
              style={{ width: `${60 + Math.random() * 60}px` }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {displayFamilies.map(({ name, language_count }) => {
            const selected = selectedFamilies.includes(name);
            return (
              <button
                key={name}
                onClick={() => toggle(name)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                  selected
                    ? 'border-sky-300 bg-sky-50 text-sky-900 shadow-[0_4px_10px_rgba(46,80,99,0.12)]'
                    : 'border-stone-200 bg-white text-slate-600 hover:border-stone-300 hover:bg-stone-50',
                ].join(' ')}
              >
                {name}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${selected ? 'bg-sky-100 text-sky-700' : 'bg-stone-100 text-slate-500'}`}>
                  {language_count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FamilySelector;
