import React, { useMemo, useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { ComparisonResult, Languages, FamilyColexifications } from '../types';
import { FamilyGraph } from './FamilyGraph';
import { useSemanticChains } from '../hooks/useSemanticChains';
import InfoTooltip from './InfoTooltip';
import CorrelationAnalysis from './CorrelationAnalysis';

interface FamilyComparisonViewProps {
  results: Record<string, ComparisonResult>;
  languages: Languages;
  originalConcepts: [string, string]; 
}

interface SemanticChain {
  path: string[];
  total_score: number;
}

const calculateEnhancedColexScore = (directScore: number, chains: SemanticChain[] = []) => {
  if (!chains?.length) return directScore;
  
  // Start with direct colexification score
  let totalScore = directScore;
  
  // Add weighted chain scores with exponential decay based on path length
  chains.forEach(chain => {
    const chainLength = chain.path.length - 1; // Number of steps
    const baseWeight = Math.pow(0.8, chainLength - 1); // Exponential decay for longer paths
    const chainScore = chain.total_score * baseWeight;
    totalScore += chainScore;
  });
  
  // Cap at 1.0 and ensure non-negative
  return Math.min(Math.max(totalScore, 0), 1.0);
};

export const FamilyComparisonView: React.FC<FamilyComparisonViewProps> = ({ 
  results, 
  languages, 
  originalConcepts
}) => {
  const [prevResults, setPrevResults] = useState({});

  useEffect(() => {
    if (Object.keys(results).length > 0) {
      setPrevResults(results);
    }
  }, [results]);

  const familyResults = useMemo(() => {
    const grouped: Record<string, {
      embeddings: Array<{
        language: string;
        similarity: number;
        variations: ComparisonResult['variation_similarities'];
      }>;
      family_colexifications: FamilyColexifications;
      languages: string[];
    }> = {};
    
    Object.entries(results).forEach(([langCode, result]) => {
      const family = languages[langCode]?.family;
      if (!family) return;

      if (!grouped[family]) {
        grouped[family] = {
          embeddings: [],
          family_colexifications: result.family_colexifications[family],
          languages: []
        };
      }
      
      grouped[family].embeddings.push({
        language: languages[langCode].name,
        similarity: result.main_similarity * 100,
        variations: result.variation_similarities
      });
      
      grouped[family].languages.push(langCode);
    });
    
    return grouped;
  }, [results, languages]);

  const chartData = Object.entries(familyResults).map(([family, data]) => ({
    name: family,
    similarity: data.embeddings.reduce((sum, curr) => sum + curr.similarity, 0) / data.embeddings.length
  }));


  return (
  <div className="grid grid-cols-1 gap-6">
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left column for chart and metrics */}
      <div className="flex flex-col gap-6">
        {/* Chart section */}
        <div className="rounded-[24px] border border-stone-200/80 bg-white/78 p-6">
          <p className="atlas-label mb-1">Family overview</p>
          <h3 className="mb-4 text-2xl text-slate-900">
            Semantic Similarity by Family
          </h3>
          <div style={{ width: '100%', height: 400 }} className="mt-4">
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 95, 82, 0.25)" />
                <XAxis 
                  dataKey="name"
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12, fill: '#5b6470' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#5b6470' }}
                  label={{ 
                    value: 'Similarity %', 
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#5b6470' }
                  }}
                />
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  contentStyle={{ fontSize: 12, borderRadius: 16, border: '1px solid rgba(212, 201, 181, 0.9)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#5b6470' }} />
                <Bar 
                  dataKey="similarity" 
                  fill="#245a73"
                  animationDuration={500}
                  label={{ 
                    position: 'top',
                    formatter: (value: number) => `${value.toFixed(1)}%`,
                    fontSize: 12,
                    fill: '#42505e'
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Family Metrics Comparison - Now directly below the chart */}
        <div className="rounded-[24px] border border-stone-200/80 bg-white/78 p-6">
          <p className="atlas-label mb-1">Metrics</p>
          <h3 className="mb-4 text-2xl text-slate-900">
            Current Family Metrics
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(familyResults).map(([family, data]) => {
              const { data: chainData } = useSemanticChains(
                originalConcepts[0],
                originalConcepts[1],
                family
              );
              
              const avgEmbeddingSim = data.embeddings.reduce(
                (sum, curr) => sum + curr.similarity, 0
              ) / data.embeddings.length / 100;
              
              const directColexRate = data.family_colexifications?.direct_colexification.frequency / 
                (data.family_colexifications?.total_languages || 1);
                
              const enhancedColexScore = calculateEnhancedColexScore(
                directColexRate,
                chainData?.chains
              );
              
              return (
                <div 
                  key={family}
                  className="rounded-[20px] border border-stone-200/80 bg-stone-50/75 p-4 transition-colors hover:border-sky-300"
                >
                  <h4 className="mb-3 text-lg font-semibold text-slate-900">{family}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <InfoTooltip 
                        content="Average semantic similarity based on LaBSE embeddings across all languages in this family"
                        className="text-sm text-slate-600"
                      >
                        Embedding Similarity
                      </InfoTooltip>
                      <span className="font-medium text-sky-700">
                        {(avgEmbeddingSim * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <InfoTooltip 
                        content="Percentage of languages in this family that use the same word for both concepts"
                        className="text-sm text-slate-600"
                      >
                        Direct Colexification
                      </InfoTooltip>
                      <span className="font-medium text-emerald-700">
                        {(directColexRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <InfoTooltip 
                        content={
                          <div className="space-y-2">
                            <p>Combined score that includes both direct and indirect semantic connections:</p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li>Starts with direct colexification score (D)</li>
                              <li>Adds weighted contributions from semantic chains (C)</li>
                              <li>Chain weights decay exponentially with length (0.8^(length-1))</li>
                              <li>Formula: Score = D + Σ(C × 0.8^(length-1))</li>
                            </ul>
                            <p className="text-xs">Example: A chain A→B→C of strength 0.6 contributes 0.6 × 0.8 = 0.48</p>
                          </div>
                        }
                        className="text-sm text-slate-600"
                      >
                        Total Colexical Score
                      </InfoTooltip>
                      <span className="font-medium text-violet-700">
                        {(enhancedColexScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative pt-1">
                      <div className="flex h-2 overflow-hidden rounded bg-stone-200">
                        <div
                          style={{ width: `${avgEmbeddingSim * 100}%` }}
                          className="flex flex-col justify-center whitespace-nowrap rounded bg-sky-700 text-center text-xs text-white"
                        />
                      </div>
                      <div className="mt-1 flex h-2 overflow-hidden rounded bg-stone-200">
                        <div
                          style={{ width: `${directColexRate * 100}%` }}
                          className="flex flex-col justify-center whitespace-nowrap rounded bg-emerald-600 text-center text-xs text-white"
                        />
                      </div>
                      <div className="mt-1 flex h-2 overflow-hidden rounded bg-stone-200">
                        <div
                          style={{ width: `${enhancedColexScore * 100}%` }}
                          className="flex flex-col justify-center whitespace-nowrap rounded bg-violet-600 text-center text-xs text-white"
                        />
                      </div>
                    </div>
                    {chainData?.chains && chainData.chains.length > 0 && (
                      <div className="mt-1 text-xs text-slate-500">
                        Including {chainData.chains.length} semantic chains
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Family Pattern Graphs - Now in right column */}
      <div className="rounded-[24px] border border-stone-200/80 bg-white/78 p-6">
        <p className="atlas-label mb-1">Pattern graphs</p>
        <h3 className="mb-4 text-2xl text-slate-900">
          Family Pattern Analysis
        </h3>
        <div className="space-y-6">
          {Object.entries(familyResults).map(([family, data]) => (
            data.family_colexifications && (
              <FamilyGraph
                key={family}
                concept1={originalConcepts[0]}
                concept2={originalConcepts[1]}
                familyData={data.family_colexifications}
                familyName={family}
                enableChains={true}
                className="mt-4"
              />
            )
          ))}
        </div>
      </div>
    </div>

    {/* Correlation Analysis */}
    <div className="lg:col-span-2">
        <CorrelationAnalysis
          currentConcepts={originalConcepts}
          currentData={{
            embeddings: Object.fromEntries(
              Object.entries(familyResults).map(([family, data]) => [
                family,
                data.embeddings.reduce((sum, curr) => sum + curr.similarity, 0) / 
                data.embeddings.length / 100
              ])
            ),
            colexifications: Object.fromEntries(
              Object.entries(familyResults).map(([family, data]) => {
                const { data: chainData } = useSemanticChains(
                  originalConcepts[0],
                  originalConcepts[1],
                  family
                );
                
                const directColexRate = data.family_colexifications?.direct_colexification.frequency / 
                  (data.family_colexifications?.total_languages || 1);
                
                return [
                  family,
                  calculateEnhancedColexScore(directColexRate, chainData?.chains)
                ];
              })
            )
          }}
          shouldStore={Object.keys(results).length > 0 && JSON.stringify(prevResults) !== JSON.stringify(results)}
        />
      </div>
  </div>
);
};
