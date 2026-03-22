import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { enhanceComponent, cardVariants, hoverEffects, animations, spacing, shadows } from '@/lib/component-enhancements';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Enhanced variant for modern styling
   */
  variant?: 'default' | 'glass' | 'elevated' | 'bordered' | 'flat';
  
  /**
   * Modern hover effect
   */
  hoverEffect?: 'lift' | 'glow' | 'slide' | 'fade' | 'modern' | 'none';
  
  /**
   * Animation on mount
   */
  animation?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'none';
  
  /**
   * Enhanced shadow
   */
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | 'modern' | 'elevated' | 'glass' | 'none';
  
  /**
   * Spacing variant
   */
  spacing?: 'section' | 'card' | 'compact' | 'tight' | 'loose';
  
  /**
   * Whether to apply modern enhancements
   */
  modern?: boolean;
}

/**
 * Enhanced Card component with modern styling
 * 
 * This component extends the base shadcn Card with modern enhancements
 * while maintaining full compatibility with the original API.
 */
const EnhancedCard = forwardRef<HTMLDivElement, EnhancedCardProps>(
  (
    {
      className,
      variant = 'default',
      hoverEffect = 'modern',
      animation = 'fadeIn',
      shadow = 'modern',
      spacing: spacingVariant = 'card',
      modern = true,
      ...props
    },
    ref
  ) => {
    // Build enhancement classes
    const enhancementClasses: Record<string, string> = modern ? {
      variant: cardVariants[variant] ?? '',
      animation: animation !== 'none' ? (animations[animation] ?? '') : '',
      hover: hoverEffect !== 'none' ? (hoverEffects[hoverEffect] ?? '') : '',
      shadow: shadow !== 'none' ? (shadows[shadow] ?? '') : '',
      spacing: spacing[spacingVariant] ?? '',
    } : {};

    // Apply enhancements
    const enhancedClassName = modern 
      ? enhanceComponent(className || '', enhancementClasses)
      : className;

    return (
      <Card
        ref={ref}
        className={cn(
          // Base shadcn classes are preserved
          enhancedClassName
        )}
        {...props}
      />
    );
  }
);

EnhancedCard.displayName = 'EnhancedCard';

// Enhanced sub-components
const EnhancedCardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <CardHeader
      ref={ref}
      className={cn('flex flex-col space-y-1.5', className)}
      {...props}
    />
  )
);
EnhancedCardHeader.displayName = 'CardHeader';

const EnhancedCardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <CardTitle
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
EnhancedCardTitle.displayName = 'CardTitle';

const EnhancedCardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <CardDescription
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
EnhancedCardDescription.displayName = 'CardDescription';

const EnhancedCardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <CardContent
      ref={ref}
      className={cn('pt-6', className)}
      {...props}
    />
  )
);
EnhancedCardContent.displayName = 'CardContent';

const EnhancedCardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <CardFooter
      ref={ref}
      className={cn('flex items-center pt-6', className)}
      {...props}
    />
  )
);
EnhancedCardFooter.displayName = 'CardFooter';

export {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardTitle,
  EnhancedCardDescription,
  EnhancedCardContent,
  EnhancedCardFooter,
  type EnhancedCardProps,
};
