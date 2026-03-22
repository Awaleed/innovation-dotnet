import { Button } from '@/components/ui/button';
import {
  enhanceComponent,
  buttonVariants,
  hoverEffects,
  animations,
} from '@/lib/component-enhancements';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface EnhancedButtonProps extends React.ComponentProps<'button'> {
  /**
   * Base shadcn variant
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

  /**
   * Base shadcn size
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';

  /**
   * Enhanced variant for modern styling
   */
  enhancedVariant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'link';

  /**
   * Modern hover effect
   */
  hoverEffect?: 'lift' | 'glow' | 'slide' | 'fade' | 'modern' | 'none';

  /**
   * Animation on mount/interaction
   */
  animation?:
    | 'fadeIn'
    | 'slideIn'
    | 'scaleIn'
    | 'slideUp'
    | 'slideDown'
    | 'slideLeft'
    | 'slideRight'
    | 'none';

  /**
   * Enhanced shadow
   */
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | 'modern' | 'elevated' | 'glass' | 'none';

  /**
   * Whether to apply modern enhancements
   */
  modern?: boolean;

  /**
   * Whether to render as child component
   */
  asChild?: boolean;
}

/**
 * Enhanced Button component with modern styling
 *
 * This component extends the base shadcn Button with modern enhancements
 * while maintaining full compatibility with the original API.
 */
const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      enhancedVariant,
      hoverEffect = 'modern',
      animation = 'none',
      shadow = 'modern',
      modern = true,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    // Build enhancement classes
    const enhancementClasses: Record<string, string> = modern
      ? {
          variant: enhancedVariant ? String(buttonVariants[enhancedVariant] ?? '') : '',
          size: buttonVariants.size[size as keyof typeof buttonVariants.size] ?? '',
          animation: animation !== 'none' ? (animations[animation] ?? '') : '',
          hover: hoverEffect !== 'none' ? (hoverEffects[hoverEffect] ?? '') : '',
          shadow: shadow !== 'none' ? `shadow-${shadow}` : '',
        }
      : {};

    // Apply enhancements
    const enhancedClassName = modern
      ? enhanceComponent(className || '', enhancementClasses)
      : className;

    return (
      <Button
        ref={ref}
        className={cn(
          // Base shadcn classes are preserved
          enhancedClassName,
        )}
        variant={variant}
        size={size}
        asChild={asChild}
        {...props}
      />
    );
  },
);

EnhancedButton.displayName = 'EnhancedButton';

export { EnhancedButton, type EnhancedButtonProps };
