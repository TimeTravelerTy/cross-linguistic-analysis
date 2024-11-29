from typing import List

CLICS_LANGUAGE_MAPPINGS = {
    # Indo-European - Germanic
    'eng': ['wold-13', 'ids-190', 'northeuralex-eng'],
    'nld': ['wold-12', 'ids-191', 'northeuralex-nld'],
    'deu': ['wold-135', 'ids-194', 'northeuralex-deu'],
    
    # Indo-European - Romance
    'fra': ['wold-123', 'ids-171', 'northeuralex-fra'],
    'spa': ['wold-115', 'ids-176', 'northeuralex-spa'],
    'ita': ['wold-169', 'ids-170', 'northeuralex-ita'],
    'por': ['wold-274', 'ids-178', 'northeuralex-por'],
    'ron': ['wold-8', 'ids-179', 'northeuralex-ron'],
    
    # Indo-European - Slavic
    'rus': ['wold-309', 'ids-204', 'northeuralex-rus'],
    'pol': ['wold-273', 'ids-203', 'northeuralex-pol'],
    'ces': ['wold-103', 'ids-202', 'northeuralex-ces'],
    'bul': ['wold-75', 'ids-200', 'northeuralex-bul'],
    
    # Indo-European - Indo-Iranian
    'hin': ['wold-154', 'northeuralex-hin'],
    'ben': ['wold-72', 'northeuralex-ben'],
    'urd': ['northeuralex-urd'],  # Not in WOLD/IDS
    
    # Indo-European - Other
    'ell': ['wold-147', 'ids-168', 'northeuralex-ell'],  # Greek
    'hye': ['wold-57', 'ids-206', 'northeuralex-hye'],  # Armenian
    
    # Afroasiatic
    'ara': ['wold-53', 'northeuralex-arb'],
    'heb': ['wold-152', 'northeuralex-heb'],
    'amh': ['wold-51', 'northeuralex-amh'],
    
    # Sino-Tibetan
    'zho': ['wold-22', 'wold-89', 'northeuralex-cmn'],  # Multiple codes for Chinese
    'yue': ['wold-78'],  # Cantonese
    'bod': ['northeuralex-bod'],  # Tibetan
    
    # Japonic
    'jpn': ['wold-21', 'northeuralex-jpn'],
    
    # Koreanic
    'kor': ['wold-189', 'northeuralex-kor'],
    
    # Austroasiatic
    'vie': ['wold-24', 'northeuralex-vie'],
    'khm': ['wold-110', 'ids-222', 'northeuralex-khm'],
    
    # Tai-Kadai
    'tha': ['wold-23', 'northeuralex-tha'],
    'lao': ['wold-193', 'northeuralex-lao'],
    
    # Dravidian
    'mal': ['wold-203', 'northeuralex-mal'],
    'tam': ['wold-339', 'northeuralex-tam'],
    'tel': ['northeuralex-tel'],
    'kan': ['wold-180', 'northeuralex-kan'],
    
    # Austronesian
    'msa': ['wold-202', 'northeuralex-msa'],  # Malay
    'ind': ['wold-27', 'northeuralex-ind'],   # Indonesian
    'jav': ['wold-175', 'northeuralex-jav'],
    
    # Turkic
    'tur': ['wold-356', 'northeuralex-tur'],
    'azj': ['wold-64', 'ids-71', 'northeuralex-azj'],
    'uzb': ['northeuralex-uzb'],
    
    # Uralic
    'fin': ['wold-119', 'ids-128', 'northeuralex-fin'],
    'est': ['ids-127', 'northeuralex-est'],
    'hun': ['wold-158', 'ids-131', 'northeuralex-hun'],
    
    # Niger-Congo
    'swa': ['northeuralex-swa'],
    'zul': ['northeuralex-zul'],
    'yor': ['wold-384', 'northeuralex-yor']
}

def get_clics_codes(lang_code: str) -> List[str]:
    """Get all possible CLICS codes for a language"""
    return CLICS_LANGUAGE_MAPPINGS.get(lang_code, [])