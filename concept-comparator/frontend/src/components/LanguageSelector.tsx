import React from 'react';
import { Languages, LanguageInfo } from '../types';

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
  const handleLanguageToggle = (langCode: string) => {
    if (selectedLanguages.includes(langCode)) {
      onChange(selectedLanguages.filter((code) => code !== langCode));
    } else {
      onChange([...selectedLanguages, langCode]);
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
    <div className="space-y-8">
      {Object.entries(groupedLanguages).map(([family, subfamilies]) => (
        <div 
          key={family}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e5e7eb'
          }}
        >
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            borderBottom: '2px solid #e5e7eb'
          }}>
            {family}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.entries(subfamilies).map(([subfamily, langs]) => (
              <div key={subfamily}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#4b5563',
                  marginBottom: '0.75rem'
                }}>
                  {subfamily}
                </h4>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {langs.map(({ code, name }) => (
                    <div
                      key={code}
                      onClick={() => handleLanguageToggle(code)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: `2px solid ${selectedLanguages.includes(code) ? '#3b82f6' : '#e5e7eb'}`,
                        backgroundColor: selectedLanguages.includes(code) ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(code)}
                        onChange={() => {}} // Handle change through div click
                        style={{
                          width: '1rem',
                          height: '1rem',
                          accentColor: '#3b82f6'
                        }}
                      />
                      <span style={{
                        fontSize: '0.875rem',
                        color: selectedLanguages.includes(code) ? '#1e40af' : '#374151',
                        fontWeight: selectedLanguages.includes(code) ? '500' : '400'
                      }}>
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};