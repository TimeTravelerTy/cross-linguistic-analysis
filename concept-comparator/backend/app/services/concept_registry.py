"""
ConceptRegistryService — searches the Concepticon concept registry stored in
atlas.sqlite and provides concept → CLICS gloss resolution.
"""
import sqlite3
import struct
from pathlib import Path
from typing import Optional

from app.models.schemas import ConceptAnchor, SemanticMapNode

_DB_CANDIDATES = [
    Path(__file__).resolve().parents[3] / "data" / "atlas.sqlite",
    Path(__file__).resolve().parents[2] / "data" / "atlas.sqlite",
]


def _find_db() -> Path:
    for p in _DB_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError(
        "atlas.sqlite not found. Run backend/scripts/run_ingestion.py first.\n"
        "Checked: " + ", ".join(str(p) for p in _DB_CANDIDATES)
    )


def _decode_embedding(blob: bytes) -> list[float]:
    n = len(blob) // 4
    return list(struct.unpack(f"{n}f", blob))


class ConceptRegistryService:
    def __init__(self) -> None:
        db_path = _find_db()
        self._conn = sqlite3.connect(str(db_path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        print(f"ConceptRegistryService: connected to {db_path}")

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def search(self, query: str, limit: int = 12) -> list[ConceptAnchor]:
        """
        Full-text search over concept labels and semantic fields.
        Returns concepts ranked by label prefix match, then CLICS coverage.
        """
        q = query.strip().upper()
        rows = self._conn.execute(
            """
            SELECT concepticon_id, label, definition, semantic_field, clics_gloss
            FROM concept_registry
            WHERE label LIKE ? OR label LIKE ?
            ORDER BY
                CASE WHEN label = ? THEN 0
                     WHEN label LIKE ? THEN 1
                     ELSE 2 END,
                CASE WHEN clics_gloss IS NOT NULL THEN 0 ELSE 1 END,
                label
            LIMIT ?
            """,
            (f"{q}%", f"%{q}%", q, f"{q}%", limit),
        ).fetchall()
        return [self._row_to_anchor(r) for r in rows]

    def get_by_id(self, concepticon_id: str) -> Optional[ConceptAnchor]:
        row = self._conn.execute(
            "SELECT concepticon_id, label, definition, semantic_field, clics_gloss "
            "FROM concept_registry WHERE concepticon_id = ?",
            (concepticon_id,),
        ).fetchone()
        return self._row_to_anchor(row) if row else None

    def get_by_label(self, label: str) -> Optional[ConceptAnchor]:
        """Exact case-insensitive label lookup."""
        row = self._conn.execute(
            "SELECT concepticon_id, label, definition, semantic_field, clics_gloss "
            "FROM concept_registry WHERE label = ?",
            (label.upper(),),
        ).fetchone()
        return self._row_to_anchor(row) if row else None

    # ------------------------------------------------------------------
    # Neighbors (for discovery widget)
    # ------------------------------------------------------------------

    def get_neighbors(
        self,
        concepticon_id: str,
        limit: int = 10,
    ) -> list[SemanticMapNode]:
        """
        Return concepts most frequently colexified with the given concept,
        derived from the same semantic field (fast approximation from registry).
        The full colexification neighborhood is provided by ColexificationService.
        """
        anchor = self.get_by_id(concepticon_id)
        if not anchor or not anchor.semantic_field:
            return []
        rows = self._conn.execute(
            """
            SELECT concepticon_id, label, semantic_field, clics_gloss
            FROM concept_registry
            WHERE semantic_field = ? AND concepticon_id != ?
              AND clics_gloss IS NOT NULL
            ORDER BY label
            LIMIT ?
            """,
            (anchor.semantic_field, concepticon_id, limit),
        ).fetchall()
        return [
            SemanticMapNode(
                concept=r["label"],
                concepticon_id=r["concepticon_id"],
                semantic_field=r["semantic_field"],
                is_selected=False,
            )
            for r in rows
        ]

    # ------------------------------------------------------------------
    # OMW anchors
    # ------------------------------------------------------------------

    def get_omw_anchors(
        self,
        concepticon_id: str,
        language_codes: list[str],
    ) -> dict[str, list[str]]:
        """Return OMW lemmas keyed by ISO 639-3 language code."""
        if not language_codes:
            return {}
        placeholders = ",".join("?" * len(language_codes))
        rows = self._conn.execute(
            f"""
            SELECT language_code, lemma FROM omw_anchors
            WHERE concepticon_id = ? AND language_code IN ({placeholders})
            """,
            [concepticon_id] + language_codes,
        ).fetchall()
        result: dict[str, list[str]] = {}
        for r in rows:
            result.setdefault(r["language_code"], []).append(r["lemma"])
        return result

    # ------------------------------------------------------------------
    # Colexification-space embeddings
    # ------------------------------------------------------------------

    def get_embedding(self, concepticon_id: str) -> Optional[list[float]]:
        """Return the 128-dim Node2Vec embedding for a concept, or None."""
        row = self._conn.execute(
            "SELECT embedding FROM colex_embeddings WHERE concepticon_id = ?",
            (concepticon_id,),
        ).fetchone()
        if row and row[0]:
            return _decode_embedding(row[0])
        return None

    def get_embeddings(
        self,
        concepticon_ids: list[str],
    ) -> dict[str, list[float]]:
        """Batch embedding lookup."""
        if not concepticon_ids:
            return {}
        placeholders = ",".join("?" * len(concepticon_ids))
        rows = self._conn.execute(
            f"SELECT concepticon_id, embedding FROM colex_embeddings "
            f"WHERE concepticon_id IN ({placeholders})",
            concepticon_ids,
        ).fetchall()
        return {
            r["concepticon_id"]: _decode_embedding(r["embedding"])
            for r in rows
            if r["embedding"]
        }

    # ------------------------------------------------------------------
    # Dataset versions
    # ------------------------------------------------------------------

    def get_dataset_versions(self) -> dict[str, str]:
        rows = self._conn.execute(
            "SELECT name, version FROM dataset_versions"
        ).fetchall()
        return {r["name"]: r["version"] for r in rows}

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _row_to_anchor(row: sqlite3.Row) -> ConceptAnchor:
        return ConceptAnchor(
            concepticon_id=row["concepticon_id"],
            label=row["label"],
            clics_gloss=row["clics_gloss"],
            semantic_field=row["semantic_field"],
        )
