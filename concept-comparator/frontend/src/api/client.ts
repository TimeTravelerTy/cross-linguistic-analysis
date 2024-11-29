import axios, { AxiosError } from 'axios';

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
};

// Optional: Add error types for better error handling
export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}