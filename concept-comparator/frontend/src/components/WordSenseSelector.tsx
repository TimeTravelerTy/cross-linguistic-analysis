import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { WordSense } from '../types';

interface Props {
  word: string;
  senses: WordSense[];
  selectedSense: WordSense | null;
  onSelect: (sense: WordSense) => void;
}

export const WordSenseSelector: React.FC<Props> = ({ word, senses, selectedSense, onSelect }) => (
  <div>
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="atlas-label mb-1">Sense selection</p>
        <h3 className="text-xl text-slate-900">Resolve the meaning of "{word}"</h3>
      </div>
      <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {senses.length} options
      </div>
    </div>

    <div className="atlas-scroll flex max-h-[28rem] flex-col gap-3 overflow-y-auto pr-2">
      {senses.map((sense) => {
        const isSelected = selectedSense?.synset_id === sense.synset_id;

        return (
          <button
            key={sense.synset_id}
            type="button"
            onClick={() => onSelect(sense)}
            className={[
              'rounded-[22px] border p-4 text-left transition-all',
              isSelected
                ? 'border-sky-400 bg-sky-50/80 shadow-[0_12px_28px_rgba(50,89,112,0.14)]'
                : 'border-stone-200/80 bg-white/80 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white',
            ].join(' ')}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                {sense.category}
              </span>
              {isSelected && <CheckCircle2 className="h-5 w-5 text-sky-700" />}
            </div>

            <p className="text-sm leading-7 text-slate-900">{sense.definition}</p>

            {sense.lemma_names.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sense.lemma_names.slice(0, 4).map((lemma) => (
                  <span
                    key={`${sense.synset_id}-${lemma}`}
                    className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900"
                  >
                    {lemma}
                  </span>
                ))}
              </div>
            )}

            {sense.examples.length > 0 && (
              <p className="mt-3 border-t border-stone-200/70 pt-3 text-sm italic leading-6 text-slate-500">
                Example: "{sense.examples[0]}"
              </p>
            )}
          </button>
        );
      })}
    </div>
  </div>
);
