from typing import List

CLICS_LANGUAGE_MAPPINGS = {
    # Existing mappings
    'eng': ['wold-13', 'ids-190', 'northeuralex-eng'],
    'nld': ['wold-12', 'ids-191', 'northeuralex-nld'],
    'deu': ['wold-135', 'ids-194', 'northeuralex-deu'],
    'fra': ['wold-123', 'ids-171', 'northeuralex-fra'],
    'spa': ['wold-115', 'ids-176', 'northeuralex-spa'],
    'ita': ['wold-169', 'ids-170', 'northeuralex-ita'],
    'por': ['wold-274', 'ids-178', 'northeuralex-por'],
    'ron': ['wold-8', 'ids-179', 'northeuralex-ron'],
    'rus': ['wold-309', 'ids-204', 'northeuralex-rus'],
    'pol': ['wold-273', 'ids-203', 'northeuralex-pol'],
    'ces': ['wold-103', 'ids-202', 'northeuralex-ces'],
    'bul': ['wold-75', 'ids-200', 'northeuralex-bul'],
    'hin': ['wold-154', 'northeuralex-hin'],
    'ben': ['wold-72', 'northeuralex-ben'],
    'urd': ['northeuralex-urd'],
    'ell': ['wold-147', 'ids-168', 'northeuralex-ell'],
    'hye': ['wold-57', 'ids-206', 'northeuralex-hye'],
    'ara': ['wold-53', 'northeuralex-arb'],
    'heb': ['wold-152', 'northeuralex-heb'],
    'amh': ['wold-51', 'northeuralex-amh'],
    'zho': ['wold-22', 'wold-89', 'northeuralex-cmn'],
    'yue': ['wold-78'],
    'bod': ['northeuralex-bod'],
    'jpn': ['wold-21', 'northeuralex-jpn'],
    'kor': ['wold-189', 'northeuralex-kor'],
    'vie': ['wold-24', 'northeuralex-vie'],
    'khm': ['wold-110', 'ids-222', 'northeuralex-khm'],
    'tha': ['wold-23', 'northeuralex-tha'],
    'lao': ['wold-193', 'northeuralex-lao'],
    'mal': ['wold-203', 'northeuralex-mal'],
    'tam': ['wold-339', 'northeuralex-tam'],
    'tel': ['northeuralex-tel'],
    'kan': ['wold-180', 'northeuralex-kan'],
    'msa': ['wold-202', 'northeuralex-msa'],
    'ind': ['wold-27', 'northeuralex-ind'],
    'jav': ['wold-175', 'northeuralex-jav'],
    'tur': ['wold-356', 'northeuralex-tur'],
    'azj': ['wold-64', 'ids-71', 'northeuralex-azj'],
    'uzb': ['northeuralex-uzb'],
    'fin': ['wold-119', 'ids-128', 'northeuralex-fin'],
    'est': ['ids-127', 'northeuralex-est'],
    'hun': ['wold-158', 'ids-131', 'northeuralex-hun'],
    'swa': ['northeuralex-swa'],
    'zul': ['northeuralex-zul'],
    'yor': ['wold-384', 'northeuralex-yor'],

    # New Indo-European Languages
    'bel': ['northeuralex-bel'],
    'srp': ['northeuralex-srp'],
    'hrv': ['northeuralex-hrv'],
    'slk': ['northeuralex-slk'],
    'slv': ['northeuralex-slv'],
    'lav': ['northeuralex-lav'],
    'lit': ['northeuralex-lit'],
    'pan': ['northeuralex-pan'],
    'mar': ['northeuralex-mar'],
    'guj': ['northeuralex-guj'],
    'nep': ['northeuralex-nep'],
    'fas': ['northeuralex-fas'],
    'tgk': ['northeuralex-tgk'],
    'sqi': ['northeuralex-sqi'],
    'gle': ['northeuralex-gle'],
    'gla': ['northeuralex-gla'],
    'cym': ['northeuralex-cym'],
    'fry': ['northeuralex-fry'],
    'isl': ['northeuralex-isl'],
    'nor': ['northeuralex-nor'],
    'dan': ['northeuralex-dan'],
    'swe': ['northeuralex-swe'],

    # New Turkic Languages
    'kaz': ['northeuralex-kaz'],
    'kir': ['northeuralex-kir'],
    'tat': ['northeuralex-tat'],
    'tuk': ['northeuralex-tuk'],
    'uig': ['northeuralex-uig'],

    # New Austronesian Languages
    'ceb': ['northeuralex-ceb'],
    'tgl': ['northeuralex-tgl'],
    'sun': ['northeuralex-sun'],
    'mlg': ['northeuralex-mlg'],

    # New Niger-Congo Languages
    'ibo': ['northeuralex-ibo'],
    'wol': ['northeuralex-wol'],
    'sna': ['northeuralex-sna'],
    'nya': ['northeuralex-nya'],
    'xho': ['northeuralex-xho'],
    'sot': ['northeuralex-sot'],

    # New Afroasiatic Languages
    'hau': ['northeuralex-hau'],
    'som': ['northeuralex-som'],

    # Other New Languages
    'sin': ['northeuralex-sin'],
    'mon': ['northeuralex-mon'],
    'mri': ['northeuralex-mri'],
    'mlt': ['northeuralex-mlt']
}

def get_clics_codes(lang_code: str) -> List[str]:
    """Get all possible CLICS codes for a language"""
    return CLICS_LANGUAGE_MAPPINGS.get(lang_code, [])