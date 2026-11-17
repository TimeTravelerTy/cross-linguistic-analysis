import { ConceptAnchor } from '../types';

interface StarterStudy {
  name: string;
  description: string;
  concepts: ConceptAnchor[];
}

const c = (concepticon_id: string, label: string, semantic_field: string): ConceptAnchor => ({
  concepticon_id,
  label,
  clics_gloss: label,
  semantic_field,
});

// Concepts are pinned to exact Concepticon IDs so each example resolves to the
// CLICS-linked sense (e.g. DAY (NOT NIGHT), not DAY (24 HOURS)).
const STARTER_STUDIES: StarterStudy[] = [
  {
    name: 'Hand & arm',
    description: 'One word for HAND and ARM is common worldwide.',
    concepts: [
      c('1277', 'HAND', 'The Body'),
      c('1673', 'ARM', 'The Body'),
      c('1303', 'FINGER', 'The Body'),
      c('799', 'WRIST', 'The Body'),
    ],
  },
  {
    name: 'Tree, wood & fire',
    description: 'From living tree to firewood to fire.',
    concepts: [
      c('906', 'TREE', 'Agriculture And Vegetation'),
      c('1803', 'WOOD', 'The Physical World'),
      c('10', 'FIREWOOD', 'The Physical World'),
      c('221', 'FIRE', 'The Physical World'),
    ],
  },
  {
    name: 'Sun, day, moon & month',
    description: 'Celestial bodies and the time spans they measure.',
    concepts: [
      c('1343', 'SUN', 'The Physical World'),
      c('1225', 'DAY (NOT NIGHT)', 'Time'),
      c('1313', 'MOON', 'The Physical World'),
      c('1370', 'MONTH', 'Time'),
    ],
  },
  {
    name: 'Wind, air & soul',
    description: 'WIND and SOUL only connect through a chain.',
    concepts: [
      c('960', 'WIND', 'The Physical World'),
      c('27', 'AIR', 'The Physical World'),
      c('3183', 'BREATH OR BREATHE', 'The Body'),
      c('811', 'SOUL', 'Religion And Belief'),
    ],
  },
  {
    name: 'Knowing & perceiving',
    description: 'KNOW often shares a word with HEAR or SEE.',
    concepts: [
      c('1410', 'KNOW (SOMETHING)', 'Cognition'),
      c('1536', 'UNDERSTAND', 'Cognition'),
      c('1408', 'HEAR', 'Sense Perception'),
      c('1409', 'SEE', 'Sense Perception'),
    ],
  },
  {
    name: 'Skin, bark & leather',
    description: 'Outer coverings of bodies, trees and hides.',
    concepts: [
      c('763', 'SKIN', 'The Body'),
      c('1204', 'BARK', 'Agriculture And Vegetation'),
      c('629', 'LEATHER', 'Clothing And Grooming'),
    ],
  },
];

interface Props {
  onSelect: (anchors: ConceptAnchor[]) => void;
}

export default function StarterStudyPicker({ onSelect }: Props) {
  return (
    <section className="atlas-panel p-6">
      <div className="mb-4">
        <h2 className="text-xl text-slate-900">Examples</h2>
        <p className="mt-1 text-sm text-slate-600">Load a concept set, then run the study.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STARTER_STUDIES.map(study => (
          <button
            key={study.name}
            onClick={() => onSelect(study.concepts)}
            className="group flex flex-col rounded-[20px] border border-stone-200/80 bg-white/60 p-4 text-left transition hover:border-sky-300/70 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <p className="text-sm font-semibold text-slate-800">{study.name}</p>
            <p className="mb-3 mt-1 text-xs leading-5 text-slate-500">{study.description}</p>
            <div className="mt-auto flex flex-wrap gap-1">
              {study.concepts.map(concept => (
                <span
                  key={concept.concepticon_id}
                  className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                >
                  {concept.label}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
