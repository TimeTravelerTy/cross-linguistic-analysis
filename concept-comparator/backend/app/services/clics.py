import networkx as nx
from pathlib import Path
from typing import Dict, List, Set, Optional, Any
import os
import numpy as np
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
            print("Cleaning data...")    
            # Clean the data to ensure ASCII compatibility
            gml_data = gml_data.encode('ascii', 'ignore').decode('ascii')
            print("Data cleaned")

            print("Creating temporary file...")
            # Create temporary file with cleaned data
            temp_path = network_path + '.temp'
            with open(temp_path, 'w') as f:
                f.write(gml_data)
                
            # Load only a portion of the network by using a generator to read lines
            self.graph = nx.Graph()
            nodes_added = 0
            max_nodes = 100
            print(f"Loading up to {max_nodes} nodes...")
            with open(temp_path, 'r') as f:
                # Skip header until node section
                for line in f:
                    if line.strip() == "graph [":
                        break
                
                # Read nodes until we hit max
                in_node = False
                current_node = {}
                
                for line in f:
                    line = line.strip()
                    if line == "node [":
                        in_node = True
                        current_node = {}
                    elif line == "]":
                        if in_node:
                            self.graph.add_node(current_node.get('id', nodes_added), **current_node)
                            nodes_added += 1
                            if nodes_added >= max_nodes:
                                break
                        in_node = False
                    elif in_node and "=" in line:
                        key, value = line.split('[', 1)[0].strip(), line.split('[', 1)[1].strip('][')
                        current_node[key] = value
           
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
    
    def find_chains(self, concept1: str, concept2: str, family: str, max_depth: int = 4) -> List[Dict]:
        """Find semantic chains between two concepts within a language family."""
        print("\n=== Starting Chain Search ===")
        print(f"Looking for chains between '{concept1}' and '{concept2}' in {family} family")
        print(f"Graph is directed: {self.graph.is_directed()}")
        node1 = self._get_node_by_gloss(concept1)
        node2 = self._get_node_by_gloss(concept2)
        
        if not node1 or not node2:
            print(f"Could not find nodes for {concept1} and/or {concept2}")
            return []
            
        print(f"Finding paths between {concept1} ({node1}) and {concept2} ({node2})")
        
        try:
            print("\nSearching for paths...")
            # Find all simple paths up to max_depth
            paths = list(nx.all_simple_paths(
                self.graph, 
                node1, 
                node2, 
                cutoff=max_depth
            ))
            print(f"Found {len(paths)} directed paths")
            
            chains = []
            for path in paths:
                scores = []
                valid_chain = True
                
                for i in range(len(path)-1):
                    edge_data = self.graph.get_edge_data(path[i], path[i+1])
                    if not edge_data or 'wofam' not in edge_data:
                        # No data or missing family info means we can’t validate
                        valid_chain = False
                        break
                    
                    edge_languages = self._get_family_languages(edge_data, family)
                    
                    if not edge_languages:
                        # If this edge isn't attested in any language of the family, this chain fails
                        valid_chain = False
                        break
                    
                    # Calculate frequency score 
                    family_langs = self.family_language_map.get(family, set())
                    freq = len(edge_languages) / len(family_langs) if family_langs else 0
                    scores.append(freq)
                
                if valid_chain and scores:
                    # Construct the chain data 
                    chain_glosses = [self.graph.nodes[n]["Gloss"] for n in path]
                    print(f"\nValid chain found: {' -> '.join(chain_glosses)}")
                    print(f"Scores: {[f'{s:.2f}' for s in scores]}")

                    chains.append({
                        "path": chain_glosses,
                        "scores": scores,
                        "total_score": np.exp(np.mean(np.log(scores))) if all(s > 0 for s in scores) else 0,
                    })

                else:
                    print("Chain invalid or no scores")

            return chains
            
        except Exception as e:
            print(f"Error finding chains: {str(e)}")
            return []

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