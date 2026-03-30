"""
ColexificationService — wraps the existing ClicsService and the new atlas.sqlite
to provide direct + partial colexification evidence for concept pairs.

Design principle: evidence is raw and attested, never blended into a score.
"""
import sqlite3
from pathlib import Path
from typing import Optional

from app.models.schemas import (
    ColexificationEvidence,
    ColexResult,
    LanguagePartition,
    SemanticMapEdge,
    SemanticMapNode,
    SemanticMapResponse,
    ConceptAnchor,
)
from app.services.clics import ClicsService

_DB_CANDIDATES = [
    Path(__file__).resolve().parents[3] / "data" / "atlas.sqlite",
    Path(__file__).resolve().parents[2] / "data" / "atlas.sqlite",
]

# ISO 639-3 → human-readable name (mirrors SUPPORTED_LANGUAGES in main.py)
# We import it lazily to avoid circular imports.
def _get_supported_languages() -> dict:
    from app.main import SUPPORTED_LANGUAGES  # type: ignore
    return SUPPORTED_LANGUAGES


def _find_db() -> Path:
    for p in _DB_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError("atlas.sqlite not found")


class ColexificationService:
    def __init__(self, clics: ClicsService) -> None:
        self._clics = clics
        db_path = _find_db()
        self._conn = sqlite3.connect(str(db_path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        print("ColexificationService initialised")

    # ------------------------------------------------------------------
    # Direct colexification (from existing CLICS graph)
    # ------------------------------------------------------------------

    def get_direct_evidence(
        self,
        anchor_a: ConceptAnchor,
        anchor_b: ConceptAnchor,
        language_codes: list[str],
        supported_languages: dict,
    ) -> ColexificationEvidence:
        """
        Return direct colexification evidence for a concept pair across the
        requested languages.  Delegates graph traversal to ClicsService.
        """
        gloss_a = anchor_a.clics_gloss
        gloss_b = anchor_b.clics_gloss

        clics_coverage = bool(gloss_a and gloss_b)

        direct_langs: list[str] = []
        direct_families: list[str] = []
        chain_paths: list[list[str]] = []
        embedding_sim: Optional[float] = None

        if clics_coverage:
            node_a = self._clics._get_node_by_gloss(gloss_a)
            node_b = self._clics._get_node_by_gloss(gloss_b)

            if node_a and node_b:
                edge = self._clics.graph.get_edge_data(node_a, node_b)
                if edge and "wofam" in edge:
                    direct_langs, direct_families = self._parse_wofam_languages(
                        edge["wofam"], language_codes
                    )

        partial = self.get_partial_evidence(anchor_a, anchor_b, language_codes)

        return ColexificationEvidence(
            direct_languages=direct_langs,
            direct_families=list(set(direct_families)),
            direct_count=len(direct_langs),
            affix_languages=partial["affix_languages"],
            affix_direction=partial["affix_direction"],
            overlap_languages=partial["overlap_languages"],
            chain_paths=chain_paths,
            chain_min_length=min(len(p) for p in chain_paths) if chain_paths else None,
            embedding_similarity=embedding_sim,
            clics_coverage=clics_coverage,
            omw_coverage=0,  # filled by StudyPipelineService if needed
        )

    def get_chain_evidence(
        self,
        anchor_a: ConceptAnchor,
        anchor_b: ConceptAnchor,
        family: str,
        max_depth: int = 4,
    ) -> list[list[str]]:
        """Return CLICS semantic chain paths between two concepts in a family."""
        if not anchor_a.clics_gloss or not anchor_b.clics_gloss:
            return []
        chains = self._clics.find_chains(
            anchor_a.clics_gloss, anchor_b.clics_gloss, family, max_depth
        )
        return [c["path"] for c in chains]

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

        if not language_codes:
            return empty

        placeholders = ",".join("?" * len(language_codes))

        # Affix colexifications
        affix_rows = self._conn.execute(
            f"""
            SELECT language, direction FROM partial_colexifications
            WHERE concept_a IN (?, ?) AND concept_b IN (?, ?)
              AND type = 'affix'
              AND language IN ({placeholders})
            """,
            [
                anchor_a.concepticon_id, anchor_b.concepticon_id,
                anchor_a.concepticon_id, anchor_b.concepticon_id,
            ] + language_codes,
        ).fetchall()

        affix_langs = [r["language"] for r in affix_rows]
        affix_dir = affix_rows[0]["direction"] if affix_rows else None

        # Overlap colexifications
        overlap_rows = self._conn.execute(
            f"""
            SELECT language FROM partial_colexifications
            WHERE concept_a IN (?, ?) AND concept_b IN (?, ?)
              AND type = 'overlap'
              AND language IN ({placeholders})
            """,
            [
                anchor_a.concepticon_id, anchor_b.concepticon_id,
                anchor_a.concepticon_id, anchor_b.concepticon_id,
            ] + language_codes,
        ).fetchall()

        return {
            "affix_languages": affix_langs,
            "affix_direction": affix_dir,
            "overlap_languages": [r["language"] for r in overlap_rows],
        }

    # ------------------------------------------------------------------
    # Language partitions: which concepts merge/split per language
    # ------------------------------------------------------------------

    def compute_language_partitions(
        self,
        anchors: list[ConceptAnchor],
        language_codes: list[str],
        supported_languages: dict,
    ) -> dict[str, LanguagePartition]:
        """
        For each language, determine which concepts share a lexical form
        (are directly colexified).  Returns merge/split groupings.
        """
        partitions: dict[str, LanguagePartition] = {}

        for lang_code in language_codes:
            lang_info = supported_languages.get(lang_code, {})
            lang_name = lang_info.get("name", lang_code)
            family = lang_info.get("family", "Unknown")

            # Build adjacency: which pairs are colexified in this language?
            colex_pairs: set[tuple[int, int]] = set()

            for i, anchor_a in enumerate(anchors):
                for j, anchor_b in enumerate(anchors):
                    if j <= i:
                        continue
                    gloss_a = anchor_a.clics_gloss
                    gloss_b = anchor_b.clics_gloss
                    if not gloss_a or not gloss_b:
                        continue

                    node_a = self._clics._get_node_by_gloss(gloss_a)
                    node_b = self._clics._get_node_by_gloss(gloss_b)
                    if not node_a or not node_b:
                        continue

                    edge = self._clics.graph.get_edge_data(node_a, node_b)
                    if not edge or "wofam" not in edge:
                        continue

                    direct, _ = self._parse_wofam_languages(
                        edge["wofam"], [lang_code]
                    )
                    if direct:
                        colex_pairs.add((i, j))

            # Build connected components (merge groups)
            groups = self._connected_components(len(anchors), colex_pairs)
            merged_groups = [
                [anchors[idx].label for idx in grp]
                for grp in groups
                if len(grp) > 1
            ]

            partitions[lang_code] = LanguagePartition(
                language=lang_code,
                language_name=lang_name,
                family=family,
                merged_groups=merged_groups,
                split_count=len(groups),
            )

        return partitions

    # ------------------------------------------------------------------
    # Family profiles: colexification rates aggregated by family
    # ------------------------------------------------------------------

    def compute_family_profiles(
        self,
        anchors: list[ConceptAnchor],
        pair_matrix: dict[str, dict[str, ColexResult]],
        supported_languages: dict,
    ) -> dict[str, dict]:
        """
        Aggregate colexification evidence by language family.
        Returns colexification rate (direct_count / total_family_languages)
        per concept pair per family.
        """
        # Group language codes by family
        family_langs: dict[str, list[str]] = {}
        for lang_code, info in supported_languages.items():
            fam = info.get("family", "Unknown")
            family_langs.setdefault(fam, []).append(lang_code)

        profiles: dict[str, dict] = {}

        for family, langs in family_langs.items():
            n_langs = len(langs)
            pair_rates: dict[str, dict] = {}

            for id_a, inner in pair_matrix.items():
                for id_b, col_result in inner.items():
                    ev = col_result.evidence
                    # Count how many of this family's languages appear in direct_languages
                    n_direct = sum(1 for l in ev.direct_languages if l in langs)
                    pair_rates[f"{col_result.label_a}|{col_result.label_b}"] = {
                        "direct_count": n_direct,
                        "total_languages": n_langs,
                        "direct_rate": round(n_direct / n_langs, 3) if n_langs else 0.0,
                        "label_a": col_result.label_a,
                        "label_b": col_result.label_b,
                    }

            profiles[family] = {
                "total_languages": n_langs,
                "pair_rates": pair_rates,
            }

        return profiles

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
    # Full-CLICS family profiles (primary view — no language filter)
    # ------------------------------------------------------------------

    def _parse_wofam_full(
        self,
        wofam: str,
    ) -> tuple[list[str], dict[str, list[str]]]:
        """Parse ALL entries from a CLICS wofam string without language filtering.
        Returns (all_lang_codes, family→attesting_langs)."""
        family_to_langs: dict[str, list[str]] = {}
        all_langs: list[str] = []
        seen_langs: set[str] = set()

        for entry in wofam.split(";"):
            if not entry.strip():
                continue
            parts = entry.strip().split("/")
            if len(parts) < 5:
                continue
            lang_code = parts[3].strip()
            family = parts[4].strip()
            if lang_code and family:
                if lang_code not in seen_langs:
                    all_langs.append(lang_code)
                    seen_langs.add(lang_code)
                fam_langs = family_to_langs.setdefault(family, [])
                if lang_code not in fam_langs:
                    fam_langs.append(lang_code)

        return all_langs, family_to_langs

    def compute_family_profiles_full(
        self,
        anchors: list[ConceptAnchor],
        selected_families: list[str],
    ) -> dict[str, dict]:
        """
        Compute family-level colexification profiles using ALL CLICS wofam data.
        Uses ClicsService.family_language_map as the per-family denominator.
        Includes attesting_languages per pair for drill-down.
        """
        family_map = self._clics.family_language_map  # Dict[str, Set[str]]
        profiles: dict[str, dict] = {}

        n = len(anchors)
        pairs = [(i, j) for i in range(n) for j in range(i + 1, n)]

        for i, j in pairs:
            anchor_a = anchors[i]
            anchor_b = anchors[j]

            gloss_a = anchor_a.clics_gloss
            gloss_b = anchor_b.clics_gloss
            if not gloss_a or not gloss_b:
                continue

            node_a = self._clics._get_node_by_gloss(gloss_a)
            node_b = self._clics._get_node_by_gloss(gloss_b)
            if not node_a or not node_b:
                continue

            edge = self._clics.graph.get_edge_data(node_a, node_b)
            if not edge or "wofam" not in edge:
                continue

            _, family_attesting = self._parse_wofam_full(edge["wofam"])
            pair_key = f"{anchor_a.label}|{anchor_b.label}"

            for family, attesting_langs in family_attesting.items():
                if family not in profiles:
                    total_in_family = len(family_map.get(family, set()))
                    profiles[family] = {
                        "total_languages": total_in_family,
                        "pair_rates": {},
                        "is_selected": not selected_families or family in selected_families,
                    }
                total_in_family = len(family_map.get(family, set()))
                n_direct = len(attesting_langs)
                profiles[family]["pair_rates"][pair_key] = {
                    "direct_count": n_direct,
                    "total_languages": total_in_family,
                    "direct_rate": round(n_direct / total_in_family, 3) if total_in_family else 0.0,
                    "label_a": anchor_a.label,
                    "label_b": anchor_b.label,
                    "attesting_languages": attesting_langs,
                }

        return profiles

    def compute_language_partitions_from_profiles(
        self,
        anchors: list[ConceptAnchor],
        selected_families: list[str],
        family_profiles: dict[str, dict],
    ) -> dict[str, LanguagePartition]:
        """
        Derive per-language partitions from already-computed family profiles.
        Includes attesting languages from the selected families, or all attesting
        families when no family filter is applied.
        merged_groups stores concepticon_ids (for frontend matching).
        """
        partitions: dict[str, LanguagePartition] = {}
        families_to_include = selected_families or list(family_profiles.keys())

        for family in families_to_include:
            if family not in family_profiles:
                continue
            pair_rates = family_profiles[family].get("pair_rates", {})

            # Build per-lang adjacency: which concept-index pairs are colexified?
            lang_pairs: dict[str, set[tuple[int, int]]] = {}

            for pair_key, rate_data in pair_rates.items():
                attesting = rate_data.get("attesting_languages", [])
                label_a = rate_data["label_a"]
                label_b = rate_data["label_b"]

                idx_a = next((k for k, a in enumerate(anchors) if a.label == label_a), None)
                idx_b = next((k for k, a in enumerate(anchors) if a.label == label_b), None)
                if idx_a is None or idx_b is None:
                    continue

                for lang_code in attesting:
                    lang_pairs.setdefault(lang_code, set()).add((idx_a, idx_b))

            for lang_code, colex_pairs in lang_pairs.items():
                groups = self._connected_components(len(anchors), colex_pairs)
                merged_groups = [
                    [anchors[idx].concepticon_id for idx in grp]
                    for grp in groups
                    if len(grp) > 1
                ]
                partitions[lang_code] = LanguagePartition(
                    language=lang_code,
                    language_name=lang_code,
                    family=family,
                    merged_groups=merged_groups,
                    split_count=len(groups),
                )

        return partitions

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _parse_wofam_languages(
        self,
        wofam: str,
        filter_codes: list[str],
    ) -> tuple[list[str], list[str]]:
        """
        Parse a CLICS 'wofam' edge attribute string and return
        (matching_language_codes, matching_families) filtered to filter_codes.

        wofam format: "dataset/number/glottocode/langcode/family;..."
        """
        from app.constants.clics_mappings import get_clics_codes  # type: ignore

        # Build reverse map: clics_code → iso_code (for filter_codes)
        clics_to_iso: dict[str, str] = {}
        for iso in filter_codes:
            for clics_code in get_clics_codes(iso):
                clics_to_iso[clics_code] = iso

        matched_langs: list[str] = []
        matched_families: list[str] = []

        for entry in wofam.split(";"):
            if not entry:
                continue
            parts = entry.split("/")
            if len(parts) < 5:
                continue
            lang_code = parts[3].strip()
            family = parts[4].strip()
            if lang_code in clics_to_iso:
                iso = clics_to_iso[lang_code]
                if iso not in matched_langs:
                    matched_langs.append(iso)
                if family and family not in matched_families:
                    matched_families.append(family)

        return matched_langs, matched_families

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
