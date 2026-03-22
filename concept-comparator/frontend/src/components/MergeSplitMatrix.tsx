import React, { useMemo, useState } from 'react';
import { ConceptAnchor, StudyResult } from '../types';

const SLOT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const MERGE_COLORS = [
  { bg: 'bg-sky-100', text: 'text-sky-900', border: 'border-sky-300' },
  { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  { bg: 'bg-violet-100', text: 'text-violet-900', border: 'border-violet-300' },
  { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
  { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300' },
];

interface Props {
  studyResult: StudyResult;
}

/**
 * For a given language partition, assign a group index to each concept position.
 * Returns an array (parallel to concepts[]) where equal values = same merged group.
 */
function assignGroups(concepts: ConceptAnchor[], merged_groups: string[][]): number[] {
  const conceptIds = concepts.map(c => c.concepticon_id);
  const result = new Array(concepts.length).fill(-1);
  merged_groups.forEach((group, groupIdx) => {
    for (const id of group) {
      const i = conceptIds.indexOf(id);
      if (i >= 0) result[i] = groupIdx;
    }
  });
  let nextGroup = merged_groups.length;
  for (let i = 0; i < result.length; i++) {
    if (result[i] === -1) result[i] = nextGroup++;
  }
  return result;
}

/** Returns set of group indices that have 2+ members (i.e., actually merged). */
function getMergedGroupIndices(groups: number[]): Set<number> {
  const counts: Record<number, number> = {};
  for (const g of groups) counts[g] = (counts[g] ?? 0) + 1;
  const merged = new Set<number>();
  for (const [idx, count] of Object.entries(counts)) {
    if (count >= 2) merged.add(Number(idx));
  }
  return merged;
}

export function MergeSplitMatrix({ studyResult }: Props) {
  const { concepts, language_partitions } = studyResult;
  const [familyFilter, setFamilyFilter] = useState('');
  const [sortBy, setSortBy] = useState<'merges' | 'alpha'>('merges');

  const families = useMemo(() => {
    const f = new Set<string>();
    for (const p of Object.values(language_partitions)) {
      if (p.family) f.add(p.family);
    }
    return Array.from(f).sort();
  }, [language_partitions]);

  const rows = useMemo(() => {
    let entries = Object.entries(language_partitions);
    if (familyFilter) {
      entries = entries.filter(([, p]) => p.family === familyFilter);
    }
    return entries
      .map(([langCode, partition]) => {
        const groups = assignGroups(concepts, partition.merged_groups);
        const mergedIndices = getMergedGroupIndices(groups);
        const mergeCount = groups.filter(g => mergedIndices.has(g)).length;
        return { langCode, partition, groups, mergedIndices, mergeCount };
      })
      .sort((a, b) =>
        sortBy === 'merges'
          ? b.mergeCount - a.mergeCount
          : a.partition.language_name.localeCompare(b.partition.language_name),
      );
  }, [language_partitions, concepts, familyFilter, sortBy]);

  // Per concept-pair: how many languages colexify them?
  const pairStats = useMemo(() => {
    const total = Object.keys(language_partitions).length;
    const stats: Array<{ labelA: string; labelB: string; count: number; rate: number }> = [];
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const idA = concepts[i].concepticon_id;
        const idB = concepts[j].concepticon_id;
        let count = 0;
        for (const p of Object.values(language_partitions)) {
          if (p.merged_groups.some(g => g.includes(idA) && g.includes(idB))) count++;
        }
        stats.push({ labelA: concepts[i].label, labelB: concepts[j].label, count, rate: total > 0 ? count / total : 0 });
      }
    }
    return stats;
  }, [concepts, language_partitions]);

  if (Object.keys(language_partitions).length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-stone-300 bg-stone-50/60 px-4 py-12 text-center">
        <p className="mb-2 text-sm font-medium text-slate-600">No language-level data</p>
        <p className="text-sm text-slate-400">
          Select language families in the Family filter above to see per-language merge/split patterns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pair colexification summary */}
      {pairStats.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pairStats.map(({ labelA, labelB, count, rate }) => (
            <div
              key={`${labelA}-${labelB}`}
              className="rounded-[20px] border border-stone-200/80 bg-white/70 p-4"
            >
              <p className="atlas-label mb-1">
                {labelA} ↔ {labelB}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-slate-900">{count}</span>
                <span className="text-sm text-slate-500">
                  / {Object.keys(language_partitions).length} languages
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${rate * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{(rate * 100).toFixed(1)}% directly colexify</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={familyFilter}
          onChange={e => setFamilyFilter(e.target.value)}
          className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          <option value="">All families ({Object.keys(language_partitions).length} languages)</option>
          {families.map(f => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <div className="flex gap-1 rounded-full border border-stone-200/80 bg-white/80 p-1">
          {(['merges', 'alpha'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                sortBy === s ? 'bg-sky-900 text-white' : 'text-slate-600 hover:bg-stone-100'
              }`}
            >
              {s === 'merges' ? 'Most merged' : 'Alphabetical'}
            </button>
          ))}
        </div>
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <span className="font-semibold uppercase tracking-[0.14em] text-slate-500">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-full bg-sky-200 border border-sky-300" />
          Merged — concepts with the same color share one word
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-full bg-stone-100 border border-stone-200" />
          Split — distinct words
        </span>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto rounded-[22px] border border-stone-200/80 bg-white/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200/80 bg-stone-50/60">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Language
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Family
              </th>
              {concepts.map((c, i) => (
                <th
                  key={c.concepticon_id}
                  className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                >
                  <span className="rounded-full bg-stone-200 px-1.5 py-0.5 font-mono text-slate-600">
                    {SLOT_LETTERS[i]}
                  </span>
                  <span className="ml-1.5 normal-case font-medium text-slate-700">{c.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100/80">
            {rows.map(({ langCode, partition, groups, mergedIndices }) => {
              // Map merge group index → stable color index
              const groupToColorIdx: Record<number, number> = {};
              let colorCounter = 0;
              for (const groupIdx of mergedIndices) {
                groupToColorIdx[groupIdx] = colorCounter++ % MERGE_COLORS.length;
              }

              return (
                <tr key={langCode} className="transition-colors hover:bg-stone-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {partition.language_name}
                    <span className="ml-1.5 font-mono text-xs text-slate-400">{langCode}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">{partition.family}</td>
                  {concepts.map((c, i) => {
                    const groupIdx = groups[i];
                    const isMerged = mergedIndices.has(groupIdx);

                    if (isMerged) {
                      const color = MERGE_COLORS[groupToColorIdx[groupIdx] ?? 0];
                      return (
                        <td key={c.concepticon_id} className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${color.bg} ${color.text} ${color.border}`}
                          >
                            {SLOT_LETTERS[i]}
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td key={c.concepticon_id} className="px-3 py-3 text-center">
                        <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-slate-400">
                          {SLOT_LETTERS[i]}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-slate-400">
            No language data for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
