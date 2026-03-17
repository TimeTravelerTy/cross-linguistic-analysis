import React from 'react';

interface ProgressButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  progress?: number;
  children: React.ReactNode;
}

const ProgressButton = ({ onClick, disabled, isLoading, progress, children }: ProgressButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled || isLoading}
    className={[
      'relative overflow-hidden rounded-full px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] transition-all',
      disabled || isLoading
        ? 'cursor-not-allowed bg-stone-300 text-stone-600'
        : 'bg-stone-50 text-sky-950 shadow-[0_12px_30px_rgba(12,25,34,0.28)] hover:-translate-y-0.5 hover:bg-white',
    ].join(' ')}
  >
    {isLoading && (
      <div
        className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,rgba(217,163,77,0.85),rgba(248,214,148,0.9))] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    )}
    <div className="relative">{isLoading ? `Comparing ${progress}%` : children}</div>
  </button>
);

export default ProgressButton;
