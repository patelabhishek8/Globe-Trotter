import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-surface border border-dashed border-borderLight rounded-card-lg my-4">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand flex items-center justify-center mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-ink-primary mb-1">{title}</h3>
      <p className="text-sm text-ink-secondary max-w-md mb-6">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} leftIcon={actionIcon}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
