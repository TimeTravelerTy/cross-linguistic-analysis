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

const calculateEnhancedColexScore = (directScore: number, chains: any[] = []) => {
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
      embeddings: Array<{ language: string; similarity: number; variations: any[] }>;
      family_colexifications: FamilyColexifications;
      languages: string[];
    }> = {};
    
    Object.entries(results).forEach(([langCode, result]) => {
      const family = languages[langCode]?.family;
      if (!family) return;

      console.log(`\nProcessing ${langCode} in family ${family}:`);
      console.log('Result family_colexifications:', result.family_colexifications);
      console.log('Language colexifications:', result.language_colexifications);
      
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column for chart and metrics */}
      <div className="flex flex-col gap-6">
        {/* Chart section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Semantic Similarity by Family
          </h3>
          <div style={{ width: '100%', height: 400 }} className="mt-4">
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Similarity %', 
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar 
                  dataKey="similarity" 
                  fill="#3b82f6"
                  animationDuration={500}
                  label={{ 
                    position: 'top',
                    formatter: (value: number) => `${value.toFixed(1)}%`,
                    fontSize: 12
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Family Metrics Comparison - Now directly below the chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                  className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <h4 className="font-medium mb-3 text-gray-900">{family}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <InfoTooltip 
                        content="Average semantic similarity based on LaBSE embeddings across all languages in this family"
                        className="text-sm text-gray-600"
                      >
                        Embedding Similarity
                      </InfoTooltip>
                      <span className="font-medium text-blue-600">
                        {(avgEmbeddingSim * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <InfoTooltip 
                        content="Percentage of languages in this family that use the same word for both concepts"
                        className="text-sm text-gray-600"
                      >
                        Direct Colexification
                      </InfoTooltip>
                      <span className="font-medium text-emerald-600">
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
                        className="text-sm text-gray-600"
                      >
                        Total Colexical Score
                      </InfoTooltip>
                      <span className="font-medium text-violet-600">
                        {(enhancedColexScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                        <div
                          style={{ width: `${avgEmbeddingSim * 100}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                        />
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100 mt-1">
                        <div
                          style={{ width: `${directColexRate * 100}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                        />
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100 mt-1">
                        <div
                          style={{ width: `${enhancedColexScore * 100}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-violet-500"
                        />
                      </div>
                    </div>
                    {chainData?.chains && chainData.chains.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
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