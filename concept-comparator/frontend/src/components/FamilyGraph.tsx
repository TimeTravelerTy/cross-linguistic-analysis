import React, { useEffect, useRef, useState } from 'react';
import { Network, Edge as VisEdge, Node as VisNode, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { FamilyColexifications } from '../types';
import { useSemanticChains } from '../hooks/useSemanticChains';
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
  const chainContainerRef = useRef<HTMLDivElement>(null);
  const chainNetworkRef = useRef<Network | null>(null);
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

    // Process colexifications for concept1
    Object.entries(familyData.concept1_colexifications).forEach(([concept, data]) => {
      if (addedNodes.has(concept.toLowerCase())) return;

      nodesArray.push({
        id: nodeId,
        label: concept,
        color: '#e5e7eb',
        level: 2
      });

      const frequency = data.frequency / familyData.total_languages;
      const frequencyPercent = (frequency * 100).toFixed(1);

      edgesArray.push({
        from: 1,
        to: nodeId,
        width: Math.max(1, frequency * 5),
        color: '#cbd5e1',
        title: `${frequencyPercent}% (${data.frequency}/${familyData.total_languages} languages)`,
        frequency
      });

      addedNodes.add(concept.toLowerCase());
      nodeId++;
    });

    // Process colexifications for concept2
    Object.entries(familyData.concept2_colexifications).forEach(([concept, data]) => {
      if (addedNodes.has(concept.toLowerCase())) return;

      nodesArray.push({
        id: nodeId,
        label: concept,
        color: '#e5e7eb',
        level: 2
      });

      const frequency = data.frequency / familyData.total_languages;
      const frequencyPercent = (frequency * 100).toFixed(1);

      edgesArray.push({
        from: 2,
        to: nodeId,
        width: Math.max(1, frequency * 5),
        color: '#cbd5e1',
        title: `${frequencyPercent}% (${data.frequency}/${familyData.total_languages} languages)`,
        frequency
      });

      addedNodes.add(concept.toLowerCase());
      nodeId++;
    });

    // Add direct colexification edge
    if (familyData.direct_colexification.frequency > 0) {
      const frequency = familyData.direct_colexification.frequency / familyData.total_languages;
      const frequencyPercent = (frequency * 100).toFixed(1);
      
      edgesArray.push({
        id: '1-2',
        from: 1,
        to: 2,
        width: Math.max(2, frequency * 5),
        color: '#93c5fd',
        title: `Direct colexification: ${frequencyPercent}% (${familyData.direct_colexification.frequency}/${familyData.total_languages} languages)`,
        frequency
      });
    }

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
          gravitationalConstant: -2000,
          centralGravity: 0.5,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.1
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

  // Setup chain visualization network
  useEffect(() => {
    if (!chainContainerRef.current || !chainData?.chains.length) return;
    if (chainNetworkRef.current) {
      chainNetworkRef.current.destroy();
      chainNetworkRef.current = null;
    }
  
    const nodes = new DataSet<Node>();
    const edges = new DataSet<Edge>();
    const nodeMap = new Map<string, number>();
    let nodeId = 1;
  
    // Color palette for different paths
    const pathColors = [
      '#3b82f6', // blue
      '#10b981', // emerald
      '#8b5cf6', // violet
      '#f59e0b', // amber
      '#ec4899'  // pink
    ];
  
    // First pass: create unique nodes
    chainData.chains.forEach(chain => {
      chain.path.forEach(concept => {
        if (!nodeMap.has(concept)) {
          const isEndpoint = concept === chain.path[0] || concept === chain.path[chain.path.length - 1];
          nodeMap.set(concept, nodeId);
          nodes.add({
            id: nodeId,
            label: concept,
            color: isEndpoint ? '#93c5fd' : '#e5e7eb',
            level: isEndpoint ? (concept === chain.path[0] ? 0 : 2) : 1,
            font: { 
              size: 14,
              face: 'Inter'
            }
          });
          nodeId++;
        }
      });
    });
  
    // Second pass: create edges with different colors per path
    chainData.chains.forEach((chain, chainIndex) => {
      const pathColor = pathColors[chainIndex % pathColors.length];
      
      for (let i = 0; i < chain.path.length - 1; i++) {
        const fromId = nodeMap.get(chain.path[i])!;
        const toId = nodeMap.get(chain.path[i + 1])!;
        const frequency = chain.scores[i];
        
        
        edges.add({
          id: `${chainIndex}-${fromId}-${toId}`,
          from: fromId,
          to: toId,
          width: Math.max(2, frequency * 5),
          color: pathColor,
          title: `Path ${chainIndex + 1}\nFrequency: ${(frequency * 100).toFixed(1)}%`,
          smooth: {
            enabled: true,
            type: 'curvedCW',
            roundness: 0.15 + (chainIndex * 0.08),
            forceDirection: 'horizontal'
          },
  
        });
      }
    });
  
    const options: Options = {
      nodes: {
        shape: 'box',
        margin: {top : 10},
        borderWidth: 1,
        shadow: {
          enabled: true,
          size: 3,
          x: 1,
          y: 1
        }
      },
      edges: {
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.5
          }
        },
        hoverWidth: 2,
        selectionWidth: 2
      },
      layout: {
        improvedLayout: true,
        hierarchical: {
          enabled: true,
          direction: 'LR',
          sortMethod: 'directed',
          levelSeparation: 150,
          nodeSpacing: chainData.chains.length > 3 ? 130 : 100,
          treeSpacing: chainData.chains.length > 3 ? 60 : 100,
          edgeMinimization: false,
          parentCentralization: true
        }
      },
      physics: {
        enabled: false
      },
      interaction: {
        hover: true,
        tooltipDelay: 100
      }
    };
  
    const network = new Network(chainContainerRef.current, { nodes, edges }, options);
    chainNetworkRef.current = network;
  
  
    network.once('afterDrawing', () => {
      network.fit({
        nodes: nodes.getIds(),
        animation: {
          duration: 1000,
          easingFunction: "easeInOutQuad"
        }
      });
    });
  
    return () => {
      if (chainNetworkRef.current) {
        chainNetworkRef.current.destroy();
        chainNetworkRef.current = null;
      }
      // Clean up legend
      if (chainContainerRef.current) {
        const legend = chainContainerRef.current.querySelector('div[style*="position: absolute"]');
        if (legend) {
          legend.remove();
        }
      }
    };
  }, [chainData]);

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
                  <div 
                    ref={chainContainerRef}
                    className="border border-gray-100 rounded-lg"
                    style={{ height: '300px' }}
                  />
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

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-500">Direct Connection</div>
          <div className="mt-1 text-lg font-semibold">
            {((familyData.direct_colexification.frequency / familyData.total_languages) * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">
            {familyData.direct_colexification.languages.length} of {familyData.total_languages} languages
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyGraph;