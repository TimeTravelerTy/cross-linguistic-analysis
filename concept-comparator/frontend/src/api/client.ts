import axios from 'axios';
import {
  ConceptAnchor,
  FamilyInfo,
  SemanticChainResponse,
  SemanticMapResponse,
  StudyProgress,
  StudyRequest,
  StudyResult,
} from '@/types';

// Override with VITE_API_URL (e.g. in frontend/.env.local) when the backend
// runs somewhere other than localhost:8000.
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

/** Pull a readable message out of an axios/FastAPI error. */
export const errorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (!error.response) return `Cannot reach the backend at ${API_URL}. Is it running?`;
    return error.message;
  }
  return error instanceof Error ? error.message : String(error);
};

export const apiClient = {
  searchConcepts: (q: string, limit = 12): Promise<ConceptAnchor[]> =>
    api.get('/concepts', { params: { q, limit } }).then(res => res.data),

  getConceptsById: (ids: string[]): Promise<ConceptAnchor[]> =>
    api.get('/concepts/by-id', { params: { ids: ids.join(',') } }).then(res => res.data),

  getSemanticMap: (
    conceptIdsOrLabels: string[],
    maxNeighbors = 15,
    family?: string,
  ): Promise<SemanticMapResponse> =>
    api
      .get('/semantic-map', {
        params: {
          concepts: conceptIdsOrLabels.join(','),
          max_neighbors: maxNeighbors,
          ...(family ? { family } : {}),
        },
      })
      .then(res => res.data),

  getChains: (
    conceptA: string,
    conceptB: string,
    options: { family?: string; maxDepth?: number; limit?: number } = {},
  ): Promise<SemanticChainResponse> =>
    api
      .get('/chains', {
        params: {
          a: conceptA,
          b: conceptB,
          max_depth: options.maxDepth ?? 3,
          limit: options.limit ?? 12,
          ...(options.family ? { family: options.family } : {}),
        },
      })
      .then(res => res.data),

  getFamilies: (): Promise<FamilyInfo[]> =>
    api.get('/families').then(res => res.data),
};

/**
 * Run a multi-concept study with SSE streaming.
 * Calls onProgress with each progress update; resolves with the final StudyResult.
 */
export const runStudyWithProgress = async (
  request: StudyRequest,
  onProgress: (progress: number, step: string) => void,
): Promise<StudyResult> => {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/study-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error(`Cannot reach the backend at ${API_URL}. Is it running?`);
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      if (typeof body?.detail === 'string') detail = body.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(`Study request failed: ${detail}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      let update: StudyProgress;
      try {
        update = JSON.parse(line.slice(6)) as StudyProgress;
      } catch (e) {
        console.error('SSE parse error:', e);
        continue;
      }

      if (update.error) throw new Error(update.error);
      onProgress(update.progress ?? 0, update.step ?? '');
      if (update.result) return update.result;
    }
  }

  throw new Error('Study stream ended without a result');
};
