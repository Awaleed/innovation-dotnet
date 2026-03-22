import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BaseButtonProps = React.ComponentProps<typeof Button>;

interface MockButtonProps extends BaseButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const _appendAlpha = (hex: string, alpha: number): string => {
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

export const MockButton = React.forwardRef<HTMLButtonElement, MockButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-slate-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const sizeStyles = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    // Map variant to existing Button component
    const buttonVariant =
      variant === 'destructive'
        ? 'destructive'
        : variant === 'outline'
          ? 'outline'
          : variant === 'secondary'
            ? 'secondary'
            : variant === 'ghost'
              ? 'ghost'
              : variant === 'link'
                ? 'link'
                : 'default';

    return (
      <Button
        ref={ref}
        variant={buttonVariant}
        className={cn(baseStyles, sizeStyles[props.size || 'default'], className)}
        style={{
          ...(variant === 'default' && {
            backgroundColor: 'var(--secondary)',
            boxShadow: '0 12px 20px -5px rgba(var(--secondary-rgb), 0.35)',
          }),
          ...(variant === 'destructive' && {
            backgroundColor: 'var(--destructive)',
            boxShadow: '0 12px 20px -5px rgba(var(--destructive-rgb), 0.35)',
          }),
          ...(variant === 'outline' && {
            color: 'var(--secondary)',
            borderColor: 'var(--secondary)',
          }),
          ...(variant === 'secondary' && {
            backgroundColor: 'var(--muted)',
            color: 'var(--primary)',
            boxShadow: '0 12px 18px -8px rgba(var(--muted-rgb), 0.4)',
          }),
          ...(variant === 'secondary' &&
            props.disabled && {
              backgroundColor: 'var(--muted)',
              color: 'rgba(var(--primary-rgb), 0.65)',
            }),
          ...(variant === 'ghost' && {
            color: 'var(--secondary)',
          }),
          ...(variant === 'link' && {
            color: 'var(--secondary)',
          }),
        }}
        {...props}
      />
    );
  },
);
MockButton.displayName = 'MockButton';
