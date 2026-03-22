"""
Link CLICS GML graph node glosses to Concepticon IDs.

Reads the existing network-3-families.gml, extracts node Gloss values,
and attempts to match each to a row in concept_registry by exact label
match (case-insensitive), then updates concept_registry.clics_gloss.

Also stores the reverse mapping so ColexificationService can resolve
a Concepticon ID → CLICS Gloss for graph lookups.

Run after ingest_concepticon.py.
"""
import sqlite3
import sys
from pathlib import Path

# Allow running from any working directory
sys.path.insert(0, str(Path(__file__).parent.parent))

import networkx as nx

DB_PATH = Path(__file__).parent.parent / "data" / "atlas.sqlite"
GML_CANDIDATES = [
    Path(__file__).parent.parent / "data" / "clics" / "network-3-families.gml",
    Path(__file__).parent.parent.parent / "data" / "clics" / "network-3-families.gml",
]


def find_gml() -> Path:
    for p in GML_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError(
        f"CLICS GML not found. Checked:\n" + "\n".join(str(p) for p in GML_CANDIDATES)
    )


def load_graph_glosses(gml_path: Path) -> list[str]:
    """Load CLICS GML and return all unique non-empty Gloss values."""
    print(f"Loading CLICS graph from {gml_path} …")
    # Clean non-ASCII before loading (mirrors ClicsService)
    raw = gml_path.read_text(encoding="utf-8")
    cleaned = raw.encode("ascii", "ignore").decode("ascii")
    tmp = gml_path.with_suffix(".tmp")
    tmp.write_text(cleaned)
    try:
        g = nx.read_gml(tmp)
    finally:
        tmp.unlink(missing_ok=True)

    glosses = []
    for _, data in g.nodes(data=True):
        gloss = data.get("Gloss", "").strip()
        if gloss:
            glosses.append(gloss)

    print(f"Found {len(glosses)} CLICS node glosses ({len(set(glosses))} unique)")
    return list(set(glosses))


def match_glosses(conn: sqlite3.Connection, glosses: list[str]) -> tuple[int, int]:
    """
    Match CLICS glosses to Concepticon labels (case-insensitive).
    Returns (matched, unmatched) counts.
    """
    # Build lookup: lowercase label → concepticon_id
    rows = conn.execute(
        "SELECT concepticon_id, label FROM concept_registry"
    ).fetchall()
    label_map: dict[str, str] = {label.lower(): cid for cid, label in rows}

    matched = 0
    unmatched = []

    updates = []
    for gloss in glosses:
        cid = label_map.get(gloss.lower())
        if cid:
            updates.append((gloss, cid))
            matched += 1
        else:
            unmatched.append(gloss)

    conn.executemany(
        "UPDATE concept_registry SET clics_gloss = ? WHERE concepticon_id = ?",
        updates,
    )
    conn.commit()

    # Report unmatched (first 20)
    if unmatched:
        print(f"\nNo Concepticon match for {len(unmatched)} CLICS glosses (first 20):")
        for g in unmatched[:20]:
            print(f"  {g!r}")

    return matched, len(unmatched)


def main() -> None:
    gml_path = find_gml()
    glosses = load_graph_glosses(gml_path)

    with sqlite3.connect(DB_PATH) as conn:
        matched, unmatched = match_glosses(conn, glosses)

    total = matched + unmatched
    print(f"\nLinked {matched}/{total} CLICS glosses to Concepticon IDs "
          f"({matched/total*100:.1f}% match rate)")


if __name__ == "__main__":
    main()
