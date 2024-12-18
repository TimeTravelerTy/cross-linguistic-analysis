export const LANGUAGE_CODES_TO_NAMES: Record<string, string> = {
  // Existing languages
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
  'eus': 'Basque',

  // New Indo-European Languages
  'bel': 'Belarusian',
  'srp': 'Serbian',
  'hrv': 'Croatian',
  'slk': 'Slovak',
  'slv': 'Slovene',
  'lav': 'Latvian',
  'ron': 'Romanian',
  'lit': 'Lithuanian',
  'pan': 'Punjabi',
  'mar': 'Marathi',
  'guj': 'Gujarati',
  'nep': 'Nepali',
  'fas': 'Persian',
  'tgk': 'Tajik',
  'sqi': 'Albanian',
  'gle': 'Irish',
  'gla': 'Scottish Gaelic',
  'cym': 'Welsh',
  'fry': 'Frisian',
  'isl': 'Icelandic',
  'nor': 'Norwegian',
  'dan': 'Danish',
  'swe': 'Swedish',

  // New Turkic Languages
  'kaz': 'Kazakh',
  'kir': 'Kyrgyz',
  'tat': 'Tatar',
  'tuk': 'Turkmen',
  'uig': 'Uyghur',

  // New Austronesian Languages
  'ceb': 'Cebuano',
  'tgl': 'Tagalog',
  'sun': 'Sundanese',
  'mlg': 'Malagasy',

  // New Niger-Congo Languages
  'ibo': 'Igbo',
  'wol': 'Wolof',
  'sna': 'Shona',
  'nya': 'Nyanja',
  'xho': 'Xhosa',
  'sot': 'Sotho',

  // New Afroasiatic Languages
  'hau': 'Hausa',
  'som': 'Somali',

  // Other New Languages
  'sin': 'Sinhala',
  'mon': 'Mongolian',
  'mri': 'Maori',
  'mlt': 'Maltese'
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