import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ZAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { getLanguageName } from '../constants/languages';
import { projectEmbeddings, ProjectedPoint } from '../utils/embedding';
import { ComparisonResult } from '../types';

interface Props {
  results: Record<string, ComparisonResult>;
  className?: string;
}

const SharedEmbeddingsViz: React.FC<Props> = ({ results, className = "" }) => {
  // Project embeddings to 2D
  const points = useMemo(() => projectEmbeddings(results), [results]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    
    const point = payload[0].payload as ProjectedPoint;
    
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <div className="font-medium">{point.translation}</div>
        <div className="text-sm text-gray-600 mt-1">
          {getLanguageName(point.language)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Pair Similarity: {(point.similarity * 100).toFixed(1)}%
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Semantic Space</h3>
      <div className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              type="number" 
              dataKey="x" 
              domain={['auto', 'auto']}
              tick={false}  // Hide axis numbers
              label={{ value: 'UMAP projection', position: 'bottom' }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              domain={['auto', 'auto']}
              tick={false}  // Hide axis numbers
              label={{ value: 'UMAP projection', angle: -90, position: 'left' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ZAxis range={[60, 60]} />
            <Scatter
              data={points.filter(p => p.concept === 'concept1')}
              fill="#3b82f6"
              shape="circle"
            />
            <Scatter
              data={points.filter(p => p.concept === 'concept2')}
              fill="#10b981"
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600">Concept 1</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-gray-600">Concept 2</span>
        </div>
      </div>
    </div>
  );
};

export default SharedEmbeddingsViz;