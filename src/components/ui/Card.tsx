import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'subtle';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'glass',
  interactive = false,
  ...props
}) => {
  const variantStyles = {
    glass: 'glass-card',
    solid:
      'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm',
    subtle:
      'bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60'
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl p-5 transition-all duration-200 ease-out',
          variantStyles[variant],
          interactive &&
            'cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

