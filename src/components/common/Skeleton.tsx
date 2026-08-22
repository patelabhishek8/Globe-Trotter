import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
}) => {
  const variantStyles = {
    text: 'h-4 rounded-md',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  return (
    <div
      className={clsx(
        'animate-pulse bg-slate-200/80',
        variantStyles[variant],
        className
      )}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-surface rounded-card p-4 border border-borderLight shadow-subtle space-y-3">
    <Skeleton className="h-44 w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="pt-2 flex justify-between items-center border-t border-borderLight/60">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  </div>
);
