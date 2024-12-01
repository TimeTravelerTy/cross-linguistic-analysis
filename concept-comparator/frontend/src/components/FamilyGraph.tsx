import React, { useEffect, useRef } from 'react';
import { Network, Edge as VisEdge, Node as VisNode, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { FamilyColexifications } from '../types';
import 'vis-network/dist/dist/vis-network.css';

interface FamilyGraphProps {
  concept1: string;
  concept2: string;
  familyName: string;
  familyData: FamilyColexifications;
  className?: string;
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
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

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
        keyboard: false,  // Disable keyboard controls
        navigationButtons: false,  // Remove navigation buttons
        zoomView: true,  // Keep zoom functionality
        dragView: true   // Keep drag functionality
      }
    };

    const network = new Network(containerRef.current, { nodes, edges }, options);

    // Center graph with zoom limits
    network.once('stabilizationIterationsDone', () => {
      network.fit({
        nodes: nodes.getIds(),
        animation: {
          duration: 1000,
          easingFunction: "easeInOutQuad"
        }
      });
    });

    networkRef.current = network;

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