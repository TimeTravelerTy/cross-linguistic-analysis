import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { WordSenseSelector } from './components/WordSenseSelector';
import { ComparisonContainer } from './components/ComparisonContainer';
import { LanguageSelector } from './components/LanguageSelector';
import { apiClient } from './api/client';
import { WordSense, ComparisonResult, Languages, ComparisonData } from './types';

function App() {
  const [concept1, setConcept1] = useState('');
  const [concept2, setConcept2] = useState('');
  const [selectedSense1, setSelectedSense1] = useState<WordSense | null>(null);
  const [selectedSense2, setSelectedSense2] = useState<WordSense | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const { data: senses1, isLoading: loading1 } = useQuery<WordSense[]>({
    queryKey: ['wordSenses', concept1],
    queryFn: () => apiClient.getWordSenses(concept1),
    enabled: concept1.length >= 3,
    staleTime: Infinity,
  });

  const { data: senses2, isLoading: loading2 } = useQuery<WordSense[]>({
    queryKey: ['wordSenses', concept2],
    queryFn: () => apiClient.getWordSenses(concept2),
    enabled: concept2.length >= 3,
    staleTime: Infinity,
  });

  const { data: languages } = useQuery<Languages>({
    queryKey: ['languages'],
    queryFn: () => apiClient.getSupportedLanguages()
  });

  const { mutate: compareWords, data: results, isPending: comparing, error: compareError } = useMutation<
    Record<string, ComparisonResult>,
    Error,
    ComparisonData
  >({
    mutationFn: (data) => {
      return apiClient.compareWords({
        ...data,
        languages: data.languages.map(langCode => langCode.toLowerCase())
      });
    },
    onError: (error) => {
      console.error('Comparison failed:', error);
    }
  });

  const handleCompare = () => {
    if (selectedSense1 && selectedSense2 && selectedLanguages.length > 0) {
      compareWords({
        concept1,
        sense_id1: selectedSense1.synset_id,
        concept2,
        sense_id2: selectedSense2.synset_id,
        languages: selectedLanguages
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-['Inter']">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cross-Linguistic Concept Comparator
          </h1>
          <p className="text-gray-600">
            Compare how different languages express and relate concepts
          </p>
        </div>

        {/* Main content area */}
        <div className="max-w-6xl mx-auto">
          {/* Concepts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Concept 1 Container */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <input
                  type="text"
                  value={concept1}
                  onChange={(e) => setConcept1(e.target.value)}
                  placeholder="Enter first concept"
                  className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="border-t border-gray-200">
                {loading1 ? (
                  <div className="p-6 text-center text-gray-500">
                    Loading word senses...
                  </div>
                ) : (
                  senses1 && (
                    <WordSenseSelector
                      word={concept1}
                      senses={senses1}
                      selectedSense={selectedSense1}
                      onSelect={setSelectedSense1}
                    />
                  )
                )}
              </div>
            </div>

            {/* Concept 2 Container */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <input
                  type="text"
                  value={concept2}
                  onChange={(e) => setConcept2(e.target.value)}
                  placeholder="Enter second concept"
                  className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="border-t border-gray-200">
                {loading2 ? (
                  <div className="p-6 text-center text-gray-500">
                    Loading word senses...
                  </div>
                ) : (
                  senses2 && (
                    <WordSenseSelector
                      word={concept2}
                      senses={senses2}
                      selectedSense={selectedSense2}
                      onSelect={setSelectedSense2}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Language Selection */}
          {languages && (
            <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                Select Languages to Compare
              </h2>
              <LanguageSelector
                languages={languages}
                selectedLanguages={selectedLanguages}
                onChange={setSelectedLanguages}
              />
            </div>
          )}

          {/* Compare Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleCompare}
              disabled={!selectedSense1 || !selectedSense2 || selectedLanguages.length === 0 || comparing}
              className={`px-8 py-3 rounded-lg font-medium transition-colors
                ${(!selectedSense1 || !selectedSense2 || selectedLanguages.length === 0 || comparing)
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                }`}
            >
              {comparing ? 'Comparing...' : 'Compare Concepts'}
            </button>
          </div>

          {/* Results */}
          {results && languages && (
            <ComparisonContainer 
              results={results}
              languages={languages}
            />
          )}

          {/* Error */}
          {compareError && (
            <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-8">
              {compareError.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;