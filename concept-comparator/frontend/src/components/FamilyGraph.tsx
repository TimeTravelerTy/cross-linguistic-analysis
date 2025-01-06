import React, { useEffect, useRef, useState } from 'react';
import { Network, Edge as VisEdge, Node as VisNode, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { FamilyColexifications } from '../types';
import { useSemanticChains } from '../hooks/useSemanticChains';
import SemanticChainList from './SemanticChainList'
import InfoTooltip from './InfoTooltip';
import 'vis-network/dist/dist/vis-network.css';

interface FamilyGraphProps {
  concept1: string;
  concept2: string;
  familyName: string;
  familyData: FamilyColexifications;
  className?: string;
  enableChains?: boolean;
}

interface Node extends VisNode {
  id: number;
  label: string;
  color: string;
  level?: number;
}

interface Edge extends VisEdge {
  from: number;
  to: number;
  width: number;
  color: string;
  title?: string;
  frequency?: number;
}

export const FamilyGraph: React.FC<FamilyGraphProps> = ({
  concept1,
  concept2,
  familyName,
  familyData,
  className = "",
  enableChains = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [showChains, setShowChains] = useState(false);

  // Fetch chain data
  const { data: chainData, isLoading: chainsLoading, refetch } = useSemanticChains(
    enableChains && showChains ? concept1 : null,
    enableChains && showChains ? concept2 : null,
    enableChains && showChains ? familyName : null
  );

  const handleShowChains = async () => {
    setShowChains(!showChains);
    if (!showChains) {  // Only refetch when showing chains
      await refetch();
    }
  };

  // Setup main visualization network
  useEffect(() => {
    if (!containerRef.current) return;

    const nodesArray: Node[] = [
      { id: 1, label: concept1, color: '#93c5fd', level: 1 },
      { id: 2, label: concept2, color: '#86efac', level: 1 }
    ];

    let nodeId = 3;
    const edgesArray: Edge[] = [];
    const addedNodes = new Set([concept1.toLowerCase(), concept2.toLowerCase()]);

    // First, collect all unique colexifications and their connections
    const colexMap: Record<string, {
      nodeId?: number;
      concept1Data?: { frequency: number; languages: string[] };
      concept2Data?: { frequency: number; languages: string[] };
    }> = {};

    // Map concept1 colexifications
    Object.entries(familyData.concept1_colexifications).forEach(([concept, data]) => {
      const lowerConcept = concept.toLowerCase();
      if (!colexMap[lowerConcept]) {
        colexMap[lowerConcept] = {};
      }
      colexMap[lowerConcept].concept1Data = data;
    });

    // Map concept2 colexifications
    Object.entries(familyData.concept2_colexifications).forEach(([concept, data]) => {
      const lowerConcept = concept.toLowerCase();
      if (!colexMap[lowerConcept]) {
        colexMap[lowerConcept] = {};
      }
      colexMap[lowerConcept].concept2Data = data;
    });

    // Create nodes and edges for all colexifications
    Object.entries(colexMap).forEach(([conceptLower, data]) => {
      if (!addedNodes.has(conceptLower)) {
        // Add node
        const currentNodeId = nodeId++;
        nodesArray.push({
          id: currentNodeId,
          label: Object.keys(familyData.concept1_colexifications)
            .find(c => c.toLowerCase() === conceptLower) ||
            Object.keys(familyData.concept2_colexifications)
            .find(c => c.toLowerCase() === conceptLower) ||
            conceptLower,
          // Use a different color if it's connected to both concepts
          color: data.concept1Data && data.concept2Data ? '#fde68a' : '#e5e7eb',
          level: 2
        });
        
        // Store nodeId for edge creation
        colexMap[conceptLower].nodeId = currentNodeId;
        addedNodes.add(conceptLower);

        // Add edges if they exist
        if (data.concept1Data) {
          const frequency1 = data.concept1Data.frequency / familyData.total_languages;
          const frequencyPercent1 = (frequency1 * 100).toFixed(1);
          edgesArray.push({
            from: 1,
            to: currentNodeId,
            width: Math.max(1, frequency1 * 5),
            color: '#cbd5e1',
            title: `${frequencyPercent1}% (${data.concept1Data.frequency}/${familyData.total_languages} languages)`,
            frequency: frequency1
          });
        }

        if (data.concept2Data) {
          const frequency2 = data.concept2Data.frequency / familyData.total_languages;
          const frequencyPercent2 = (frequency2 * 100).toFixed(1);
          edgesArray.push({
            from: 2,
            to: currentNodeId,
            width: Math.max(1, frequency2 * 5),
            color: '#cbd5e1',
            title: `${frequencyPercent2}% (${data.concept2Data.frequency}/${familyData.total_languages} languages)`,
            frequency: frequency2
          });
        }
      }
    });

    const nodes = new DataSet<Node>(nodesArray);
    const edges = new DataSet<Edge>(edgesArray);

    const options: Options = {
      nodes: {
        shape: 'box',
        borderWidth: 1,
        font: { size: 14 },
        fixed: { x: false, y: false }
      },
      edges: {
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.5
        },
        hoverWidth: 2
      },
      physics: {
        enabled: true,
        stabilization: true,
        barnesHut: {
          gravitationalConstant: -1500,
          centralGravity: 0.5,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.2
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 40,
        hideEdgesOnDrag: false,
        keyboard: false,
        navigationButtons: false,
        zoomView: true,
        zoomSpeed: 0.3,
        dragView: true
      }
    };

    const network = new Network(containerRef.current, { nodes, edges }, options);
    networkRef.current = network;

    // Initial positioning
    network.once('stabilizationIterationsDone', () => {
      network.fit({
        nodes: nodes.getIds(),
        animation: {
          duration: 1000,
          easingFunction: "easeInOutQuad"
        }
      });
    });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [concept1, concept2, familyData]);


  return (
    <div className={`bg-white rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900">
          {familyName}
        </h4>
        <div className="text-xs text-gray-500">
          {((familyData.direct_colexification.frequency / familyData.total_languages) * 100).toFixed(1)}% colexification rate
        </div>
      </div>

      <div 
        ref={containerRef} 
        className="border border-gray-100 rounded-lg relative"
        style={{ height: '256px' }}
      />

      {/* Semantic Chains Section */}
      {enableChains && (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-medium text-gray-900">Semantic Chains</h4>
          <InfoTooltip 
            content={
              <div className="space-y-2">
                <p>Semantic chains show indirect connections between concepts through shared meanings, limited to 4 steps.</p>
                <p>Example: WEATHER→SKY→GOD shows how concepts link through intermediate meanings.</p>
                <div className="mt-3">
                  <p className="font-medium">Chain Strength</p>
                  <p>Each link's strength is the % of languages in the family showing that connection.</p>
                  <p className="text-xs mt-1">Example: If 8/10 languages connect WEATHER→SKY and 6/10 connect SKY→GOD, 
                    chain strength would be the geometric mean: √(0.8 × 0.6) = 69%</p>
                </div>
              </div>
            }
          />
        </div>

        <button
          onClick={handleShowChains}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors
            ${chainsLoading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          disabled={chainsLoading}
        >
          {chainsLoading 
            ? 'Loading chains...' 
            : showChains 
              ? 'Hide Semantic Chains' 
              : 'Show Semantic Chains'
          }
        </button>

          {showChains && chainData?.chains && (
            <div className="mt-4">
              {chainData.chains.length > 0 ? (
                <>
                  <div className="mb-2 text-sm text-gray-600">
                    Found {chainData.chains.length} semantic chain{chainData.chains.length > 1 ? 's' : ''}
                  </div>
                  <SemanticChainList chains={chainData.chains} />
                </>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No semantic chains found between these concepts in {familyName}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-500">Direct Connection</div>
          <div className="mt-1 text-lg font-semibold">
            {((familyData.direct_colexification.frequency / familyData.total_languages) * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">
            {familyData.direct_colexification.languages.length} of {familyData.total_languages} languages
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default FamilyGraph;