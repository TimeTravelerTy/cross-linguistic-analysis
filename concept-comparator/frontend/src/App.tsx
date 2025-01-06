import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { WordSenseSelector } from './components/WordSenseSelector';
import { ComparisonContainer } from './components/ComparisonContainer';
import { LanguageSelector } from './components/LanguageSelector';
import ConceptSearch from './components/ConceptSearch';
import InfoPanel from './components/InformationPanel';
import { apiClient } from './api/client';
import { WordSense, ComparisonResult, Languages, ComparisonData, ClicsMatch } from './types';

function App() {
  const [concept1, setConcept1] = useState('');
  const [concept2, setConcept2] = useState('');
  const [selectedSense1, setSelectedSense1] = useState<WordSense | null>(null);
  const [selectedSense2, setSelectedSense2] = useState<WordSense | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [concept1Mode, setConcept1Mode] = useState<'wordnet' | 'clics'>('wordnet');
  const [concept2Mode, setConcept2Mode] = useState<'wordnet' | 'clics'>('wordnet');

  const { data: senses1, isLoading: loading1 } = useQuery<WordSense[]>({
    queryKey: ['wordSenses', concept1],
    queryFn: () => apiClient.getWordSenses(concept1),
    enabled: concept1.length >= 3 && concept1Mode === 'wordnet',
    staleTime: Infinity,
  });

  const { data: senses2, isLoading: loading2 } = useQuery<WordSense[]>({
    queryKey: ['wordSenses', concept2],
    queryFn: () => apiClient.getWordSenses(concept2),
    enabled: concept2.length >= 3 && concept2Mode === 'wordnet',
    staleTime: Infinity,
  });

  const { data: clicsMatches1 } = useQuery<{ matches: ClicsMatch[] }>({
    queryKey: ['clics-concepts', concept1],
    queryFn: () => apiClient.searchClicsConcepts(concept1),
    enabled: concept1Mode === 'clics' && concept1.length >= 2,
  });

  const { data: clicsMatches2 } = useQuery<{ matches: ClicsMatch[] }>({
    queryKey: ['clics-concepts', concept2],
    queryFn: () => apiClient.searchClicsConcepts(concept2),
    enabled: concept2Mode === 'clics' && concept2.length >= 2,
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

  const canCompare = (
    // WordNet mode requirements
    ((concept1Mode === 'wordnet' && selectedSense1) || 
     (concept1Mode === 'clics' && concept1)) &&
    ((concept2Mode === 'wordnet' && selectedSense2) || 
     (concept2Mode === 'clics' && concept2)) &&
    selectedLanguages.length > 0 &&
    !comparing
  );

  const formatClicsSense = (match: ClicsMatch | undefined) => {
    if (!match) return '';
    return `SEMANTIC_FIELD:${match.semantic_field} CATEGORY:${match.category} ${match.concept}`;
  };

  const handleCompare = () => {
    if (canCompare) {
      compareWords({
        concept1,
        sense_id1: concept1Mode === 'wordnet' 
          ? selectedSense1!.synset_id 
          : formatClicsSense(clicsMatches1?.matches.find(m => m.concept === concept1)),
        concept2,
        sense_id2: concept2Mode === 'wordnet' 
          ? selectedSense2!.synset_id 
          : formatClicsSense(clicsMatches2?.matches.find(m => m.concept === concept2)),
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

        {/* Info Panel*/}
        <InfoPanel className="mb-8" />

        {/* Main content area */}
        <div className="max-w-6xl mx-auto">
          {/* Concepts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Concept 1 Container */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <ConceptSearch
                  value={concept1}
                  onChange={setConcept1}
                  placeholder="Enter first concept"
                  disabled={loading1}
                  mode={concept1Mode}
                  onModeChange={setConcept1Mode}
                />
              </div>
              <div className="border-t border-gray-200">
                {concept1Mode === 'wordnet' && (
                  loading1 ? (
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
                  )
                )}
              </div>
            </div>

            {/* Concept 2 Container */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <ConceptSearch
                  value={concept2}
                  onChange={setConcept2}
                  placeholder="Enter second concept"
                  disabled={loading2}
                  mode={concept2Mode}
                  onModeChange={setConcept2Mode}
                />
              </div>
              <div className="border-t border-gray-200">
                {concept2Mode === 'wordnet' && (
                  loading2 ? (
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
              disabled={!canCompare}
              className={`px-8 py-3 rounded-lg font-medium transition-colors
                ${!canCompare
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
                originalConcepts={[concept1, concept2]}
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