import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Chain {
  path: string[];
  scores: number[];
  total_score: number;
}

interface Props {
  chains: Chain[];
  className?: string;
  initialDisplay?: number;
}

const SemanticChainList: React.FC<Props> = ({ 
  chains, 
  className = "",
  initialDisplay = 5
}) => {
  const [showAll, setShowAll] = useState(false);
  
  // Sort chains by total score
  const sortedChains = [...chains].sort((a, b) => b.total_score - a.total_score);
  const displayChains = showAll ? sortedChains : sortedChains.slice(0, initialDisplay);
  
  if (!chains.length) return null;

  const getConceptColor = (position: number, pathLength: number) => {
    if (position === 0) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (position === pathLength - 1) return 'bg-green-50 text-green-700 border-green-200';
    return 'bg-white text-gray-700 border-gray-200';
  };

  return (
    <div className={`bg-white rounded-lg ${className}`}>
      {/* Outer container with visible overflow for tooltips */}
      <div className="overflow-visible">
        {/* Inner container with scroll for content */}
        <div className="max-h-[300px] overflow-y-auto">
          <div className="space-y-3 p-2">
          {displayChains.map((chain, idx) => (
            <div 
              key={idx}
              className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2 flex-wrap">
                {chain.path.map((concept, pathIdx) => (
                  <React.Fragment key={pathIdx}>
                    <span 
                      className={`px-2 py-1 rounded border text-sm
                        ${getConceptColor(pathIdx, chain.path.length)}`}
                      style={{
                        opacity: Math.max(0.6, chain.total_score)
                      }}
                    >
                      {concept}
                    </span>
                    {pathIdx < chain.path.length - 1 && (
                      <div 
                        className="group relative" 
                        onMouseEnter={(e) => {
                          const tooltip = e.currentTarget.querySelector('div:last-child') as HTMLElement;
                          if (tooltip) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            tooltip.style.top = `${rect.top - 30}px`;
                            tooltip.style.left = `${rect.left + rect.width / 2}px`;
                          }
                        }}>
                        <span 
                          className="text-gray-400 cursor-help"
                          style={{
                            opacity: Math.max(0.4, chain.scores[pathIdx])
                          }}
                        >
                          ↔
                        </span>
                        <div className="fixed transform -translate-x-1/2 px-2 py-1 text-xs 
                          bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity
                          pointer-events-none whitespace-nowrap z-50">
                          {(chain.scores[pathIdx] * 100).toFixed(1)}% frequency
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-2 flex gap-4 text-xs text-gray-500">
                <div>
                  Chain strength: 
                  <span className="ml-1 font-medium text-gray-900">
                    {(chain.total_score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
      
      {chains.length > initialDisplay && (
        <div className="p-2 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
          >
            {showAll ? (
              <>
                Show less
                <ChevronDown className="w-4 h-4" />
              </>
            ) : (
              <>
                Show {chains.length - initialDisplay} more chains
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default SemanticChainList;