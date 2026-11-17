import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { apiClient, errorMessage } from '../api/client';
import { ConceptAnchor } from '../types';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onAnchorSelect: (anchor: ConceptAnchor) => void;
  placeholder?: string;
}

/** Debounce a value so typing doesn't fire a request per keystroke. */
function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Concept search backed by the Concepticon registry (GET /concepts). */
export default function ConceptSearch({ value, onChange, onAnchorSelect, placeholder = 'Search concepts…' }: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listId = useId();
  const query = useDebounced(value.trim());

  const { data: candidates = [], isFetching, error } = useQuery<ConceptAnchor[]>({
    queryKey: ['concepts', query],
    queryFn: () => apiClient.searchConcepts(query, 10),
    enabled: query.length >= 2,
    staleTime: 60_000,
  });

  useEffect(() => setHighlight(0), [query]);

  const select = (anchor: ConceptAnchor) => {
    onAnchorSelect(anchor);
    setOpen(false);
  };

  const showList = open && value.trim().length >= 2;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showList || candidates.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => (h + 1) % candidates.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => (h - 1 + candidates.length) % candidates.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(candidates[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="atlas-input pl-11"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && candidates[highlight] ? `${listId}-${highlight}` : undefined}
      />

      {showList && (
        <div className="absolute z-20 mt-2 w-full rounded-[20px] border border-stone-200/80 bg-[rgba(255,251,245,0.98)] p-2 shadow-[0_16px_36px_rgba(65,52,30,0.14)]">
          {error ? (
            <p className="px-3 py-4 text-center text-sm text-red-700">{errorMessage(error)}</p>
          ) : candidates.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-400">
              {isFetching || query !== value.trim() ? 'Searching…' : `No concepts found for “${value}”`}
            </p>
          ) : (
            <ul id={listId} role="listbox" className="atlas-scroll max-h-72 space-y-1 overflow-y-auto pr-1">
              {candidates.map((anchor, i) => (
                <li
                  key={anchor.concepticon_id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={() => select(anchor)}
                  onMouseEnter={() => setHighlight(i)}
                  className={[
                    'cursor-pointer rounded-[14px] border px-3.5 py-2.5 transition',
                    i === highlight ? 'border-sky-300 bg-white' : 'border-transparent bg-white/60',
                    anchor.clics_gloss ? '' : 'opacity-70',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{anchor.label}</span>
                    {anchor.clics_gloss ? (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                        CLICS
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] text-slate-400">no CLICS data</span>
                    )}
                  </div>
                  {anchor.semantic_field && <p className="mt-0.5 text-xs text-slate-500">{anchor.semantic_field}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
