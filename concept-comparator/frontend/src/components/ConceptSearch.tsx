import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Database, Search } from 'lucide-react';
import { apiClient } from '../api/client';
import { ClicsMatch } from '../types';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  mode: 'wordnet' | 'clics';
  onModeChange: (mode: 'wordnet' | 'clics') => void;
}

const modeButtonClasses = (isActive: boolean) =>
  [
    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
    isActive
      ? 'border-sky-700/20 bg-sky-900 text-stone-50 shadow-[0_8px_24px_rgba(19,40,54,0.18)]'
      : 'border-stone-200 bg-white/70 text-slate-600 hover:border-stone-300 hover:bg-white',
  ].join(' ');

const ConceptSearch: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Enter a concept',
  disabled = false,
  mode,
  onModeChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: clicsMatches, isLoading } = useQuery({
    queryKey: ['clics-concepts', searchQuery],
    queryFn: () => apiClient.searchClicsConcepts(searchQuery),
    enabled: mode === 'clics' && searchQuery.length >= 2,
  });

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue);
    onChange(newValue);
    setShowSuggestions(true);
  };

  const handleSelectConcept = (concept: string) => {
    setSearchQuery(concept);
    onChange(concept);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => onModeChange('wordnet')} className={modeButtonClasses(mode === 'wordnet')}>
          <Database size={14} />
          WordNet
          {mode === 'wordnet' && <Check size={14} />}
        </button>
        <button onClick={() => onModeChange('clics')} className={modeButtonClasses(mode === 'clics')}>
          <Database size={14} />
          CLICS
          {mode === 'clics' && <Check size={14} />}
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled && mode === 'clics'}
          className={`atlas-input pl-11 ${mode === 'clics' && showSuggestions && searchQuery.length >= 2 ? 'rounded-b-[12px]' : ''}`}
        />
      </div>

      {mode === 'clics' && showSuggestions && searchQuery.length >= 2 && (
        <div className="mt-2 rounded-[22px] border border-stone-200/80 bg-[rgba(255,251,245,0.96)] p-3 shadow-[0_16px_36px_rgba(65,52,30,0.1)]">
          {isLoading ? (
            <div className="rounded-[18px] border border-dashed border-stone-300 bg-stone-50/70 px-4 py-8 text-center text-sm text-slate-500">
              Loading suggestions...
            </div>
          ) : clicsMatches?.matches.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-stone-300 bg-stone-50/70 px-4 py-8 text-center text-sm text-slate-500">
              No matching concepts found.
            </div>
          ) : (
            <div className="atlas-scroll max-h-80 space-y-3 overflow-y-auto pr-1">
              {clicsMatches?.matches.map((match: ClicsMatch) => (
                <button
                  key={match.concept}
                  onClick={() => handleSelectConcept(match.concept)}
                  className="w-full rounded-[20px] border border-stone-200/80 bg-white/80 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_14px_28px_rgba(46,80,99,0.12)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-slate-900">{match.concept}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {match.semantic_field && <span className="atlas-chip">{match.semantic_field}</span>}
                        {match.category && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            {match.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {match.frequency} hits
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-xs uppercase tracking-[0.14em] text-slate-500 sm:grid-cols-3">
                    <div>{match.family_frequency} families</div>
                    <div>{match.language_frequency} languages</div>
                    <div>{match.word_frequency} words</div>
                  </div>
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
