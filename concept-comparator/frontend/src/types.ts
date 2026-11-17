// ---------------------------------------------------------------------------
// Concepts (Concepticon-anchored)
// ---------------------------------------------------------------------------

export interface ConceptAnchor {
  concepticon_id: string;       // e.g. "1277"
  label: string;                // e.g. "HAND"
  clics_gloss: string | null;   // CLICS gloss, null if the concept is not in CLICS
  semantic_field: string | null;
}

/** One slot in the concept input panel */
export interface ConceptSlot {
  anchor: ConceptAnchor | null;
  inputValue: string;
}

// ---------------------------------------------------------------------------
// Study request / result
// ---------------------------------------------------------------------------

export interface ColexificationEvidence {
  direct_languages: string[];
  direct_families: string[];
  direct_count: number;
  affix_languages: string[];
  affix_direction: string | null;
  overlap_languages: string[];
  chain_paths: string[][];
  chain_min_length: number | null;
  /** Cosine similarity of the two concepts' Node2Vec colexification embeddings */
  embedding_similarity: number | null;
  clics_coverage: boolean;
  omw_coverage: number;
}

export interface ColexResult {
  concept_a: string;   // concepticon_id
  concept_b: string;
  label_a: string;
  label_b: string;
  evidence: ColexificationEvidence;
}

export interface LanguagePartition {
  language: string;
  language_name: string;
  dataset: string;
  family: string;
  merged_groups: string[][];  // each inner array = concepticon ids sharing one word
  split_count: number;
  /** Attested word form per colexified pair, keyed "concepticonA|concepticonB" */
  pair_forms: Record<string, string>;
}

export interface PairRate {
  direct_count: number;
  total_languages: number;
  direct_rate: number;
  label_a: string;
  label_b: string;
  attesting_languages: string[];
}

export interface FamilyProfile {
  total_languages: number;
  is_selected: boolean;
  pair_rates: Record<string, PairRate>;
}

export interface StudyResult {
  concepts: ConceptAnchor[];
  // pair_matrix[id_a][id_b] = ColexResult (upper triangle only)
  pair_matrix: Record<string, Record<string, ColexResult>>;
  language_partitions: Record<string, LanguagePartition>;
  family_profiles: Record<string, FamilyProfile>;
  colexification_embeddings: Record<string, number[]>;
  dataset_versions: Record<string, string>;
  /** Readable names for every language code in the result */
  language_names: Record<string, string>;
}

export interface StudyRequest {
  concepts: ConceptAnchor[];
  families: string[];
}

export interface StudyProgress {
  progress: number;
  step: string;
  result?: StudyResult;
  error?: string;
}

export interface FamilyInfo {
  name: string;
  language_count: number;
}

// ---------------------------------------------------------------------------
// Semantic map (CLICS neighbourhood graph)
// ---------------------------------------------------------------------------

export interface SemanticMapNode {
  concept: string;
  concepticon_id: string | null;
  semantic_field: string | null;
  is_selected: boolean;
  family_frequency: number;
  language_frequency: number;
}

export interface SemanticMapEdge {
  source: string;
  target: string;
  weight: number;
  direct_count: number;
  languages: string[];
}

export interface SemanticMapResponse {
  nodes: SemanticMapNode[];
  edges: SemanticMapEdge[];
  concepts: string[];
}

// ---------------------------------------------------------------------------
// Semantic chains
// ---------------------------------------------------------------------------

export interface SemanticChain {
  path: string[];
  scores: number[];
  counts: number[];
  total_score: number;
}

export interface SemanticChainResponse {
  concept_a: string;
  concept_b: string;
  family: string | null;
  direct_count: number;
  chains: SemanticChain[];
}
