import networkx as nx
from pathlib import Path
from typing import Dict, List, Set, Optional
import os
from app.models.schemas import ColexificationData, FamilyPattern, ColexificationLink

class ClicsService:
    def __init__(self):
        """Initialize by loading the pre-computed network and building family-language mappings."""
        print("Starting CLICS service initialization...")
        network_path = os.getenv("CLICS_NETWORK_PATH")
        if not network_path or not Path(network_path).exists():
            raise ValueError(f"CLICS network file not found at {network_path}")
            
        print(f"Loading network from {network_path}...")
        
        try:
            with open(network_path, 'r', encoding='utf-8') as f:
                gml_data = f.read()
                
            # Clean the data to ensure ASCII compatibility
            gml_data = gml_data.encode('ascii', 'ignore').decode('ascii')
            
            # Create temporary file with cleaned data
            temp_path = network_path + '.temp'
            with open(temp_path, 'w') as f:
                f.write(gml_data)
                
            # Load the network from cleaned file
            self.graph = nx.read_gml(temp_path)
            
            # Clean up temp file
            os.remove(temp_path)
            
            node_count = len(self.graph.nodes)
            edge_count = len(self.graph.edges)
            print(f"Loaded CLICS network with {node_count} nodes and {edge_count} edges")
            
            # Build family-language mapping
            print("Building family-language mapping...")
            self.family_language_map = self._build_family_language_map()
            print(f"Found {len(self.family_language_map)} language families")
            for family, langs in self.family_language_map.items():
                print(f"{family}: {len(langs)} languages")
            print("CLICS service initialization complete")
            
        except Exception as e:
            print(f"Error loading CLICS network: {str(e)}")
            raise

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
        """Find node ID for a concept by its Gloss"""
        # Try both original case and uppercase
        for node, data in self.graph.nodes(data=True):
            if (data.get('Gloss') == concept or 
                data.get('Gloss') == concept.upper()):
                return node
        return None

    def get_colexifications(
        self, 
        concept: str,
        target_languages: Optional[List[str]] = None
    ) -> ColexificationData:
        """Get colexification patterns for a concept from the network with detailed data"""
        node_id = self._get_node_by_gloss(concept)
        print(f"Looking for node with gloss: {concept}, found: {node_id}") 
        if not node_id:
            return ColexificationData(
                concept=concept,
                colexified_concepts=[],
                family_frequencies={},
                languages=[],
                semantic_field=None,
                category=None,
                detailed_colexifications=[], 
                total_languages=0 
            )
            
        node_data = self.graph.nodes[node_id]
        print(f"Node data: {node_data}")
        
        colexified = []
        family_freqs = {}
        all_languages = set()
        
        # Enhanced data structures
        colexification_details = []
        total_languages = set()
        
        # Get all neighbors and their edge data
        for neighbor in self.graph.neighbors(node_id):
            neighbor_data = self.graph.nodes[neighbor]
            edge = self.graph.get_edge_data(node_id, neighbor)
            print(f"Processing neighbor: {neighbor_data.get('Gloss')}")  # Debug print
            print(f"Edge data: {edge}")  # Debug print
            
            if neighbor_data and edge:
                # Track basic colexification
                colexified.append(neighbor_data['Gloss'])
                
                # Get languages from edge data
                languages = set()
                if 'wofam' in edge:
                    for entry in edge['wofam'].split(';'):
                        if entry:
                            parts = entry.split('/')
                            if len(parts) >= 4:
                                lang = parts[3].strip()
                                print(f"Found language: {lang}")  # Debug print
                                family = parts[4].strip() if len(parts) >= 5 else None
                                
                                if target_languages is None or lang in target_languages:
                                    languages.add(lang)
                                    total_languages.add(lang)
                                    all_languages.add(lang)
                                    
                                    if family:
                                        family_freqs[family] = family_freqs.get(family, 0) + 1

                # Add detailed colexification data
                if languages:
                    colexification_details.append(ColexificationLink(
                        concept=neighbor_data['Gloss'],
                        frequency=len(languages),
                        languages=list(languages)
                    ))
        
        # Normalize family frequencies
        total = sum(family_freqs.values()) if family_freqs else 1
        family_freqs = {k: v/total for k, v in family_freqs.items()}
        
        return ColexificationData(
            concept=node_data.get('Gloss', concept),
            colexified_concepts=colexified,
            family_frequencies=family_freqs,
            languages=list(all_languages),
            semantic_field=node_data.get('Semanticfield'),
            category=node_data.get('Category'),
            detailed_colexifications=sorted(
                colexification_details,
                key=lambda x: x.frequency,
                reverse=True
            ),
            total_languages=len(total_languages)
        )
        
    def get_family_patterns(
    self, 
    concept1: str, 
    concept2: str, 
    families: Optional[List[str]] = None
) -> Dict[str, FamilyPattern]:
        """Get colexification patterns by language family for a pair of concepts."""
        node1 = self._get_node_by_gloss(concept1)
        node2 = self._get_node_by_gloss(concept2)
        
        if not node1 or not node2:
            return {}

        # Get direct patterns first (keep original functionality)
        edge_data = self.graph.get_edge_data(node1, node2)
        family_colex_langs = {}
        
        if edge_data and 'wofam' in edge_data:
            entries = edge_data['wofam'].split(';')
            for entry in entries:
                if not entry:
                    continue
                parts = entry.split('/')
                if len(parts) >= 5:
                    family = parts[4].strip()
                    language = parts[3].strip()
                    
                    if families and family not in families:
                        continue
                        
                    if family not in family_colex_langs:
                        family_colex_langs[family] = set()
                    family_colex_langs[family].add(language)

        # Also check for indirect connections through one intermediate node
        for neighbor in self.graph.neighbors(node1):
            if neighbor == node2:
                continue  # Skip direct connection
            
            # Check if this neighbor connects to concept2
            indirect_edge = self.graph.get_edge_data(neighbor, node2)
            if indirect_edge and 'wofam' in indirect_edge:
                # Process indirect connections same way as direct ones
                for entry in indirect_edge['wofam'].split(';'):
                    if not entry:
                        continue
                    parts = entry.split('/')
                    if len(parts) >= 5:
                        family = parts[4].strip()
                        language = parts[3].strip()
                        
                        if families and family not in families:
                            continue
                        
                        # Add to same structure but mark as indirect
                        if family not in family_colex_langs:
                            family_colex_langs[family] = set()
                        family_colex_langs[family].add(f"indirect:{language}")

        # Calculate patterns using the total language counts
        patterns = {}
        for family, colex_langs in family_colex_langs.items():
            total_langs = len(self.family_language_map.get(family, set()))
            if total_langs > 0:
                # Separate direct and indirect connections
                direct_langs = {l for l in colex_langs if not l.startswith('indirect:')}
                indirect_langs = {l.split(':', 1)[1] for l in colex_langs if l.startswith('indirect:')}
                
                proportion = len(direct_langs) / total_langs
                patterns[family] = FamilyPattern(
                    proportion=proportion,
                    languages_with_colexification=list(direct_langs),
                    total_languages_in_family=total_langs,
                    # Add indirect connections if found
                    indirect_languages=list(indirect_langs) if indirect_langs else None
                )

        return patterns