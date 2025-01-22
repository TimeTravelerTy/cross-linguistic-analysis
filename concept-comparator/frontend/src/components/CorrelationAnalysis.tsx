import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import _ from 'lodash';
import InfoTooltip from './InfoTooltip';

interface StoredComparison {
  concepts: [string, string];
  timestamp: number;
  embeddings: Record<string, number>;  // family -> similarity
  colexifications: Record<string, number>;  // family -> colex score
  coverage: number;  // % of families with non-zero colex
}

interface Props {
    currentConcepts: [string, string];
    currentData: {
      embeddings: Record<string, number>;
      colexifications: Record<string, number>;
    };
    shouldStore: boolean;  // New prop to control when to store data
    className?: string;
}

const STORAGE_KEY = 'semantic-correlation-data';

const CorrelationAnalysis: React.FC<Props> = ({ 
  currentConcepts, 
  currentData,
  shouldStore,
  className = "" 
}) => {
  const [allComparisons, setAllComparisons] = useState<StoredComparison[]>([]);

  // Process and store new comparison
  useEffect(() => {
    const storeComparison = () => {
      // Only include families with non-zero colexification
      const activeFamilies = Object.entries(currentData.colexifications)
        .filter(([_, score]) => score > 0)
        .map(([family]) => family);
      
      if (activeFamilies.length === 0) return;
      
      const coverage = activeFamilies.length / Object.keys(currentData.colexifications).length;
  
      const newComparison: StoredComparison = {
        concepts: currentConcepts,
        timestamp: Date.now(),
        embeddings: _.pick(currentData.embeddings, activeFamilies),
        colexifications: _.pick(currentData.colexifications, activeFamilies),
        coverage
      };
  
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const history = stored ? JSON.parse(stored) as StoredComparison[] : [];
        
        const filteredHistory = history.filter(
          comp => !(comp.concepts[0] === currentConcepts[0] && 
                   comp.concepts[1] === currentConcepts[1])
        );
        
        const updatedHistory = [...filteredHistory, newComparison];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
        setAllComparisons(updatedHistory);
      } catch (error) {
        console.error('Error storing comparison:', error);
      }
    };
  
    if (shouldStore) {
      storeComparison();
    }
  }, [currentConcepts, currentData, shouldStore]);  // Added shouldStore to dependencies

  // Calculate data points
  const dataPoints = allComparisons.map(comparison => {
    // Only include families that have non-zero colexification scores
    const activeFamilies = Object.entries(comparison.colexifications)
      .filter(([_, score]) => score > 0)
      .map(([family]) => family);
    
    if (activeFamilies.length === 0) return null;
  
    // Calculate averages only across families with non-zero scores
    const avgEmbedding = _.meanBy(activeFamilies, f => comparison.embeddings[f]);
    const avgColex = _.meanBy(activeFamilies, f => comparison.colexifications[f]);
  
    return {
      concepts: comparison.concepts,
      embeddingSim: avgEmbedding,
      colexScore: avgColex,
      coverage: activeFamilies.length / Object.keys(comparison.colexifications).length,
      timestamp: comparison.timestamp,
      activeFamilies: activeFamilies.length,
      totalFamilies: Object.keys(comparison.colexifications).length
    };
  }).filter(Boolean);

  // Calculate correlation
  const correlation = dataPoints.length > 1 ? calculateCorrelation(
    dataPoints.map(p => p!.embeddingSim),
    dataPoints.map(p => p!.colexScore)
  ) : null;

  function calculateCorrelation(x: number[], y: number[]): number {
    const meanX = _.mean(x);
    const meanY = _.mean(y);
    
    const numerator = _.sum(_.zip(x, y).map(([xi, yi]) => 
      (xi! - meanX) * (yi! - meanY)
    ));
    
    const denominator = Math.sqrt(
      _.sum(x.map(xi => Math.pow(xi - meanX, 2))) *
      _.sum(y.map(yi => Math.pow(yi - meanY, 2)))
    );
    
    return numerator / denominator;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    
    const point = payload[0].payload;
    const date = new Date(point.timestamp).toLocaleString();
    
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <div className="text-sm font-medium mb-2">
          {point.concepts[0]} ↔ {point.concepts[1]}
        </div>
        <div className="space-y-1 text-sm">
          <div>
            Embedding Similarity: {(point.embeddingSim * 100).toFixed(1)}%
          </div>
          <div>
            Total Colexical Score: {(point.colexScore * 100).toFixed(1)}%
          </div>
          <div className="text-gray-500 text-xs mt-2">
            {point.activeFamilies} families with colexification
          </div>
          <div className="text-gray-500 text-xs">
            {date}
          </div>
        </div>
      </div>
    );
  };

  if (!dataPoints.length) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 text-center text-gray-500 ${className}`}>
        No comparison data available yet
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
            <InfoTooltip content="Analysis of how computational similarity scores (from embeddings) correlate with linguistic patterns (from colexifications)">
                <h3 className="text-lg font-medium text-gray-900">
                Computational vs. Colexical Correlation
                </h3>
            </InfoTooltip>
            <p className="text-sm text-gray-500 mt-1">
                Only including families with non-zero colexification patterns
            </p>
        </div>
        <div className="flex items-center gap-3">
            {correlation !== null && (
                <InfoTooltip 
                content="Pearson correlation coefficient between embedding similarities and colexification scores"
                showIcon={false}
                >
                <div className="text-sm font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700 cursor-help">
                    r = {correlation.toFixed(3)}
                </div>
                </InfoTooltip>
            )}
            <button
            onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setAllComparisons([]);
            }}
            className="text-sm text-red-600 hover:text-red-800"
            >
            Reset Data
            </button>
        </div>
    </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              type="number" 
              dataKey="embeddingSim" 
              domain={[0, 1]} 
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            >
              <Label 
                value="Embedding Similarity" 
                position="bottom" 
                offset={20}
              />
            </XAxis>
            <YAxis 
              type="number" 
              dataKey="colexScore" 
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            >
              <Label 
                value="Total Colexical Score" 
                angle={-90} 
                position="left" 
                offset={20}
              />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Scatter 
              data={dataPoints} 
              fill="#3b82f6"
              opacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Based on {dataPoints.length} concept pair comparisons
      </div>
    </div>
  );
};

export default CorrelationAnalysis;