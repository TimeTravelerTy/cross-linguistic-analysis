import React, { useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { LanguageInfo, Languages } from '../types';

interface Props {
  languages: Languages;
  selectedLanguages: string[];
  onChange: (languages: string[]) => void;
}

export const LanguageSelector: React.FC<Props> = ({ languages, selectedLanguages, onChange }) => {
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});

  const allLanguageCodes = Object.keys(languages);
  const allSelected = allLanguageCodes.length === selectedLanguages.length;
  const someSelected = selectedLanguages.length > 0;

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

  const handleLanguageToggle = (langCode: string) => {
    if (selectedLanguages.includes(langCode)) {
      onChange(selectedLanguages.filter((code) => code !== langCode));
      return;
    }
    onChange([...selectedLanguages, langCode]);
  };

  const toggleFamily = (family: string) => {
    setExpandedFamilies((prev) => ({
      ...prev,
      [family]: !prev[family],
    }));
  };

  const toggleAllInFamily = (codes: string[]) => {
    const familySelected = codes.every((code) => selectedLanguages.includes(code));
    if (familySelected) {
      onChange(selectedLanguages.filter((code) => !codes.includes(code)));
      return;
    }
    onChange([...new Set([...selectedLanguages, ...codes])]);
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
      return;
    }
    onChange(allLanguageCodes);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-[22px] border border-stone-200/80 bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="atlas-label mb-1">Selection controls</p>
            <h4 className="text-lg text-slate-900">Choose your comparison set</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleAll}
              className={[
                'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                allSelected
                  ? 'border-sky-700 bg-sky-900 text-stone-50'
                  : 'border-stone-200 bg-stone-50 text-slate-600 hover:bg-white',
              ].join(' ')}
            >
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
              {selectedLanguages.length} of {allLanguageCodes.length} selected
            </span>
          </div>
        </div>
      </div>

      {Object.entries(groupedLanguages).map(([family, subfamilies], index) => {
        const allLanguagesInFamily = Object.values(subfamilies)
          .flat()
          .map((lang) => lang.code);
        const allSelectedInFamily = allLanguagesInFamily.every((code) => selectedLanguages.includes(code));
        const someSelectedInFamily = allLanguagesInFamily.some((code) => selectedLanguages.includes(code));
        const isExpanded = expandedFamilies[family] ?? index < 2;

        return (
          <div key={family} className="overflow-hidden rounded-[24px] border border-stone-200/80 bg-white/78">
            <div className="flex flex-col gap-3 border-b border-stone-200/70 bg-[linear-gradient(180deg,rgba(255,250,242,0.95),rgba(246,239,227,0.9))] p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleFamily(family)}
                  className="rounded-full border border-stone-200 bg-white p-2 text-slate-600 transition-colors hover:border-stone-300 hover:text-slate-900"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <div>
                  <p className="atlas-label mb-1">Language family</p>
                  <h4 className="text-lg text-slate-900">{family}</h4>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => toggleAllInFamily(allLanguagesInFamily)}
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                    allSelectedInFamily
                      ? 'border-emerald-600 bg-emerald-700 text-white'
                      : someSelectedInFamily
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : 'border-stone-200 bg-white text-slate-600 hover:bg-stone-50',
                  ].join(' ')}
                >
                  {allSelectedInFamily && <Check className="h-4 w-4" />}
                  {allSelectedInFamily ? 'Selected family' : 'Toggle family'}
                </button>
                <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {allLanguagesInFamily.filter((code) => selectedLanguages.includes(code)).length} / {allLanguagesInFamily.length}
                </span>
              </div>
            </div>

            {isExpanded && (
              <div className="space-y-4 p-4">
                {Object.entries(subfamilies).map(([subfamily, langs]) => {
                  const subfamilyCodes = langs.map((lang) => lang.code);
                  const allSelectedInSubfamily = subfamilyCodes.every((code) => selectedLanguages.includes(code));
                  const someSelectedInSubfamily = subfamilyCodes.some((code) => selectedLanguages.includes(code));

                  return (
                    <div key={subfamily} className="rounded-[20px] border border-stone-200/70 bg-stone-50/70 p-4">
                      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="atlas-label mb-1">Subfamily</p>
                          <h5 className="text-base font-semibold text-slate-800">{subfamily}</h5>
                        </div>
                        <button
                          onClick={() => toggleAllInFamily(subfamilyCodes)}
                          className={[
                            'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors',
                            allSelectedInSubfamily
                              ? 'border-sky-700 bg-sky-900 text-stone-50'
                              : someSelectedInSubfamily
                                ? 'border-amber-300 bg-amber-50 text-amber-900'
                                : 'border-stone-200 bg-white text-slate-500 hover:bg-stone-100',
                          ].join(' ')}
                        >
                          {allSelectedInSubfamily && <Check className="h-3.5 w-3.5" />}
                          {allSelectedInSubfamily ? 'Selected group' : 'Toggle group'}
                        </button>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {langs.map(({ code, name }) => {
                          const isSelected = selectedLanguages.includes(code);

                          return (
                            <button
                              key={code}
                              onClick={() => handleLanguageToggle(code)}
                              className={[
                                'flex items-center justify-between rounded-[18px] border px-3 py-3 text-left transition-all',
                                isSelected
                                  ? 'border-sky-400 bg-sky-50 text-sky-950 shadow-[0_10px_22px_rgba(49,88,111,0.12)]'
                                  : 'border-stone-200 bg-white/90 text-slate-700 hover:border-stone-300 hover:bg-white',
                              ].join(' ')}
                            >
                              <span className="pr-3 text-sm font-medium">{name}</span>
                              <span
                                className={[
                                  'flex h-5 w-5 items-center justify-center rounded-full border',
                                  isSelected ? 'border-sky-600 bg-sky-700 text-white' : 'border-stone-300 bg-stone-50',
                                ].join(' ')}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {!someSelected && (
        <div className="rounded-[20px] border border-dashed border-stone-300 bg-stone-50/60 px-4 py-4 text-sm text-slate-500">
          No languages selected yet. Pick a few families to start, then expand only if you need finer control.
        </div>
      )}
    </div>
  );
};
