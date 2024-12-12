import React, { useEffect, useRef } from 'react';
import { Network, Edge as VisEdge, Node as VisNode, Options } from 'vis-network';
import { DataSet } from 'vis-data';

interface Chain {
  path: string[];
  scores: number[];
  total_score: number;
}

interface Props {
  chains: Chain[];
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
  color: string | { color: string; opacity: number };
  title?: string;
}

export const SemanticChainGraph: React.FC<Props> = ({ chains, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current || !chains.length) return;
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    const nodes = new DataSet<Node>();
    const edges = new DataSet<Edge>();
    const nodeMap = new Map<string, number>();
    let nodeId = 1;

    const pathColors = [
      '#3b82f6', // blue
      '#10b981', // emerald
      '#8b5cf6', // violet
      '#f59e0b', // amber
      '#ec4899'  // pink
    ];

    // First pass: create unique nodes
    chains.forEach(chain => {
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
    chains.forEach((chain, chainIndex) => {
      const pathColor = pathColors[chainIndex % pathColors.length];
      const opacity = Math.max(0.6, chain.total_score*2);
      
      for (let i = 0; i < chain.path.length - 1; i++) {
        const fromId = nodeMap.get(chain.path[i])!;
        const toId = nodeMap.get(chain.path[i + 1])!;
        const frequency = chain.scores[i];
        
        edges.add({
          id: `${chainIndex}-${fromId}-${toId}`,
          from: fromId,
          to: toId,
          width: Math.max(2, frequency * 5),
          color: { color: pathColor, opacity },
          title: `Chain ${chainIndex + 1}\nStrength: ${(chain.total_score * 100).toFixed(1)}%\nStep: ${(frequency * 100).toFixed(1)}%`,
          smooth: {
            enabled: true,
            type: 'curvedCW',
            roundness: 0.15 + (chainIndex * 0.08),
            forceDirection: 'horizontal'
          }
        });
      }
    });

    chains.sort((a, b) => b.total_score - a.total_score);

    const options: Options = {
      nodes: {
        shape: 'box',
        margin: { top: 10 },
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
          nodeSpacing: chains.length > 3 ? 130 : 100,
          treeSpacing: chains.length > 3 ? 60 : 100,
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

    const network = new Network(containerRef.current, { nodes, edges }, options);
    networkRef.current = network;

    network.once('afterDrawing', () => {
      network.fit({
        nodes: nodes.getIds(),
        animation: {
          duration: 1000,
          easingFunction: "easeInOutQuad"
        }
      });

      // Add legend
      const legend = document.createElement('div');
      legend.className = 'absolute top-2 right-2 bg-white p-2 rounded-lg shadow-sm text-sm';
      legend.innerHTML = chains.map((chain, i) => `
        <div class="flex items-center gap-2 mb-1">
          <div class="w-3 h-3 rounded-full" style="background-color: ${pathColors[i % pathColors.length]}; opacity: ${Math.max(0.6, chain.total_score*2)}"></div>
          <span>Chain ${i + 1}: ${(chain.total_score * 100).toFixed(1)}%</span>
        </div>
      `).join('');
      containerRef.current?.appendChild(legend);
    });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
      const legend = containerRef.current?.querySelector('div[style*="position: absolute"]');
      if (legend) {
        legend.remove();
      }
    };
  }, [chains]);

  return (
    <div 
      ref={containerRef}
      className={`border border-gray-100 rounded-lg relative ${className}`}
      style={{ height: '300px' }}
    />
  );
};