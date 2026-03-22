import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { StudyResult } from '../types';

interface Props {
  studyResult: StudyResult;
}

interface SimNode {
  concept: string;
  concepticon_id: string | null;
  semantic_field: string | null;
  is_selected: boolean;
  language_frequency: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SimEdge {
  source: string;
  target: string;
  direct_count: number;
  weight: number;
}

const W = 720;
const H = 500;
const CX = W / 2;
const CY = H / 2;

function runForce(nodes: SimNode[], edges: SimEdge[], iterations = 150) {
  const nodeMap = new Map(nodes.map(n => [n.concept, n]));
  const repulsion = 6000;
  const attraction = 0.13;
  const centering = 0.01;
  const damping = 0.75;

  for (let iter = 0; iter < iterations; iter++) {
    for (const n of nodes) {
      if (n.is_selected) continue;
      n.vx += (CX - n.x) * centering;
      n.vy += (CY - n.y) * centering;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force, fy = (dy / dist) * force;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }
    for (const edge of edges) {
      const a = nodeMap.get(edge.source), b = nodeMap.get(edge.target);
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const strength = attraction * Math.log(dist + 1) * (0.4 + edge.weight * 3);
      a.vx += (dx / dist) * strength; a.vy += (dy / dist) * strength;
      b.vx -= (dx / dist) * strength; b.vy -= (dy / dist) * strength;
    }
    for (const n of nodes) {
      if (n.is_selected) continue;
      n.vx *= damping; n.vy *= damping;
      n.x = Math.max(28, Math.min(W - 28, n.x + n.vx));
      n.y = Math.max(28, Math.min(H - 28, n.y + n.vy));
    }
  }
}

function getFamiliesWithData(family_profiles: StudyResult['family_profiles']): string[] {
  return Object.entries(family_profiles)
    .filter(([, f]) => Object.values(f.pair_rates).some(r => r.direct_count > 0))
    .sort((a, b) => {
      const aMax = Math.max(...Object.values(a[1].pair_rates).map(r => r.direct_count));
      const bMax = Math.max(...Object.values(b[1].pair_rates).map(r => r.direct_count));
      return bMax - aMax;
    })
    .map(([name]) => name);
}

export function ColexificationNetworkView({ studyResult }: Props) {
  const conceptLabels = studyResult.concepts.map(c => c.label);
  const [selectedFamily, setSelectedFamily] = useState('');
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simEdges, setSimEdges] = useState<SimEdge[]>([]);
  const [edgeTooltip, setEdgeTooltip] = useState<{
    x: number; y: number; source: string; target: string; count: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<string | null>(null);

  // Refetch when selectedFamily changes — backend filters wofam to that family
  const { data: mapData, isLoading } = useQuery({
    queryKey: ['semantic-map', conceptLabels.join(','), selectedFamily],
    queryFn: () => apiClient.getSemanticMap(conceptLabels, 20, selectedFamily || undefined),
    staleTime: Infinity,
  });

  // Re-run force layout whenever mapData changes (including family switch)
  useEffect(() => {
    if (!mapData) return;
    const { nodes, edges } = mapData;

    const selected = nodes.filter(n => n.is_selected);
    const radius = Math.min(80, selected.length * 30);

    const simN: SimNode[] = nodes.map(n => {
      const si = selected.indexOf(n);
      if (si >= 0) {
        const angle = (2 * Math.PI * si) / Math.max(selected.length, 1) - Math.PI / 2;
        return { ...n, x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle), vx: 0, vy: 0 };
      }
      return { ...n, x: CX + (Math.random() - 0.5) * 320, y: CY + (Math.random() - 0.5) * 320, vx: 0, vy: 0 };
    });

    const simE: SimEdge[] = edges
      .filter(e => e.direct_count > 0)
      .map(e => ({ source: e.source, target: e.target, direct_count: e.direct_count, weight: e.weight }));

    runForce(simN, simE, 160);
    setSimNodes(simN);
    setSimEdges(simE);
  }, [mapData]);

  const availableFamilies = useMemo(
    () => getFamiliesWithData(studyResult.family_profiles),
    [studyResult.family_profiles],
  );

