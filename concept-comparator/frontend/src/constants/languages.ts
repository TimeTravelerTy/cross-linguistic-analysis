export const LANGUAGE_CODES_TO_NAMES: Record<string, string> = {
    'eng': 'English',
    'spa': 'Spanish',
    'fra': 'French',
    'deu': 'German',
    'nld': 'Dutch',
    'ita': 'Italian',
    'por': 'Portuguese',
    'rus': 'Russian',
    'pol': 'Polish',
    'ces': 'Czech',
    'bul': 'Bulgarian',
    'ell': 'Greek',
    'hye': 'Armenian',
    'hin': 'Hindi',
    'ben': 'Bengali',
    'urd': 'Urdu',
    'ara': 'Arabic',
    'heb': 'Hebrew',
    'amh': 'Amharic',
    'zho': 'Chinese',
    'yue': 'Cantonese',
    'bod': 'Tibetan',
    'jpn': 'Japanese',
    'kor': 'Korean',
    'vie': 'Vietnamese',
    'khm': 'Khmer',
    'tha': 'Thai',
    'lao': 'Lao',
    'mal': 'Malayalam',
    'tam': 'Tamil',
    'tel': 'Telugu',
    'kan': 'Kannada',
    'msa': 'Malay',
    'ind': 'Indonesian',
    'jav': 'Javanese',
    'tur': 'Turkish',
    'azj': 'Azerbaijani',
    'uzb': 'Uzbek',
    'fin': 'Finnish',
    'est': 'Estonian',
    'hun': 'Hungarian',
    'swa': 'Swahili',
    'zul': 'Zulu',
    'yor': 'Yoruba',
    'kat': 'Georgian',
    'eus': 'Basque'
  };
  
  // Add reverse mapping for convenience
  export const LANGUAGE_NAMES_TO_CODES = Object.entries(LANGUAGE_CODES_TO_NAMES)
    .reduce((acc, [code, name]) => ({
      ...acc,
      [name]: code
    }), {} as Record<string, string>);
  
  // Helper functions
  export const getLanguageName = (code: string): string => {
    return LANGUAGE_CODES_TO_NAMES[code] || code;
  };
  
  export const getLanguageCode = (name: string): string => {
    return LANGUAGE_NAMES_TO_CODES[name] || name;
  };