import React from 'react';

export const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.97] select-none';

  const variants = {
  primary:
    'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 focus:ring-violet-500',

  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 hover:border-slate-300 shadow-sm',

  destructive:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/25 focus:ring-rose-500',

  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-violet-50 hover:border-violet-500 hover:text-violet-700',

  ghost:
    'text-slate-700 hover:bg-slate-100 hover:text-violet-700',

  link:
    'text-violet-600 hover:text-violet-700 underline-offset-4 hover:underline',
};

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-7 py-3 gap-2.5',
  };

  const selectedVariant = variants[variant] || variants.primary;
  const selectedSize = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      className={`${baseStyle} ${selectedVariant} ${selectedSize} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};