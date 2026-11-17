import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StudyResult } from '../types';
import { pairIds, samePair, studyPairs } from '../utils/pairs';
import PairPicker from './PairPicker';

interface Props {
  studyResult: StudyResult;
  selectedPair: [string, string] | null;
  onSelectPair: (pair: [string, string]) => void;
}

interface FamilyRow {
  family: string;
  count: number;
  total: number;
  pct: number;
  attesting: string[];
  isSelected: boolean;
}

const MIN_LANG_OPTIONS = [1, 3, 5, 10, 20];
const CHIP_LIMIT = 16;
const CHART_LIMIT = 15;

function FamilyTooltip({ active, payload }: { active?: boolean; payload?: { payload: FamilyRow }[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-900">{row.family}</p>
      <p className="mt-0.5 text-slate-600">
        {row.count} of {row.total} languages ({row.pct.toFixed(1)}%)
      </p>
    </div>
  );
}

export function FamilyPatternsView({ studyResult, selectedPair, onSelectPair }: Props) {
  const { family_profiles, language_names } = studyResult;
  const [minLangs, setMinLangs] = useState(3);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const pairs = useMemo(() => studyPairs(studyResult), [studyResult]);
  // Default to the pair with the most evidence
  const pair =
    pairs.find(p => samePair(p, selectedPair)) ??
    [...pairs].sort((x, y) => (y.evidence?.direct_count ?? 0) - (x.evidence?.direct_count ?? 0))[0];

  const rows = useMemo<FamilyRow[]>(() => {
    if (!pair) return [];
    return Object.entries(family_profiles)
      .map(([family, data]) => {
        const rate = data.pair_rates[pair.labelKey];
        const count = rate?.direct_count ?? 0;
        const total = rate?.total_languages ?? data.total_languages;
        return {
          family,
          count,
          total,
          pct: total > 0 ? (count / total) * 100 : 0,
          attesting: rate?.attesting_languages ?? [],
          isSelected: data.is_selected ?? false,
        };
      })
      .filter(d => d.count > 0 && d.total >= minLangs)
      .sort((a, b) => b.count - a.count || b.pct - a.pct);
  }, [family_profiles, pair, minLangs]);

  const chartRows = useMemo(() => rows.slice(0, CHART_LIMIT), [rows]);

  if (!pair) return null;
  const totalCount = pair.evidence?.direct_count ?? 0;

  const toggleExpanded = (family: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(family)) next.delete(family);
      else next.add(family);
      return next;
    });

  return (
    <div className="space-y-5">
      <PairPicker pairs={pairs} selected={pair} onSelect={p => onSelectPair(pairIds(p))} />

      <div className="rounded-[22px] border border-stone-200/80 bg-white/78 p-5 md:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl text-slate-900">
              {pair.a.label} = {pair.b.label}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {totalCount > 0
                ? `${totalCount.toLocaleString()} languages in ${pair.evidence?.direct_families.length ?? 0} families use one word for both. Bars show attesting languages per family.`
                : 'No language in CLICS uses one word for both concepts. Check the Semantic chains tab for indirect links.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="whitespace-nowrap text-xs text-slate-500">Min. family size</span>
            <div className="flex gap-1 rounded-full border border-stone-200/80 bg-white/80 p-1">
              {MIN_LANG_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => setMinLangs(n)}
                  aria-pressed={minLangs === n}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                    minLangs === n ? 'bg-sky-900 text-white' : 'text-slate-600 hover:bg-stone-100'
                  }`}
                >
                  {n === 1 ? 'All' : `≥${n}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {totalCount > 0 && rows.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">
            No family with ≥{minLangs} languages attests this pair. Lower the minimum family size.
          </p>
        )}

        {rows.length > 0 && (
          <div style={{ width: '100%', height: Math.max(220, chartRows.length * 30 + 40) }}>
            <ResponsiveContainer>
              <BarChart data={chartRows} layout="vertical" margin={{ top: 4, right: 48, left: 4, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 95, 82, 0.15)" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#5b6470' }}
                  label={{ value: 'attesting languages', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#7b8490' }}
                />
                <YAxis type="category" dataKey="family" width={150} tick={{ fontSize: 11, fill: '#3f4853' }} />
                <Tooltip content={<FamilyTooltip />} cursor={{ fill: 'rgba(30, 90, 115, 0.06)' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                  <LabelList
                    dataKey="pct"
                    position="right"
                    formatter={(v: number) => `${v.toFixed(0)}%`}
                    style={{ fontSize: 10, fill: '#6b7280' }}
                  />
                  {chartRows.map(row => (
                    <Cell key={row.family} fill={row.isSelected ? '#1e5a73' : '#9fbfcc'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {(rows.length > CHART_LIMIT || rows.some(r => !r.isSelected)) && (
          <p className="mt-2 text-xs text-slate-500">
            {rows.length > CHART_LIMIT && `Top ${CHART_LIMIT} of ${rows.length} families shown. `}
            {rows.some(r => !r.isSelected) && 'Lighter bars are families outside your family filter.'}
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.slice(0, 12).map(row => {
            const isOpen = expanded.has(row.family);
            const shown = isOpen ? row.attesting : row.attesting.slice(0, CHIP_LIMIT);
            return (
              <div key={row.family} className="rounded-[16px] border border-stone-200/70 bg-stone-50/70 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-800">{row.family}</span>
                  <span className="text-xs font-semibold tabular-nums text-slate-600">
                    {row.count}/{row.total} · {row.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {shown.map(lang => (
                    <span
                      key={lang}
                      className="rounded-full border border-stone-200 bg-white/80 px-2 py-0.5 text-[11px] text-slate-600"
                      title={lang}
                    >
                      {language_names[lang] ?? lang}
                    </span>
                  ))}
                  {row.attesting.length > CHIP_LIMIT && (
                    <button
                      onClick={() => toggleExpanded(row.family)}
                      className="rounded-full bg-stone-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-stone-200"
                    >
                      {isOpen ? 'Show less' : `+${row.attesting.length - CHIP_LIMIT} more`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
