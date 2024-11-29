import React, { useState } from 'react';
import { ComparisonResults } from './ComparisonResults';
import { FamilyComparisonView } from './FamilyComparisonView';
import { ComparisonResult, Languages } from '../types';

interface ComparisonContainerProps {
  results: Record<string, ComparisonResult>;
  languages: Languages;
}

export const ComparisonContainer: React.FC<ComparisonContainerProps> = ({
  results,
  languages,
}) => {
  const [activeView, setActiveView] = useState<'language' | 'family'>('language');

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Cross-Linguistic Comparison Analysis
        </h2>
      </div>
      
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveView('language')}
            className={`px-6 py-3 font-medium text-sm transition-colors
              ${activeView === 'language'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Language View
          </button>
          <button
            onClick={() => setActiveView('family')}
            className={`px-6 py-3 font-medium text-sm transition-colors
              ${activeView === 'family'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Family View
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {activeView === 'language' ? (
          <ComparisonResults results={results} />
        ) : (
          <FamilyComparisonView 
            results={results}
            languages={languages}
          />
        )}
      </div>
    </div>
  );
};