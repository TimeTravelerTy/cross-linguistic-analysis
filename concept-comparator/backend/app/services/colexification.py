"""
ColexificationService: wraps ClicsService and atlas.sqlite to provide direct
and partial colexification evidence for concept pairs.

Design principle: evidence is raw and attested, never blended into a score.
"""
import math
import sqlite3
from pathlib import Path
from typing import Optional

from app.models.schemas import (
    ColexificationEvidence,
    LanguagePartition,
    SemanticMapEdge,
    SemanticMapNode,
    SemanticMapResponse,
    ConceptAnchor,
)
from app.services.clics import ClicsService
from app.services.language_metadata import LanguageMetadataService

_DB_CANDIDATES = [
    Path(__file__).resolve().parents[3] / "data" / "atlas.sqlite",
    Path(__file__).resolve().parents[2] / "data" / "atlas.sqlite",
]


def _find_db() -> Path:
    for p in _DB_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError("atlas.sqlite not found")


def pair_key(a: ConceptAnchor, b: ConceptAnchor) -> str:
    """Stable key for a concept pair, used across the API (label based)."""
    return f"{a.label}|{b.label}"


class ColexificationService:
    def __init__(
        self,
        clics: ClicsService,
        metadata: Optional[LanguageMetadataService] = None,
    ) -> None:
        self._clics = clics
        self._metadata = metadata or LanguageMetadataService()
        db_path = _find_db()
        self._conn = sqlite3.connect(str(db_path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row

    @property
    def metadata(self) -> LanguageMetadataService:
        return self._metadata

    # ------------------------------------------------------------------
    # Raw edge access
    # ------------------------------------------------------------------

    def _edge(self, anchor_a: ConceptAnchor, anchor_b: ConceptAnchor) -> Optional[dict]:
        if not anchor_a.clics_gloss or not anchor_b.clics_gloss:
            return None
        node_a = self._clics._get_node_by_gloss(anchor_a.clics_gloss)
        node_b = self._clics._get_node_by_gloss(anchor_b.clics_gloss)
        if not node_a or not node_b:
            return None
        edge = self._clics.graph.get_edge_data(node_a, node_b)
        if not edge or "wofam" not in edge:
            return None
        return edge

    @staticmethod
    def _parse_wofam(wofam: str) -> list[dict]:
        """
        Parse a CLICS ``wofam`` edge attribute. Each ``;``-separated entry is
        ``wordA/wordB/ascii_form/language/family/form/value``.
        """
        entries = []
        for raw in wofam.split(";"):
            parts = raw.strip().split("/")
            if len(parts) < 5:
                continue
            language, family = parts[3].strip(), parts[4].strip()
            if not language or not family:
                continue
            form = ""
            for idx in (6, 5, 2):  # prefer the original orthography
                if len(parts) > idx and parts[idx].strip():
                    form = parts[idx].strip()
                    break
            entries.append({"language": language, "family": family, "form": form})
        return entries

    # ------------------------------------------------------------------
    # Direct colexification
    # ------------------------------------------------------------------

    def get_direct_evidence(
        self,
        anchor_a: ConceptAnchor,
        anchor_b: ConceptAnchor,
        embeddings: Optional[dict[str, list[float]]] = None,
    ) -> ColexificationEvidence:
        """Direct colexification evidence for a concept pair across all of CLICS."""
        clics_coverage = bool(anchor_a.clics_gloss and anchor_b.clics_gloss)

        direct_langs: list[str] = []
        direct_families: list[str] = []
        edge = self._edge(anchor_a, anchor_b)
        if edge:
            for entry in self._parse_wofam(edge["wofam"]):
                if entry["language"] not in direct_langs:
                    direct_langs.append(entry["language"])
                if entry["family"] not in direct_families:
                    direct_families.append(entry["family"])

        embedding_sim = None
        if embeddings:
            embedding_sim = _cosine(
                embeddings.get(anchor_a.concepticon_id),
                embeddings.get(anchor_b.concepticon_id),
            )

        partial = self.get_partial_evidence(anchor_a, anchor_b, [])

        return ColexificationEvidence(
            direct_languages=direct_langs,
            direct_families=direct_families,
            direct_count=len(direct_langs),
            affix_languages=partial["affix_languages"],
            affix_direction=partial["affix_direction"],
            overlap_languages=partial["overlap_languages"],
            embedding_similarity=embedding_sim,
            clics_coverage=clics_coverage,
        )

    def get_chains(
        self,
        anchor_a: ConceptAnchor,
        anchor_b: ConceptAnchor,
        family: Optional[str] = None,
        max_depth: int = 3,
        limit: int = 12,
    ) -> list[dict]:
        """Indirect semantic chains between two concepts (strongest first)."""
        if not anchor_a.clics_gloss or not anchor_b.clics_gloss:
            return []
        return self._clics.find_chains(
            anchor_a.clics_gloss, anchor_b.clics_gloss, family, max_depth, limit
        )

    # ------------------------------------------------------------------
    # Partial colexification (from atlas.sqlite partial_colexifications table)
    # ------------------------------------------------------------------

    def get_partial_evidence(
        self,
        anchor_a: ConceptAnchor,
        anchor_b: ConceptAnchor,
        language_codes: list[str],
    ) -> dict:
        """Query atlas.sqlite for partial (affix + overlap) colexifications."""
        empty = {
            "affix_languages": [],
            "affix_direction": None,
            "overlap_languages": [],
        }

        ids = [
            anchor_a.concepticon_id, anchor_b.concepticon_id,
            anchor_a.concepticon_id, anchor_b.concepticon_id,
        ]
        lang_filter = ""
        if language_codes:
            lang_filter = f"AND language IN ({','.join('?' * len(language_codes))})"
            ids = ids + list(language_codes)

        try:
            affix_rows = self._conn.execute(
                f"""
                SELECT language, direction FROM partial_colexifications
                WHERE concept_a IN (?, ?) AND concept_b IN (?, ?)
                  AND type = 'affix' {lang_filter}
                """,
                ids,
            ).fetchall()
            overlap_rows = self._conn.execute(
                f"""
                SELECT language FROM partial_colexifications
                WHERE concept_a IN (?, ?) AND concept_b IN (?, ?)
                  AND type = 'overlap' {lang_filter}
                """,
                ids,
            ).fetchall()
        except sqlite3.OperationalError:
            return empty

        affix_langs = [r["language"] for r in affix_rows]
        affix_dir = affix_rows[0]["direction"] if affix_rows else None

        return {
            "affix_languages": affix_langs,
            "affix_direction": affix_dir,
            "overlap_languages": [r["language"] for r in overlap_rows],
        }

    # ------------------------------------------------------------------
    # Semantic map (CLICS neighborhood graph for selected concepts)
    # ------------------------------------------------------------------

    def get_semantic_map(
        self,
        anchors: list[ConceptAnchor],
        max_neighbors: int = 15,
        family_filter: Optional[str] = None,
    ) -> SemanticMapResponse:
        """
        Return the CLICS colexification neighborhood for the selected concepts.
        When family_filter is set, only edges attested in that family are included
        and counts are relative to that family's language count.
        """
        selected_glosses = {a.clics_gloss for a in anchors if a.clics_gloss}
        selected_labels = {a.clics_gloss: a.label for a in anchors if a.clics_gloss}

        if family_filter:
            total_langs = len(self._clics.family_language_map.get(family_filter, set()))
        else:
            total_langs = sum(len(v) for v in self._clics.family_language_map.values())

        all_nodes: dict[str, SemanticMapNode] = {}
        all_edges: dict[tuple, SemanticMapEdge] = {}

        for anchor in anchors:
            gloss = anchor.clics_gloss
            if not gloss:
                continue

            node_id = self._clics._get_node_by_gloss(gloss)
            if not node_id:
                continue

            all_nodes[gloss] = SemanticMapNode(
                concept=anchor.label,
                concepticon_id=anchor.concepticon_id,
                semantic_field=anchor.semantic_field,
                is_selected=True,
            )

            neighbors = []
            for nb in self._clics.graph.neighbors(node_id):
                edge = self._clics.graph.get_edge_data(node_id, nb)
                if not edge or "wofam" not in edge:
                    continue
                nb_gloss = self._clics.graph.nodes[nb].get("Gloss", "")

                if family_filter:
                    n_langs = len(set(
                        p.split("/")[3].strip()
                        for p in edge["wofam"].split(";")
                        if p and len(p.split("/")) >= 5
                        and p.split("/")[4].strip() == family_filter
                    ))
                else:
                    n_langs = len(set(
                        p.split("/")[3].strip()
                        for p in edge["wofam"].split(";")
                        if p and len(p.split("/")) >= 4
                    ))

                # When filtering by family, skip edges with no attestation
                if family_filter and n_langs == 0:
                    continue

                neighbors.append((nb, nb_gloss, edge, n_langs))

            neighbors.sort(key=lambda x: -x[3])

            for nb, nb_gloss, edge, n_langs in neighbors[:max_neighbors]:
                if not nb_gloss:
                    continue

                if nb_gloss not in all_nodes:
                    nb_data = self._clics.graph.nodes[nb]
                    all_nodes[nb_gloss] = SemanticMapNode(
                        concept=selected_labels.get(nb_gloss, nb_gloss),
                        semantic_field=nb_data.get("Semanticfield"),
                        is_selected=nb_gloss in selected_glosses,
                        family_frequency=nb_data.get("FamilyFrequency", 0),
                        language_frequency=nb_data.get("LanguageFrequency", 0),
                    )

                key = tuple(sorted([gloss, nb_gloss]))
                if key not in all_edges:
                    weight = round(n_langs / max(total_langs, 1), 4)
                    all_edges[key] = SemanticMapEdge(
                        source=selected_labels.get(gloss, gloss),
                        target=selected_labels.get(nb_gloss, nb_gloss),
                        weight=weight,
                        direct_count=n_langs,
                    )

        return SemanticMapResponse(
            nodes=list(all_nodes.values()),
            edges=list(all_edges.values()),
            concepts=[a.label for a in anchors],
        )

    # ------------------------------------------------------------------
    # Family profiles and per-language partitions (all CLICS data)
    # ------------------------------------------------------------------

    def compute_family_profiles_full(
        self,
        anchors: list[ConceptAnchor],
        selected_families: list[str],
    ) -> tuple[dict[str, dict], dict[str, dict[str, str]]]:
        """
        Family-level colexification profiles from all CLICS data, using
        ClicsService.family_language_map as the per-family denominator.

        Returns ``(profiles, forms)`` where ``forms[pair_key][language]`` is
        the attested word form that covers both concepts of the pair.
        """
        family_map = self._clics.family_language_map
        profiles: dict[str, dict] = {}
        forms: dict[str, dict[str, str]] = {}

        n = len(anchors)
        for i in range(n):
            for j in range(i + 1, n):
                anchor_a, anchor_b = anchors[i], anchors[j]
                edge = self._edge(anchor_a, anchor_b)
                if not edge:
                    continue

                key = pair_key(anchor_a, anchor_b)
                family_attesting: dict[str, list[str]] = {}
                pair_forms: dict[str, str] = {}
                for entry in self._parse_wofam(edge["wofam"]):
                    langs = family_attesting.setdefault(entry["family"], [])
                    if entry["language"] not in langs:
                        langs.append(entry["language"])
                    if entry["form"] and entry["language"] not in pair_forms:
                        pair_forms[entry["language"]] = entry["form"]
                forms[key] = pair_forms

                for family, attesting_langs in family_attesting.items():
                    total_in_family = len(family_map.get(family, set()))
                    profile = profiles.setdefault(family, {
                        "total_languages": total_in_family,
                        "pair_rates": {},
                        "is_selected": not selected_families or family in selected_families,
                    })
                    profile["pair_rates"][key] = {
                        "direct_count": len(attesting_langs),
                        "total_languages": total_in_family,
                        "direct_rate": round(len(attesting_langs) / total_in_family, 3) if total_in_family else 0.0,
                        "label_a": anchor_a.label,
                        "label_b": anchor_b.label,
                        "attesting_languages": attesting_langs,
                    }

        return profiles, forms

    def compute_language_partitions_from_profiles(
        self,
        anchors: list[ConceptAnchor],
        selected_families: list[str],
        family_profiles: dict[str, dict],
        forms: Optional[dict[str, dict[str, str]]] = None,
    ) -> dict[str, LanguagePartition]:
        """
        Per-language partitions (which concepts share a word) for languages
        that attest at least one colexification, restricted to the selected
        families when a filter is given. ``merged_groups`` holds concepticon ids.
        """
        forms = forms or {}
        partitions: dict[str, LanguagePartition] = {}
        families_to_include = selected_families or list(family_profiles.keys())
        index_by_label = {a.label: k for k, a in enumerate(anchors)}

        for family in families_to_include:
            if family not in family_profiles:
                continue
            pair_rates = family_profiles[family].get("pair_rates", {})

            lang_pairs: dict[str, set[tuple[int, int]]] = {}
            lang_forms: dict[str, dict[str, str]] = {}

            for key, rate_data in pair_rates.items():
                idx_a = index_by_label.get(rate_data["label_a"])
                idx_b = index_by_label.get(rate_data["label_b"])
                if idx_a is None or idx_b is None:
                    continue
                id_key = f"{anchors[idx_a].concepticon_id}|{anchors[idx_b].concepticon_id}"
                for lang_code in rate_data.get("attesting_languages", []):
                    lang_pairs.setdefault(lang_code, set()).add((idx_a, idx_b))
                    form = forms.get(key, {}).get(lang_code)
                    if form:
                        lang_forms.setdefault(lang_code, {})[id_key] = form

            for lang_code, colex_pairs in lang_pairs.items():
                groups = self._connected_components(len(anchors), colex_pairs)
                partitions[lang_code] = LanguagePartition(
                    language=lang_code,
                    language_name=self._metadata.name(lang_code),
                    dataset=self._metadata.dataset(lang_code),
                    family=family,
                    merged_groups=[
                        [anchors[idx].concepticon_id for idx in grp]
                        for grp in groups
                        if len(grp) > 1
                    ],
                    split_count=len(groups),
                    pair_forms=lang_forms.get(lang_code, {}),
                )

        return partitions

    @staticmethod
    def _connected_components(
        n: int,
        pairs: set[tuple[int, int]],
    ) -> list[list[int]]:
        """Union-Find on concept indices; returns groups (each index is a concept)."""
        parent = list(range(n))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def union(a, b):
            parent[find(a)] = find(b)

        for a, b in pairs:
            union(a, b)

        groups: dict[int, list[int]] = {}
        for i in range(n):
            root = find(i)
            groups.setdefault(root, []).append(i)

        return list(groups.values())


def _cosine(a: Optional[list[float]], b: Optional[list[float]]) -> Optional[float]:
    if not a or not b or len(a) != len(b):
        return None
    dot = sum(x * y for x, y in zip(a, b))
    norm = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return round(dot / norm, 4) if norm else None
