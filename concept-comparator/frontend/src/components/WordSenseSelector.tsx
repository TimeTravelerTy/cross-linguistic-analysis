import React, { useState } from 'react';
import { WordSense } from '../types';

interface Props {
  word: string;
  senses: WordSense[];
  selectedSense: WordSense | null;
  onSelect: (sense: WordSense) => void;
}

export const WordSenseSelector: React.FC<Props> = ({ 
  word, 
  senses, 
  selectedSense, 
  onSelect 
}) => {
  // Track which sense is being hovered
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ 
        fontSize: '1.125rem',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '1rem'
      }}>
        Select meaning for "{word}"
      </h3>
      
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxHeight: '28rem',
        overflowY: 'auto',
        paddingRight: '0.5rem'
      }}>
        {senses.map((sense) => {
          const isSelected = selectedSense?.synset_id === sense.synset_id;
          const isHovered = hoveredId === sense.synset_id;

          return (
            <div
              key={sense.synset_id}
              onClick={() => onSelect(sense)}
              onMouseEnter={() => setHoveredId(sense.synset_id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                border: `2px solid ${isSelected ? '#3b82f6' : isHovered ? '#93c5fd' : '#e5e7eb'}`,
                backgroundColor: isSelected ? '#eff6ff' : isHovered ? '#f8fafc' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isHovered ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none'
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelect(sense);
                }
              }}
            >
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px'
                }}>
                  {sense.category}
                </span>
                {isSelected && (
                  <span style={{ color: '#3b82f6' }}>✓</span>
                )}
              </div>
              
              <p style={{ 
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                {sense.definition}
              </p>
              
              {sense.examples.length > 0 && (
                <p style={{ 
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  fontStyle: 'italic'
                }}>
                  Example: "{sense.examples[0]}"
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};