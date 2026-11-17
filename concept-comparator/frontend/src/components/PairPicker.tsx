import { ConceptPair } from '../utils/pairs';

interface Props {
  pairs: ConceptPair[];
  selected: ConceptPair;
  onSelect: (pair: ConceptPair) => void;
}

/** Row of buttons for choosing one concept pair of the study. */
export default function PairPicker({ pairs, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Concept pair">
      {pairs.map(pair => {
        const isActive = pair.idKey === selected.idKey;
        const count = pair.evidence?.direct_count ?? 0;
        return (
          <button
            key={pair.idKey}
            onClick={() => onSelect(pair)}
            aria-pressed={isActive}
            className={[
              'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition',
              isActive
                ? 'border-sky-800 bg-sky-900 text-white'
                : 'border-stone-200 bg-white/80 text-slate-700 hover:border-stone-300 hover:bg-white',
            ].join(' ')}
          >
            {pair.a.label} ↔ {pair.b.label}
            <span
              className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-slate-500'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
