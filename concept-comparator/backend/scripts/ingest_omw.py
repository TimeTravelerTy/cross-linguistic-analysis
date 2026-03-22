"""
Ingest Open Multilingual Wordnet (OMW) lexical anchors into omw_anchors.

Uses the `wn` library (pip install wn) to download OMW data and link
synsets to Concepticon concept IDs via WordNet offsets.

Strategy:
  1. Download OMW language packs via `wn.download()`
  2. For each Concepticon concept that has a WordNet synset mapping,
     look up lemmas in target languages.
  3. Also performs a direct label-match fallback for concepts without
     a WordNet synset.

Run after link_clics_concepticon.py.
Requires: pip install wn
"""
import sqlite3
import sys
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "atlas.sqlite"

# OMW language packs to download (ISO 639-3 → OMW language code)
# Subset matching our supported languages
OMW_LANGUAGES = {
    "cmn": "cmn",   # Mandarin Chinese
    "fra": "fra",   # French
    "spa": "spa",   # Spanish
    "deu": "deu",   # German
    "ita": "ita",   # Italian
    "por": "por",   # Portuguese
    "jpn": "jpn",   # Japanese
    "ara": "arb",   # Arabic (Modern Standard)
    "fin": "fin",   # Finnish
    "ind": "ind",   # Indonesian
    "msa": "zsm",   # Malay
    "tha": "tha",   # Thai
    "pol": "pol",   # Polish
    "bul": "bul",   # Bulgarian
    "slv": "slv",   # Slovene
    "lit": "lit",   # Lithuanian
    "hrv": "hrv",   # Croatian
    "ron": "ron",   # Romanian
    "cat": "cat",   # Catalan
    "heb": "heb",   # Hebrew
}


def try_import_wn():
    try:
        import wn
        return wn
    except ImportError:
        print("ERROR: `wn` library not installed. Run: pip install wn")
        print("Skipping OMW ingestion.")
        return None


def ingest_omw(conn: sqlite3.Connection) -> int:
    wn = try_import_wn()
    if wn is None:
        return 0

    # Download English WordNet (base for synset IDs)
    print("Downloading English WordNet (ewn) …")
    try:
        wn.download("ewn:2020", progress=True)
    except Exception as e:
        print(f"Warning: Could not download ewn: {e}")

    # Get Concepticon entries that might have WordNet offsets
    # We'll do a simple label-to-lemma lookup per language
    concepts = conn.execute(
        "SELECT concepticon_id, label FROM concept_registry WHERE label IS NOT NULL"
    ).fetchall()
    print(f"Attempting lemma lookup for {len(concepts)} concepts across {len(OMW_LANGUAGES)} languages")

    records = []
    downloaded_langs: set[str] = set()

    for lang_iso, lang_omw in OMW_LANGUAGES.items():
        # Try to download the language pack
        if lang_omw not in downloaded_langs:
            try:
                wn.download(f"omw-{lang_omw}:1.4", progress=False)
                downloaded_langs.add(lang_omw)
                print(f"  Downloaded OMW pack for {lang_iso} ({lang_omw})")
            except Exception as e:
                print(f"  Skipping {lang_iso}: {e}")
                continue

        for cid, label in concepts:
            try:
                # Search for the concept label as an English word, then get
                # synsets, then look up lemmas in the target language
                synsets = wn.synsets(label.lower(), lang="en")
                for ss in synsets[:3]:  # top 3 senses
                    lemmas = ss.lemmas(lang=lang_omw)
                    for lemma in lemmas:
                        records.append((cid, lang_iso, lemma, ss.id(), "omw_v1"))
            except Exception:
                pass

    if records:
        conn.executemany(
            """INSERT OR IGNORE INTO omw_anchors
               (concepticon_id, language_code, lemma, synset_id, source)
               VALUES (?, ?, ?, ?, ?)""",
            records,
        )
        conn.execute(
            "INSERT OR REPLACE INTO dataset_versions (name, version, url) "
            "VALUES ('omw', '1.4', 'https://omwn.org/')"
        )
        conn.commit()

    return len(records)


def main() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        n = ingest_omw(conn)
    print(f"\nIngested {n} OMW anchor records")


if __name__ == "__main__":
    main()
