import React, { useState } from 'react';
import { getLanguageName } from '../constants/languages';
import { ColexificationGraph } from './ColexificationGraph';
import SharedEmbeddingsViz from './SharedEmbeddingsViz';
import { ComparisonResult } from '../types';

interface ComparisonResultsProps {
  results: Record<string, ComparisonResult>;
}

export const ComparisonResults: React.FC<ComparisonResultsProps> = ({ results }) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (langCode: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [langCode]: !prev[langCode]
    }));
  };

  const capitalize = (val : string) => {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  }

  // Get the first result to extract original concepts from family_colexifications
  const firstResult = Object.values(results)[0];
  // Concepts are now the keys in the language_colexifications object
  const originalConcepts = Object.keys(firstResult.language_colexifications);

  return (
    <div className="space-y-6">
      {/* Shared Embedding Visualization */}
      <SharedEmbeddingsViz results={results} concepts={originalConcepts}/>
      {Object.entries(results).map(([langCode, result]) => (
        <div 
          key={langCode} 
          className="border rounded-lg p-4 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold mb-3">
              {getLanguageName(langCode)}
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Main Similarity Section */}
            <div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-lg">
                    {capitalize(result.main_translations[0])}
                  </span>
                  <span className="text-gray-500">↔</span>
                  <span className="font-medium text-lg">
                    {capitalize(result.main_translations[1])}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div 
                    className="text-sm font-medium px-2 py-1 rounded"
                    style={{
                      backgroundColor: `rgba(${
                        Math.round(255 * (1 - result.main_similarity))
                      }, ${
                        Math.round(255 * result.main_similarity)
                      }, 0, 0.2)`,
                      color: result.main_similarity > 0.5 ? '#166534' : '#991B1B'
                    }}
                  >
                    Similarity: {(result.main_similarity * 100).toFixed(1)}%
                  </div>
                </div>

                {/* Usage notes */}
                {(result.usage_notes.concept1 || result.usage_notes.concept2) && (
                  <div className="mt-3 text-sm text-gray-600">
                    {result.usage_notes.concept1 && (
                      <p className="mb-1">{result.usage_notes.concept1}</p>
                    )}
                    {result.usage_notes.concept2 && (
                      <p>{result.usage_notes.concept2}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Variations Section */}
              {result.variation_similarities.length > 0 && (
                <>
                  <button
                    onClick={() => toggleCard(langCode)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    {expandedCards[langCode] ? 'Hide' : 'Show'} Variations
                    <span 
                      className="transform transition-transform duration-200"
                      style={{
                        transform: expandedCards[langCode] ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {expandedCards[langCode] && (
                    <div className="mt-4 space-y-3">
                      {result.variation_similarities.map((variation, idx) => (
                        <div 
                          key={idx}
                          className="bg-gray-50 p-3 rounded"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">
                              {variation.words[0]}
                            </span>
                            <span className="text-gray-500">↔</span>
                            <span className="font-medium">
                              {variation.words[1]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div 
                              className="text-xs font-medium px-2 py-1 rounded"
                              style={{
                                backgroundColor: `rgba(${
                                  Math.round(255 * (1 - variation.similarity))
                                }, ${
                                  Math.round(255 * variation.similarity)
                                }, 0, 0.2)`,
                                color: variation.similarity > 0.5 ? '#166534' : '#991B1B'
                              }}
                            >
                              Similarity: {(variation.similarity * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            {variation.context}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Colexification Graph Section */}
            {originalConcepts.length >= 2 && (
              (() => {
                // Check if there are any colexifications to display
                const hasColexifications = Object.values(result.language_colexifications).some(
                  colexList => colexList.some(colex => colex.present)
                );

                return hasColexifications ? (
                  <>
                    <h3 className="text-lg font-semibold">Colexifications</h3>
                    <ColexificationGraph
                      concept1={originalConcepts[0]}
                      concept2={originalConcepts[1]}
                      colexifications={result.language_colexifications}
                      className="mt-1"
                    />
                  </>
                ) : null;
              })()
            )}
          </div>
        </div>
      ))}
    </div>
  );
};