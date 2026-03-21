import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';
import { AwardResource } from '@/types/generated.d';
import { cn } from '@/lib/utils';
import { Award, DollarSign, Gift } from 'lucide-react';

interface AwardBadgeProps {
  award: AwardResource;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export default function AwardBadge({ award, variant = 'default', className = '' }: AwardBadgeProps) {


  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (variant === 'compact') {
    return (
      <Badge
        variant="outline"
        className={cn('gap-1', getPositionColor(award.attributes.position), className)}
      >
        <Award className="h-3 w-3" />
        #{award.attributes.position}
        {award.attributes.isMonetary && award.attributes.amount && (
          <>
            • {formatCurrency(award.attributes.amount, award.attributes.currency)}
          </>
        )}
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn('font-mono', getPositionColor(award.attributes.position))}
          >
            #{award.attributes.position}
          </Badge>
          <span className="font-medium">{award.attributes.title}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {award.attributes.isMonetary ? (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {award.attributes.amount
                ? formatCurrency(award.attributes.amount, award.attributes.currency)
                : 'Monetary award'
              }
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Gift className="h-3 w-3" />
              Non-monetary award
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-2 text-sm px-3 py-1',
        getPositionColor(award.attributes.position),
        className
      )}
    >
      <Award className="h-4 w-4" />
      <span className="font-medium">{award.attributes.title}</span>
      {award.attributes.isMonetary && award.attributes.amount && (
        <>
          <span>•</span>
          <span className="font-mono">
            {formatCurrency(award.attributes.amount, award.attributes.currency)}
          </span>
        </>
      )}
    </Badge>
  );
}
