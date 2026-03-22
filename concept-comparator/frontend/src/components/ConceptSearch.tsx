import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { apiClient } from '../api/client';
import { ConceptAnchor } from '../types';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onAnchorSelect: (anchor: ConceptAnchor) => void;
  placeholder?: string;
}

/**
 * Concept search input backed by the Concepticon registry (GET /concepts).
 * Replaces the previous WordNet / CLICS dual-mode input.
 * Calls onAnchorSelect when the user picks a result.
 */
const ConceptSearch: React.FC<Props> = ({
  value,
  onChange,
  onAnchorSelect,
  placeholder = 'Search Concepticon…',
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: candidates, isLoading } = useQuery<ConceptAnchor[]>({
    queryKey: ['concepts', value],
    queryFn: () => apiClient.searchConcepts(value, 10),
    enabled: value.length >= 2,
    staleTime: 60_000,
  });

  const handleSelect = (anchor: ConceptAnchor) => {
    onAnchorSelect(anchor);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className="atlas-input pl-11"
        />
      </div>

      {showSuggestions && value.length >= 2 && (
        <div className="absolute z-20 mt-2 w-full rounded-[22px] border border-stone-200/80 bg-[rgba(255,251,245,0.97)] p-3 shadow-[0_16px_36px_rgba(65,52,30,0.12)]">
          {isLoading ? (
            <p className="px-3 py-4 text-center text-sm text-slate-400">Searching…</p>
          ) : !candidates || candidates.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-400">
              No concepts found for "{value}"
            </p>
          ) : (
            <div className="atlas-scroll max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {candidates.map((anchor) => (
                <button
                  key={anchor.concepticon_id}
                  onMouseDown={() => handleSelect(anchor)}
                  className="w-full rounded-[18px] border border-stone-200/60 bg-white/80 px-4 py-3 text-left transition hover:border-sky-300 hover:shadow-[0_8px_20px_rgba(46,80,99,0.1)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{anchor.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {anchor.clics_gloss && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          CLICS
                        </span>
                      )}
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                        #{anchor.concepticon_id}
                      </span>
                    </div>
                  </div>
                  {anchor.semantic_field && (
                    <p className="mt-0.5 text-xs text-slate-500">{anchor.semantic_field}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConceptSearch;
