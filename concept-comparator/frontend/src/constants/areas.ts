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
    'fra': { name: 'European', subarea: 'Western European' },
    'spa': { name: 'European', subarea: 'Western European' },
    'ita': { name: 'European', subarea: 'Western European' },
    'por': { name: 'European', subarea: 'Western European' },
    'rus': { name: 'European', subarea: 'Eastern European' },
    'pol': { name: 'European', subarea: 'Eastern European' },
    'ces': { name: 'European', subarea: 'Eastern European' },
    'hun': { name: 'European', subarea: 'Central European' },
    'bul': { name: 'European', subarea: 'Balkan' },
    'ell': { name: 'European', subarea: 'Balkan' },
    'ron': { name: 'European', subarea: 'Balkan' },
    
    // South Asia (including parts of the Indian subcontinent)
    'hin': { name: 'South Asian', subarea: 'Indo-Aryan' },
    'ben': { name: 'South Asian', subarea: 'Indo-Aryan' },
    'urd': { name: 'South Asian', subarea: 'Indo-Aryan' },
    'mal': { name: 'South Asian', subarea: 'Dravidian' },
    'tam': { name: 'South Asian', subarea: 'Dravidian' },
    'tel': { name: 'South Asian', subarea: 'Dravidian' },
    'kan': { name: 'South Asian', subarea: 'Dravidian' },
  
    // East Asia
    'zho': { name: 'East Asian', subarea: 'Sinitic' },
    'yue': { name: 'East Asian', subarea: 'Sinitic' },
    'jpn': { name: 'East Asian', subarea: 'Japanese' },
    'kor': { name: 'East Asian', subarea: 'Korean' },
    
    // Southeast Asia
    'vie': { name: 'Southeast Asian', subarea: 'Mainland' },
    'khm': { name: 'Southeast Asian', subarea: 'Mainland' },
    'tha': { name: 'Southeast Asian', subarea: 'Mainland' },
    'lao': { name: 'Southeast Asian', subarea: 'Mainland' },
    'msa': { name: 'Southeast Asian', subarea: 'Maritime' },
    'ind': { name: 'Southeast Asian', subarea: 'Maritime' },
    'jav': { name: 'Southeast Asian', subarea: 'Maritime' },
  
    // Middle East and North Africa
    'ara': { name: 'Middle Eastern', subarea: 'Semitic' },
    'heb': { name: 'Middle Eastern', subarea: 'Semitic' },
    'amh': { name: 'Middle Eastern', subarea: 'Semitic' },
    'kat': { name: 'Middle Eastern', subarea: 'Caucasian' },
    'hye': { name: 'Middle Eastern', subarea: 'Caucasian' },
    'azj': { name: 'Middle Eastern', subarea: 'Turkic' },
    
    // Central Asia
    'tur': { name: 'Central Asian', subarea: 'Turkic' },
    'uzb': { name: 'Central Asian', subarea: 'Turkic' },
    
    // Northeast Asia
    'bod': { name: 'Northeast Asian', subarea: 'Tibetic' },
    
    // Sub-Saharan Africa
    'swa': { name: 'African', subarea: 'Eastern' },
    'zul': { name: 'African', subarea: 'Southern' },
    'yor': { name: 'African', subarea: 'Western' },
    
    // Uralic
    'fin': { name: 'Uralic', subarea: 'Finnic' },
    'est': { name: 'Uralic', subarea: 'Finnic' },
    
    // Language Isolates/Special Cases
    'eus': { name: 'European', subarea: 'Western European' }, // Basque - geographically European
  };
  
  export const getLanguageArea = (langCode: string): AreaInfo | undefined => {
    return LANGUAGE_AREAS[langCode];
  };
  
  export const getLanguageAreaName = (langCode: string): string => {
    return LANGUAGE_AREAS[langCode]?.name || 'Unknown';
  };