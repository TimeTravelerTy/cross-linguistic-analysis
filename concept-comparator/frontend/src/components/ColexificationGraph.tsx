import React from 'react';
import { ColexificationLink } from '../types';

interface ColexificationGraphProps {
  concept1: string;
  concept2: string;
  colexification_data: Record<string, ColexificationLink[]>;
  className?: string;
}

export const ColexificationGraph: React.FC<ColexificationGraphProps> = ({ 
  concept1, 
  concept2, 
  colexification_data,
  className = ""
}) => {
  // Check if we have any colexification data
  const concept1Data = colexification_data[concept1] || [];
  const concept2Data = colexification_data[concept2] || [];
  
  if (concept1Data.length === 0 && concept2Data.length === 0) {
    return null;  // Don't render anything if no colexifications
  }

  return (
    <div className={`bg-white rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900">
          Colexification Patterns
        </h4>
      </div>

      {/* Simple network graph */}
      <div className="relative h-64 border border-gray-100 rounded-lg">
        {/* Central concepts */}
        <div 
          className="absolute p-2 bg-blue-100 rounded-lg border border-blue-200"
          style={{ left: '30%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <span className="text-sm font-medium text-blue-800">{concept1}</span>
        </div>
        
        <div 
          className="absolute p-2 bg-green-100 rounded-lg border border-green-200"
          style={{ left: '70%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <span className="text-sm font-medium text-green-800">{concept2}</span>
        </div>

        {/* Colexification nodes and connections */}
        {concept1Data.map((link, idx) => (
          <React.Fragment key={`c1-${link.concept}`}>
            {/* Node */}
            <div 
              className="absolute p-2 bg-gray-50 rounded-lg border border-gray-200"
              style={{ 
                left: '15%', 
                top: `${20 + (idx * 20)}%`, 
                transform: 'translate(-50%, -50%)'
              }}
            >
              <span className="text-sm text-gray-600">{link.concept}</span>
            </div>
            {/* Connection line */}
            <svg 
              className="absolute w-full h-full" 
              style={{ top: 0, left: 0, pointerEvents: 'none' }}
            >
              <line
                x1="15%"
                y1={`${20 + (idx * 20)}%`}
                x2="30%"
                y2="50%"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            </svg>
          </React.Fragment>
        ))}

        {concept2Data.map((link, idx) => (
          <React.Fragment key={`c2-${link.concept}`}>
            {/* Node */}
            <div 
              className="absolute p-2 bg-gray-50 rounded-lg border border-gray-200"
              style={{ 
                left: '85%', 
                top: `${20 + (idx * 20)}%`, 
                transform: 'translate(-50%, -50%)'
              }}
            >
              <span className="text-sm text-gray-600">{link.concept}</span>
            </div>
            {/* Connection line */}
            <svg 
              className="absolute w-full h-full" 
              style={{ top: 0, left: 0, pointerEvents: 'none' }}
            >
              <line
                x1="85%"
                y1={`${20 + (idx * 20)}%`}
                x2="70%"
                y2="50%"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            </svg>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};