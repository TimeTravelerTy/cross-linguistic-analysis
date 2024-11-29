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

interface FamilyComparisonViewProps {
  results: Record<string, ComparisonResult>;
  languages: Languages;
}

export const FamilyComparisonView: React.FC<FamilyComparisonViewProps> = ({ 
  results, 
  languages 
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

  // Get original concepts from main_translations of first result
  const firstResult = Object.values(results)[0];
  const [concept1, concept2] = firstResult.main_translations;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Embedding Similarities Chart - remains the same */}
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
                concept1={concept1}
                concept2={concept2}
                familyData={data.family_colexifications}
                familyName={family}
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
            const avgEmbeddingSim = data.embeddings.reduce(
              (sum, curr) => sum + curr.similarity, 0
            ) / data.embeddings.length;
            
            const colexRate = data.family_colexifications?.direct_colexification.frequency / 
              (data.family_colexifications?.total_languages || 1) || 0;
            
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
                      {avgEmbeddingSim.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Historical Colexification
                    </span>
                    <span className="font-medium text-green-600">
                      {(colexRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                      <div
                        style={{ width: `${avgEmbeddingSim}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                      />
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100 mt-1">
                      <div
                        style={{ width: `${colexRate * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};