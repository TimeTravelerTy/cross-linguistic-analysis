import React, { useEffect, useRef} from 'react';
import { Network, Edge as VisEdge, Node as VisNode, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { FamilyPattern } from '../types';

interface FamilyGraphProps {
  concept1: string;
  concept2: string;
  familyPattern: FamilyPattern;
  familyName: string;
  className?: string;
}

interface GraphData {
  nodes: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    value: number;  // for edge weight
  }>;
}

interface Node extends VisNode {
  id: number;
  label: string;
  color: string;
}

interface Edge extends VisEdge{
  from: number;
  to: number;
  width: number;
  color: string;
}

export const FamilyGraph: React.FC<FamilyGraphProps> = ({
  concept1,
  concept2,
  familyPattern,
  familyName,
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !familyPattern) return;

    // Create nodes and edges with proper typing
    const nodes = new DataSet<Node>([
      { id: 1, label: concept1, color: '#93c5fd' },
      { id: 2, label: concept2, color: '#86efac' }
    ]);

    const edges = new DataSet<Edge>([
      { 
        id: '1-2',
        from: 1, 
        to: 2, 
        width: Math.max(2, familyPattern.proportion * 10),
        color: '#93c5fd'
      }
    ]);

    const options: Options = {
      nodes: {
        shape: 'box',
        borderWidth: 1,
        font: {
          size: 14
        },
      },
      edges: {
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.5
        }
      },
      physics: {
        stabilization: true,
        barnesHut: {
          springLength: 200
        }
      }
    };

    // Create network
    const network = new Network(
      containerRef.current,
      { nodes, edges },
      options
    );

    return () => {
      network.destroy();
    };
  }, [concept1, concept2, familyPattern]);

  if (!familyPattern) return null;

  // Prepare data for force graph
  const graphData: GraphData = {
    nodes: [
      { id: concept1, name: concept1, color: '#93c5fd' },  // blue-300
      { id: concept2, name: concept2, color: '#86efac' }   // green-300
    ],
    links: [
      {
        source: concept1,
        target: concept2,
        value: familyPattern.proportion
      }
    ]
  };

  return (
    <div className={`bg-white rounded-lg p-4 ${className}`}>
      {/* Header with family name */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900">
          {familyName}
        </h4>
        <div className="text-xs text-gray-500">
          {(familyPattern.proportion * 100).toFixed(1)}% colexification rate
        </div>
      </div>

      {/* Graph container */}
      <div 
        ref={containerRef} 
        className="border border-gray-100 rounded-lg"
        style={{ height: '256px' }}
      />

      {/* Statistics */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-500">Direct Connection</div>
          <div className="mt-1 text-lg font-semibold">
            {(familyPattern.proportion * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">
            {familyPattern.languages_with_colexification.length} of {familyPattern.total_languages_in_family} languages
          </div>
        </div>
        
        {(familyPattern.indirect_languages?.length ?? 0) > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Indirect Connections</div>
            <div className="mt-1">
              {familyPattern.intermediate_concepts?.map((inter, idx) => (
                <div key={idx} className="text-xs text-gray-600 mb-1">
                  via {inter.concept}: {((inter.frequency / familyPattern.total_languages_in_family) * 100).toFixed(1)}%
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};