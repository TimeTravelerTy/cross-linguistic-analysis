import logging
import networkx as nx
from pathlib import Path
from typing import Dict, List, Set, Optional, Any
import os
import numpy as np
from app.models.schemas import LanguageColexification
from app.constants.clics_mappings import get_clics_codes

logger = logging.getLogger(__name__)


class ClicsService:
    def __init__(self):
        """Initialize by loading the pre-computed network and building family-language mappings."""
        configured_path = (os.getenv("CLICS_NETWORK_PATH") or "").strip()
        network_path, checked_paths = self._resolve_network_path(configured_path)
        if not network_path:
            checked_paths_msg = "\n".join(f"  - {path}" for path in checked_paths)
            raise ValueError(
                "CLICS network file not found.\n"
                f"Configured CLICS_NETWORK_PATH: '{configured_path}'\n"
                "Checked paths:\n"
                f"{checked_paths_msg}"
            )

        logger.info("Loading CLICS network from %s", network_path)

        with open(network_path, "r", encoding="utf-8") as f:
            gml_data = f.read()

        # networkx's GML parser only accepts 7-bit ASCII. Escape non-ASCII
        # characters as XML character references (which the parser decodes)
        # instead of dropping them, so IPA word forms survive intact.
        gml_data = gml_data.encode("ascii", "xmlcharrefreplace").decode("ascii")
        self.graph = nx.parse_gml(gml_data)

        # Gloss -> node id index (avoids a linear scan on every lookup)
        self._gloss_index: Dict[str, str] = {}
        for node, data in self.graph.nodes(data=True):
            gloss = data.get("Gloss")
            if gloss:
                self._gloss_index.setdefault(gloss, node)
                self._gloss_index.setdefault(gloss.upper(), node)

        self.family_language_map = self._build_family_language_map()
        logger.info(
            "Loaded CLICS network: %d concepts, %d colexification edges, %d families",
            self.graph.number_of_nodes(),
            self.graph.number_of_edges(),
            len(self.family_language_map),
        )

    def _resolve_network_path(self, configured_path: str) -> tuple[Optional[Path], List[Path]]:
        """Resolve CLICS network path across common project layouts."""
        project_root = Path(__file__).resolve().parents[3]  # concept-comparator/
        backend_root = Path(__file__).resolve().parents[2]  # concept-comparator/backend/

        candidates: List[Path] = []

        if configured_path:
            env_path = Path(configured_path).expanduser()
            if env_path.is_absolute():
                candidates.append(env_path)
            else:
                candidates.append(Path.cwd() / env_path)
                candidates.append(project_root / env_path)
                candidates.append(backend_root / env_path)

        candidates.extend([
            project_root / "data/clics/network-3-families.gml",
            project_root / "backend/data/clics/network-3-families.gml",
            backend_root / "data/clics/network-3-families.gml",
        ])

        checked_paths: List[Path] = []
        seen = set()

        for path in candidates:
            resolved = path.resolve()
            if resolved in seen:
                continue
            seen.add(resolved)
            checked_paths.append(resolved)
            if resolved.exists():
                return resolved, checked_paths

        return None, checked_paths

    def _build_family_language_map(self) -> Dict[str, Set[str]]:
        """Build a mapping from family names to the set of unique languages in each family."""
        family_language_map = {}
        
        # Process each edge in the graph
        for edge in self.graph.edges(data=True):
            edge_data = edge[2]  # Get edge attributes
            
            # Get languages and families from the edge data
            if 'wofam' in edge_data:
                entries = edge_data['wofam'].split(';')
                for entry in entries:
                    if not entry:
                        continue
                    parts = entry.split('/')
                    if len(parts) >= 5:
                        family = parts[4].strip()  # The family is the 5th element
                        language = parts[3].strip()  # The language code is the 4th element
                        
                        if family and language:
                            if family not in family_language_map:
                                family_language_map[family] = set()
                            family_language_map[family].add(language)
        
        return family_language_map
        
    def _get_node_by_gloss(self, concept: str) -> Optional[str]:
        """Find node ID for a concept by its Gloss (case-insensitive fallback)."""
        if not concept:
            return None
        return self._gloss_index.get(concept) or self._gloss_index.get(concept.upper())

    def get_language_colexifications(
        self,
        concept: str,
        language_code: str,
    ) -> List[LanguageColexification]:
        """Get colexifications specific to a language"""
        node_id = self._get_node_by_gloss(concept)
        if not node_id:
            return []
            
        colexifications = []

        clics_codes = get_clics_codes(language_code)
        
        for neighbor in self.graph.neighbors(node_id):
            neighbor_data = self.graph.nodes[neighbor]
            edge = self.graph.get_edge_data(node_id, neighbor)
            
            if neighbor_data and edge and 'wofam' in edge:
                # Check if this language has this colexification
                languages = set()
                for entry in edge['wofam'].split(';'):
                    if entry:
                        parts = entry.split('/')
                        if len(parts) >= 4:
                            lang = parts[3].strip()
                            languages.add(lang)
                
                colexifications.append(LanguageColexification(
                    concept=neighbor_data['Gloss'],
                    present=any(code in languages for code in clics_codes)
                ))
        
        return colexifications
    
    def get_family_colexifications(
        self,
        concept1: str,
        concept2: str,
        families: Optional[List[str]] = None
    ) -> Dict[str, Dict]:
        """
        Get colexification patterns for two concepts across specified families.
        Will return data even if only one concept exists in CLICS.
        """
        node1 = self._get_node_by_gloss(concept1)
        node2 = self._get_node_by_gloss(concept2)
        
        if not node1 and not node2:
            return {}  # No data for either concept
            
        family_results = {}
        
        # Process requested families
        for family in (families or self.family_language_map.keys()):
            # Get all languages in this family from CLICS
            family_langs = self.family_language_map.get(family, set())
            if not family_langs:
                continue
                
            # Initialize family data
            family_results[family] = {
                'concept1_colexifications': {},  # concept -> {frequency, languages}
                'concept2_colexifications': {},
                'direct_colexification': {
                    'frequency': 0,
                    'languages': []
                },
                'total_languages': len(family_langs)
            }
            
            # Process colexifications for concept1 if it exists
            if node1:
                for neighbor in self.graph.neighbors(node1):
                    if node2 and neighbor == node2:
                        continue
                        
                    edge = self.graph.get_edge_data(node1, neighbor)
                    if not edge or 'wofam' not in edge:
                        continue
                        
                    neighbor_concept = self.graph.nodes[neighbor].get('Gloss')
                    if not neighbor_concept:
                        continue
                        
                    # Track languages in this family that show this colexification
                    family_langs_with_colex = set()
                    
                    for entry in edge['wofam'].split(';'):
                        if not entry:
                            continue
                        parts = entry.split('/')
                        if len(parts) >= 5:
                            lang_family = parts[4].strip()
                            language = parts[3].strip()
                            
                            if lang_family == family and language in family_langs:
                                family_langs_with_colex.add(language)
                    
                    if family_langs_with_colex:
                        family_results[family]['concept1_colexifications'][neighbor_concept] = {
                            'frequency': len(family_langs_with_colex),
                            'languages': list(family_langs_with_colex)
                        }

            # Process colexifications for concept2 if it exists
            if node2:
                for neighbor in self.graph.neighbors(node2):
                    if node1 and neighbor == node1:
                        continue
                        
                    edge = self.graph.get_edge_data(node2, neighbor)
                    if not edge or 'wofam' not in edge:
                        continue
                        
                    neighbor_concept = self.graph.nodes[neighbor].get('Gloss')
                    if not neighbor_concept:
                        continue
                        
                    family_langs_with_colex = set()
                    
                    for entry in edge['wofam'].split(';'):
                        if not entry:
                            continue
                        parts = entry.split('/')
                        if len(parts) >= 5:
                            lang_family = parts[4].strip()
                            language = parts[3].strip()
                            
                            if lang_family == family and language in family_langs:
                                family_langs_with_colex.add(language)
                    
                    if family_langs_with_colex:
                        family_results[family]['concept2_colexifications'][neighbor_concept] = {
                            'frequency': len(family_langs_with_colex),
                            'languages': list(family_langs_with_colex)
                        }

            # Check direct colexification only if both concepts exist
            if node1 and node2:
                edge_data = self.graph.get_edge_data(node1, node2)
                if edge_data and 'wofam' in edge_data:
                    direct_langs = set()
                    for entry in edge_data['wofam'].split(';'):
                        if not entry:
                            continue
                        parts = entry.split('/')
                        if len(parts) >= 5:
                            lang_family = parts[4].strip()
                            language = parts[3].strip()
                            
                            if lang_family == family and language in family_langs:
                                direct_langs.add(language)
                    
                    if direct_langs:
                        family_results[family]['direct_colexification'] = {
                            'frequency': len(direct_langs),
                            'languages': list(direct_langs)
                        }
        
        return family_results
    
    def find_chains(
        self,
        concept1: str,
        concept2: str,
        family: Optional[str] = None,
        max_depth: int = 4,
        limit: int = 12,
    ) -> List[Dict]:
        """
        Find indirect semantic chains between two concepts, e.g.
        WEATHER -> SKY -> GOD: every link is a colexification attested in
        the sample, but the end points need not be colexified directly.

        If ``family`` is given only links attested in that family count and
        link strength is the share of the family's languages attesting it;
        otherwise all CLICS languages are used.

        Chains are returned strongest first (highest geometric mean of link
        shares, which naturally favours shorter chains). The direct edge, if
        any, is excluded; direct colexification is reported elsewhere.
        """
        node1 = self._get_node_by_gloss(concept1)
        node2 = self._get_node_by_gloss(concept2)
        if not node1 or not node2 or node1 == node2:
            return []

        if family:
            denominator = len(self.family_language_map.get(family, set()))
        else:
            denominator = len(set().union(*self.family_language_map.values())) if self.family_language_map else 0
        if denominator == 0:
            return []

        link_cache: Dict[tuple, int] = {}

        def link_count(u: str, v: str) -> int:
            key = (u, v) if u <= v else (v, u)
            if key not in link_cache:
                data = self.graph.get_edge_data(u, v) or {}
                if family:
                    link_cache[key] = len(self._get_family_languages(data, family))
                else:
                    link_cache[key] = int(data.get("LanguageWeight", 0) or 0)
            return link_cache[key]

        # Neighbours reachable through links attested in the sample
        def neighbours(n: str) -> Set[str]:
            return {m for m in self.graph.neighbors(n) if link_count(n, m) > 0}

        n1, n2 = neighbours(node1), neighbours(node2)
        n1.discard(node2)
        n2.discard(node1)

        # Enumerate simple paths with 2..max_depth links (direct edge excluded).
        paths: List[List[str]] = [[node1, x, node2] for x in n1 & n2]
        if max_depth >= 3:
            for x in n1:
                for y in neighbours(x) & n2:
                    if y not in (node1, x):
                        paths.append([node1, x, y, node2])
        if max_depth >= 4:
            n2_neigh = {y: neighbours(y) for y in n2}
            for x in n1:
                nx_ = neighbours(x)
                for z in nx_:
                    if z in (node1, node2):
                        continue
                    nz = neighbours(z)
                    for y, ny in n2_neigh.items():
                        if y in (node1, x, z) or y not in nz:
                            continue
                        paths.append([node1, x, z, y, node2])

        chains: List[Dict] = []
        for path in paths:
            counts = [link_count(path[i], path[i + 1]) for i in range(len(path) - 1)]
            shares = [c / denominator for c in counts]
            chains.append({
                "path": [self.graph.nodes[n].get("Gloss", n) for n in path],
                "scores": shares,
                "counts": counts,
                "total_score": float(np.exp(np.mean(np.log(shares)))),
            })

        chains.sort(key=lambda c: (-c["total_score"], len(c["path"])))
        chains = chains[:limit]
        return chains

    def _get_family_languages(self, edge_data: Dict, family: str) -> Set[str]:
        """Extract languages from a specific family that show this connection."""
        languages = set()
        
        if 'wofam' not in edge_data:
            return languages
            
        for entry in edge_data['wofam'].split(';'):
            if not entry:
                continue
            parts = entry.split('/')
            if len(parts) >= 5:
                edge_family = parts[4].strip()
                language = parts[3].strip()
                
                if edge_family == family:
                    languages.add(language)
                    
        return languages
    
    def get_all_concepts(self) -> List[Dict[str, Any]]:
        """Get all concepts in CLICS with their metadata"""
        concepts = []
        for node, data in self.graph.nodes(data=True):
            gloss = data.get('Gloss')
            if gloss:
                # Extract all available metadata
                concept_data = {
                    'concept': gloss,
                    'semantic_field': data.get('Semanticfield', ''),
                    'category': data.get('Category', ''),
                    'family_frequency': data.get('FamilyFrequency', 0),
                    'language_frequency': data.get('LanguageFrequency', 0),
                    'word_frequency': data.get('WordFrequency', 0),
                    'frequency': sum(1 for edge in self.graph.edges(node, data=True)
                                  if edge[2].get('wofam'))
                }

                concepts.append(concept_data)
        
        # Sort by frequency descending
        concepts.sort(key=lambda x: x['frequency'], reverse=True)
        return concepts
    
    def search_concepts(self, query: str) -> List[Dict[str, str]]:
        """Search CLICS concepts matching a query string"""
        query = query.upper()  # CLICS uses uppercase
        matches = []
        
        for node, data in self.graph.nodes(data=True):
            gloss = data.get('Gloss', '')
            if not gloss:
                continue
                
            if query in gloss.upper():
                matches.append({
                    'concept': gloss,
                    'semantic_field': data.get('Semanticfield', ''),
                    'category': data.get('Category', ''),
                    'family_frequency': data.get('FamilyFrequency', 0),
                    'language_frequency': data.get('LanguageFrequency', 0),
                    'word_frequency': data.get('WordFrequency', 0),
                    'frequency': sum(1 for edge in self.graph.edges(node, data=True)
                                  if edge[2].get('wofam'))
                })
        
        # Sort by frequency descending
        matches.sort(key=lambda x: x['frequency'], reverse=True)
        return matches
