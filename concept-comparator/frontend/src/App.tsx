import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Compass, Loader2, Plus, Sparkles } from 'lucide-react';
import { runStudyWithProgress } from './api/client';
import ComparisonHistory, { HistoryItem } from './components/ComparisonHistory';
import { ComparisonContainer } from './components/ComparisonContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import ConceptSlotPanel from './components/ConceptSlotPanel';
import InfoPanel from './components/InformationPanel';
import FamilySelector from './components/FamilySelector';
import ProgressButton from './components/ProgressButton';
import StarterStudyPicker from './components/StarterStudyPicker';
import { ConceptAnchor, ConceptSlot, StudyRequest, StudyResult } from './types';

const initialSlot = (): ConceptSlot => ({ anchor: null, inputValue: '' });

function App() {
  const [conceptSlots, setConceptSlots] = useState<ConceptSlot[]>([initialSlot(), initialSlot()]);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');

  // ---------------------------------------------------------------------------
  // Slot management
  // ---------------------------------------------------------------------------

  const addSlot = () => {
    if (conceptSlots.length < 6) {
      setConceptSlots(prev => [...prev, initialSlot()]);
    }
  };

  const removeSlot = (index: number) => {
    if (conceptSlots.length > 2) {
      setConceptSlots(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateSlot = (index: number, updates: Partial<ConceptSlot>) => {
    setConceptSlots(prev =>
      prev.map((slot, i) => (i === index ? { ...slot, ...updates } : slot))
    );
  };

  // ---------------------------------------------------------------------------
  // Study mutation
  // ---------------------------------------------------------------------------

  const {
    mutate: runStudy,
    data: studyResult,
    isPending: comparing,
    error: studyError,
    reset: resetStudy,
  } = useMutation<StudyResult, Error, StudyRequest>({
    mutationFn: (req) =>
      runStudyWithProgress(req, (p, step) => {
        setProgress(p);
        setProgressStep(step);
      }),
    onSettled: () => {
      setProgress(0);
      setProgressStep('');
    },
  });

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const readySlots = conceptSlots.filter(s => s.anchor !== null);
  const canCompare = readySlots.length >= 2 && !comparing;

  const comparisonStatus = comparing
    ? (progressStep || 'Running study…')
    : canCompare
    ? 'Ready for analysis'
    : 'Add 2 or more concepts';

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleCompare = () => {
    if (!canCompare) return;
    const anchors = readySlots.map(s => s.anchor!);
    runStudy({
      concepts: anchors,
      families: selectedFamilies,
      show_translations: false,
    });
  };

  const handleStarterStudy = (anchors: ConceptAnchor[]) => {
    // Fill slots from a curated study (may expand beyond 2 slots)
    const newSlots: ConceptSlot[] = anchors.map(anchor => ({
      anchor,
      inputValue: anchor.label,
    }));
    // Pad to at least 2 if needed
    while (newSlots.length < 2) newSlots.push(initialSlot());
    setConceptSlots(newSlots);
    resetStudy();
  };

  const handleHistorySelect = (item: HistoryItem) => {
    // Restore slots from history (concepts stored as strings; resolve via registry)
    const newSlots: ConceptSlot[] = item.concepts.map(label => ({
      anchor: null,
      inputValue: label,
    }));
    while (newSlots.length < 2) newSlots.push(initialSlot());
    setConceptSlots(newSlots);
    setSelectedFamilies(item.selectedFamilies ?? []);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="atlas-page min-h-screen">
      <div className="relative mx-auto max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

        {/* Header */}
        <header className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_360px]">
          <section className="atlas-panel atlas-panel-strong p-8 md:p-10">
            <div className="atlas-pill mb-5">
              <Compass className="h-3.5 w-3.5" />
              Atlas Lab
            </div>
            <div className="max-w-3xl">
              <p className="atlas-kicker mb-3">Concept Colexification Atlas</p>
              <h1 className="mb-4 text-4xl leading-tight text-slate-950 md:text-5xl">
                Explore how languages carve up meaning.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-700 md:text-lg">
                Select 2–6 concepts and see where they merge into one word, stay split, or link
                through semantic chains — across 3,000+ languages and hundreds of families.
                Evidence comes from{' '}
                <span className="font-medium text-slate-900">attested colexification data</span>.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="atlas-gridline rounded-[24px] bg-white/60 p-4">
                <p className="atlas-label mb-2">Concepts</p>
                <p className="text-lg font-semibold text-slate-950">
                  {readySlots.length} / {conceptSlots.length} ready
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Search Concepticon to pin each concept to a canonical ID.
                </p>
              </div>
              <div className="atlas-gridline rounded-[24px] bg-white/60 p-4">
                <p className="atlas-label mb-2">Families</p>
                <p className="text-lg font-semibold text-slate-950">
                  {selectedFamilies.length > 0 ? `${selectedFamilies.length} selected` : 'All families'}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Drill into specific families or see all CLICS data.
                </p>
              </div>
              <div className="atlas-gridline rounded-[24px] bg-white/60 p-4">
                <p className="atlas-label mb-2">Analysis state</p>
                <p className="text-lg font-semibold text-slate-950">{comparisonStatus}</p>
                <p className="mt-2 text-sm text-slate-700">
                  Results appear below once the study finishes.
                </p>
              </div>
            </div>
          </section>

          <aside className="atlas-panel p-6">
            <p className="atlas-kicker mb-3">Study flow</p>
            <h2 className="mb-4 text-2xl text-slate-950">How to read the atlas</h2>
            <div className="space-y-4 text-sm leading-6 text-slate-700">
              <div className="rounded-[22px] border border-stone-200/70 bg-white/60 p-4">
                <p className="font-semibold uppercase tracking-[0.16em] text-slate-900">1. Build a concept set</p>
                <p className="mt-2">
                  Search by gloss, lock each concept to a Concepticon ID, then compare the set
                  against CLICS evidence.
                </p>
              </div>
              <div className="rounded-[22px] border border-stone-200/70 bg-white/60 p-4">
                <p className="font-semibold uppercase tracking-[0.16em] text-slate-900">2. Narrow the sample</p>
                <p className="mt-2">
                  Keep the global view, or open the family filter to focus the detailed language evidence.
                </p>
              </div>
              <div className="rounded-[22px] border border-stone-200/70 bg-white/60 p-4">
                <p className="font-semibold uppercase tracking-[0.16em] text-slate-900">3. Compare the views</p>
                <p className="mt-2">
                  Start with family-level patterns, then move into the network and language tabs for closer inspection.
                </p>
              </div>
            </div>
          </aside>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          <main className="space-y-6">

            {/* Starter studies (shown before any results) */}
            {!studyResult && !comparing && (
              <StarterStudyPicker onSelect={handleStarterStudy} />
            )}

            {/* Loading indicator while study runs */}
            {comparing && (
              <section className="atlas-panel p-8">
                <div className="flex flex-col items-center gap-5 py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {progressStep || 'Running study…'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Querying CLICS colexification data for {readySlots.length} concepts
                    </p>
                  </div>
                  {progress > 0 && (
                    <div className="w-full max-w-sm">
                      <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                        <div
                          className="h-full rounded-full bg-sky-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">{Math.round(progress)}% complete</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Concept input workspace */}
            <section className="atlas-panel p-6 md:p-8">
              <div className="mb-6 flex flex-col gap-3 border-b border-stone-200/70 pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="atlas-kicker mb-2">Build study</p>
                  <h2 className="atlas-section-title">Concept set</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                    Add 2–6 concepts. Each concept is resolved to a Concepticon ID for
                    accurate cross-linguistic comparison.
                  </p>
                </div>
                <div className="atlas-chip">
                  <Sparkles className="h-3.5 w-3.5" />
                  {comparisonStatus}
                </div>
              </div>

              {/* Dynamic concept slots */}
              <ConceptSlotPanel
                slots={conceptSlots}
                onUpdateSlot={updateSlot}
                onRemoveSlot={removeSlot}
              />

              {/* Add concept button */}
              {conceptSlots.length < 6 && (
                <button
                  onClick={addSlot}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-[20px] border border-dashed border-stone-300 bg-stone-50/60 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-white/70 hover:text-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Add concept ({conceptSlots.length}/6)
                </button>
              )}

              {/* Family selector */}
              <div className="mt-6 rounded-[26px] border border-stone-200/80 bg-white/65 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
                <FamilySelector
                  selectedFamilies={selectedFamilies}
                  onChange={setSelectedFamilies}
                />
              </div>

              {/* Launch bar */}
              <div className="mt-6 flex flex-col gap-4 rounded-[26px] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(25,66,86,0.96),rgba(44,102,127,0.9))] p-5 text-stone-50 shadow-[0_20px_45px_rgba(28,48,62,0.18)] md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="atlas-label mb-2 text-stone-200">Launch study</p>
                  <h3 className="text-2xl text-white">Run the analysis</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-stone-100">
                    The study checks direct and partial colexifications in CLICS for every
                    concept pair across the selected sample.
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
                      {studyResult ? 'Re-run study' : 'Run study'}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </ProgressButton>
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-200/80">
                    {readySlots.length > 1
                      ? `${readySlots.length} concepts · ${Math.floor(readySlots.length * (readySlots.length - 1) / 2)} pairs · ${selectedFamilies.length > 0 ? selectedFamilies.length + ' families' : 'all families'}`
                      : 'Add at least 2 concepts'}
                  </p>
                </div>
              </div>

              {studyError && (
                <div className="mt-6 rounded-[22px] border border-red-300/80 bg-red-50/80 p-4 text-sm text-red-900">
                  {studyError.message}
                </div>
              )}
            </section>
          </main>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <div className="atlas-panel p-6">
              <ComparisonHistory
                onSelect={handleHistorySelect}
                currentConcepts={
                  readySlots.length >= 2
                    ? readySlots.map(s => s.anchor!.label)
                    : undefined
                }
                selectedFamilies={selectedFamilies}
                hasResults={!!studyResult}
              />
            </div>
            <InfoPanel />
          </aside>
        </section>

        {/* Results */}
        {studyResult && (
          <section className="mt-6">
            <ErrorBoundary>
              <ComparisonContainer studyResult={studyResult} />
            </ErrorBoundary>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
