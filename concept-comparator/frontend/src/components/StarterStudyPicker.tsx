import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { ConceptAnchor } from '../types';

interface StarterStudy {
  name: string;
  description: string;
  labels: string[];  // Concepticon labels to resolve
}

const STARTER_STUDIES: StarterStudy[] = [
  {
    name: 'Thought & Knowledge',
    description: 'How do languages split mental verbs?',
    labels: ['KNOW', 'THINK', 'UNDERSTAND', 'BELIEVE'],
  },
  {
    name: 'Wind, Breath & Soul',
    description: 'A classic polysemy cluster across world cultures.',
    labels: ['WIND', 'BREATH', 'SOUL', 'SPIRIT'],
  },
  {
    name: 'Hand & Arm',
    description: 'Split or merged? Varies dramatically by family.',
    labels: ['HAND', 'ARM', 'FINGER', 'WRIST'],
  },
  {
    name: 'Sun, Day & Light',
    description: 'Temporal and luminous concepts often colexify.',
    labels: ['SUN', 'DAY', 'LIGHT', 'SKY'],
  },
  {
    name: 'Fear & Pain',
    description: 'Negative affect concepts and their colexification patterns.',
    labels: ['FEAR', 'PAIN', 'HURT', 'DANGER'],
  },
];

interface Props {
  onSelect: (anchors: ConceptAnchor[]) => void;
}

/**
 * Landing-page card grid of curated concept studies.
 * Resolves Concepticon labels to ConceptAnchor objects before calling onSelect.
 */
export default function StarterStudyPicker({ onSelect }: Props) {
  const [loadingStudy, setLoadingStudy] = useState<string | null>(null);

  const handlePick = async (study: StarterStudy) => {
    setLoadingStudy(study.name);
    try {
      const anchors: ConceptAnchor[] = [];
      for (const label of study.labels) {
        const results = await apiClient.searchConcepts(label, 1);
        if (results.length > 0) {
          anchors.push(results[0]);
        }
      }
      if (anchors.length >= 2) {
        onSelect(anchors);
      }
    } catch (e) {
      console.error('Failed to resolve starter study:', e);
    } finally {
      setLoadingStudy(null);
    }
  };

  return (
    <section className="atlas-panel p-6">
      <div className="mb-5 flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-slate-500" />
        <div>
          <p className="atlas-kicker">Curated studies</p>
          <h2 className="text-xl text-slate-900">Start with a known colexification pattern</h2>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {STARTER_STUDIES.map((study) => {
          const isLoading = loadingStudy === study.name;
          return (
            <button
              key={study.name}
              onClick={() => handlePick(study)}
              disabled={!!loadingStudy}
              className="group flex flex-col rounded-[22px] border border-stone-200/80 bg-white/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-300/70 hover:bg-white/80 hover:shadow-[0_12px_28px_rgba(46,80,99,0.1)] disabled:opacity-60"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{study.name}</p>
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
              </div>
              <p className="mb-3 text-xs leading-5 text-slate-500">{study.description}</p>
              <div className="mt-auto flex flex-wrap gap-1">
                {study.labels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
