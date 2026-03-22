import React from 'react';
import { X } from 'lucide-react';
import { ConceptAnchor, ConceptSlot } from '../types';
import ConceptSearch from './ConceptSearch';

const SLOT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface ConceptSlotPanelProps {
  slots: ConceptSlot[];
  onUpdateSlot: (index: number, updates: Partial<ConceptSlot>) => void;
  onRemoveSlot: (index: number) => void;
}

/**
 * Dynamic grid of concept input slots (2–6).
 * Each slot searches Concepticon via GET /concepts and pins a ConceptAnchor.
 */
export default function ConceptSlotPanel({
  slots,
  onUpdateSlot,
  onRemoveSlot,
}: ConceptSlotPanelProps) {
  // Responsive grid: 1 col ≤2 slots, 2 cols ≤4, 3 cols 5–6
  const gridClass =
    slots.length <= 2
      ? 'grid gap-5 lg:grid-cols-2'
      : slots.length <= 4
      ? 'grid gap-5 sm:grid-cols-2'
      : 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3';

  return (
    <div className={gridClass}>
      {slots.map((slot, i) => (
        <ConceptSlotCard
          key={i}
          index={i}
          slot={slot}
          canRemove={slots.length > 2}
          onUpdate={(updates) => onUpdateSlot(i, updates)}
          onRemove={() => onRemoveSlot(i)}
        />
      ))}
    </div>
  );
}

interface ConceptSlotCardProps {
  index: number;
  slot: ConceptSlot;
  canRemove: boolean;
  onUpdate: (updates: Partial<ConceptSlot>) => void;
  onRemove: () => void;
}

function ConceptSlotCard({
  index,
  slot,
  canRemove,
  onUpdate,
  onRemove,
}: ConceptSlotCardProps) {
  const label = SLOT_LABELS[index] ?? String(index + 1);

  const handleAnchorSelect = (anchor: ConceptAnchor) => {
    onUpdate({ anchor, inputValue: anchor.label });
  };

  const handleInputChange = (value: string) => {
    onUpdate({ inputValue: value, anchor: value === '' ? null : slot.anchor });
  };

  return (
    <div className="relative rounded-[26px] border border-stone-200/80 bg-white/55 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="atlas-label mb-1">Concept {label}</p>
          {slot.anchor ? (
            <div>
              <h3 className="text-xl text-slate-900">{slot.anchor.label}</h3>
              {slot.anchor.semantic_field && (
                <p className="text-xs text-slate-500">{slot.anchor.semantic_field}</p>
              )}
            </div>
          ) : (
            <h3 className="text-xl text-slate-400">Not selected</h3>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* CLICS coverage indicator */}
          {slot.anchor && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                slot.anchor.clics_gloss
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
              title={
                slot.anchor.clics_gloss
                  ? `In CLICS as "${slot.anchor.clics_gloss}"`
                  : 'Not in CLICS — colexification data unavailable'
              }
            >
              {slot.anchor.clics_gloss ? 'CLICS ✓' : 'No CLICS'}
            </span>
          )}
          {canRemove && (
            <button
              onClick={onRemove}
              className="rounded-full p-1 text-slate-400 transition hover:bg-stone-100 hover:text-slate-700"
              title="Remove this concept"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search input */}
      <ConceptSearch
        value={slot.inputValue}
        onChange={handleInputChange}
        onAnchorSelect={handleAnchorSelect}
        placeholder={`Search concept ${label}…`}
      />

      {/* Concepticon ID badge */}
      {slot.anchor?.concepticon_id && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono">
            #{slot.anchor.concepticon_id}
          </span>
          <span>Concepticon ID</span>
        </div>
      )}
    </div>
  );
}
