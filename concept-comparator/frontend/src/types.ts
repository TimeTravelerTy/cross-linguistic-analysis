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

export interface ColexificationLink {
  concept: string;
  frequency: number;
  languages: string[];
}

export interface FamilyPattern {
  proportion: number;
  languages_with_colexification: string[];
  total_languages_in_family: number;
  indirect_languages?: string[];  // Optional indirect connections
  intermediate_concepts?: Array<{  // Optional intermediate nodes
    concept: string;
    frequency: number;
  }>;
}

export interface ComparisonResult {
  main_similarity: number;
  main_translations: [string, string];
  variation_similarities: Array<{
    similarity: number;
    context: string;
    words: [string, string];
  }>;
  usage_notes: {
    concept1: string;
    concept2: string;
  };
  colexification_data: Record<string, ColexificationLink[]>;
  family_patterns: Record<string, FamilyPattern> | null; 
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