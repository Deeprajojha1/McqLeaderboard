import React from 'react';

export const Table = ({ children, className = '', ...props }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <table className={`w-full text-left text-sm border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children, className = '', ...props }) => {
  return (
    <thead className={`bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, className = '', ...props }) => {
  return (
    <tbody className={`divide-y divide-slate-100 dark:divide-slate-800/60 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow = ({ children, className = '', ...props }) => {
  return (
    <tr
      className={`transition-colors duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({ children, className = '', ...props }) => {
  return (
    <th className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${className}`} {...props}>
      {children}
    </th>
  );
};

export const TableCell = ({ children, className = '', ...props }) => {
  return (
    <td className={`px-4 py-3.5 align-middle text-slate-700 dark:text-slate-300 ${className}`} {...props}>
      {children}
    </td>
  );
};

// New animated table row component for staggered entry
export const AnimatedTableRow = ({ children, index = 0, className = '', ...props }) => {
  return (
    <tr
      className={`transition-colors duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 animate-fade-in-up ${className}`}
      style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'both' }}
      {...props}
    >
      {children}
    </tr>
  );
};