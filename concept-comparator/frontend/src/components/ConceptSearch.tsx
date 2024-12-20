import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Check, Database } from 'lucide-react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    mode: 'wordnet' | 'clics';
    onModeChange: (mode: 'wordnet' | 'clics') => void;
}

interface Match {
    concept: string;
    semantic_field: string;
    category: string;
    family_frequency: number;
    language_frequency: number;
    word_frequency: number;
    frequency: number;
}

const ConceptSearch: React.FC<Props> = ({ 
    value, 
    onChange, 
    placeholder = "Enter a concept",
    disabled = false,
    mode,
    onModeChange
  }) => {
    // Remove local mode state - it's now controlled by parent
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
  
    const { data: clicsMatches, isLoading } = useQuery({
      queryKey: ['clics-concepts', searchQuery],
      queryFn: () => apiClient.searchClicsConcepts(searchQuery),
      enabled: mode === 'clics' && searchQuery.length >= 2,
    });
  
    useEffect(() => {
      setSearchQuery(value);
    }, [value]);
  
    const handleInputChange = (newValue: string) => {
      setSearchQuery(newValue);
      onChange(newValue);
      setShowSuggestions(true);
    };
  
    const handleSelectConcept = (concept: string) => {
      setSearchQuery(concept);
      onChange(concept);
      setShowSuggestions(false);
    };
  
    return (
      <div className="relative">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => onModeChange('wordnet')}
            className={`px-3 py-1 text-sm rounded-full flex items-center gap-1
              ${mode === 'wordnet' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Database size={14} />
            WordNet
            {mode === 'wordnet' && <Check size={14} />}
          </button>
          <button
            onClick={() => onModeChange('clics')}
            className={`px-3 py-1 text-sm rounded-full flex items-center gap-1
              ${mode === 'clics' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Database size={14} />
            CLICS
            {mode === 'clics' && <Check size={14} />}
          </button>
        </div>
  
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled && mode === 'clics'} // Only disable in CLICS mode if needed
          className={`w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500
            ${mode === 'clics' && showSuggestions && searchQuery.length >= 2 ? 'rounded-b-none' : ''}`}
        />
  
        {/* CLICS Suggestions */}
        {mode === 'clics' && showSuggestions && searchQuery.length >= 2 && (
          <div className="bg-white border-t border-gray-200">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">Loading suggestions...</div>
            ) : clicsMatches?.matches.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No matching concepts found</div>
            ) : (
              <div className="space-y-2 p-4">
                {clicsMatches?.matches.map((match : Match) => (
                  <button
                    key={match.concept}
                    onClick={() => handleSelectConcept(match.concept)}
                    className="w-full text-left p-4 rounded-lg border-2 hover:border-blue-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">{match.concept}</div>
                    <div className="flex gap-2 mt-1">
                      {match.semantic_field && (
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                          {match.semantic_field}
                        </span>
                      )}
                      {match.category && (
                        <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                          {match.category}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 mt-2">
                      <div>
                        <span className="font-medium">{match.family_frequency}</span> families
                      </div>
                      <div>
                        <span className="font-medium">{match.language_frequency}</span> languages
                      </div>
                      <div>
                        <span className="font-medium">{match.word_frequency}</span> words
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
};

export default ConceptSearch;