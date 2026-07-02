import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-200';

  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
    primary: 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-200 dark:border-brand-900 hover:bg-brand-100 dark:hover:bg-brand-950/70',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/60',
    error: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950/60',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-950/60',
    info: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-950/60',
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span className={`${baseStyle} ${selectedVariant} ${className}`} {...props}>
      {children}
    </span>
  );
};