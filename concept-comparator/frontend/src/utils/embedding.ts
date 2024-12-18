// src/utils/embedding.ts
import * as UMAP from 'umap-js';
import { ComparisonResult } from '../types';

export interface ProjectedPoint {
  x: number;
  y: number;
  language: string;
  concept: 'concept1' | 'concept2';
  translation: string;
  similarity: number;
}

export const projectEmbeddings = (
  results: Record<string, ComparisonResult>
): ProjectedPoint[] => {
  // Collect all embeddings and metadata
  const points: {
    embedding: number[];
    language: string;
    concept: 'concept1' | 'concept2';
    translation: string;
    similarity: number;
  }[] = [];
  
  Object.entries(results).forEach(([language, result]) => {
    points.push({
      embedding: result.embeddings[0],
      language,
      concept: 'concept1',
      translation: result.main_translations[0],
      similarity: result.main_similarity
    });
    points.push({
      embedding: result.embeddings[1],
      language,
      concept: 'concept2',
      translation: result.main_translations[1],
      similarity: result.main_similarity
    });
  });
  
  // Configure and run UMAP
  const umap = new UMAP.UMAP({
    nComponents: 2,
    nEpochs: 400,
    nNeighbors: 15,
    minDist: 0.1
  });
  
  // Project embeddings to 2D
  const projected = umap.fit(points.map(p => p.embedding));
  
  // Combine projected coordinates with metadata
  return points.map((point, i) => ({
    x: projected[i][0],
    y: projected[i][1],
    language: point.language,
    concept: point.concept,
    translation: point.translation,
    similarity: point.similarity
  }));
};