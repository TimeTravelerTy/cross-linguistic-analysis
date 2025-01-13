import React from 'react';

interface ProgressButtonProps {
    onClick: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    progress?: number;
    children: React.ReactNode;
  }
  
const ProgressButton = ({
    onClick,
    disabled,
    isLoading,
    progress,
    children
  }: ProgressButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        relative overflow-hidden px-8 py-3 rounded-lg font-medium transition-colors
        ${disabled || isLoading 
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
        }
      `}
    >
      {/* Progress bar */}
      {isLoading && (
        <div 
          className="absolute left-0 top-0 bottom-0 bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      )}
      
      {/* Content container to ensure text stays above progress bar */}
      <div className="relative">
        {isLoading ? `Comparing... ${progress}%` : children}
      </div>
    </button>
  );
};

export default ProgressButton;