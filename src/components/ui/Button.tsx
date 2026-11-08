import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 ease-out select-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[46px]'
  };

  const variantStyles = {
    primary:
      'bg-plantation-700 hover:bg-plantation-800 active:bg-plantation-900 text-white shadow-sm border border-plantation-600/30 focus-visible:ring-plantation-600 dark:bg-plantation-600 dark:hover:bg-plantation-500',
    secondary:
      'bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-800 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60',
    outline:
      'bg-transparent hover:bg-slate-100/60 active:bg-slate-200/60 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
    ghost:
      'bg-transparent hover:bg-slate-100 active:bg-slate-200/80 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60',
    destructive:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-red-500/30 shadow-sm focus-visible:ring-red-600',
    glass:
      'bg-white/70 hover:bg-white/90 active:bg-white text-slate-900 dark:bg-slate-800/70 dark:hover:bg-slate-800/90 dark:text-white backdrop-blur-md border border-white/60 dark:border-white/10 shadow-subtle-card'
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Chargement...</span>
        </span>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

