import React, { useEffect, useMemo, useState } from 'react';
import { ConceptAnchor, StudyResult } from '../types';
import { getReadableLanguageName } from '../constants/languages';

const SLOT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const MERGE_COLORS = [
  'bg-sky-100 text-sky-900 border-sky-200',
  'bg-emerald-100 text-emerald-900 border-emerald-200',
  'bg-violet-100 text-violet-900 border-violet-200',
  'bg-amber-100 text-amber-900 border-amber-200',
  'bg-rose-100 text-rose-900 border-rose-200',
];

interface Props {
  studyResult: StudyResult;
}

const INITIAL_LANGUAGE_LIMIT = 48;

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

function getMergedGroupIndices(groups: number[]): Set<number> {
  const counts: Record<number, number> = {};
  for (const g of groups) counts[g] = (counts[g] ?? 0) + 1;
  const merged = new Set<number>();
  for (const [idx, count] of Object.entries(counts)) {
    if (count >= 2) merged.add(Number(idx));
  }
  return merged;
}

/**
 * Per-language cards showing how concepts are merged or split.
 * Driven by language_partitions derived from CLICS attesting languages.
 * Only shows languages that attest at least one relevant colexification.
 */
export function LanguageDetailsView({ studyResult }: Props) {
  const { concepts, language_partitions } = studyResult;
  const [familyFilter, setFamilyFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_LANGUAGE_LIMIT);

  const families = useMemo(() => {
    const f = new Set<string>();
    for (const p of Object.values(language_partitions)) {
      if (p.family) f.add(p.family);
    }
    return Array.from(f).sort();
  }, [language_partitions]);

  const entries = useMemo(() => {
    let all = Object.entries(language_partitions);
    if (familyFilter) all = all.filter(([, p]) => p.family === familyFilter);
    return all.sort((a, b) => {
      const familyOrder = a[1].family.localeCompare(b[1].family);
      if (familyOrder !== 0) {
        return familyOrder;
      }
      return getReadableLanguageName(a[0], a[1].language_name).localeCompare(
        getReadableLanguageName(b[0], b[1].language_name),
      );
    });
  }, [language_partitions, familyFilter]);

  useEffect(() => {
    setVisibleCount(INITIAL_LANGUAGE_LIMIT);
  }, [familyFilter, language_partitions]);

  const visibleEntries = useMemo(
    () => entries.slice(0, visibleCount),
    [entries, visibleCount],
  );

  if (Object.keys(language_partitions).length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-stone-300 bg-stone-50/60 px-4 py-12 text-center">
        <p className="mb-2 text-sm font-medium text-slate-600">No individual language data</p>
        <p className="text-sm text-slate-400">
          No attesting languages were found for this concept set in the current sample.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={familyFilter}
          onChange={e => setFamilyFilter(e.target.value)}
          className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          <option value="">All families ({entries.length} attesting languages)</option>
          {families.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <p className="text-xs text-slate-400">Only languages with at least one attested colexification are shown.</p>
        {entries.length > visibleEntries.length && (
          <p className="text-xs text-slate-400">
            Showing {visibleEntries.length} of {entries.length} languages.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleEntries.map(([langCode, partition]) => {
          const groups = assignGroups(concepts, partition.merged_groups);
          const mergedIndices = getMergedGroupIndices(groups);
          const groupToColorIdx: Record<number, number> = {};
          let colorCounter = 0;
          for (const groupIdx of mergedIndices) {
            groupToColorIdx[groupIdx] = colorCounter++ % MERGE_COLORS.length;
          }

          const mergedPairCount = [...mergedIndices].length;
          const isAllSplit = mergedIndices.size === 0;
          const languageName = getReadableLanguageName(langCode, partition.language_name);

          return (
            <div
              key={langCode}
              className="rounded-[24px] border border-stone-200/80 bg-white/70 p-5 shadow-[0_8px_20px_rgba(43,53,40,0.05)]"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <p className="atlas-label mb-0.5">{partition.family}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{languageName}</h3>
                  <p className="font-mono text-xs text-slate-400">{langCode}</p>
                </div>
                <span
                  className={`mt-0.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isAllSplit
                      ? 'bg-stone-100 text-slate-500'
                      : 'bg-sky-100 text-sky-900'
                  }`}
                >
                  {isAllSplit ? 'All split' : `${mergedPairCount} merged`}
                </span>
              </div>

              {/* Concept chips */}
              <div className="flex flex-wrap gap-2">
                {concepts.map((c, i) => {
                  const groupIdx = groups[i];
                  const isMerged = mergedIndices.has(groupIdx);
                  const colorClass = isMerged
                    ? MERGE_COLORS[groupToColorIdx[groupIdx] ?? 0]
                    : 'bg-stone-50 text-slate-500 border-stone-200';

                  return (
                    <span
                      key={c.concepticon_id}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${colorClass}`}
                    >
                      {SLOT_LETTERS[i]} · {c.label}
                    </span>
                  );
                })}
              </div>

              {/* Merge groups description */}
              {!isAllSplit && (
                <div className="mt-3 space-y-1">
                  {partition.merged_groups
                    .filter(g => g.length >= 2)
                    .map((group, gi) => {
                      const groupLabels = group
                        .map(id => concepts.find(c => c.concepticon_id === id)?.label)
                        .filter(Boolean);
                      if (groupLabels.length < 2) return null;
                      return (
                        <p key={gi} className="text-xs text-slate-500">
                          <span className="font-medium text-slate-700">Same word:</span>{' '}
                          {groupLabels.join(' + ')}
                        </p>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {entries.length > visibleEntries.length && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount(prev => prev + INITIAL_LANGUAGE_LIMIT)}
            className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-stone-50"
          >
            Show more languages
          </button>
        </div>
      )}

      {entries.length === 0 && familyFilter && (
        <div className="rounded-[22px] border border-dashed border-stone-300 bg-stone-50/60 px-4 py-10 text-center text-sm text-slate-400">
          No colexification data for the selected filter.
        </div>
      )}
    </div>
  );
}
