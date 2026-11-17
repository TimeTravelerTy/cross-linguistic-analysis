import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiClient, errorMessage } from '../api/client';
import { SemanticChain, StudyResult } from '../types';
import { pairIds, samePair, studyPairs } from '../utils/pairs';
import PairPicker from './PairPicker';

interface Props {
  studyResult: StudyResult;
  selectedPair: [string, string] | null;
  onSelectPair: (pair: [string, string]) => void;
}

const DEPTHS = [
  { value: 2, label: 'via 1 concept' },
  { value: 3, label: 'via ≤ 2 concepts' },
  { value: 4, label: 'via ≤ 3 concepts' },
];

function ChainRow({ chain, max }: { chain: SemanticChain; max: number }) {
  const last = chain.path.length - 1;
  return (
    <li className="rounded-[18px] border border-stone-200/80 bg-white/80 p-4">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {chain.path.map((concept, i) => (
          <Fragment key={`${concept}-${i}`}>
            <span
              className={[
                'rounded-full border px-2.5 py-1 text-xs font-semibold',
                i === 0 || i === last
                  ? 'border-sky-800 bg-sky-900 text-white'
                  : 'border-stone-300 bg-stone-50 text-slate-800',
              ].join(' ')}
            >
              {concept}
            </span>
            {i < last && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums text-slate-500"
                title={`${chain.counts[i]} languages colexify ${concept} and ${chain.path[i + 1]}`}
              >
                <span className="text-slate-300">—</span>
                {chain.counts[i]}
                <span className="text-slate-300">→</span>
              </span>
            )}
          </Fragment>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-sky-700"
            style={{ width: `${(chain.total_score / max) * 100}%` }}
          />
        </div>
        <span className="w-44 shrink-0 text-right text-xs text-slate-500">
          weakest link: <span className="font-semibold tabular-nums text-slate-700">{Math.min(...chain.counts)}</span> languages
        </span>
      </div>
    </li>
  );
}

export function SemanticChainsView({ studyResult, selectedPair, onSelectPair }: Props) {
  const pairs = useMemo(() => studyPairs(studyResult), [studyResult]);
  const pair = pairs.find(p => samePair(p, selectedPair)) ?? pairs[0];
  const [family, setFamily] = useState('');
  const [maxDepth, setMaxDepth] = useState(3);

  const families = useMemo(
    () =>
      Object.entries(studyResult.family_profiles)
        .sort((a, b) => b[1].total_languages - a[1].total_languages)
        .map(([name]) => name),
    [studyResult.family_profiles],
  );

  const bothInClics = !!pair?.a.clics_gloss && !!pair?.b.clics_gloss;

  const { data, isFetching, error } = useQuery({
    queryKey: ['chains', pair?.idKey, family, maxDepth],
    queryFn: () =>
      apiClient.getChains(pair!.a.concepticon_id, pair!.b.concepticon_id, {
        family: family || undefined,
        maxDepth,
      }),
    enabled: !!pair && bothInClics,
    staleTime: Infinity,
  });

  if (!pair) return null;
  const chains = data?.chains ?? [];
  const max = Math.max(...chains.map(c => c.total_score), 1e-9);

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-sm leading-6 text-slate-600">
        Concepts can be linked indirectly: each step is a colexification attested in the sample, even
        when the two ends never share a word. Numbers show how many languages attest each step;
        chains are ranked by the geometric mean of their steps.
      </p>

      <PairPicker pairs={pairs} selected={pair} onSelect={p => onSelectPair(pairIds(p))} />

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={family}
          onChange={e => setFamily(e.target.value)}
          className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
          aria-label="Language family"
        >
          <option value="">All families</option>
          {families.map(f => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <div className="flex gap-1 rounded-full border border-stone-200/80 bg-white/80 p-1" role="group" aria-label="Chain length">
          {DEPTHS.map(d => (
            <button
              key={d.value}
              onClick={() => setMaxDepth(d.value)}
              aria-pressed={maxDepth === d.value}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                maxDepth === d.value ? 'bg-sky-900 text-white' : 'text-slate-600 hover:bg-stone-100'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      {data && (
        <p className="text-sm text-slate-700">
          {data.direct_count > 0 ? (
            <>
              <span className="font-semibold">{pair.a.label}</span> and{' '}
              <span className="font-semibold">{pair.b.label}</span> are also colexified directly in{' '}
              <span className="font-semibold">{data.direct_count}</span> languages
              {family ? ` of ${family}` : ''}.
            </>
          ) : (
            <>
              <span className="font-semibold">{pair.a.label}</span> and{' '}
              <span className="font-semibold">{pair.b.label}</span> are never colexified directly
              {family ? ` in ${family}` : ''}; the chains below are the only links.
            </>
          )}
        </p>
      )}

      {!bothInClics ? (
        <p className="rounded-[18px] border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-slate-500">
          Both concepts need CLICS coverage to search for chains.
        </p>
      ) : error ? (
        <p className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage(error)}
        </p>
      ) : data && chains.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-slate-500">
          No indirect chains found{family ? ` in ${family}` : ''}. Try allowing longer chains
          {family ? ' or all families' : ''}.
        </p>
      ) : (
        <ol className="space-y-3">
          {chains.map(chain => (
            <ChainRow key={chain.path.join('>')} chain={chain} max={max} />
          ))}
        </ol>
      )}
    </div>
  );
}
