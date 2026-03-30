import React, { useState } from 'react';
import { GitBranch, Globe2, Network } from 'lucide-react';
import { StudyResult } from '../types';
import { FamilyPatternsView } from './FamilyPatternsView';
import { LanguageDetailsView } from './LanguageDetailsView';
import { ColexificationNetworkView } from './ColexificationNetworkView';

interface Props {
  studyResult: StudyResult;
}

const TABS = [
  { id: 'family', label: 'Family Patterns', icon: GitBranch },
  { id: 'network', label: 'Concept Network', icon: Network },
  { id: 'details', label: 'Language Details', icon: Globe2 },
] as const;

type TabId = (typeof TABS)[number]['id'];

export const ComparisonContainer: React.FC<Props> = ({ studyResult }) => {
  const [activeTab, setActiveTab] = useState<TabId>('family');

  const conceptLabels = studyResult.concepts.map(c => c.label).join(' · ');
  const totalFamilies = Object.values(studyResult.family_profiles).filter(
    f => Object.values(f.pair_rates).some(r => r.direct_count > 0)
  ).length;
  const totalLangs = Object.keys(studyResult.language_partitions).length;

  return (
    <section className="atlas-panel p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 border-b border-stone-200/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="atlas-kicker mb-2">Study results</p>
          <h2 className="atlas-section-title">{conceptLabels}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Attested colexification patterns across {totalFamilies} families in the CLICS database.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="atlas-chip">{totalFamilies} families</span>
          {totalLangs > 0 && <span className="atlas-chip">{totalLangs} languages</span>}
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-900">
            CLICS evidence
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-6 inline-flex flex-wrap gap-2 rounded-full border border-stone-200/80 bg-white/80 p-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-sky-900 text-stone-50 shadow-[0_10px_22px_rgba(31,59,76,0.18)]'
                  : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active view */}
      <div>
        {activeTab === 'family' && <FamilyPatternsView studyResult={studyResult} />}
        {activeTab === 'network' && <ColexificationNetworkView studyResult={studyResult} />}
        {activeTab === 'details' && <LanguageDetailsView studyResult={studyResult} />}
      </div>

      {/* Data provenance */}
      {Object.keys(studyResult.dataset_versions).length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2 border-t border-stone-200/60 pt-4">
          <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Data:</span>
          {Object.entries(studyResult.dataset_versions).map(([name, version]) => (
            <span
              key={name}
              className="rounded bg-stone-100 px-2 py-0.5 font-mono text-xs text-slate-500"
            >
              {name} {version}
            </span>
          ))}
        </div>
      )}
    </section>
  );
};
