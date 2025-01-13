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
import { getLanguageArea } from '../constants/areas';

interface AreaComparisonViewProps {
  results: Record<string, ComparisonResult>;
  languages: Languages;
  originalConcepts: [string, string];
}

interface AreaColexifications {
  concept1: Record<string, number>;
  concept2: Record<string, number>;
  totalLanguages: number;
  directColexification: number;
}

interface AreaData {
  embeddings: Array<{ language: string; similarity: number; variations: any[] }>;
  languages: string[];
  colexifications: FamilyColexifications;
}

export const AreaComparisonView: React.FC<AreaComparisonViewProps> = ({ 
  results, 
  languages,
  originalConcepts
}) => {
  const areaResults = useMemo(() => {
    const grouped: Record<string, {
      embeddings: Array<{ language: string; similarity: number; variations: any[] }>;
      languages: string[];
      colexifications: AreaColexifications;
    }> = {};
    
    Object.entries(results).forEach(([langCode, result]) => {
        const area = getLanguageArea(langCode)?.name;
        if (!area) return;
        
        if (!grouped[area]) {
          grouped[area] = {
            embeddings: [],
            languages: [],
            colexifications: {
              concept1: {},
              concept2: {},
              totalLanguages: 0,
              directColexification: 0
            }
          };
        }
        
        grouped[area].embeddings.push({
          language: languages[langCode].name,
          similarity: result.main_similarity * 100,
          variations: result.variation_similarities
        });
        
        grouped[area].languages.push(langCode);
        grouped[area].colexifications.totalLanguages++;
      
        const concept1Colexs = new Set(
          result.language_colexifications[originalConcepts[0]]
            .filter(colex => colex.present)
            .map(colex => colex.concept)
        );
        const concept2Colexs = new Set(
          result.language_colexifications[originalConcepts[1]]
            .filter(colex => colex.present)
            .map(colex => colex.concept)
        );
      
        // Check for direct colexification
        const hasDirectColexification = concept1Colexs.has(originalConcepts[1].toUpperCase()) || concept2Colexs.has(originalConcepts[0].toUpperCase());
      
        if (hasDirectColexification) {
          grouped[area].colexifications.directColexification++;
        }
      
        // Process and aggregate colexifications
        result.language_colexifications[originalConcepts[0]].forEach(colex => {
          if (colex.present) {
            const concept = colex.concept;
            grouped[area].colexifications.concept1[concept] = 
              (grouped[area].colexifications.concept1[concept] || 0) + 1;
          }
        });
      
        result.language_colexifications[originalConcepts[1]].forEach(colex => {
          if (colex.present) {
            const concept = colex.concept;
            grouped[area].colexifications.concept2[concept] = 
              (grouped[area].colexifications.concept2[concept] || 0) + 1;
          }
        });
    });


    // Convert to FamilyColexifications format
    const formattedResults: Record<string, AreaData> = {};
    
    for (const [area, data] of Object.entries(grouped)) {
        const formattedColexData: FamilyColexifications = {
            concept1_colexifications: {},
            concept2_colexifications: {},
            direct_colexification: {
              frequency: data.colexifications.directColexification,
              languages: [...Array(data.colexifications.directColexification)].map(() => 'dummy'), // Create array of correct length
            },
            total_languages: data.colexifications.totalLanguages
        };

      // Format concept1 colexifications
      Object.entries(data.colexifications.concept1).forEach(([concept, count]) => {
        formattedColexData.concept1_colexifications[concept] = {
          frequency: count,
          languages: []
        };
      });

      // Format concept2 colexifications
      Object.entries(data.colexifications.concept2).forEach(([concept, count]) => {
        formattedColexData.concept2_colexifications[concept] = {
          frequency: count,
          languages: []
        };
      });

      formattedResults[area] = {
        embeddings: data.embeddings,
        languages: data.languages,
        colexifications: formattedColexData
      };
    }
    
    return formattedResults;
  }, [results, languages, originalConcepts]);

  const chartData = Object.entries(areaResults).map(([area, data]) => ({
    name: area,
    similarity: data.embeddings.reduce((sum, curr) => sum + curr.similarity, 0) / data.embeddings.length
  }));

  const hasColexifications = (data: AreaData): boolean => {
    const { colexifications } = data;
    
    // Check if there's direct colexification
    if (colexifications.direct_colexification.frequency > 0) {
      return true;
    }
    
    // Check if there are any concept1 colexifications
    if (Object.keys(colexifications.concept1_colexifications).length > 0) {
      return true;
    }
    
    // Check if there are any concept2 colexifications
    if (Object.keys(colexifications.concept2_colexifications).length > 0) {
      return true;
    }
    
    return false;
  };

  // Filter areas to only those with colexifications
  const areasWithColexifications = Object.entries(areaResults).filter(
    ([_, data]) => hasColexifications(data)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart section remains the same */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Semantic Similarity by Linguistic Area
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

      {/* Pattern Analysis section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Area Pattern Analysis
        </h3>
        {areasWithColexifications.length > 0 ? (
          <div className="space-y-6">
            {areasWithColexifications.map(([area, data]) => (
              <FamilyGraph
                key={area}
                concept1={originalConcepts[0]}
                concept2={originalConcepts[1]}
                familyData={data.colexifications}
                familyName={area}
                className="mt-4"
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No colexification patterns found across linguistic areas
          </div>
        )}
      </div>
    </div>
  );
};