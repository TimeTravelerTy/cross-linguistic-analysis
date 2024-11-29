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