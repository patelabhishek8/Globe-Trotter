import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  padding = 'md',
  className,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'bg-surface border border-borderLight rounded-card shadow-card overflow-hidden',
          hoverable && 'transition-all duration-200 hover:shadow-card-hover hover:border-brand-200/80 cursor-pointer',
          paddingStyles[padding],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