  const clientToSVG = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };

  const handleNodePointerDown = (e: React.PointerEvent<SVGCircleElement>, concept: string) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = concept;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleNodePointerMove = (e: React.PointerEvent<SVGCircleElement>, concept: string) => {
    if (draggingRef.current !== concept) return;
    const { x, y } = clientToSVG(e.clientX, e.clientY);
    setSimNodes(prev =>
      prev.map(n =>
        n.concept === concept
          ? { ...n, x: Math.max(22, Math.min(W - 22, x)), y: Math.max(22, Math.min(H - 22, y)), vx: 0, vy: 0 }
          : n,
      ),
    );
  };

  const handleNodePointerUp = (e: React.PointerEvent<SVGCircleElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    draggingRef.current = null;
  };

  const nodeMap = useMemo(() => new Map(simNodes.map(n => [n.concept, n])), [simNodes]);
  const maxCount = useMemo(() => Math.max(1, ...simEdges.map(e => e.direct_count)), [simEdges]);

  const countLabel = selectedFamily
    ? `attesting languages in ${selectedFamily}`
    : 'attesting languages (all families)';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-500 flex-1">
          Drag nodes to rearrange. Hover edges for language count.
          {selectedFamily && (
            <span className="ml-1 font-medium text-sky-700">
              Showing only {selectedFamily} neighbours.
            </span>
          )}
        </p>
        {availableFamilies.length > 0 && (
          <select
            value={selectedFamily}
            onChange={e => setSelectedFamily(e.target.value)}
            className="rounded-full border border-stone-200 bg-white/80 px-4 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            <option value="">All families</option>
            {availableFamilies.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        )}
      </div>

      <div className="relative overflow-hidden rounded-[22px] border border-stone-200/80 bg-white/70 select-none">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-[22px]">
            <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          </div>
        )}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: H }}
          onMouseLeave={() => setEdgeTooltip(null)}
        >
          {/* Edges */}
          {simEdges.map((edge, i) => {
            const a = nodeMap.get(edge.source);
            const b = nodeMap.get(edge.target);
            if (!a || !b) return null;

            const bothSelected = a.is_selected && b.is_selected;
            const strokeWidth = bothSelected
              ? 2 + (edge.direct_count / maxCount) * 8
              : 1 + (edge.direct_count / maxCount) * 3;
            const stroke = bothSelected ? '#1e5a73' : '#c7bfaf';
            const opacity = bothSelected ? 0.85 : 0.4;
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;

            return (
              <g key={i}>
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke="transparent"
                  strokeWidth={Math.max(strokeWidth + 10, 14)}
                  onMouseEnter={() =>
                    setEdgeTooltip({ x: midX, y: midY, source: edge.source, target: edge.target, count: edge.direct_count })
                  }
                  onMouseLeave={() => setEdgeTooltip(null)}
                  style={{ cursor: 'crosshair' }}
                />
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeOpacity={opacity}
                  pointerEvents="none"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {simNodes.map(node => {
            const r = node.is_selected ? 20 : 9;
            const fill = node.is_selected ? '#1e5a73' : '#a5c8d8';
            const strokeColor = node.is_selected ? '#0f3547' : '#8bb4c4';
            const label = node.concept.length > 16 ? node.concept.slice(0, 15) + '…' : node.concept;

            return (
              <g key={node.concept}>
                {/* Wide transparent hit area for drag */}
                <circle
                  cx={node.x} cy={node.y} r={r + 9}
                  fill="transparent"
                  style={{ cursor: draggingRef.current === node.concept ? 'grabbing' : 'grab' }}
                  onPointerDown={e => handleNodePointerDown(e, node.concept)}
                  onPointerMove={e => handleNodePointerMove(e, node.concept)}
                  onPointerUp={handleNodePointerUp}
                />
                <circle
                  cx={node.x} cy={node.y} r={r}
                  fill={fill}
                  fillOpacity={node.is_selected ? 0.92 : 0.65}
                  stroke={strokeColor}
                  strokeWidth={node.is_selected ? 2 : 1}
                  pointerEvents="none"
                />
                <text
                  x={node.x}
                  y={node.y + r + 13}
                  textAnchor="middle"
                  fontSize={node.is_selected ? 11 : 9}
                  fontWeight={node.is_selected ? '700' : '400'}
                  fill={node.is_selected ? '#0f3547' : '#5b6470'}
                  pointerEvents="none"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Edge tooltip */}
          {edgeTooltip && (() => {
            const { x, y, source, target, count } = edgeTooltip;
            const line1 = `${source} ↔ ${target}`;
            const line2 = `${count} language${count !== 1 ? 's' : ''}`;
            const tw = Math.max(line1.length * 6.8 + 16, 160);
            const th = 52;
            const tx = Math.min(Math.max(x - tw / 2, 4), W - tw - 4);
            const ty = y - th - 14 < 4 ? y + 14 : y - th - 14;
            return (
              <g pointerEvents="none">
                <rect x={tx} y={ty} width={tw} height={th} rx={10}
                  fill="white" fillOpacity={0.97} stroke="#d4c9b5" strokeWidth={1} />
                <text x={tx + tw / 2} y={ty + 18} textAnchor="middle" fontSize={10} fontWeight="600" fill="#1e293b">
                  {line1}
                </text>
                <text x={tx + tw / 2} y={ty + 37} textAnchor="middle" fontSize={12} fill="#1e5a73" fontWeight="700">
                  {line2}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 px-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-[#1e5a73]" />
          Selected concept
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-[#a5c8d8]" />
          CLICS neighbour
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-6 rounded bg-[#1e5a73] inline-block opacity-80" />
          Thickness = {countLabel}
        </span>
      </div>
    </div>
  );
}
