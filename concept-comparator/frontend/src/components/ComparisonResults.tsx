import React, { useMemo, useState } from 'react';
import { ChevronDown, LanguagesIcon, Orbit, Scale } from 'lucide-react';
import { getLanguageName } from '../constants/languages';
import { ColexificationGraph } from './ColexificationGraph';
import InfoTooltip from './InfoTooltip';
import SharedEmbeddingsViz from './SharedEmbeddingsViz';
import { ComparisonResult } from '../types';

interface ComparisonResultsProps {
  results: Record<string, ComparisonResult>;
}

const scoreToneClasses = (score: number) => {
  if (score >= 0.75) {
    return {
      badge: 'bg-emerald-100 text-emerald-900',
      bar: 'bg-emerald-500',
      rail: 'bg-emerald-100',
    };
  }
  if (score >= 0.45) {
    return {
      badge: 'bg-amber-100 text-amber-900',
      bar: 'bg-amber-500',
      rail: 'bg-amber-100',
    };
  }
  return {
    badge: 'bg-rose-100 text-rose-900',
    bar: 'bg-rose-500',
    rail: 'bg-rose-100',
  };
};

export const ComparisonResults: React.FC<ComparisonResultsProps> = ({ results }) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (langCode: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [langCode]: !prev[langCode],
    }));
  };

  const summary = useMemo(() => {
    const allResults = Object.values(results);
    const averageSimilarity =
      allResults.reduce((total, result) => total + result.main_similarity, 0) / Math.max(allResults.length, 1);
    const variationCount = allResults.reduce((total, result) => total + result.variation_similarities.length, 0);
    const directColexCount = allResults.filter((result) =>
      Object.values(result.language_colexifications).some((colexList) => colexList.some((colex) => colex.present))
    ).length;

    return {
      averageSimilarity,
      variationCount,
      directColexCount,
    };
  }, [results]);

  const firstResult = Object.values(results)[0];
  const originalConcepts = Object.keys(firstResult.language_colexifications);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[24px] border border-stone-200/80 bg-white/78 p-5">
          <div className="mb-3 flex items-center gap-2 text-sky-900">
            <Scale className="h-4 w-4" />
            <p className="atlas-label !text-sky-900">Average similarity</p>
          </div>
          <div className="text-3xl font-semibold text-slate-900">{(summary.averageSimilarity * 100).toFixed(1)}%</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Mean semantic closeness across the selected languages.</p>
        </div>
        <div className="rounded-[24px] border border-stone-200/80 bg-white/78 p-5">
          <div className="mb-3 flex items-center gap-2 text-amber-900">
            <Orbit className="h-4 w-4" />
            <p className="atlas-label !text-amber-900">Variation pairs</p>
          </div>
          <div className="text-3xl font-semibold text-slate-900">{summary.variationCount}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Alternative translation contexts available for closer reading.</p>
        </div>
        <div className="rounded-[24px] border border-stone-200/80 bg-white/78 p-5">
          <div className="mb-3 flex items-center gap-2 text-emerald-900">
            <LanguagesIcon className="h-4 w-4" />
            <p className="atlas-label !text-emerald-900">Colexification traces</p>
          </div>
          <div className="text-3xl font-semibold text-slate-900">{summary.directColexCount}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Languages showing at least one visible colexification link.</p>
        </div>
      </div>

      <SharedEmbeddingsViz results={results} concepts={originalConcepts} />

      {Object.entries(results).map(([langCode, result]) => {
        const isExpanded = expandedCards[langCode];
        const tone = scoreToneClasses(result.main_similarity);
        const hasColexifications = Object.values(result.language_colexifications).some((colexList) =>
          colexList.some((colex) => colex.present)
        );

        return (
          <div key={langCode} className="rounded-[26px] border border-stone-200/80 bg-white/78 p-5 shadow-[0_14px_34px_rgba(43,53,40,0.06)]">
            <div className="mb-5 flex flex-col gap-4 border-b border-stone-200/70 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="atlas-label mb-1">Language profile</p>
                <h3 className="text-2xl text-slate-900">{getLanguageName(langCode)}</h3>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
                  <span>{result.main_translations[0]}</span>
                  <span className="text-stone-400">vs</span>
                  <span>{result.main_translations[1]}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <InfoTooltip
                  content="Similarity score based on LaBSE embeddings comparing the two translations in contextualized form."
                  showIcon={false}
                >
                  <div className={`rounded-full px-4 py-2 text-sm font-semibold ${tone.badge}`}>
                    Similarity {(result.main_similarity * 100).toFixed(1)}%
                  </div>
                </InfoTooltip>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5">
                <div className="rounded-[22px] border border-stone-200/80 bg-stone-50/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="atlas-label">Primary reading</p>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Core pair</span>
                  </div>
                  <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-stone-200">
                    <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${result.main_similarity * 100}%` }} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[18px] bg-white/80 p-4">
                      <p className="atlas-label mb-2">Concept A output</p>
                      <p className="text-lg font-semibold text-slate-900">{result.main_translations[0]}</p>
                    </div>
                    <div className="rounded-[18px] bg-white/80 p-4">
                      <p className="atlas-label mb-2">Concept B output</p>
                      <p className="text-lg font-semibold text-slate-900">{result.main_translations[1]}</p>
                    </div>
                  </div>
                </div>

                {(result.usage_notes.concept1 || result.usage_notes.concept2) && (
                  <div className="rounded-[22px] border border-stone-200/80 bg-white/70 p-4">
                    <p className="atlas-label mb-3">Usage notes</p>
                    <div className="space-y-2 text-sm leading-6 text-slate-600">
                      {result.usage_notes.concept1 && <p>{result.usage_notes.concept1}</p>}
                      {result.usage_notes.concept2 && <p>{result.usage_notes.concept2}</p>}
                    </div>
                  </div>
                )}

                {result.variation_similarities.length > 0 && (
                  <div className="rounded-[22px] border border-stone-200/80 bg-white/70 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="atlas-label mb-1">Variation study</p>
                        <h4 className="text-lg font-semibold text-slate-900">{result.variation_similarities.length} alternate contexts</h4>
                      </div>
                      <button
                        onClick={() => toggleCard(langCode)}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white"
                      >
                        {isExpanded ? 'Hide details' : 'Show details'}
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 grid gap-3">
                        {result.variation_similarities.map((variation, idx) => {
                          const variationTone = scoreToneClasses(variation.similarity);

                          return (
                            <div key={idx} className="rounded-[18px] border border-stone-200/80 bg-stone-50/80 p-4">
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-slate-900">
                                  {variation.words[0]} <span className="text-stone-400">vs</span> {variation.words[1]}
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${variationTone.badge}`}>
                                  {(variation.similarity * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className={`mb-3 h-2 overflow-hidden rounded-full ${variationTone.rail}`}>
                                <div className={`h-full rounded-full ${variationTone.bar}`} style={{ width: `${variation.similarity * 100}%` }} />
                              </div>
                              <p className="text-sm leading-6 text-slate-600">{variation.context}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-[22px] border border-stone-200/80 bg-stone-50/70 p-4">
                  <p className="atlas-label mb-3">Quick read</p>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <span>Main similarity</span>
                      <span className="font-semibold text-slate-900">{(result.main_similarity * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Variation set</span>
                      <span className="font-semibold text-slate-900">{result.variation_similarities.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Colexification signal</span>
                      <span className="font-semibold text-slate-900">{hasColexifications ? 'Present' : 'Absent'}</span>
                    </div>
                  </div>
                </div>

                {originalConcepts.length >= 2 && hasColexifications && (
                  <div className="rounded-[22px] border border-stone-200/80 bg-white/70 p-4">
                    <ColexificationGraph
                      concept1={originalConcepts[0]}
                      concept2={originalConcepts[1]}
                      colexifications={result.language_colexifications}
                      className="mt-1"
                      title="Colexifications"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
