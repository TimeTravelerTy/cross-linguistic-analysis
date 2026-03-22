export interface WordSense {
  synset_id: string;
  definition: string;
  examples: string[];
  lemma_names: string[];
  category: string;
}
  
export interface TranslationVariant {
  word: string;
  context: string;
  nuance: string;
}

export interface Translation {
  main_translation: string;
  variations: TranslationVariant[];
  usage_notes: string;
}

export interface ComparisonData {
  concept1: string;
  sense_id1: string;
  concept2: string;
  sense_id2: string;
  languages: string[];
}

export interface FamilyColexificationData {
  frequency: number;
  languages: string[];
}

export interface FamilyColexifications {
  concept1_colexifications: Record<string, FamilyColexificationData>;
  concept2_colexifications: Record<string, FamilyColexificationData>;
  direct_colexification: FamilyColexificationData;
  total_languages: number;
}

export interface LanguageColexification {
  concept: string;
  present: boolean;
}

export interface ComparisonResult {
  main_similarity: number;
  main_translations: [string, string];
  embeddings: [number[], number[]];
  variation_similarities: Array<{
    similarity: number;
    context: string;
    words: [string, string];
  }>;
  usage_notes: {
    concept1: string;
    concept2: string;
  };
  language_colexifications: Record<string, LanguageColexification[]>;
  family_colexifications: Record<string, FamilyColexifications>;
}

export interface ClicsMatch {
  concept: string;
  semantic_field: string;
  category: string;
  family_frequency: number;
  language_frequency: number;
  word_frequency: number;
  frequency: number;
}

export interface StoredComparison {
  concepts: [string, string];
  family: string;
  avgEmbeddingSim: number;
  directColexRate: number;
  enhancedColexScore: number;
  timestamp: number;
}

export interface ApiResponse<T> {
data: T;
}

export interface LanguageInfo {
  name: string;
  family: string;
  subfamily: string;
}

export interface Languages {
[key: string]: LanguageInfo;
}

export type ProgressCallback = (progress: number, language: string) => void;

export interface ComparisonProgress {
  progress: number;
  current_language: string;
  processed: number;
  total: number;
  results?: Record<string, ComparisonResult>;
}

// ---------------------------------------------------------------------------
// Atlas / multi-concept types (Concepticon-anchored)
// ---------------------------------------------------------------------------

export interface ConceptAnchor {
  concepticon_id: string;       // e.g. "1277"
  label: string;                // e.g. "HAND"
  clics_gloss: string | null;   // CLICS GML Gloss, null if not in CLICS
  semantic_field: string | null;
}

/** One slot in the dynamic concept input panel */
export interface ConceptSlot {
  anchor: ConceptAnchor | null;
  inputValue: string;
}

export interface ColexificationEvidence {
  direct_languages: string[];
  direct_families: string[];
  direct_count: number;
  affix_languages: string[];
  affix_direction: string | null;
  overlap_languages: string[];
  chain_paths: string[][];
  chain_min_length: number | null;
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
  family: string;
  merged_groups: string[][];  // each inner array = concepts that share one word
  split_count: number;
}

export interface StudyResult {
  concepts: ConceptAnchor[];
  // pair_matrix[id_a][id_b] = ColexResult
  pair_matrix: Record<string, Record<string, ColexResult>>;
  language_partitions: Record<string, LanguagePartition>;
  family_profiles: Record<string, {
    total_languages: number;
    is_selected: boolean;
    pair_rates: Record<string, {
      direct_count: number;
      total_languages: number;
      direct_rate: number;
      label_a: string;
      label_b: string;
      attesting_languages: string[];
    }>;
  }>;
  colexification_embeddings: Record<string, number[]>;  // 128-dim Node2Vec per concept
  translations: Record<string, string[]> | null;
  dataset_versions: Record<string, string>;
}

export interface StudyRequest {
  concepts: ConceptAnchor[];
  families: string[];
  show_translations: boolean;
}

export interface FamilyInfo {
  name: string;
  language_count: number;
}

export interface StudyProgress {
  progress: number;
  step: string;
  result?: StudyResult;
  error?: string;
}

// Semantic map types
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