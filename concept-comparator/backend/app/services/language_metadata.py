"""
Human-readable names for CLICS language identifiers.

CLICS identifies a language as ``<dataset>-<local id>`` (``northeuralex-fin``,
``wold-ImbaburaQuechua``, ``transnewguineaorg-kirikiri-faia``, ``ids-218``).
The network file carries no names, so they are resolved in this order:

1. ``LanguageTable`` in ``clics.sqlite``, when the file is present and readable
2. ISO 639-3 codes (NorthEuraLex ids are ISO codes)
3. A readable rendering of the local id (CamelCase / slug splitting)

Numeric ids (IDS, DiACL) cannot be resolved without clics.sqlite and are
shown as e.g. "IDS #218". The hand-made CLICS -> ISO table in
clics_mappings.py is deliberately not used for names: it contained wrong
entries (ids-222 is Uto-Aztecan, not Khmer) and cannot be verified.
"""
from __future__ import annotations

import logging
import re
import sqlite3
from pathlib import Path
from typing import Dict, Iterable

from app.constants.supported_languages import SUPPORTED_LANGUAGES

logger = logging.getLogger(__name__)

DATASET_LABELS: Dict[str, str] = {
    "abrahammonpa": "Abraham Monpa",
    "allenbai": "Allen Bai",
    "bantubvd": "Bantu BVD",
    "beidasinitic": "Beida Sinitic",
    "bodtkhobwa": "Bodt Khobwa",
    "bowernpny": "Bowern Pama-Nyungan",
    "castrosui": "Castro Sui",
    "chenhmongmien": "Chen Hmong-Mien",
    "diacl": "DiACL",
    "halenepal": "Hale Nepal",
    "hantganbangime": "Hantgan Bangime",
    "hubercolumbian": "Huber Colombian",
    "ids": "IDS",
    "kraftchadic": "Kraft Chadic",
    "lexirumah": "LexiRumah",
    "logos": "Logos",
    "marrisonnaga": "Marrison Naga",
    "mitterhoferbena": "Mitterhofer Bena",
    "naganorgyalrongic": "Nagano rGyalrongic",
    "northeuralex": "NorthEuraLex",
    "robinsonap": "Robinson Alor-Pantar",
    "satterthwaitetb": "Satterthwaite Tibeto-Burman",
    "sohartmannchin": "So-Hartmann Chin",
    "suntb": "Sun Tibeto-Burman",
    "tls": "TLS",
    "transnewguineaorg": "TransNewGuinea.org",
    "tryonsolomon": "Tryon Solomons",
    "wold": "WOLD",
    "yanglalo": "Yang Lalo",
    "zgraggenmadang": "Z'graggen Madang",
}

# ISO 639-3 names for NorthEuraLex languages not in SUPPORTED_LANGUAGES
EXTRA_ISO_NAMES: Dict[str, str] = {
    "abk": "Abkhaz", "ady": "Adyghe", "ain": "Ainu", "ale": "Aleut",
    "arb": "Standard Arabic", "ava": "Avar", "bak": "Bashkir", "bre": "Breton",
    "bsk": "Burushaski", "bua": "Buryat", "cat": "Catalan", "che": "Chechen",
    "chv": "Chuvash", "ckt": "Chukchi", "cmn": "Mandarin Chinese", "dar": "Dargwa",
    "ddo": "Tsez", "ekk": "Estonian", "enf": "Forest Enets", "ess": "Central Siberian Yupik",
    "evn": "Evenki", "gld": "Nanai", "itl": "Itelmen", "kal": "Greenlandic",
    "kca": "Khanty", "ket": "Ket", "khk": "Khalkha Mongolian", "kmr": "Northern Kurdish",
    "koi": "Komi-Permyak", "kpv": "Komi-Zyrian", "krl": "Karelian", "lat": "Latin",
    "lbe": "Lak", "lez": "Lezgian", "liv": "Livonian", "mdf": "Moksha",
    "mhr": "Meadow Mari", "mnc": "Manchu", "mns": "Mansi", "mrj": "Hill Mari",
    "myv": "Erzya", "nio": "Nganasan", "niv": "Nivkh", "olo": "Livvi-Karelian",
    "oss": "Ossetian", "pbu": "Northern Pashto", "pes": "Western Persian", "sah": "Yakut",
    "sel": "Selkup", "sjd": "Kildin Sami", "sma": "Southern Sami", "sme": "Northern Sami",
    "smj": "Lule Sami", "smn": "Inari Sami", "sms": "Skolt Sami", "udm": "Udmurt",
    "ukr": "Ukrainian", "uzn": "Northern Uzbek", "vep": "Veps", "xal": "Kalmyk",
    "ykg": "Tundra Yukaghir", "yrk": "Tundra Nenets", "yux": "Kolyma Yukaghir",
}

_CAMEL = re.compile(r"(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])")


def _iso_name(iso: str) -> str | None:
    info = SUPPORTED_LANGUAGES.get(iso)
    if info:
        return info["name"]
    return EXTRA_ISO_NAMES.get(iso)


def _prettify_local_id(local_id: str) -> str:
    # lexirumah ids look like "adan1251-otvai" (glottocode + variety)
    m = re.fullmatch(r"([a-z]{4}\d{4})-(.+)", local_id)
    if m:
        local_id = m.group(2)
    elif re.fullmatch(r"[a-z]{4}\d{4}", local_id):
        return local_id  # bare Glottolog code; keep it as an identifier
    if "_" in local_id or "-" in local_id:
        words = re.split(r"[-_]+", local_id)
    else:
        words = _CAMEL.sub(" ", local_id).split()
    return " ".join(w[:1].upper() + w[1:] for w in words if w)


class LanguageMetadataService:
    def __init__(self, sqlite_path: Path | None = None) -> None:
        self._names: Dict[str, str] = {}
        if sqlite_path and sqlite_path.exists():
            self._load_sqlite(sqlite_path)

    def _load_sqlite(self, path: Path) -> None:
        try:
            conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
            rows = conn.execute(
                "SELECT dataset_ID, ID, Name FROM LanguageTable WHERE Name IS NOT NULL"
            ).fetchall()
            conn.close()
        except sqlite3.DatabaseError as e:
            logger.warning(
                "Could not read language names from %s (%s). Falling back to "
                "heuristic names; re-download clics.sqlite to fix this.",
                path,
                e,
            )
            return
        for dataset, local_id, name in rows:
            self._names[f"{dataset}-{local_id}"] = name
        logger.info("Loaded %d language names from %s", len(rows), path.name)

    def name(self, code: str) -> str:
        if code in self._names:
            return self._names[code]
        dataset, _, local_id = code.partition("-")
        if not local_id:
            return code
        if dataset == "northeuralex":
            return _iso_name(local_id) or local_id
        if local_id.isdigit():
            return f"{DATASET_LABELS.get(dataset, dataset)} #{local_id}"
        return _prettify_local_id(local_id)

    def names(self, codes: Iterable[str]) -> Dict[str, str]:
        return {code: self.name(code) for code in codes}

    @staticmethod
    def dataset(code: str) -> str:
        prefix = code.split("-", 1)[0]
        return DATASET_LABELS.get(prefix, prefix)
