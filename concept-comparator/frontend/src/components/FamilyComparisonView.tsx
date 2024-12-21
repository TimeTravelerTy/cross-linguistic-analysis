import React, { useMemo } from 'react';
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Embedding Similarities */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Semantic Similarity by Family
        </h3>
        <div style={{ width: '100%', height: 400 }} className="mt-4">
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60
              }}
            >
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

      {/* Family Pattern Graphs Section */}
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

      {/* Similarity Correlation Analysis */}
      <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Computational vs Colexical Similarity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(familyResults).map(([family, data]) => {
            // Get semantic chains for this family
            const { data: chainData } = useSemanticChains(
              originalConcepts[0],
              originalConcepts[1],
              family
            );
            
            const avgEmbeddingSim = data.embeddings.reduce(
              (sum, curr) => sum + curr.similarity, 0
            ) / data.embeddings.length / 100; // Normalize to 0-1
            
            const directColexRate = data.family_colexifications?.direct_colexification.frequency / 
              (data.family_colexifications?.total_languages || 1);
              
            // Calculate enhanced colexical score including chains
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
                    <span className="text-sm text-gray-600">
                      Embedding Similarity
                    </span>
                    <span className="font-medium text-blue-600">
                      {(avgEmbeddingSim * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Direct Colexification
                    </span>
                    <span className="font-medium text-emerald-600">
                      {(directColexRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Enhanced Colexical Score
                    </span>
                    <span className="font-medium text-violet-600">
                      {(enhancedColexScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative pt-1">
                    {/* Embedding similarity bar */}
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                      <div
                        style={{ width: `${avgEmbeddingSim * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                      />
                    </div>
                    {/* Direct colexification bar */}
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100 mt-1">
                      <div
                        style={{ width: `${directColexRate * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                      />
                    </div>
                    {/* Enhanced colexical score bar */}
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
  );
};