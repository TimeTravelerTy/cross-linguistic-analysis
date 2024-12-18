import React, { useState } from 'react';
import { Languages, LanguageInfo } from '../types';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';

interface Props {
  languages: Languages;
  selectedLanguages: string[];
  onChange: (languages: string[]) => void;
}

export const LanguageSelector: React.FC<Props> = ({
  languages,
  selectedLanguages,
  onChange,
}) => {
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});

  // Get all language codes
  const allLanguageCodes = Object.keys(languages);
  const allSelected = allLanguageCodes.length === selectedLanguages.length;
  const someSelected = selectedLanguages.length > 0;

  const handleLanguageToggle = (langCode: string) => {
    if (selectedLanguages.includes(langCode)) {
      onChange(selectedLanguages.filter((code) => code !== langCode));
    } else {
      onChange([...selectedLanguages, langCode]);
    }
  };

  const toggleFamily = (family: string) => {
    setExpandedFamilies(prev => ({
      ...prev,
      [family]: !prev[family]
    }));
  };

  const toggleAllInFamily = (family: string, codes: string[]) => {
    const allSelected = codes.every(code => selectedLanguages.includes(code));
    if (allSelected) {
      onChange(selectedLanguages.filter(code => !codes.includes(code)));
    } else {
      const newSelected = new Set([...selectedLanguages, ...codes]);
      onChange([...newSelected]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(allLanguageCodes);
    }
  };

  // Group languages by family and subfamily
  const groupedLanguages = Object.entries(languages).reduce((acc, [code, lang]) => {
    if (!acc[lang.family]) {
      acc[lang.family] = {};
    }
    if (!acc[lang.family][lang.subfamily]) {
      acc[lang.family][lang.subfamily] = [];
    }
    acc[lang.family][lang.subfamily].push({ code, ...lang });
    return acc;
  }, {} as Record<string, Record<string, Array<{ code: string } & LanguageInfo>>>);

  return (
    <div className="space-y-2">
      {/* Global Select All Header */}
      <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className={`
              w-4 h-4 border rounded flex items-center justify-center
              ${someSelected ? 'border-blue-500' : 'border-gray-300'}
              ${allSelected ? 'bg-blue-500' : 'bg-white'}
            `}
          >
            {allSelected && <Check className="w-3 h-3 text-white" />}
          </button>
          <span className="font-medium">All Languages</span>
        </div>
        <div className="text-sm text-gray-500">
          {selectedLanguages.length} of {allLanguageCodes.length} selected
        </div>
      </div>

      {/* Existing family groups */}
      {Object.entries(groupedLanguages).map(([family, subfamilies]) => {
        const allLanguagesInFamily = Object.values(subfamilies)
          .flat()
          .map(lang => lang.code);
        
        const allSelectedInFamily = allLanguagesInFamily
          .every(code => selectedLanguages.includes(code));
        
        const someSelectedInFamily = allLanguagesInFamily
          .some(code => selectedLanguages.includes(code));

        return (
          <div 
            key={family}
            className="border rounded-lg overflow-hidden bg-white"
          >
            {/* Family Header */}
            <div className="flex items-center justify-between p-3 bg-gray-50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleFamily(family)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {expandedFamilies[family] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAllInFamily(family, allLanguagesInFamily)}
                    className={`
                      w-4 h-4 border rounded flex items-center justify-center
                      ${someSelectedInFamily ? 'border-blue-500' : 'border-gray-300'}
                      ${allSelectedInFamily ? 'bg-blue-500' : 'bg-white'}
                    `}
                  >
                    {allSelectedInFamily && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className="font-medium">{family}</span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {allLanguagesInFamily.filter(code => selectedLanguages.includes(code)).length} of {allLanguagesInFamily.length} selected
              </div>
            </div>

            {/* Subfamilies and Languages */}
            {expandedFamilies[family] && (
              <div className="p-3 space-y-4 border-t">
                {Object.entries(subfamilies).map(([subfamily, langs]) => {
                  const allSelectedInSubfamily = langs
                    .every(({ code }) => selectedLanguages.includes(code));
                  
                  return (
                    <div key={subfamily}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAllInFamily(
                              subfamily,
                              langs.map(l => l.code)
                            )}
                            className={`
                              w-4 h-4 border rounded flex items-center justify-center
                              ${langs.some(({ code }) => selectedLanguages.includes(code)) 
                                ? 'border-blue-500' : 'border-gray-300'}
                              ${allSelectedInSubfamily ? 'bg-blue-500' : 'bg-white'}
                            `}
                          >
                            {allSelectedInSubfamily && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <h4 className="text-sm font-medium text-gray-600">
                            {subfamily}
                          </h4>
                        </div>
                        <div className="text-sm text-gray-500">
                          {langs.filter(({ code }) => selectedLanguages.includes(code)).length} of {langs.length} selected
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {langs.map(({ code, name }) => (
                          <button
                            key={code}
                            onClick={() => handleLanguageToggle(code)}
                            className={`
                              flex items-center gap-2 p-2 rounded text-left
                              ${selectedLanguages.includes(code)
                                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                : 'hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className={`
                              w-4 h-4 border rounded flex items-center justify-center
                              ${selectedLanguages.includes(code)
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                              }
                            `}>
                              {selectedLanguages.includes(code) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm truncate">
                              {name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};