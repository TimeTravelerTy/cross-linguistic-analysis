"""ISO 639-3 code -> name/family for the languages used by the legacy pairwise comparison."""

SUPPORTED_LANGUAGES = {
    # Indo-European - Germanic
    'eng': {'name': 'English', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'deu': {'name': 'German', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'nld': {'name': 'Dutch', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'fry': {'name': 'Frisian', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'isl': {'name': 'Icelandic', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'nor': {'name': 'Norwegian', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'dan': {'name': 'Danish', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'swe': {'name': 'Swedish', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    
    # Indo-European - Romance
    'fra': {'name': 'French', 'family': 'Indo-European', 'subfamily': 'Romance'},
    'spa': {'name': 'Spanish', 'family': 'Indo-European', 'subfamily': 'Romance'},
    'ita': {'name': 'Italian', 'family': 'Indo-European', 'subfamily': 'Romance'},
    'por': {'name': 'Portuguese', 'family': 'Indo-European', 'subfamily': 'Romance'},
    'ron': {'name': 'Romanian', 'family': 'Indo-European', 'subfamily': 'Romance'},
    
    # Indo-European - Slavic
    'rus': {'name': 'Russian', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'pol': {'name': 'Polish', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'ces': {'name': 'Czech', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'bel': {'name': 'Belarusian', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'bul': {'name': 'Bulgarian', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'srp': {'name': 'Serbian', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'hrv': {'name': 'Croatian', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'slk': {'name': 'Slovak', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'slv': {'name': 'Slovene', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    
    # Indo-European - Baltic
    'lav': {'name': 'Latvian', 'family': 'Indo-European', 'subfamily': 'Baltic'},
    'lit': {'name': 'Lithuanian', 'family': 'Indo-European', 'subfamily': 'Baltic'},
    
    # Indo-European - Indo-Iranian
    'hin': {'name': 'Hindi', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'ben': {'name': 'Bengali', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'urd': {'name': 'Urdu', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'pan': {'name': 'Punjabi', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'mar': {'name': 'Marathi', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'guj': {'name': 'Gujarati', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'nep': {'name': 'Nepali', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'sin': {'name': 'Sinhala', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'fas': {'name': 'Persian', 'family': 'Indo-European', 'subfamily': 'Iranian'},
    'tgk': {'name': 'Tajik', 'family': 'Indo-European', 'subfamily': 'Iranian'},
    
    # Indo-European - Celtic
    'gle': {'name': 'Irish', 'family': 'Indo-European', 'subfamily': 'Celtic'},
    'gla': {'name': 'Scottish Gaelic', 'family': 'Indo-European', 'subfamily': 'Celtic'},
    'cym': {'name': 'Welsh', 'family': 'Indo-European', 'subfamily': 'Celtic'},
    
    # Indo-European - Other
    'ell': {'name': 'Greek', 'family': 'Indo-European', 'subfamily': 'Hellenic'},
    'hye': {'name': 'Armenian', 'family': 'Indo-European', 'subfamily': 'Armenian'},
    'sqi': {'name': 'Albanian', 'family': 'Indo-European', 'subfamily': 'Albanian'},
    
    # Afroasiatic
    'ara': {'name': 'Arabic', 'family': 'Afro-Asiatic', 'subfamily': 'Semitic'},
    'heb': {'name': 'Hebrew', 'family': 'Afro-Asiatic', 'subfamily': 'Semitic'},
    'amh': {'name': 'Amharic', 'family': 'Afro-Asiatic', 'subfamily': 'Semitic'},
    'mlt': {'name': 'Maltese', 'family': 'Afro-Asiatic', 'subfamily': 'Semitic'},
    'hau': {'name': 'Hausa', 'family': 'Afro-Asiatic', 'subfamily': 'Chadic'},
    'som': {'name': 'Somali', 'family': 'Afro-Asiatic', 'subfamily': 'Cushitic'},
    
    # Sino-Tibetan
    'zho': {'name': 'Mandarin Chinese', 'family': 'Sino-Tibetan', 'subfamily': 'Sinitic'},
    'yue': {'name': 'Cantonese', 'family': 'Sino-Tibetan', 'subfamily': 'Sinitic'},
    'bod': {'name': 'Tibetan', 'family': 'Sino-Tibetan', 'subfamily': 'Tibetic'},
    
    # Japonic
    'jpn': {'name': 'Japanese', 'family': 'Japonic', 'subfamily': 'Japanese'},
    
    # Koreanic
    'kor': {'name': 'Korean', 'family': 'Koreanic', 'subfamily': 'Korean'},
    
    # Mongolic
    'mon': {'name': 'Mongolian', 'family': 'Mongolic', 'subfamily': 'Mongolian'},
    
    # Austroasiatic
    'vie': {'name': 'Vietnamese', 'family': 'Austroasiatic', 'subfamily': 'Vietic'},
    'khm': {'name': 'Khmer', 'family': 'Austroasiatic', 'subfamily': 'Khmer'},
    
    # Tai-Kadai
    'tha': {'name': 'Thai', 'family': 'Tai-Kadai', 'subfamily': 'Tai'},
    'lao': {'name': 'Lao', 'family': 'Tai-Kadai', 'subfamily': 'Tai'},
    
    # Dravidian
    'mal': {'name': 'Malayalam', 'family': 'Dravidian', 'subfamily': 'South Dravidian'},
    'tam': {'name': 'Tamil', 'family': 'Dravidian', 'subfamily': 'South Dravidian'},
    'tel': {'name': 'Telugu', 'family': 'Dravidian', 'subfamily': 'South Central Dravidian'},
    'kan': {'name': 'Kannada', 'family': 'Dravidian', 'subfamily': 'South Dravidian'},
    
    # Austronesian
    'msa': {'name': 'Malay', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'ind': {'name': 'Indonesian', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'jav': {'name': 'Javanese', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'ceb': {'name': 'Cebuano', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'tgl': {'name': 'Tagalog', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'sun': {'name': 'Sundanese', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'mlg': {'name': 'Malagasy', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'mri': {'name': 'Maori', 'family': 'Austronesian', 'subfamily': 'Polynesian'},
    
    # Turkic
    'tur': {'name': 'Turkish', 'family': 'Turkic', 'subfamily': 'Oghuz'},
    'azj': {'name': 'Azerbaijani', 'family': 'Turkic', 'subfamily': 'Oghuz'},
    'tuk': {'name': 'Turkmen', 'family': 'Turkic', 'subfamily': 'Oghuz'},
    'uzb': {'name': 'Uzbek', 'family': 'Turkic', 'subfamily': 'Karluk'},
    'uig': {'name': 'Uyghur', 'family': 'Turkic', 'subfamily': 'Karluk'},
    'kaz': {'name': 'Kazakh', 'family': 'Turkic', 'subfamily': 'Kipchak'},
    'kir': {'name': 'Kyrgyz', 'family': 'Turkic', 'subfamily': 'Kipchak'},
    'tat': {'name': 'Tatar', 'family': 'Turkic', 'subfamily': 'Kipchak'},
    
    # Uralic
    'fin': {'name': 'Finnish', 'family': 'Uralic', 'subfamily': 'Finnic'},
    'est': {'name': 'Estonian', 'family': 'Uralic', 'subfamily': 'Finnic'},
    'hun': {'name': 'Hungarian', 'family': 'Uralic', 'subfamily': 'Ugric'},
    
    # Atlantic-Congo
    'swa': {'name': 'Swahili', 'family': 'Atlantic-Congo', 'subfamily': 'Bantu'},
    'zul': {'name': 'Zulu', 'family': 'Atlantic-Congo', 'subfamily': 'Bantu'},
    'sna': {'name': 'Shona', 'family': 'Atlantic-Congo', 'subfamily': 'Bantu'},
    'nya': {'name': 'Nyanja', 'family': 'Atlantic-Congo', 'subfamily': 'Bantu'},
    'xho': {'name': 'Xhosa', 'family': 'Atlantic-Congo', 'subfamily': 'Bantu'},
    'sot': {'name': 'Sotho', 'family': 'Atlantic-Congo', 'subfamily': 'Bantu'},
    'yor': {'name': 'Yoruba', 'family': 'Atlantic-Congo', 'subfamily': 'Volta-Niger'},
    'ibo': {'name': 'Igbo', 'family': 'Atlantic-Congo', 'subfamily': 'Volta-Niger'},
    'wol': {'name': 'Wolof', 'family': 'Atlantic-Congo', 'subfamily': 'Atlantic'},
    
    # Others
    'kat': {'name': 'Georgian', 'family': 'Kartvelian', 'subfamily': 'Kartvelian'},
    'eus': {'name': 'Basque', 'family': 'Language Isolate', 'subfamily': 'None'},
}
