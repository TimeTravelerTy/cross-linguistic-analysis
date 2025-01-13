import axios, { AxiosError } from 'axios';
import { ComparisonData, ComparisonResult, ProgressCallback, ComparisonProgress } from '@/types';

const API_URL = 'http://localhost:8000'; // Change this if your backend runs on a different port

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const compareWordsWithProgress = async (
  data: ComparisonData, 
  onProgress: ProgressCallback
): Promise<Record<string, ComparisonResult>> => {
  const response = await fetch(`${API_URL}/compare-concepts-progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
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
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6)) as ComparisonProgress;
          
          if ('error' in data && typeof data.error === 'string') {
            throw new Error(data.error);
          }

          if (data.progress) {
            onProgress(data.progress, data.current_language);
          }

          if (data.results) {
            return data.results;
          }
        } catch (e) {
          console.error('Error parsing SSE data:', e);
        }
      }
    }
  }

  throw new Error('Stream ended without results');
};

// Type-safe API functions
export const apiClient = {
  getWordSenses: (word: string) => 
    api.get(`/word-senses/${encodeURIComponent(word)}`).then(res => res.data),
    
  getSupportedLanguages: () => 
    api.get('/supported-languages').then(res => res.data),
    
  compareWords: (data: {
    concept1: string;
    sense_id1: string;
    concept2: string;
    sense_id2: string;
    languages: string[];
  }) => api.post('/compare-concepts', data).then(res => res.data),

  searchClicsConcepts: (query: string) => 
    api.get(`/search-clics-concepts/${encodeURIComponent(query)}`).then(res => res.data),
    
  getClicsConcepts: () => 
    api.get('/clics-concepts').then(res => res.data),

  compareWordsWithProgress,
  
};

export const getSemanticChains = async (
  concept1: string,
  concept2: string,
  family: string,
  maxDepth: number = 4
): Promise<{
  chains: Array<{
    path: string[];
    scores: number[];
    total_score: number;
  }>;
  family: string;
  concepts: [string, string];
}> => {
  const response = await api.get(
    `/semantic-chains/${encodeURIComponent(concept1)}/${encodeURIComponent(concept2)}`,
    {
      params: {
        family,
        max_depth: maxDepth
      }
    }
  );
  return response.data;
};

// Optional: Add error types for better error handling
export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}