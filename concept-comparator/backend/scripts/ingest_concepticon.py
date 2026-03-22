"""
Ingest Concepticon 3.4.0 concept sets into the concept_registry table.

Downloads the conceptsets.tsv from the official Concepticon GitHub release.
Run after setup_database.py.
"""
import csv
import io
import sqlite3
import urllib.request
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "atlas.sqlite"

# Concepticon 3.4.0 release asset (raw TSV from GitHub)
CONCEPTSETS_URL = (
    "https://raw.githubusercontent.com/concepticon/concepticon-data/"
    "v3.4.0/concepticondata/concepticon.tsv"
)

# Semantic field mapping — Concepticon uses uppercase field names
# We normalise them to Title Case for display
def _normalise_field(field: str) -> str:
    return field.strip().title() if field else ""


def download_conceptsets(url: str) -> list[dict]:
    print(f"Downloading Concepticon concept sets from:\n  {url}")
    with urllib.request.urlopen(url, timeout=30) as resp:
        content = resp.read().decode("utf-8")

    reader = csv.DictReader(io.StringIO(content), delimiter="\t")
    rows = list(reader)
    print(f"Downloaded {len(rows)} concept sets")
    return rows


def ingest(conn: sqlite3.Connection, rows: list[dict]) -> int:
    """Insert concept sets; returns count of inserted rows."""
    insert_sql = """
        INSERT OR REPLACE INTO concept_registry
            (concepticon_id, label, definition, semantic_field, ontological_cat, dataset_version)
        VALUES (?, ?, ?, ?, ?, 'concepticon-3.4.0')
    """
    records = []
    for row in rows:
        cid = row.get("ID", "").strip()
        label = row.get("GLOSS", row.get("LABEL", "")).strip()
        if not cid or not label:
            continue
        records.append((
            cid,
            label,
            row.get("DEFINITION", "").strip() or None,
            _normalise_field(row.get("SEMANTICFIELD", "")),
            row.get("ONTOLOGICAL_CATEGORY", "").strip() or None,
        ))

    conn.executemany(insert_sql, records)

    conn.execute("""
        INSERT OR REPLACE INTO dataset_versions (name, version, url)
        VALUES ('concepticon', '3.4.0', ?)
    """, (CONCEPTSETS_URL,))

    conn.commit()
    return len(records)


def main() -> None:
    rows = download_conceptsets(CONCEPTSETS_URL)
    with sqlite3.connect(DB_PATH) as conn:
        n = ingest(conn, rows)
    print(f"Ingested {n} concept sets into concept_registry")


if __name__ == "__main__":
    main()
