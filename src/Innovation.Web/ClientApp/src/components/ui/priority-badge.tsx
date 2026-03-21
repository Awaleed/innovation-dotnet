import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { IdeaPriority } from '@/types/generated.d';
import { getPriorityColor, getPriorityLabel } from '@/lib/enums/idea-priority';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: IdeaPriority | null | undefined;
  className?: string;
  variant?: 'default' | 'outline';
  showLabel?: boolean;
}

const priorityColorClasses = {
  red: {
    default: 'bg-red-500 text-white border-transparent',
    outline: 'border-red-500 text-red-700 dark:text-red-400',
  },
  yellow: {
    default: 'bg-yellow-500 text-white border-transparent',
    outline: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
  },
  gray: {
    default: 'bg-gray-500 text-white border-transparent',
    outline: 'border-gray-500 text-gray-700 dark:text-gray-400',
  },
};

export function PriorityBadge({
  priority,
  className,
  variant = 'default',
  showLabel = true,
}: PriorityBadgeProps) {
  if (!priority) {
    return showLabel ? (
      <Badge variant="outline" className={cn('text-muted-foreground', className)}>
        غير مقيّم
      </Badge>
    ) : null;
  }

  const color = getPriorityColor(priority);
  const label = getPriorityLabel(priority);
  const colorClasses = priorityColorClasses[color as keyof typeof priorityColorClasses];

  return (
    <Badge
      className={cn(
        variant === 'default' ? colorClasses.default : colorClasses.outline,
        className
      )}
    >
      {showLabel && label}
    </Badge>
  );
}
