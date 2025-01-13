import React, { useEffect, useRef } from 'react';
import { Network, Edge as VisEdge, Node as VisNode, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { LanguageColexification } from '../types';

interface ColexificationGraphProps {
  concept1: string;
  concept2: string;
  colexifications: Record<string, LanguageColexification[]>;
  className?: string;
  title?: string;
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
}

export const ColexificationGraph: React.FC<ColexificationGraphProps> = ({ 
  concept1, 
  concept2, 
  colexifications,
  className = "",
  title
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  // Get colexifications for each concept
  const concept1Colexs = colexifications[concept1]?.filter(colex => colex.present) || [];
  const concept2Colexs = colexifications[concept2]?.filter(colex => colex.present) || [];

  
  if (concept1Colexs.length === 0 && concept2Colexs.length === 0) {
    return null;  // Don't render if no colexifications
  }

  useEffect(() => {
    if (!containerRef.current) return;

    // Create base nodes for the two concepts
    const nodesArray: Node[] = [
      { id: 1, label: concept1, color: '#93c5fd', level: 1 },
      { id: 2, label: concept2, color: '#86efac', level: 1 }
    ];

    let nodeId = 3;
    const edgesArray: Edge[] = [];
    const addedNodes = new Set([concept1.toLowerCase(), concept2.toLowerCase()]);

    // Process colexifications for concept1
    concept1Colexs.forEach(colex => {
      const conceptLower = colex.concept.toLowerCase();
      if (!addedNodes.has(conceptLower)) {
        nodesArray.push({
          id: nodeId,
          label: colex.concept,
          color: '#e5e7eb',
          level: 2
        });

        edgesArray.push({
          from: 1,
          to: nodeId,
          width: 2,
          color: '#cbd5e1',
          title: `Colexified with "${concept1}"`
        });

        addedNodes.add(conceptLower);
        nodeId++;
      }
    });

    // Process colexifications for concept2
    concept2Colexs.forEach(colex => {
      const conceptLower = colex.concept.toLowerCase();
      if (!addedNodes.has(conceptLower)) {
        nodesArray.push({
          id: nodeId,
          label: colex.concept,
          color: '#e5e7eb',
          level: 2
        });

        edgesArray.push({
          from: 2,
          to: nodeId,
          width: 2,
          color: '#cbd5e1',
          title: `Colexified with "${concept2}"`
        });

        addedNodes.add(conceptLower);
        nodeId++;
      }
    });

    // Check if concepts are directly colexified
    const directColex = concept1Colexs.some(colex => 
      colex.concept.toLowerCase() === concept2.toLowerCase()
    );

    if (directColex) {
      edgesArray.push({
        id: '1-2',
        from: 1,
        to: 2,
        width: 3,
        color: '#93c5fd',
        title: 'Direct colexification'
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
        dragNodes: true,
        dragView: true,
        zoomView: true,
        hover: true,
        tooltipDelay: 100,
        zoomSpeed: 0.2,
        keyboard: {
          enabled: true,
          bindToWindow: false
        },
        navigationButtons: false
      }
    };

    const network = new Network(
      containerRef.current,
      { nodes, edges },
      options
    );

    // Center initially with zoom limits
    network.once('stabilizationIterationsDone', () => {
      network.fit({
        nodes: nodes.getIds(),
        animation: {
          duration: 1000,
          easingFunction: "easeInOutQuad"
        },
        minZoomLevel: 0.7,
        maxZoomLevel: 1.5
      });
    });

    // Boundary control
    network.on("dragEnd", () => {
      const viewPosition = network.getViewPosition();
      const scale = network.getScale();
      
      if (!containerRef.current) return;
      
      const container = containerRef.current.getBoundingClientRect();
      const centerX = container.width / 2;
      const centerY = container.height / 2;
      
      const maxDistance = Math.min(centerX, centerY) / (scale * 2);
      const distanceFromCenter = Math.sqrt(
        Math.pow(viewPosition.x, 2) + Math.pow(viewPosition.y, 2)
      );

      if (distanceFromCenter > maxDistance) {
        network.moveTo({
          position: {
            x: viewPosition.x * 0.3,
            y: viewPosition.y * 0.3
          },
          animation: {
            duration: 500,
            easingFunction: "easeInOutQuad"
          }
        });
      }
    });

    networkRef.current = network;

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [concept1, concept2, concept1Colexs, concept2Colexs]);

  return (
    <div className={`bg-white rounded-lg p-4 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div 
        ref={containerRef} 
        className="border border-gray-100 rounded-lg"
        style={{ height: '256px' }}
      />
    </div>
  );
};