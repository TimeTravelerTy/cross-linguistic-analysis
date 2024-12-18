// Based on established linguistic areas and contact zones
export interface AreaInfo {
    name: string;
    subarea: string;
  }
  
export const LANGUAGE_AREAS: Record<string, AreaInfo> = {
  // Europe
  'eng': { name: 'European', subarea: 'Western European' },
  'deu': { name: 'European', subarea: 'Western European' },
  'nld': { name: 'European', subarea: 'Western European' },
  'fry': { name: 'European', subarea: 'Western European' },
  'fra': { name: 'European', subarea: 'Western European' },
  'spa': { name: 'European', subarea: 'Western European' },
  'ita': { name: 'European', subarea: 'Western European' },
  'por': { name: 'European', subarea: 'Western European' },
  'eus': { name: 'European', subarea: 'Western European' },
  
  // Northern European
  'nor': { name: 'European', subarea: 'Northern European' },
  'swe': { name: 'European', subarea: 'Northern European' },
  'dan': { name: 'European', subarea: 'Northern European' },
  'isl': { name: 'European', subarea: 'Northern European' },
  
  // Celtic
  'gle': { name: 'European', subarea: 'Celtic' },
  'gla': { name: 'European', subarea: 'Celtic' },
  'cym': { name: 'European', subarea: 'Celtic' },
  
  // Eastern European
  'rus': { name: 'European', subarea: 'Eastern European' },
  'bel': { name: 'European', subarea: 'Eastern European' },
  'pol': { name: 'European', subarea: 'Eastern European' },
  'ces': { name: 'European', subarea: 'Eastern European' },
  'slk': { name: 'European', subarea: 'Eastern European' },
  
  // Central European
  'hun': { name: 'European', subarea: 'Central European' },
  'slv': { name: 'European', subarea: 'Central European' },
  
  // Baltic
  'lit': { name: 'European', subarea: 'Baltic' },
  'lav': { name: 'European', subarea: 'Baltic' },
  
  // Balkan
  'bul': { name: 'European', subarea: 'Balkan' },
  'srp': { name: 'European', subarea: 'Balkan' },
  'hrv': { name: 'European', subarea: 'Balkan' },
  'sqi': { name: 'European', subarea: 'Balkan' },
  'ell': { name: 'European', subarea: 'Balkan' },
  'ron': { name: 'European', subarea: 'Balkan' },
  
  // South Asia
  'hin': { name: 'South Asian', subarea: 'Indo-Aryan' },
  'ben': { name: 'South Asian', subarea: 'Indo-Aryan' },
  'urd': { name: 'South Asian', subarea: 'Indo-Aryan' },
  'pan': { name: 'South Asian', subarea: 'Indo-Aryan' },
  'mar': { name: 'South Asian', subarea: 'Indo-Aryan' },
  'guj': { name: 'South Asian', subarea: 'Indo-Aryan' },
  'nep': { name: 'South Asian', subarea: 'Indo-Aryan' },
  'sin': { name: 'South Asian', subarea: 'Indo-Aryan' },
  'mal': { name: 'South Asian', subarea: 'Dravidian' },
  'tam': { name: 'South Asian', subarea: 'Dravidian' },
  'tel': { name: 'South Asian', subarea: 'Dravidian' },
  'kan': { name: 'South Asian', subarea: 'Dravidian' },

  // East Asia
  'zho': { name: 'East Asian', subarea: 'Sinitic' },
  'yue': { name: 'East Asian', subarea: 'Sinitic' },
  'jpn': { name: 'East Asian', subarea: 'Japanese' },
  'kor': { name: 'East Asian', subarea: 'Korean' },
  'mon': { name: 'East Asian', subarea: 'Mongolic' },
  
  // Southeast Asia
  'vie': { name: 'Southeast Asian', subarea: 'Mainland' },
  'khm': { name: 'Southeast Asian', subarea: 'Mainland' },
  'tha': { name: 'Southeast Asian', subarea: 'Mainland' },
  'lao': { name: 'Southeast Asian', subarea: 'Mainland' },
  'msa': { name: 'Southeast Asian', subarea: 'Maritime' },
  'ind': { name: 'Southeast Asian', subarea: 'Maritime' },
  'jav': { name: 'Southeast Asian', subarea: 'Maritime' },
  'ceb': { name: 'Southeast Asian', subarea: 'Maritime' },
  'tgl': { name: 'Southeast Asian', subarea: 'Maritime' },
  'sun': { name: 'Southeast Asian', subarea: 'Maritime' },

  // Middle East and North Africa
  'ara': { name: 'Middle Eastern', subarea: 'Semitic' },
  'heb': { name: 'Middle Eastern', subarea: 'Semitic' },
  'mlt': { name: 'Middle Eastern', subarea: 'Semitic' },
  'amh': { name: 'Middle Eastern', subarea: 'Semitic' },
  'kat': { name: 'Middle Eastern', subarea: 'Caucasian' },
  'hye': { name: 'Middle Eastern', subarea: 'Caucasian' },
  'azj': { name: 'Middle Eastern', subarea: 'Turkic' },
  
  // Central Asia
  'tur': { name: 'Central Asian', subarea: 'Turkic' },
  'uzb': { name: 'Central Asian', subarea: 'Turkic' },
  'kaz': { name: 'Central Asian', subarea: 'Turkic' },
  'kir': { name: 'Central Asian', subarea: 'Turkic' },
  'tuk': { name: 'Central Asian', subarea: 'Turkic' },
  'uig': { name: 'Central Asian', subarea: 'Turkic' },
  'tgk': { name: 'Central Asian', subarea: 'Iranian' },
  'fas': { name: 'Central Asian', subarea: 'Iranian' },
  
  // Northeast Asia
  'bod': { name: 'Northeast Asian', subarea: 'Tibetic' },
  
  // Africa
  'swa': { name: 'African', subarea: 'Eastern' },
  'som': { name: 'African', subarea: 'Eastern' },
  'hau': { name: 'African', subarea: 'Western' },
  'yor': { name: 'African', subarea: 'Western' },
  'ibo': { name: 'African', subarea: 'Western' },
  'wol': { name: 'African', subarea: 'Western' },
  'zul': { name: 'African', subarea: 'Southern' },
  'xho': { name: 'African', subarea: 'Southern' },
  'sot': { name: 'African', subarea: 'Southern' },
  'sna': { name: 'African', subarea: 'Southern' },
  'nya': { name: 'African', subarea: 'Southern' },
  
  // Uralic
  'fin': { name: 'Uralic', subarea: 'Finnic' },
  'est': { name: 'Uralic', subarea: 'Finnic' },
  
  // Pacific
  'mri': { name: 'Pacific', subarea: 'Polynesian' },
  'mlg': { name: 'Pacific', subarea: 'Austronesian' },
};

export const getLanguageArea = (langCode: string): AreaInfo | undefined => {
  return LANGUAGE_AREAS[langCode];
};
  
export const getLanguageAreaName = (langCode: string): string => {
  return LANGUAGE_AREAS[langCode]?.name || 'Unknown';
};