import React, { useState, useEffect } from 'react';
import { Clock, Trash2, ChevronRight } from 'lucide-react';
import { ClicsMatch } from '../types';

export interface HistoryItem {
    concepts: [string, string];
    timestamp: number;
    selectedLanguages: string[];
    senseIds: [string | null, string | null];
    modes: ['wordnet' | 'clics', 'wordnet' | 'clics'];
    clicsMatches?: {  // Add this
      concept1?: ClicsMatch;
      concept2?: ClicsMatch;
    };
}

interface Props {
  onSelect: (item: HistoryItem) => void;
  currentConcepts?: [string, string];
  currentModes?: ['wordnet' | 'clics', 'wordnet' | 'clics'];
  currentSenseIds?: [string | null, string | null];
  selectedLanguages?: string[];
  hasResults?: boolean; // New prop to check if comparison was performed
  className?: string;
  clicsMatches1?: { matches: ClicsMatch[] };
  clicsMatches2?: { matches: ClicsMatch[] };
}

const STORAGE_KEY = 'concept-comparison-history';
const MAX_HISTORY = 20;

const ComparisonHistory: React.FC<Props> = ({ 
  onSelect, 
  currentConcepts,
  currentModes = ['wordnet', 'wordnet'],
  currentSenseIds = [null, null],
  selectedLanguages = [],
  hasResults = false,
  clicsMatches1,
  clicsMatches2,
  className = "",
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, []);

  // Add current comparison to history only when we have results
  useEffect(() => {
    if (!hasResults || !currentConcepts?.[0] || !currentConcepts?.[1]) return;

    const newItem: HistoryItem = {
      concepts: currentConcepts,
      timestamp: Date.now(),
      selectedLanguages,
      senseIds: currentSenseIds,
      modes: currentModes,
      clicsMatches: currentModes[0] === 'clics' || currentModes[1] === 'clics' ? {
        concept1: clicsMatches1?.matches.find(m => m.concept === currentConcepts[0]),
        concept2: clicsMatches2?.matches.find(m => m.concept === currentConcepts[1])
      } : undefined
    };

    setHistory(prev => {
      // Remove any exact duplicates (same concepts, languages, and modes)
      const filtered = prev.filter(item => {
        const sameConcepts = item.concepts[0] === currentConcepts[0] && 
                           item.concepts[1] === currentConcepts[1];
        const sameLanguages = JSON.stringify((item.selectedLanguages || []).sort()) === 
                            JSON.stringify((selectedLanguages || []).sort());
        const sameModes = item.modes[0] === currentModes[0] && 
                         item.modes[1] === currentModes[1];
        return !(sameConcepts && sameLanguages && sameModes);
      });

      // Add new item at the start and limit total items
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving history:', error);
      }

      return updated;
    });
  }, [hasResults]); // Only trigger when hasResults changes

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => {
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
    const languages = (item.selectedLanguages || []).sort().join('-') || 'no-languages';
    const modes = item.modes?.join('-') || 'no-modes';
    return `${concepts}-${languages}-${modes}-${item.timestamp}`;
  };

  if (history.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 text-sm ${className}`}>
        No comparison history yet
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900">
            Recent Comparisons
          </h3>
        </div>
        <button
          onClick={clearHistory}
          className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Clear History
        </button>
      </div>

      <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
        {history.map((item, index) => {
          const date = new Date(item.timestamp);
          const isExpanded = expandedItems.has(index);
          const isActive = currentConcepts && 
            currentConcepts[0] === item.concepts[0] && 
            currentConcepts[1] === item.concepts[1] &&
            JSON.stringify((selectedLanguages || []).sort()) === 
            JSON.stringify((item.selectedLanguages || []).sort());

          return (
            <div 
              key={generateItemKey(item)}
              className={`
                border rounded-lg transition-colors cursor-pointer
                ${isActive 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-200 bg-white'
                }
              `}
            >
              <div 
                className="p-3 flex items-center justify-between"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-center gap-3">
                  <ChevronRight 
                    className={`w-4 h-4 text-gray-400 transition-transform
                      ${isExpanded ? 'transform rotate-90' : ''}`}
                  />
                  <div>
                    <div className="font-medium">
                      {item.concepts[0]} ↔ {item.concepts[1]}
                    </div>
                    <div className="text-sm text-gray-500">
                      {date.toLocaleDateString()} {date.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-3 pb-3">
                  <div className="text-sm text-gray-600 mb-2">
                    <div>
                      {item.selectedLanguages?.length || 0} languages selected
                    </div>
                    <div>
                      Mode: {item.modes[0].toUpperCase()} ↔ {item.modes[1].toUpperCase()}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelect(item)}
                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 
                      border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Restore this comparison
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