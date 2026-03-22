interface AwardResource {
  id: number;
  attributes: {
    position: number;
    title: string;
    description?: string;
    isMonetary: boolean;
    isActive: boolean;
    amount?: number;
    currency?: string;
  };
}
import { Award } from 'lucide-react';
import AwardCard from './award-card';
import { Card, CardContent } from './card';

interface AwardListProps {
    awards: AwardResource[];
    showActions?: boolean;
    emptyMessage?: string;
    className?: string;
    gridCols?: {
        default?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
}

export default function AwardList({
    awards,
    showActions = true,
    emptyMessage,
    className = '',
    gridCols = { default: 1, md: 2, lg: 3 },
}: AwardListProps) {
    
    

    const defaultEmptyMessage = emptyMessage || 'No awards found';

    // Build grid class string
    const gridClasses = Object.entries(gridCols)
        .map(([breakpoint, cols]) => {
            if (breakpoint === 'default') {
                return `grid-cols-${cols}`;
            }
            return `${breakpoint}:grid-cols-${cols}`;
        })
        .join(' ');

    if (awards.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Award className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Awards</h3>
                    <p className="text-sm text-muted-foreground">{defaultEmptyMessage}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={`grid gap-4 ${gridClasses} ${className}`}>
            {awards.map((award) => (
                <AwardCard
                    key={award.id}
                    award={award}
                    showActions={showActions}
                />
            ))}
        </div>
    );
}