import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  className = '',
  type = 'text',
  id,
  ...props
}, ref) => {
  return (
    <div className="w-full mb-4">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={id}
        className={`w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white transition-all duration-200 ${
          error ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'hover:border-slate-300 dark:hover:border-slate-600'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';