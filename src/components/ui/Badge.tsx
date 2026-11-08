import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'blue' | 'red' | 'slate' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'md',
  className,
  dot = false
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25',
    blue: 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20',
    red: 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/20',
    slate: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
    purple: 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/20'
  };

  const dotColors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    slate: 'bg-slate-400',
    purple: 'bg-purple-500'
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 font-medium rounded-full border',
          size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
          variantStyles[variant],
          className
        )
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};

