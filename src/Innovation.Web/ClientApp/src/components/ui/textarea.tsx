import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onFocus, onBlur, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasError = ariaInvalid === 'true' || ariaInvalid === true;

    const getBorderColor = () => {
      if (hasError) return 'var(--destructive)';
      if (isFocused) return 'var(--secondary)';
      return 'var(--border)';
    };

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-alinma-sm border-2 px-3 py-2 text-sm font-sans transition-all duration-200 outline-none',
          'placeholder:text-muted-foreground selection:bg-accent selection:text-accent-foreground',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        style={{
          borderColor: getBorderColor(),
          backgroundColor: 'var(--background)',
          ...(isFocused &&
            !hasError && {
              outline: '2px solid rgba(var(--secondary-rgb), 0.2)',
            }),
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-invalid={ariaInvalid}
        ref={ref}
        data-testid="textarea"
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
