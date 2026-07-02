import React from 'react';

export const Progress = ({ value = 0, className = '', animated = true, ...props }) => {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner ${className}`}
      {...props}
    >
      <div
        className={`bg-gradient-to-r from-brand-500 to-brand-600 h-full rounded-full ${
          animated ? 'transition-all duration-700 ease-out' : ''
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};