import React, { useMemo } from 'react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { getLanguageName } from '../constants/languages';
import { projectEmbeddings, ProjectedPoint } from '../utils/embedding';
import InfoTooltip from './InfoTooltip';
import { ComparisonResult } from '../types';

interface Props {
  results: Record<string, ComparisonResult>;
  className?: string;
  concepts: string[];
}

interface TooltipPayload {
  payload: ProjectedPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

const SharedEmbeddingsViz: React.FC<Props> = ({ results, className = '', concepts }) => {
  const points = useMemo(() => projectEmbeddings(results), [results]);

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (!active || !payload?.length) {
      return null;
    }

    const point = payload[0].payload as ProjectedPoint;

    return (
      <div className="rounded-[18px] border border-stone-200 bg-white/95 p-3 shadow-[0_14px_28px_rgba(48,43,31,0.12)]">
        <div className="font-semibold text-slate-900">{point.translation}</div>
        <div className="mt-1 text-sm text-slate-600">{getLanguageName(point.language)}</div>
        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
          Pair similarity {(point.similarity * 100).toFixed(1)}%
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-[26px] border border-stone-200/80 bg-white/75 p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="atlas-label mb-1">Projection</p>
          <h3 className="text-2xl text-slate-900">Semantic space</h3>
        </div>
        <InfoTooltip
          content={
            <div className="space-y-2">
              <p>2D visualization of translation clusters using UMAP on LaBSE embeddings.</p>
              <p>Nearby points represent translations used in similar contexts across languages.</p>
              <p className="text-xs">This is an approximation: 2D distance does not perfectly match full embedding distance.</p>
            </div>
          }
        />
      </div>
      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              type="number"
              dataKey="x"
              domain={['auto', 'auto']}
              tick={false}
              axisLine={false}
              tickLine={false}
              label={{ value: 'UMAP projection', position: 'bottom' }}
            />
            <YAxis type="number" dataKey="y" domain={['auto', 'auto']} tick={false} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ZAxis range={[60, 60]} />
            <Scatter data={points.filter((point) => point.concept === 'concept1')} fill="#245a73" shape="circle" />
            <Scatter data={points.filter((point) => point.concept === 'concept2')} fill="#c47c2a" shape="circle" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm font-medium text-sky-900">
          <div className="h-3 w-3 rounded-full bg-sky-700" />
          {concepts[0]}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          <div className="h-3 w-3 rounded-full bg-amber-600" />
          {concepts[1]}
        </div>
      </div>
    </div>
  );
};

export default SharedEmbeddingsViz;
