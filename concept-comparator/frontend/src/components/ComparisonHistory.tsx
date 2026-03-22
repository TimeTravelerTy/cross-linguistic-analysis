import React, { useEffect, useState } from 'react';
import { ChevronRight, Clock3, RotateCcw, Trash2 } from 'lucide-react';

export interface HistoryItem {
  concepts: string[];
  timestamp: number;
  selectedFamilies: string[];
  // Legacy fields for backward compat
  selectedLanguages?: string[];
}

interface Props {
  onSelect: (item: HistoryItem) => void;
  currentConcepts?: string[];
  selectedFamilies?: string[];
  hasResults?: boolean;
  className?: string;
}

const STORAGE_KEY = 'concept-comparison-history';
const MAX_HISTORY = 20;

const ComparisonHistory: React.FC<Props> = ({
  onSelect,
  currentConcepts,
  selectedFamilies = [],
  hasResults = false,
  className = '',
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Migrate legacy items that used selectedLanguages
        const items = JSON.parse(stored) as any[];
        setHistory(items.map(item => ({
          ...item,
          selectedFamilies: item.selectedFamilies ?? [],
        })));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, []);

  useEffect(() => {
    if (!hasResults || !currentConcepts || currentConcepts.length < 2) {
      return;
    }

    const newItem: HistoryItem = {
      concepts: currentConcepts,
      timestamp: Date.now(),
      selectedFamilies,
    };

    setHistory((prev) => {
      const filtered = prev.filter((item) => {
        const sameConcepts = JSON.stringify([...(item.concepts || [])].sort()) === JSON.stringify([...currentConcepts].sort());
        const sameFamilies =
          JSON.stringify((item.selectedFamilies || []).sort()) === JSON.stringify((selectedFamilies || []).sort());
        return !(sameConcepts && sameFamilies);
      });

      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving history:', error);
      }

      return updated;
    });
  }, [currentConcepts, hasResults, selectedFamilies]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const toggleExpand = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const generateItemKey = (item: HistoryItem) => {
    const concepts = item.concepts?.join('-') || 'no-concepts';
    return `${concepts}-${item.timestamp}`;
  };

  if (history.length === 0) {
    return (
      <div className={className}>
        <div className="mb-4 flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-stone-500" />
          <div>
            <p className="atlas-label mb-1">History</p>
            <h3 className="text-xl text-slate-900">Recent expeditions</h3>
          </div>
        </div>
        <div className="rounded-[22px] border border-dashed border-stone-300 bg-stone-50/60 px-4 py-8 text-center text-sm text-slate-500">
          No comparison history yet.
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-stone-500" />
          <div>
            <p className="atlas-label mb-1">History</p>
            <h3 className="text-xl text-slate-900">Recent expeditions</h3>
          </div>
        </div>
        <button
          onClick={clearHistory}
          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-800 transition-colors hover:bg-red-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      <div className="atlas-scroll max-h-[32rem] space-y-3 overflow-y-auto pr-1">
        {history.map((item, index) => {
          const date = new Date(item.timestamp);
          const isExpanded = expandedItems.has(index);
          const isActive =
            currentConcepts &&
            JSON.stringify([...currentConcepts].sort()) === JSON.stringify([...(item.concepts || [])].sort()) &&
            JSON.stringify((selectedFamilies || []).sort()) === JSON.stringify((item.selectedFamilies || []).sort());

          const familyCount = item.selectedFamilies?.length || 0;

          return (
            <div
              key={generateItemKey(item)}
              className={[
                'overflow-hidden rounded-[22px] border transition-all',
                isActive
                  ? 'border-sky-300 bg-sky-50/70 shadow-[0_16px_30px_rgba(49,88,111,0.12)]'
                  : 'border-stone-200/80 bg-white/75 hover:border-stone-300 hover:bg-white',
              ].join(' ')}
            >
              <button
                onClick={() => toggleExpand(index)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <ChevronRight
                    className={`h-4 w-4 text-stone-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {(item.concepts || []).join(' · ')}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {date.toLocaleDateString()} {date.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {familyCount > 0 ? `${familyCount} fams` : 'all fams'}
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-stone-200/70 px-4 pb-4 pt-3">
                  <p className="mb-3 text-sm text-slate-500">
                    {familyCount > 0
                      ? `${familyCount} families selected`
                      : 'All CLICS families'}
                  </p>
                  <button
                    onClick={() => onSelect(item)}
                    className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 transition-colors hover:bg-sky-100"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restore study
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComparisonHistory;
