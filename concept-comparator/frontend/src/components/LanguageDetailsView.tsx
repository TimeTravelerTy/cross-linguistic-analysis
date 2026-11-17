import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ConceptAnchor, LanguagePartition, StudyResult } from '../types';

const SLOT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const PAGE_SIZE = 48;

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

/** Group index per concept (concepts in the same merged group share an index). */
function assignGroups(concepts: ConceptAnchor[], mergedGroups: string[][]): number[] {
  const ids = concepts.map(c => c.concepticon_id);
  const result = new Array(concepts.length).fill(-1);
  mergedGroups.forEach((group, groupIdx) => {
    for (const id of group) {
      const i = ids.indexOf(id);
      if (i >= 0) result[i] = groupIdx;
    }
  });
  let next = mergedGroups.length;
  return result.map(g => (g === -1 ? next++ : g));
}

/**
 * Concepts that share each attested word form, e.g. { "fot": ["LEG", "FOOT"] }.
 * Built from the per-pair forms, so a group only lists concepts that really
 * share that exact form.
 */
function sharedForms(partition: LanguagePartition, concepts: ConceptAnchor[]): [string, string[]][] {
  const order = concepts.map(c => c.concepticon_id);
  const byForm = new Map<string, Set<string>>();
  for (const [key, form] of Object.entries(partition.pair_forms ?? {})) {
    const ids = byForm.get(form) ?? new Set<string>();
    key.split('|').forEach(id => ids.add(id));
    byForm.set(form, ids);
  }
  return [...byForm.entries()].map(([form, ids]) => [
    form,
    [...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b)),
  ]);
}

function LanguageCard({ code, partition, concepts }: { code: string; partition: LanguagePartition; concepts: ConceptAnchor[] }) {
  const groups = assignGroups(concepts, partition.merged_groups);
  const colorOf = new Map(partition.merged_groups.map((_, i) => [i, MERGE_COLORS[i % MERGE_COLORS.length]]));
  const labelOf = (id: string) => concepts.find(c => c.concepticon_id === id)?.label ?? id;

  return (
    <div className="rounded-[20px] border border-stone-200/80 bg-white/75 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900" title={partition.language_name}>
            {partition.language_name}
          </h3>
          <p className="truncate text-xs text-slate-500" title={code}>
            {partition.family}
            {partition.dataset ? ` · ${partition.dataset}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {concepts.map((c, i) => {
          const g = groups[i];
          const color = colorOf.get(g) ?? 'bg-stone-50 text-slate-500 border-stone-200';
          return (
            <span key={c.concepticon_id} className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
              {SLOT_LETTERS[i]} · {c.label}
            </span>
          );
        })}
      </div>

      <ul className="mt-3 space-y-1">
        {sharedForms(partition, concepts).map(([form, ids]) => (
          <li key={form} className="text-xs text-slate-600">
            <span className="font-serif text-sm italic text-slate-900">{form}</span>
            <span className="text-slate-400"> · </span>
            <span className="font-medium text-slate-700">{ids.map(labelOf).join(' + ')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LanguageDetailsView({ studyResult }: Props) {
  const { concepts, language_partitions } = studyResult;
  const [familyFilter, setFamilyFilter] = useState('');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const families = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of Object.values(language_partitions)) counts.set(p.family, (counts.get(p.family) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [language_partitions]);

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(language_partitions)
      .filter(([, p]) => !familyFilter || p.family === familyFilter)
      .filter(([code, p]) =>
        !q ||
        p.language_name.toLowerCase().includes(q) ||
        code.toLowerCase().includes(q) ||
        Object.values(p.pair_forms ?? {}).some(f => f.toLowerCase().includes(q)),
      )
      .sort(
        (a, b) =>
          b[1].merged_groups.flat().length - a[1].merged_groups.flat().length ||
          Number(a[1].language_name.includes('#')) - Number(b[1].language_name.includes('#')) ||
          a[1].family.localeCompare(b[1].family) ||
          a[1].language_name.localeCompare(b[1].language_name),
      );
  }, [language_partitions, familyFilter, query]);

  const total = Object.keys(language_partitions).length;

  if (total === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-stone-300 bg-stone-50/60 px-4 py-12 text-center">
        <p className="mb-1 text-sm font-medium text-slate-600">No attesting languages</p>
        <p className="text-sm text-slate-400">
          None of the concept pairs are colexified in the current sample.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search language or word form…"
            className="atlas-input py-2 pl-9 text-sm"
          />
        </div>
        <select
          value={familyFilter}
          onChange={e => {
            setFamilyFilter(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          aria-label="Filter by family"
          className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          <option value="">All families ({total})</option>
          {families.map(([f, n]) => (
            <option key={f} value={f}>
              {f} ({n})
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 md:ml-auto">
          {entries.length} {entries.length === 1 ? 'language' : 'languages'} with at least one shared word
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.slice(0, visibleCount).map(([code, partition]) => (
          <LanguageCard key={code} code={code} partition={partition} concepts={concepts} />
        ))}
      </div>

      {entries.length > visibleCount && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
            className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-stone-50"
          >
            Show more ({entries.length - visibleCount} left)
          </button>
        </div>
      )}

      {entries.length === 0 && (
        <p className="rounded-[20px] border border-dashed border-stone-300 bg-stone-50/60 px-4 py-10 text-center text-sm text-slate-400">
          No languages match.
        </p>
      )}
    </div>
  );
}
