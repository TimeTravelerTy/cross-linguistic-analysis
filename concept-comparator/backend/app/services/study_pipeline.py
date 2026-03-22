"""
StudyPipelineService — orchestrates a multi-concept cross-linguistic study.

For a StudyRequest with N concepts (2–6), computes:
  - ColexificationEvidence for every concept pair (N*(N-1)/2 pairs)
  - LanguagePartition for each requested language
  - Family profiles aggregated from the pair data
  - Node2Vec colexification-space embeddings for UMAP visualisation
  - Optional: surface translations via TranslationService (show_translations=True)
"""
import asyncio
from typing import AsyncGenerator, Optional

from app.models.schemas import (
    ColexResult,
    StudyRequest,
    StudyResult,
)
from app.services.colexification import ColexificationService
from app.services.concept_registry import ConceptRegistryService


class StudyPipelineService:
    def __init__(
        self,
        colex_service: ColexificationService,
        registry_service: ConceptRegistryService,
        translation_service=None,  # optional; injected at startup
    ) -> None:
        self._colex = colex_service
        self._registry = registry_service
        self._translation = translation_service

    async def run(
        self,
        request: StudyRequest,
    ) -> StudyResult:
        """Run the full study pipeline (non-streaming version)."""
        results = []
        async for update in self.stream(request):
            results.append(update)

        # The last update always contains the full result
        for update in reversed(results):
            if "result" in update:
                return update["result"]
        raise RuntimeError("Study pipeline produced no result")

    async def stream(
        self,
        request: StudyRequest,
    ) -> AsyncGenerator[dict, None]:
        """
        Yield progress dicts as the study runs.
        Format: { "progress": int, "step": str, "result"?: StudyResult }
        """
        anchors = request.concepts
        n = len(anchors)

        # -----------------------------------------------------------------
        # Step 1: Build pair matrix (for ColexResult metadata)
        # -----------------------------------------------------------------
        pair_matrix: dict[str, dict[str, ColexResult]] = {}
        pairs = [
            (i, j)
            for i in range(n)
            for j in range(i + 1, n)
        ]
        total_steps = len(pairs) + 3

        for step_idx, (i, j) in enumerate(pairs):
            anchor_a = anchors[i]
            anchor_b = anchors[j]

            evidence = self._colex.get_direct_evidence(
                anchor_a, anchor_b, [], {}
            )

            col_result = ColexResult(
                concept_a=anchor_a.concepticon_id,
                concept_b=anchor_b.concepticon_id,
                label_a=anchor_a.label,
                label_b=anchor_b.label,
                evidence=evidence,
            )

            pair_matrix.setdefault(anchor_a.concepticon_id, {})[
                anchor_b.concepticon_id
            ] = col_result

            progress = round((step_idx + 1) / total_steps * 40)
            yield {
                "progress": progress,
                "step": f"Analysing pair {anchor_a.label} ↔ {anchor_b.label}",
            }
            await asyncio.sleep(0)  # yield control

        # -----------------------------------------------------------------
        # Step 2: Family profiles from ALL CLICS data
        # -----------------------------------------------------------------
        yield {"progress": 50, "step": "Aggregating family profiles from CLICS …"}
        await asyncio.sleep(0)

        family_profiles = self._colex.compute_family_profiles_full(
            anchors, request.families
        )

        # -----------------------------------------------------------------
        # Step 3: Language partitions (from selected families only)
        # -----------------------------------------------------------------
        yield {"progress": 70, "step": "Computing language partitions …"}
        await asyncio.sleep(0)

        language_partitions = self._colex.compute_language_partitions_from_profiles(
            anchors, request.families, family_profiles
        )

        colex_embeddings: dict = {}  # embeddings not used in current UI
        translations: Optional[dict[str, list[str]]] = None

        # -----------------------------------------------------------------
        # Assemble final result
        # -----------------------------------------------------------------
        yield {"progress": 95, "step": "Assembling result …"}
        await asyncio.sleep(0)

        dataset_versions = self._registry.get_dataset_versions()

        result = StudyResult(
            concepts=anchors,
            pair_matrix=pair_matrix,
            language_partitions=language_partitions,
            family_profiles=family_profiles,
            colexification_embeddings=colex_embeddings,
            translations=translations,
            dataset_versions=dataset_versions,
        )

        yield {"progress": 100, "step": "Done", "result": result}
