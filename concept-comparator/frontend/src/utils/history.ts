import { ConceptAnchor } from '../types';

export interface HistoryItem {
  anchors: ConceptAnchor[];
  selectedFamilies: string[];
  timestamp: number;
}

const STORAGE_KEY = 'concept-comparator-history-v2';
const MAX_HISTORY = 20;

export const sameStudy = (a: HistoryItem, b: HistoryItem) =>
  a.anchors.map(x => x.concepticon_id).sort().join(',') ===
    b.anchors.map(x => x.concepticon_id).sort().join(',') &&
  [...a.selectedFamilies].sort().join(',') === [...b.selectedFamilies].sort().join(',');

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    return Array.isArray(items) ? items.filter(i => Array.isArray(i.anchors)) : [];
  } catch {
    return [];
  }
}

/** Returns the updated list with `item` first, de-duplicated and capped. */
export function addToHistory(history: HistoryItem[], item: HistoryItem): HistoryItem[] {
  const updated = [item, ...history.filter(h => !sameStudy(h, item))].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    /* storage unavailable (private mode etc.) */
  }
  return updated;
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

