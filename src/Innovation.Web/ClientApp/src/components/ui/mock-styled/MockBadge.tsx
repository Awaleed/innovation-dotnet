import * as React from 'react';
import { BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MockBadgeProps extends Omit<BadgeProps, 'variant'> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

const appendAlpha = (hex: string, alpha: number): string => {
    const normalizedHex = hex.replace('#', '');
    if (normalizedHex.length !== 6) {
        return hex;
    }
    const clamped = Math.max(0, Math.min(1, alpha));
    const alphaHex = Math.round(clamped * 255)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase();
    return `#${normalizedHex}${alphaHex}`;
};

export const MockBadge = React.forwardRef<HTMLDivElement, MockBadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const baseClasses = `inline-flex items-center rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary`;

        return (
            <div
                ref={ref}
                className={cn(baseClasses, className)}
                style={{
                    ...(variant === 'default' && {
                        backgroundColor: 'var(--secondary)',
                        color: '#FFFFFF',
                        borderColor: 'transparent',
                    }),
                    ...(variant === 'secondary' && {
                        backgroundColor: 'var(--muted)',
                        color: 'var(--primary)',
                        borderColor: 'transparent',
                    }),
                    ...(variant === 'destructive' && {
                        backgroundColor: 'var(--destructive)',
                        color: '#FFFFFF',
                        borderColor: 'transparent',
                    }),
                    ...(variant === 'outline' && {
                        borderColor: 'var(--secondary)',
                        color: 'var(--secondary)',
                        backgroundColor: 'transparent',
                    }),
                    ...(variant === 'success' && {
                        backgroundColor: appendAlpha('#10B981', 0.15),
                        color: '#10B981',
                        borderColor: 'transparent',
                    }),
                }}
                {...props}
            />
        );
    }
);
MockBadge.displayName = 'MockBadge';

