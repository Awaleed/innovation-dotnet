import * as React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface MockLabelProps extends React.ComponentProps<typeof Label> {}

export const MockLabel = React.forwardRef<HTMLLabelElement, MockLabelProps>(
    ({ className, ...props }, ref) => {
        return (
            <Label
                ref={ref}
                className={cn(
                    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-200',
                    className
                )}
                {...props}
            />
        );
    }
);
MockLabel.displayName = 'MockLabel';

