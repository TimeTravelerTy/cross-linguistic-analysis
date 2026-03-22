"""
Create the atlas.sqlite database with all required tables.
Run once before any other ingestion scripts.
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "atlas.sqlite"


def create_tables(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        -- Canonical concept registry (from Concepticon 3.4.0)
        CREATE TABLE IF NOT EXISTS concept_registry (
            concepticon_id  TEXT PRIMARY KEY,
            label           TEXT NOT NULL,      -- e.g. "HAND"
            definition      TEXT,
            semantic_field  TEXT,
            ontological_cat TEXT,
            clics_gloss     TEXT,               -- matched CLICS GML Gloss value (may be NULL)
            dataset_version TEXT DEFAULT 'concepticon-3.4.0'
        );
        CREATE INDEX IF NOT EXISTS idx_concept_label ON concept_registry(label);
        CREATE INDEX IF NOT EXISTS idx_concept_field ON concept_registry(semantic_field);
        CREATE INDEX IF NOT EXISTS idx_concept_clics ON concept_registry(clics_gloss);

        -- Multilingual lexical anchors (from Open Multilingual Wordnet)
        CREATE TABLE IF NOT EXISTS omw_anchors (
            concepticon_id  TEXT NOT NULL,
            language_code   TEXT NOT NULL,      -- ISO 639-3
            lemma           TEXT NOT NULL,
            synset_id       TEXT,
            source          TEXT NOT NULL,      -- 'omw_v2' | 'omw_v1' | 'wn31'
            PRIMARY KEY (concepticon_id, language_code, lemma)
        );
        CREATE INDEX IF NOT EXISTS idx_omw_concept ON omw_anchors(concepticon_id);
        CREATE INDEX IF NOT EXISTS idx_omw_lang ON omw_anchors(language_code);

        -- Precomputed colexification-space embeddings (Node2Vec on CLICS graph)
        CREATE TABLE IF NOT EXISTS colex_embeddings (
            concepticon_id  TEXT PRIMARY KEY,
            clics_gloss     TEXT,
            embedding       BLOB NOT NULL       -- 128-dim float32 as numpy bytes
        );

        -- Partial colexifications (affix/overlap, from CLICS* CLDF if available)
        CREATE TABLE IF NOT EXISTS partial_colexifications (
            concept_a       TEXT NOT NULL,      -- concepticon_id
            concept_b       TEXT NOT NULL,
            type            TEXT NOT NULL,      -- 'affix' | 'overlap'
            direction       TEXT,               -- 'a_prefix_b' | 'b_prefix_a' | NULL for overlap
            language        TEXT NOT NULL,
            form_a          TEXT,
            form_b          TEXT,
            PRIMARY KEY (concept_a, concept_b, type, language)
        );
        CREATE INDEX IF NOT EXISTS idx_partial_a ON partial_colexifications(concept_a);
        CREATE INDEX IF NOT EXISTS idx_partial_b ON partial_colexifications(concept_b);

        -- Dataset version tracking
        CREATE TABLE IF NOT EXISTS dataset_versions (
            name        TEXT PRIMARY KEY,
            version     TEXT,
            url         TEXT,
            ingested_at TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    print(f"Database tables created at {DB_PATH}")


def main() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        create_tables(conn)


if __name__ == "__main__":
    main()
