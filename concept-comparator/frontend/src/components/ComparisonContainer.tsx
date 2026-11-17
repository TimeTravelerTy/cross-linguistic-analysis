import { useState } from 'react';
import { GitBranch, Globe2, LayoutGrid, Network, Route } from 'lucide-react';
import { StudyResult } from '../types';
import { writeUrlState } from '../utils/urlState';
import { OverviewView } from './OverviewView';
import { FamilyPatternsView } from './FamilyPatternsView';
import { SemanticChainsView } from './SemanticChainsView';
import { LanguageDetailsView } from './LanguageDetailsView';
import { ColexificationNetworkView } from './ColexificationNetworkView';

interface Props {
  studyResult: StudyResult;
  initialTab?: string | null;
  initialPair?: [string, string] | null;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'family', label: 'Families', icon: GitBranch },
  { id: 'chains', label: 'Semantic chains', icon: Route },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'details', label: 'Languages', icon: Globe2 },
] as const;

type TabId = (typeof TABS)[number]['id'];

const isTab = (value: string | null | undefined): value is TabId => TABS.some(t => t.id === value);

export function ComparisonContainer({ studyResult, initialTab, initialPair }: Props) {
  const [activeTab, setActiveTabState] = useState<TabId>(isTab(initialTab) ? initialTab : 'overview');
  // Selected pair is shared by the Families and Semantic chains tabs
  const [selectedPair, setSelectedPairState] = useState<[string, string] | null>(initialPair ?? null);

  const setActiveTab = (tab: TabId) => {
    setActiveTabState(tab);
    writeUrlState({ tab: tab === 'overview' ? null : tab });
  };
  const setSelectedPair = (pair: [string, string]) => {
    setSelectedPairState(pair);
    writeUrlState({ pair });
  };

  const conceptLabels = studyResult.concepts.map(c => c.label).join(' · ');
  const totalFamilies = Object.values(studyResult.family_profiles).filter(f =>
    Object.values(f.pair_rates).some(r => r.direct_count > 0),
  ).length;
  const totalLangs = Object.keys(studyResult.language_names).length;

  const openPair = (pair: [string, string], tab: TabId) => {
    setSelectedPair(pair);
    setActiveTab(tab);
  };

  return (
    <section className="atlas-panel p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-3 border-b border-stone-200/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="atlas-label mb-1">Results</p>
          <h2 className="atlas-section-title">{conceptLabels}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="atlas-chip">{totalLangs.toLocaleString()} attesting languages</span>
          <span className="atlas-chip">{totalFamilies} families</span>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Result views"
        className="atlas-scroll mb-6 flex max-w-full gap-1 overflow-x-auto rounded-full border border-stone-200/80 bg-white/80 p-1.5 sm:inline-flex"
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all',
                isActive ? 'bg-sky-900 text-stone-50' : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {activeTab === 'overview' && (
          <OverviewView
            studyResult={studyResult}
            onOpenFamilies={pair => openPair(pair, 'family')}
            onOpenChains={pair => openPair(pair, 'chains')}
          />
        )}
        {activeTab === 'family' && (
          <FamilyPatternsView
            studyResult={studyResult}
            selectedPair={selectedPair}
            onSelectPair={setSelectedPair}
          />
        )}
        {activeTab === 'chains' && (
          <SemanticChainsView
            studyResult={studyResult}
            selectedPair={selectedPair}
            onSelectPair={setSelectedPair}
          />
        )}
        {activeTab === 'network' && <ColexificationNetworkView studyResult={studyResult} />}
        {activeTab === 'details' && <LanguageDetailsView studyResult={studyResult} />}
      </div>

      {Object.keys(studyResult.dataset_versions).length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-stone-200/60 pt-4">
          <span className="text-xs text-slate-400">Data:</span>
          {Object.entries(studyResult.dataset_versions).map(([name, version]) => (
            <span key={name} className="rounded bg-stone-100 px-2 py-0.5 font-mono text-xs text-slate-500">
              {name} {version}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
