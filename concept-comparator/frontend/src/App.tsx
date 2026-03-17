import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Compass, LanguagesIcon, Sparkles } from 'lucide-react';
import { apiClient } from './api/client';
import ComparisonHistory, { HistoryItem } from './components/ComparisonHistory';
import { ComparisonContainer } from './components/ComparisonContainer';
import ConceptSearch from './components/ConceptSearch';
import InfoPanel from './components/InformationPanel';
import { LanguageSelector } from './components/LanguageSelector';
import ProgressButton from './components/ProgressButton';
import { WordSenseSelector } from './components/WordSenseSelector';
import { ClicsMatch, ComparisonData, ComparisonResult, Languages, WordSense } from './types';

function App() {
  const [concept1, setConcept1] = useState('');
  const [concept2, setConcept2] = useState('');
  const [selectedSense1, setSelectedSense1] = useState<WordSense | null>(null);
  const [selectedSense2, setSelectedSense2] = useState<WordSense | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [concept1Mode, setConcept1Mode] = useState<'wordnet' | 'clics'>('wordnet');
  const [concept2Mode, setConcept2Mode] = useState<'wordnet' | 'clics'>('wordnet');
  const [progress, setProgress] = useState(0);

  const { data: senses1, isLoading: loading1 } = useQuery<WordSense[]>({
    queryKey: ['wordSenses', concept1],
    queryFn: () => apiClient.getWordSenses(concept1),
    enabled: concept1.length >= 3 && concept1Mode === 'wordnet',
    staleTime: Infinity,
  });

  const { data: senses2, isLoading: loading2 } = useQuery<WordSense[]>({
    queryKey: ['wordSenses', concept2],
    queryFn: () => apiClient.getWordSenses(concept2),
    enabled: concept2.length >= 3 && concept2Mode === 'wordnet',
    staleTime: Infinity,
  });

  const { data: clicsMatches1 } = useQuery<{ matches: ClicsMatch[] }>({
    queryKey: ['clics-concepts', concept1],
    queryFn: () => apiClient.searchClicsConcepts(concept1),
    enabled: concept1Mode === 'clics' && concept1.length >= 2,
  });

  const { data: clicsMatches2 } = useQuery<{ matches: ClicsMatch[] }>({
    queryKey: ['clics-concepts', concept2],
    queryFn: () => apiClient.searchClicsConcepts(concept2),
    enabled: concept2Mode === 'clics' && concept2.length >= 2,
  });

  const { data: languages } = useQuery<Languages>({
    queryKey: ['languages'],
    queryFn: () => apiClient.getSupportedLanguages(),
  });

  const {
    mutate: compareWords,
    data: results,
    isPending: comparing,
    error: compareError,
  } = useMutation<Record<string, ComparisonResult>, Error, ComparisonData>({
    mutationFn: (data) =>
      apiClient.compareWordsWithProgress(
        {
          ...data,
          languages: data.languages.map((langCode) => langCode.toLowerCase()),
        },
        (nextProgress: number) => {
          setProgress(nextProgress);
        }
      ),
    onSettled: () => {
      setProgress(0);
    },
  });

  const canCompare =
    ((concept1Mode === 'wordnet' && selectedSense1) || (concept1Mode === 'clics' && concept1)) &&
    ((concept2Mode === 'wordnet' && selectedSense2) || (concept2Mode === 'clics' && concept2)) &&
    selectedLanguages.length > 0 &&
    !comparing;

  const formatClicsSense = (match: ClicsMatch | undefined) => {
    if (!match) {
      return '';
    }
    return `SEMANTIC_FIELD:${match.semantic_field} CATEGORY:${match.category} ${match.concept}`;
  };

  const handleCompare = () => {
    if (!canCompare) {
      return;
    }

    compareWords({
      concept1,
      sense_id1:
        concept1Mode === 'wordnet'
          ? selectedSense1!.synset_id
          : formatClicsSense(clicsMatches1?.matches.find((match) => match.concept === concept1)),
      concept2,
      sense_id2:
        concept2Mode === 'wordnet'
          ? selectedSense2!.synset_id
          : formatClicsSense(clicsMatches2?.matches.find((match) => match.concept === concept2)),
      languages: selectedLanguages,
    });
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setConcept1(item.concepts[0]);
    setConcept2(item.concepts[1]);
    setConcept1Mode(item.modes[0]);
    setConcept2Mode(item.modes[1]);
    setSelectedLanguages(item.selectedLanguages);

    compareWords({
      concept1: item.concepts[0],
      sense_id1:
        item.modes[0] === 'wordnet'
          ? item.senseIds[0] || ''
          : formatClicsSense(item.clicsMatches?.concept1),
      concept2: item.concepts[1],
      sense_id2:
        item.modes[1] === 'wordnet'
          ? item.senseIds[1] || ''
          : formatClicsSense(item.clicsMatches?.concept2),
      languages: item.selectedLanguages,
    });
  };

  const comparisonStatus = comparing ? 'Mapping semantic terrain' : canCompare ? 'Ready for analysis' : 'Choose concepts and languages';
  const selectedSourceLabel = `${concept1Mode.toUpperCase()} x ${concept2Mode.toUpperCase()}`;

  return (
    <div className="atlas-page min-h-screen">
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_360px]">
          <section className="atlas-panel atlas-panel-strong p-8 md:p-10">
            <div className="atlas-pill mb-5">
              <Compass className="h-3.5 w-3.5" />
              Atlas Lab
            </div>
            <div className="max-w-3xl">
              <p className="atlas-kicker mb-3">Cross-Linguistic concept mapping</p>
              <h1 className="mb-4 text-4xl leading-tight text-slate-900 md:text-5xl">
                Compare how languages carve up meaning, not just vocabulary.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Build a pairwise study with WordNet precision or CLICS concepts, then inspect semantic
                similarity, colexification structure, and family-level patterns in one place.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="atlas-gridline rounded-[24px] bg-white/45 p-4">
                <p className="atlas-label mb-2">Sources</p>
                <p className="text-lg font-semibold text-slate-900">{selectedSourceLabel}</p>
                <p className="mt-2 text-sm text-slate-600">Mix lexical disambiguation with cross-linguistic concept data.</p>
              </div>
              <div className="atlas-gridline rounded-[24px] bg-white/45 p-4">
                <p className="atlas-label mb-2">Languages</p>
                <p className="text-lg font-semibold text-slate-900">{selectedLanguages.length} selected</p>
                <p className="mt-2 text-sm text-slate-600">Compare narrow clusters or broad family coverage.</p>
              </div>
              <div className="atlas-gridline rounded-[24px] bg-white/45 p-4">
                <p className="atlas-label mb-2">Analysis state</p>
                <p className="text-lg font-semibold text-slate-900">{comparisonStatus}</p>
                <p className="mt-2 text-sm text-slate-600">Results update below once the comparison finishes.</p>
              </div>
            </div>
          </section>

          <aside className="atlas-panel p-6">
            <p className="atlas-kicker mb-3">Field notes</p>
            <h2 className="mb-4 text-2xl text-slate-900">Recommended workflow</h2>
            <div className="space-y-4 text-sm leading-6 text-slate-600">
              <div className="rounded-[22px] border border-stone-200/70 bg-white/60 p-4">
                <p className="font-semibold uppercase tracking-[0.16em] text-slate-800">1. Frame the comparison</p>
                <p className="mt-2">Use WordNet for precise English sense selection, or switch to CLICS when you want concepts anchored in cross-linguistic datasets.</p>
              </div>
              <div className="rounded-[22px] border border-stone-200/70 bg-white/60 p-4">
                <p className="font-semibold uppercase tracking-[0.16em] text-slate-800">2. Widen the sample</p>
                <p className="mt-2">Pick enough languages to expose family and area-level tendencies instead of isolated translation choices.</p>
              </div>
              <div className="rounded-[22px] border border-stone-200/70 bg-white/60 p-4">
                <p className="font-semibold uppercase tracking-[0.16em] text-slate-800">3. Read the terrain</p>
                <p className="mt-2">Use the language view for per-language nuance, then switch to family and area views for structural patterns.</p>
              </div>
            </div>
          </aside>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
          <main className="space-y-6">
            <section className="atlas-panel p-6 md:p-8">
              <div className="mb-8 flex flex-col gap-3 border-b border-stone-200/70 pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="atlas-kicker mb-2">Build comparison</p>
                  <h2 className="atlas-section-title">Semantic survey workspace</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Choose two concepts, resolve their intended senses, then select the language set you want
                    the system to map.
                  </p>
                </div>
                <div className="atlas-chip">
                  <Sparkles className="h-3.5 w-3.5" />
                  {comparisonStatus}
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-[26px] border border-stone-200/80 bg-white/55 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="atlas-label mb-1">Concept A</p>
                      <h3 className="text-2xl text-slate-900">Source concept</h3>
                    </div>
                    <div className="atlas-chip">{concept1Mode.toUpperCase()}</div>
                  </div>
                  <ConceptSearch
                    value={concept1}
                    onChange={setConcept1}
                    placeholder="Enter the first concept"
                    disabled={loading1}
                    mode={concept1Mode}
                    onModeChange={setConcept1Mode}
                  />
                  <div className="mt-4 border-t border-stone-200/70 pt-4">
                    {concept1Mode === 'wordnet' &&
                      (loading1 ? (
                        <div className="rounded-[20px] border border-dashed border-stone-300 bg-stone-50/70 px-4 py-8 text-center text-sm text-slate-500">
                          Loading word senses...
                        </div>
                      ) : (
                        senses1 && (
                          <WordSenseSelector
                            word={concept1}
                            senses={senses1}
                            selectedSense={selectedSense1}
                            onSelect={setSelectedSense1}
                          />
                        )
                      ))}
                  </div>
                </div>

                <div className="rounded-[26px] border border-stone-200/80 bg-white/55 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="atlas-label mb-1">Concept B</p>
                      <h3 className="text-2xl text-slate-900">Counterpart concept</h3>
                    </div>
                    <div className="atlas-chip">{concept2Mode.toUpperCase()}</div>
                  </div>
                  <ConceptSearch
                    value={concept2}
                    onChange={setConcept2}
                    placeholder="Enter the second concept"
                    disabled={loading2}
                    mode={concept2Mode}
                    onModeChange={setConcept2Mode}
                  />
                  <div className="mt-4 border-t border-stone-200/70 pt-4">
                    {concept2Mode === 'wordnet' &&
                      (loading2 ? (
                        <div className="rounded-[20px] border border-dashed border-stone-300 bg-stone-50/70 px-4 py-8 text-center text-sm text-slate-500">
                          Loading word senses...
                        </div>
                      ) : (
                        senses2 && (
                          <WordSenseSelector
                            word={concept2}
                            senses={senses2}
                            selectedSense={selectedSense2}
                            onSelect={setSelectedSense2}
                          />
                        )
                      ))}
                  </div>
                </div>
              </div>

              {languages && (
                <div className="mt-6 rounded-[26px] border border-stone-200/80 bg-white/55 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <div className="mb-5 flex flex-col gap-3 border-b border-stone-200/70 pb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="atlas-label mb-1">Coverage</p>
                      <h3 className="text-2xl text-slate-900">Language field set</h3>
                    </div>
                    <div className="atlas-chip">
                      <LanguagesIcon className="h-3.5 w-3.5" />
                      {selectedLanguages.length} / {Object.keys(languages).length}
                    </div>
                  </div>
                  <LanguageSelector
                    languages={languages}
                    selectedLanguages={selectedLanguages}
                    onChange={setSelectedLanguages}
                  />
                </div>
              )}

              <div className="mt-6 flex flex-col gap-4 rounded-[26px] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(25,66,86,0.96),rgba(44,102,127,0.9))] p-5 text-stone-50 shadow-[0_20px_45px_rgba(28,48,62,0.18)] md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="atlas-label mb-2 text-stone-200">Launch analysis</p>
                  <h3 className="text-2xl text-white">Compare the concept pair</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-stone-200">
                    The system will generate translations, compare their semantic embeddings, and surface
                    colexification patterns across the selected languages.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-3 md:items-end">
                  <ProgressButton
                    onClick={handleCompare}
                    disabled={!canCompare}
                    isLoading={comparing}
                    progress={progress}
                  >
                    <span className="inline-flex items-center gap-2">
                      Compare concepts
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </ProgressButton>
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-200/80">
                    {selectedLanguages.length > 0
                      ? `${selectedLanguages.length} languages in this pass`
                      : 'Select at least one language'}
                  </p>
                </div>
              </div>

              {compareError && (
                <div className="mt-6 rounded-[22px] border border-red-300/80 bg-red-50/80 p-4 text-sm text-red-900">
                  {compareError.message}
                </div>
              )}
            </section>

            {results && languages && (
              <ComparisonContainer
                results={results}
                languages={languages}
                originalConcepts={[concept1, concept2]}
              />
            )}
          </main>

          <aside className="space-y-6">
            <div className="atlas-panel p-6">
              <ComparisonHistory
                onSelect={handleHistorySelect}
                currentConcepts={concept1 && concept2 ? ([concept1, concept2] as [string, string]) : undefined}
                currentModes={concept1Mode && concept2Mode ? [concept1Mode, concept2Mode] : undefined}
                currentSenseIds={[selectedSense1?.synset_id || null, selectedSense2?.synset_id || null]}
                selectedLanguages={selectedLanguages}
                hasResults={!!results}
                clicsMatches1={clicsMatches1}
                clicsMatches2={clicsMatches2}
              />
            </div>

            <InfoPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;
