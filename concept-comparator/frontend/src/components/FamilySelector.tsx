import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Globe2 } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(selectedFamilies.length > 0);

  const toggle = (name: string) => {
    if (selectedFamilies.includes(name)) {
      onChange(selectedFamilies.filter(f => f !== name));
    } else {
      onChange([...selectedFamilies, name]);
    }
  };

  const clearAll = () => onChange([]);

  const displayFamilies = useMemo(() => families ?? [], [families]);
  const totalLanguages = useMemo(
    () => displayFamilies.reduce((count, family) => count + family.language_count, 0),
    [displayFamilies]
  );

  useEffect(() => {
    if (selectedFamilies.length > 0) {
      setIsExpanded(true);
    }
  }, [selectedFamilies.length]);

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-stone-200/70 pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="atlas-label mb-1">Optional filter</p>
            <h3 className="text-2xl text-slate-950">Language family filter</h3>
            <p className="mt-1 text-sm text-slate-600">
              Leave this closed for the global view, or open it to narrow the language-level evidence.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="atlas-chip">
              <Globe2 className="h-3.5 w-3.5" />
              {selectedFamilies.length > 0 ? `${selectedFamilies.length} selected` : 'All families'}
            </div>
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-stone-50"
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Collapse' : 'Choose families'}
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-[20px] bg-stone-100/75 px-4 py-3 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
          <p>
            {selectedFamilies.length > 0
              ? `Filtering detailed language views to ${selectedFamilies.length} selected families.`
              : `Showing the full sample across ${displayFamilies.length || 'all'} families.`}
          </p>
          {displayFamilies.length > 0 && (
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {totalLanguages.toLocaleString()} language records
            </span>
          )}
        </div>

        {selectedFamilies.length > 0 && !isExpanded && (
          <div className="flex flex-wrap gap-2">
            {selectedFamilies.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-900"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="pt-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Select one or more families to focus the detailed results.
            </p>
            {selectedFamilies.length > 0 && (
              <button
                onClick={clearAll}
                className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-stone-50"
              >
                Clear
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-wrap gap-2 py-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded-full bg-stone-100"
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
                        ? 'border-sky-300 bg-sky-100 text-sky-950 shadow-[0_6px_16px_rgba(30,58,77,0.16)]'
                        : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300 hover:bg-stone-50',
                    ].join(' ')}
                  >
                    {name}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${selected ? 'bg-white/80 text-sky-800' : 'bg-stone-100 text-slate-500'}`}>
                      {language_count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FamilySelector;
