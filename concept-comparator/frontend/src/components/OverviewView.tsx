import { useMemo, type CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { StudyResult } from '../types';
import { ConceptPair, pairIds, studyPairs } from '../utils/pairs';

interface Props {
  studyResult: StudyResult;
  onOpenFamilies: (pair: [string, string]) => void;
  onOpenChains: (pair: [string, string]) => void;
}

/** Sequential blue ramp for the matrix, by log(count). */
function cellStyle(count: number, max: number): CSSProperties {
  if (count === 0) return { background: 'rgba(245, 241, 233, 0.9)', color: '#94a3b8' };
  const t = Math.log(count + 1) / Math.log(max + 1);
  const lightness = 92 - t * 62; // 92% -> 30%
  return {
    background: `hsl(198 55% ${lightness}%)`,
    color: lightness < 58 ? '#f8fafc' : '#0f2f3d',
  };
}

export function OverviewView({ studyResult, onOpenFamilies, onOpenChains }: Props) {
  const { concepts } = studyResult;
  const pairs = useMemo(() => studyPairs(studyResult), [studyResult]);

  const byIds = useMemo(() => {
    const map = new Map<string, ConceptPair>();
    for (const p of pairs) {
      map.set(`${p.a.concepticon_id}|${p.b.concepticon_id}`, p);
      map.set(`${p.b.concepticon_id}|${p.a.concepticon_id}`, p);
    }
    return map;
  }, [pairs]);

  const maxCount = Math.max(1, ...pairs.map(p => p.evidence?.direct_count ?? 0));
  const sorted = [...pairs].sort(
    (x, y) => (y.evidence?.direct_count ?? 0) - (x.evidence?.direct_count ?? 0),
  );
  const missingClics = concepts.filter(c => !c.clics_gloss);

  return (
    <div className="space-y-6">
      {missingClics.length > 0 && (
        <p className="rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {missingClics.map(c => c.label).join(', ')} {missingClics.length === 1 ? 'is' : 'are'} not
          in CLICS, so pairs involving {missingClics.length === 1 ? 'it' : 'them'} have no data.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
        {/* Matrix */}
        <div className="rounded-[22px] border border-stone-200/80 bg-white/75 p-5">
          <h3 className="text-lg text-slate-900">Shared words</h3>
          <p className="mb-4 mt-1 text-sm text-slate-500">Languages with one word for both concepts.</p>
          <div className="atlas-scroll overflow-x-auto">
            <table className="border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th />
                  {concepts.map(c => (
                    <th
                      key={c.concepticon_id}
                      scope="col"
                      className="max-w-[5.5rem] px-1 pb-1 text-left align-bottom font-semibold text-slate-600"
                    >
                      <span className="line-clamp-2 break-words">{c.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {concepts.map((row, i) => (
                  <tr key={row.concepticon_id}>
                    <th scope="row" className="max-w-[8rem] pr-2 text-right font-semibold text-slate-600">
                      <span className="line-clamp-2 break-words">{row.label}</span>
                    </th>
                    {concepts.map((col, j) => {
                      if (i === j) {
                        return <td key={col.concepticon_id} className="h-12 w-[4.5rem] rounded-lg bg-stone-200/50" />;
                      }
                      const pair = byIds.get(`${row.concepticon_id}|${col.concepticon_id}`)!;
                      const count = pair.evidence?.direct_count ?? 0;
                      return (
                        <td key={col.concepticon_id} className="p-0">
                          <button
                            onClick={() => onOpenFamilies(pairIds(pair))}
                            disabled={count === 0}
                            title={`${row.label} = ${col.label}: ${count} languages`}
                            className="h-12 w-[4.5rem] rounded-lg text-sm font-semibold tabular-nums transition hover:ring-2 hover:ring-sky-400 disabled:cursor-default disabled:hover:ring-0"
                            style={cellStyle(count, maxCount)}
                          >
                            {count || '–'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pair list */}
        <div className="rounded-[22px] border border-stone-200/80 bg-white/75 p-5">
          <h3 className="text-lg text-slate-900">Pairs</h3>
          <p className="mb-4 mt-1 text-sm text-slate-500">
            <span className="font-medium text-slate-700">Neighbourhood similarity</span> compares the
            concepts' positions in the CLICS network (Node2Vec cosine). High values mean they colexify
            with the same concepts, even when they rarely share a word themselves.
          </p>
          <ul className="divide-y divide-stone-200/70">
            {sorted.map(pair => {
              const ev = pair.evidence;
              const count = ev?.direct_count ?? 0;
              const families = ev?.direct_families.length ?? 0;
              const similarity = ev?.embedding_similarity;
              return (
                <li key={pair.idKey} className="flex flex-col gap-3 py-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {pair.a.label} <span className="text-slate-400">↔</span> {pair.b.label}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {count > 0
                        ? `${count.toLocaleString()} languages · ${families} ${families === 1 ? 'family' : 'families'}`
                        : 'No direct colexification in CLICS'}
                    </p>
                  </div>
                  <div className="w-40 shrink-0">
                    {similarity != null ? (
                      <>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Similarity</span>
                          <span className="font-semibold tabular-nums text-slate-700">{similarity.toFixed(2)}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-200">
                          <div
                            className="h-full rounded-full bg-sky-700"
                            style={{ width: `${Math.max(0, Math.min(1, similarity)) * 100}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">No embedding</span>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {count > 0 && (
                      <button
                        onClick={() => onOpenFamilies(pairIds(pair))}
                        className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-stone-50"
                      >
                        Families <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => onOpenChains(pairIds(pair))}
                      className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-stone-50"
                    >
                      Chains <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
