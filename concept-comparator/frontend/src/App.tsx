import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Plus } from 'lucide-react';
import { apiClient, runStudyWithProgress } from './api/client';
import ComparisonHistory from './components/ComparisonHistory';
import { HistoryItem, addToHistory, clearHistory, loadHistory } from './utils/history';
import { readUrlState, writeUrlState } from './utils/urlState';
import { ComparisonContainer } from './components/ComparisonContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import ConceptSlotPanel from './components/ConceptSlotPanel';
import InfoPanel from './components/InformationPanel';
import FamilySelector from './components/FamilySelector';
import ProgressButton from './components/ProgressButton';
import StarterStudyPicker from './components/StarterStudyPicker';
import { ConceptAnchor, ConceptSlot, StudyRequest, StudyResult } from './types';

const MAX_CONCEPTS = 6;
const emptySlot = (): ConceptSlot => ({ anchor: null, inputValue: '' });
const slotsFrom = (anchors: ConceptAnchor[]): ConceptSlot[] => {
  const slots = anchors.map(anchor => ({ anchor, inputValue: anchor.label }));
  while (slots.length < 2) slots.push(emptySlot());
  return slots;
};

function App() {
  const [conceptSlots, setConceptSlots] = useState<ConceptSlot[]>([emptySlot(), emptySlot()]);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [lastRun, setLastRun] = useState<HistoryItem | null>(null);
  const [initialUrl] = useState(readUrlState);
  // Tab/pair from a shared link apply to the first result only
  const pendingView = useRef<{ tab: string | null; pair: [string, string] | null }>({
    tab: initialUrl.tab,
    pair: initialUrl.pair,
  });
  const [resultView, setResultView] = useState(pendingView.current);

  const { data: families } = useQuery({
    queryKey: ['families'],
    queryFn: () => apiClient.getFamilies(),
    staleTime: Infinity,
  });
  const totalLanguages = families?.reduce((sum, f) => sum + f.language_count, 0);

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------

  const addSlot = () =>
    setConceptSlots(prev => (prev.length < MAX_CONCEPTS ? [...prev, emptySlot()] : prev));

  const removeSlot = (index: number) =>
    setConceptSlots(prev => (prev.length > 2 ? prev.filter((_, i) => i !== index) : prev));

  const updateSlot = (index: number, updates: Partial<ConceptSlot>) =>
    setConceptSlots(prev => prev.map((slot, i) => (i === index ? { ...slot, ...updates } : slot)));

  // ---------------------------------------------------------------------------
  // Study
  // ---------------------------------------------------------------------------

  const {
    mutate: runStudy,
    data: studyResult,
    isPending: comparing,
    error: studyError,
  } = useMutation<StudyResult, Error, StudyRequest>({
    mutationFn: req =>
      runStudyWithProgress(req, (p, step) => {
        setProgress(p);
        setProgressStep(step);
      }),
    onSuccess: (_result, req) => {
      const item: HistoryItem = {
        anchors: req.concepts,
        selectedFamilies: req.families,
        timestamp: Date.now(),
      };
      setLastRun(item);
      setResultView(pendingView.current);
      pendingView.current = { tab: null, pair: null };
      setHistory(prev => addToHistory(prev, item));
      writeUrlState({ concepts: req.concepts.map(c => c.concepticon_id), families: req.families });
    },
    onSettled: () => {
      setProgress(0);
      setProgressStep('');
    },
  });

  const readySlots = conceptSlots.filter(s => s.anchor !== null);
  const uniqueIds = new Set(readySlots.map(s => s.anchor!.concepticon_id));
  const hasDuplicates = uniqueIds.size < readySlots.length;
  const canCompare = readySlots.length >= 2 && !hasDuplicates && !comparing;
  const pairCount = (readySlots.length * (readySlots.length - 1)) / 2;

  const handleCompare = () => {
    if (!canCompare) return;
    runStudy({ concepts: readySlots.map(s => s.anchor!), families: selectedFamilies });
  };

  const loadStudy = (anchors: ConceptAnchor[], familiesToUse: string[] = selectedFamilies) => {
    setConceptSlots(slotsFrom(anchors));
    setSelectedFamilies(familiesToUse);
    runStudy({ concepts: anchors, families: familiesToUse });
  };

  // Restore a shared study link (?concepts=…) once on load
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current || initialUrl.concepts.length < 2) return;
    restoredRef.current = true;
    apiClient
      .getConceptsById(initialUrl.concepts)
      .then(anchors => {
        if (anchors.length >= 2) loadStudy(anchors, initialUrl.families);
      })
      .catch(err => console.error('Could not restore study from URL', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusText = comparing
    ? progressStep || 'Running study…'
    : hasDuplicates
    ? 'The same concept is selected twice'
    : readySlots.length < 2
    ? 'Pick at least 2 concepts'
    : `${readySlots.length} concepts · ${pairCount} ${pairCount === 1 ? 'pair' : 'pairs'} · ${
        selectedFamilies.length > 0 ? `${selectedFamilies.length} families` : 'all families'
      }`;

  return (
    <div className="atlas-page min-h-screen">
      <div className="relative mx-auto max-w-[88rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-8">
          <h1 className="text-3xl text-slate-950 md:text-4xl">Cross-Linguistic Concept Comparator</h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-700">
            Compare how languages group concepts into words. Pick 2–6 concepts to see which
            languages use one word for several of them (colexification), how this varies by
            family, and which indirect chains link them, based on CLICS data
            {totalLanguages ? ` for ${totalLanguages.toLocaleString()} languages in ${families!.length} families` : ''}.
          </p>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          <main className="space-y-6">
            <section className="atlas-panel p-6 md:p-8">
              <div className="mb-5">
                <h2 className="atlas-section-title">Concepts</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Search for a concept and pick a Concepticon entry. Entries marked CLICS have
                  colexification data.
                </p>
              </div>

              <ConceptSlotPanel slots={conceptSlots} onUpdateSlot={updateSlot} onRemoveSlot={removeSlot} />

              {conceptSlots.length < MAX_CONCEPTS && (
                <button
                  onClick={addSlot}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-[20px] border border-dashed border-stone-300 bg-stone-50/60 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-white/70 hover:text-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Add concept ({conceptSlots.length}/{MAX_CONCEPTS})
                </button>
              )}

              <div className="mt-6 rounded-[22px] border border-stone-200/80 bg-white/65 p-5">
                <FamilySelector selectedFamilies={selectedFamilies} onChange={setSelectedFamilies} />
              </div>

              <div className="mt-6 flex flex-col gap-3 rounded-[22px] bg-sky-950 p-5 text-stone-50 md:flex-row md:items-center md:justify-between">
                <p className={`text-sm ${hasDuplicates ? 'text-amber-200' : 'text-stone-200'}`}>{statusText}</p>
                <ProgressButton
                  onClick={handleCompare}
                  disabled={!canCompare}
                  isLoading={comparing}
                  progress={progress}
                >
                  <span className="inline-flex items-center gap-2">
                    {studyResult ? 'Run again' : 'Run study'}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </ProgressButton>
              </div>

              {studyError && (
                <div role="alert" className="mt-4 rounded-[18px] border border-red-300/80 bg-red-50/80 p-4 text-sm text-red-900">
                  {studyError.message}
                </div>
              )}
            </section>

            {!studyResult && !comparing && <StarterStudyPicker onSelect={anchors => loadStudy(anchors)} />}
          </main>

          <aside className="space-y-6 xl:sticky xl:top-6">
            <div className="atlas-panel p-5">
              <ComparisonHistory
                history={history}
                active={lastRun}
                onSelect={item => loadStudy(item.anchors, item.selectedFamilies)}
                onClear={() => {
                  clearHistory();
                  setHistory([]);
                }}
              />
            </div>
            <InfoPanel />
          </aside>
        </section>

        {studyResult && (
          <section className="mt-6" id="results">
            <ErrorBoundary>
              {/* Keyed so per-view state (selected pair, filters) resets for each new result */}
              <ComparisonContainer
                key={lastRun?.timestamp ?? 0}
                studyResult={studyResult}
                initialTab={resultView.tab}
                initialPair={resultView.pair}
              />
            </ErrorBoundary>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
