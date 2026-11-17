import { ColexificationEvidence, ConceptAnchor, StudyResult } from '../types';

export interface ConceptPair {
  a: ConceptAnchor;
  b: ConceptAnchor;
  /** Key used by family_profiles ("LABEL_A|LABEL_B") */
  labelKey: string;
  /** Concepticon-id key used by pair_forms ("idA|idB") */
  idKey: string;
  evidence: ColexificationEvidence | null;
}

/** All concept pairs of a study, in the order the concepts were entered. */
export function studyPairs(result: StudyResult): ConceptPair[] {
  const pairs: ConceptPair[] = [];
  const { concepts, pair_matrix } = result;
  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      const a = concepts[i];
      const b = concepts[j];
      pairs.push({
        a,
        b,
        labelKey: `${a.label}|${b.label}`,
        idKey: `${a.concepticon_id}|${b.concepticon_id}`,
        evidence: pair_matrix[a.concepticon_id]?.[b.concepticon_id]?.evidence ?? null,
      });
    }
  }
  return pairs;
}

export const samePair = (pair: ConceptPair, ids: [string, string] | null) =>
  !!ids &&
  ((pair.a.concepticon_id === ids[0] && pair.b.concepticon_id === ids[1]) ||
    (pair.a.concepticon_id === ids[1] && pair.b.concepticon_id === ids[0]));

export const pairIds = (pair: ConceptPair): [string, string] => [
  pair.a.concepticon_id,
  pair.b.concepticon_id,
];
