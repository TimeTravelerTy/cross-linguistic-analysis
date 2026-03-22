import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { StudyResult } from '../types';

interface Props {
  studyResult: StudyResult;
}

const MIN_LANG_OPTIONS = [1, 3, 5, 10, 20];

export function FamilyPatternsView({ studyResult }: Props) {
  const { family_profiles } = studyResult;
  const [minLangs, setMinLangs] = useState(3);

  const pairs = useMemo(() => {
    const pairMap: Record<string, { labelA: string; labelB: string }> = {};
    for (const familyData of Object.values(family_profiles)) {
      for (const [key, rate] of Object.entries(familyData.pair_rates)) {
        if (!pairMap[key]) pairMap[key] = { labelA: rate.label_a, labelB: rate.label_b };
      }
    }
    return Object.entries(pairMap).map(([key, { labelA, labelB }]) => ({ key, labelA, labelB }));
  }, [family_profiles]);

  const [selectedPair, setSelectedPair] = useState(() => pairs[0]?.key ?? '');

  // Chart data: absolute attesting count as primary, filtered by minLangs
  const chartData = useMemo(() => {
    if (!selectedPair) return [];
    return Object.entries(family_profiles)
      .map(([family, data]) => {
        const rate = data.pair_rates[selectedPair];
        const count = rate?.direct_count ?? 0;
        const total = rate?.total_languages ?? data.total_languages;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return {
          family,
          count,
          total,
          pct,
          attesting: rate?.attesting_languages ?? [],
          is_selected: data.is_selected ?? false,
        };
      })
      .filter(d => d.count > 0 && d.total >= minLangs)
      .sort((a, b) => b.count - a.count);
  }, [family_profiles, selectedPair, minLangs]);

  const selectedPairInfo = pairs.find(p => p.key === selectedPair);
  const familiesWithData = Object.values(family_profiles).filter(f =>
    Object.values(f.pair_rates).some(r => r.direct_count > 0)
  ).length;

  if (pairs.length === 0 || familiesWithData === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-stone-300 bg-stone-50/60 px-4 py-10 text-center text-sm text-slate-500">
        No family data available. Make sure concepts have CLICS coverage.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards — show total attesting count across all CLICS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pairs.map(({ key, labelA, labelB }) => {
          let totalCount = 0;
          let totalLangs = 0;
          for (const data of Object.values(family_profiles)) {
            const rate = data.pair_rates[key];
            if (rate) {
              totalCount += rate.direct_count;
              totalLangs += rate.total_languages;
            }
          }
          const pct = totalLangs > 0 ? (totalCount / totalLangs) * 100 : 0;
          return (
            <button
              key={key}
              onClick={() => setSelectedPair(key)}
              className={`rounded-[20px] border p-4 text-left transition ${
                selectedPair === key
                  ? 'border-sky-300 bg-sky-50 shadow-[0_8px_20px_rgba(46,80,99,0.1)]'
                  : 'border-stone-200/80 bg-white/70 hover:border-stone-300 hover:bg-white'
              }`}
            >
              <p className="atlas-label mb-1">{labelA} ↔ {labelB}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-slate-900">{totalCount}</span>
                <span className="text-sm text-slate-500">languages attest this</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                across all CLICS families ({pct.toFixed(1)}% of sampled)
              </p>
            </button>
          );
        })}
      </div>

      {/* Bar chart */}
      {selectedPairInfo && (
        <div className="rounded-[24px] border border-stone-200/80 bg-white/78 p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="atlas-label mb-1">Family breakdown</p>
              <h3 className="text-2xl text-slate-900">
                {selectedPairInfo.labelA} ↔ {selectedPairInfo.labelB}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Languages attesting direct colexification, by family. Sorted by count.
              </p>
            </div>
            {/* Min-language filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 whitespace-nowrap">Min. family size:</span>
              <div className="flex gap-1 rounded-full border border-stone-200/80 bg-white/80 p-1">
                {MIN_LANG_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setMinLangs(n)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      minLangs === n ? 'bg-sky-900 text-white' : 'text-slate-600 hover:bg-stone-100'
                    }`}
                  >
                    {n === 1 ? 'All' : `≥${n}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {chartData.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No families with ≥{minLangs} language{minLangs !== 1 ? 's' : ''} attest this pair.
              Try reducing the minimum family size.
            </p>
          ) : (
            <div style={{ width: '100%', height: Math.max(280, chartData.length * 34) }}>
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 90, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 95, 82, 0.15)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 'auto']}
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#5b6470' }}
                    label={{ value: 'attesting languages', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#9ca3af' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="family"
                    width={140}
                    tick={{ fontSize: 11, fill: '#5b6470' }}
                  />
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) => {
                      const { total, pct } = props.payload;
                      return [
                        `${value} / ${total} languages in CLICS (${pct.toFixed(1)}%)`,
                        'Attesting',
                      ];
                    }}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 16,
                      border: '1px solid rgba(212, 201, 181, 0.9)',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} animationDuration={350}>
                    <LabelList
                      dataKey="pct"
                      position="right"
                      formatter={(v: number) => `${v.toFixed(0)}%`}
                      style={{ fontSize: 10, fill: '#6b7280' }}
                    />
                    {chartData.map(entry => (
                      <Cell
                        key={entry.family}
                        fill={entry.is_selected ? '#1e5a73' : entry.count >= 10 ? '#2d7a96' : entry.count >= 4 ? '#4da3bf' : '#a5c8d8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Attesting language chips per family */}
          {chartData.length > 0 && (
            <div className="mt-5 space-y-2">
              {chartData.slice(0, 8).map(d => (
                <div
                  key={d.family}
                  className={[
                    'rounded-[18px] border px-4 py-3',
                    d.is_selected
                      ? 'border-sky-200 bg-sky-50/60'
                      : 'border-stone-200/70 bg-stone-50/70',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-800">{d.family}</span>
                    <span className="text-xs font-semibold text-slate-600">
                      {d.count}/{d.total} · {d.pct.toFixed(1)}%
                    </span>
                  </div>
                  {d.attesting.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {d.attesting.slice(0, 12).map(lang => (
                        <span
                          key={lang}
                          className="rounded-full border border-stone-200 bg-white/80 px-2 py-0.5 font-mono text-[10px] text-slate-600"
                        >
                          {lang}
                        </span>
                      ))}
                      {d.attesting.length > 12 && (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-slate-500">
                          +{d.attesting.length - 12}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
