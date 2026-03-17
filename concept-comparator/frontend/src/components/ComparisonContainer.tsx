import React, { useState } from 'react';
import { GitBranch, Globe2, LanguagesIcon } from 'lucide-react';
import { AreaComparisonView } from './AreaComparisonView';
import { ComparisonResults } from './ComparisonResults';
import { FamilyComparisonView } from './FamilyComparisonView';
import { ComparisonResult, Languages } from '../types';

interface ComparisonContainerProps {
  results: Record<string, ComparisonResult>;
  languages: Languages;
  originalConcepts: [string, string];
}

const views = [
  { id: 'language', label: 'Language View', icon: LanguagesIcon },
  { id: 'family', label: 'Family View', icon: GitBranch },
  { id: 'area', label: 'Area View', icon: Globe2 },
] as const;

export const ComparisonContainer: React.FC<ComparisonContainerProps> = ({ results, languages, originalConcepts }) => {
  const [activeView, setActiveView] = useState<'language' | 'family' | 'area'>('language');

  return (
    <section className="atlas-panel p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-stone-200/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="atlas-kicker mb-2">Results</p>
          <h2 className="atlas-section-title">
            {originalConcepts[0]} <span className="text-stone-400">vs</span> {originalConcepts[1]}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Inspect translation behavior, semantic proximity, and higher-order patterns across the selected
            languages.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="atlas-chip">{Object.keys(results).length} language profiles</span>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-900">
            Atlas report
          </span>
        </div>
      </div>

      <div className="mb-6 inline-flex flex-wrap gap-2 rounded-full border border-stone-200/80 bg-white/80 p-2">
        {views.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;

          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={[
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-sky-900 text-stone-50 shadow-[0_10px_22px_rgba(31,59,76,0.18)]'
                  : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {view.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeView === 'language' ? (
          <ComparisonResults results={results} />
        ) : activeView === 'family' ? (
          <FamilyComparisonView results={results} languages={languages} originalConcepts={originalConcepts} />
        ) : (
          <AreaComparisonView results={results} languages={languages} originalConcepts={originalConcepts} />
        )}
      </div>
    </section>
  );
};
