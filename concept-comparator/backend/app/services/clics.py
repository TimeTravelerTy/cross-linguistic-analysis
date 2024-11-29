import networkx as nx
from pathlib import Path
from typing import Dict, List, Set, Optional
import os
from app.models.schemas import LanguageColexification
from app.constants.clics_mappings import get_clics_codes

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

    # def get_colexifications(
    #     self, 
    #     concept: str,
    #     target_languages: Optional[List[str]] = None
    # ) -> ColexificationData:
    #     """Get colexification patterns for a concept from the network with detailed data"""
    #     node_id = self._get_node_by_gloss(concept)
    #     print(f"Looking for node with gloss: {concept}, found: {node_id}") 
    #     if not node_id:
    #         return ColexificationData(
    #             concept=concept,
    #             colexified_concepts=[],
    #             family_frequencies={},
    #             languages=[],
    #             semantic_field=None,
    #             category=None,
    #             detailed_colexifications=[], 
    #             total_languages=0 
    #         )
            
    #     node_data = self.graph.nodes[node_id]
    #     print(f"Node data: {node_data}")
        
    #     colexified = []
    #     family_freqs = {}
    #     all_languages = set()
        
    #     # Enhanced data structures
    #     colexification_details = []
    #     total_languages = set()
        
    #     # Get all neighbors and their edge data
    #     for neighbor in self.graph.neighbors(node_id):
    #         neighbor_data = self.graph.nodes[neighbor]
    #         edge = self.graph.get_edge_data(node_id, neighbor)
    #         print(f"Processing neighbor: {neighbor_data.get('Gloss')}")  # Debug print
    #         print(f"Edge data: {edge}")  # Debug print
            
    #         if neighbor_data and edge:
    #             # Track basic colexification
    #             colexified.append(neighbor_data['Gloss'])
                
    #             # Get languages from edge data
    #             languages = set()
    #             if 'wofam' in edge:
    #                 for entry in edge['wofam'].split(';'):
    #                     if entry:
    #                         parts = entry.split('/')
    #                         if len(parts) >= 4:
    #                             lang = parts[3].strip()
    #                             print(f"Found language: {lang}")  # Debug print
    #                             family = parts[4].strip() if len(parts) >= 5 else None
                                
    #                             if target_languages is None or lang in target_languages:
    #                                 languages.add(lang)
    #                                 total_languages.add(lang)
    #                                 all_languages.add(lang)
                                    
    #                                 if family:
    #                                     family_freqs[family] = family_freqs.get(family, 0) + 1

    #             # Add detailed colexification data
    #             if languages:
    #                 colexification_details.append(ColexificationLink(
    #                     concept=neighbor_data['Gloss'],
    #                     frequency=len(languages),
    #                     languages=list(languages)
    #                 ))
        
    #     # Normalize family frequencies
    #     total = sum(family_freqs.values()) if family_freqs else 1
    #     family_freqs = {k: v/total for k, v in family_freqs.items()}
        
    #     return ColexificationData(
    #         concept=node_data.get('Gloss', concept),
    #         colexified_concepts=colexified,
    #         family_frequencies=family_freqs,
    #         languages=list(all_languages),
    #         semantic_field=node_data.get('Semanticfield'),
    #         category=node_data.get('Category'),
    #         detailed_colexifications=sorted(
    #             colexification_details,
    #             key=lambda x: x.frequency,
    #             reverse=True
    #         ),
    #         total_languages=len(total_languages)
    #     )
    
    def get_language_colexifications(
        self,
        concept: str,
        language_code: str,
        language_family: str
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
        Returns detailed data about what concepts colexify with either input concept
        within each language family.
        """
        node1 = self._get_node_by_gloss(concept1)
        node2 = self._get_node_by_gloss(concept2)
        
        if not node1 or not node2:
            return {}

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
                    'languages': set()
                },
                'total_languages': len(family_langs)
            }
            
            # Check direct colexification between concept1 and concept2
            edge_data = self.graph.get_edge_data(node1, node2)
            if edge_data and 'wofam' in edge_data:
                for entry in edge_data['wofam'].split(';'):
                    if not entry:
                        continue
                    parts = entry.split('/')
                    if len(parts) >= 5:
                        lang_family = parts[4].strip()
                        language = parts[3].strip()
                        
                        if lang_family == family and language in family_langs:
                            family_results[family]['direct_colexification']['languages'].add(language)

            # Process neighbors of concept1
            for neighbor in self.graph.neighbors(node1):
                if neighbor == node2:
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
                        'languages': family_langs_with_colex
                    }

            # Process neighbors of concept2
            for neighbor in self.graph.neighbors(node2):
                if neighbor == node1:
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
                        'languages': family_langs_with_colex
                    }
            
            # Calculate direct colexification frequency
            direct_langs = family_results[family]['direct_colexification']['languages']
            family_results[family]['direct_colexification']['frequency'] = len(direct_langs)
            family_results[family]['direct_colexification']['languages'] = list(direct_langs)
            
            # Convert language sets to lists for JSON serialization
            for colexs in [family_results[family]['concept1_colexifications'], 
                        family_results[family]['concept2_colexifications']]:
                for data in colexs.values():
                    data['languages'] = list(data['languages'])
        
        return family_results