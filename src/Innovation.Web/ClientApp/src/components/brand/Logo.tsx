import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { isDarkColor } from '@/lib/utils/brand-colors';
import { ImgHTMLAttributes, useMemo } from 'react';

export type LogoVariant = 'bilingual' | 'arabic' | 'english' | 'shorthand';
export type LogoSize = 'small' | 'medium' | 'large' | number;

interface LogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  variant?: LogoVariant;
  size?: LogoSize;
  theme?: 'light' | 'dark'; // Theme mode (light/dark), not the theme config
  noPadding?: boolean; // Disable clear space padding (for sidebars/constrained spaces)
}

/**
 * Alinma Brandmark Logo Component
 *
 * Implements the official Alinma brandmark according to brand guidelines.
 *
 * Variants:
 * - bilingual: Horizontal bilingual layout (Arabic + English) - Primary
 * - arabic: Arabic-only horizontal layout
 * - english: English-only horizontal layout
 * - shorthand: Emblem only - Only for mobile app icons and space-constrained contexts
 *
 * Size Requirements:
 * - Standard: Minimum emblem height of 35px or 4mm
 * - Vertical lockups: Minimum size of 45px or 8mm
 *
 * Clear Space: Half the height of the emblem must be maintained around all sides
 *
 * @see brand.txt for complete brandmark usage guidelines
 */
export default function Logo({
  variant = 'bilingual',
  size = 'medium',
  theme: themeMode,
  noPadding = false,
  className,
  ...props
}: LogoProps) {
  // Map size to pixel values
  const getSizeValue = (size: LogoSize): number => {
    if (typeof size === 'number') {
      return size;
    }
    switch (size) {
      case 'small':
        return 35; // Minimum standard size
      case 'medium':
        return 40;
      case 'large':
        return 120;
      default:
        return 60;
    }
  };

  const sizeValue = getSizeValue(size);

  // Get theme-aware logo paths
  const themeConfig = useTheme();

  // Auto-detect sidebar darkness if themeMode is not explicitly provided
  const finalThemeMode = useMemo<'light' | 'dark'>(() => {
    if (themeMode !== undefined) {
      return themeMode;
    }

    // Try to get sidebar color from CSS variables
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const sidebarColor = getComputedStyle(root).getPropertyValue('--sidebar').trim();
      if (sidebarColor) {
        return isDarkColor(sidebarColor) ? 'dark' : 'light';
      }
    }

    // Fallback: check theme config
    const sidebarColorFromConfig = themeConfig.css?.light?.['--sidebar'] || '#1B1717';
    return isDarkColor(sidebarColorFromConfig) ? 'dark' : 'light';
  }, [themeMode, themeConfig.css?.light]);

  // Determine logo asset path based on variant and theme
  const getLogoPath = (variant: LogoVariant, mode: 'light' | 'dark'): string => {
    const logos = themeConfig.logos;

    // Helper to get logo with fallback for both naming conventions (dash and underscore)
    // Uses bracket notation to access keys with dashes
    const getLogo = (key: string): string | undefined => {
      // Try exact key first using bracket notation (handles dashes)
      if (logos[key]) {
        return logos[key];
      }
      // Try with underscore if key has dash
      if (key.includes('-')) {
        const underscoreKey = key.replace(/-/g, '_');
        if (logos[underscoreKey]) {
          return logos[underscoreKey];
        }
      }
      // Try with dash if key has underscore
      if (key.includes('_')) {
        const dashKey = key.replace(/_/g, '-');
        if (logos[dashKey]) {
          return logos[dashKey];
        }
      }
      return undefined;
    };

    // For shorthand, use white version on dark theme (sidebar)
    if (variant === 'shorthand') {
      if (mode === 'dark') {
        // Always use logo-shorthand-white.svg in sidebar (dark theme)
        const shorthandWhite = getLogo('shorthand-white') || getLogo('shorthand_white');
        if (shorthandWhite) {
          return shorthandWhite;
        }
        // Fallback to regular shorthand if white version not found
        return logos.shorthand || '/assets/images/brand/logo-shorthand-white.svg';
      }
      return logos.shorthand || '/assets/images/brand/logo-shorthand.svg';
    }

    // For full logos (bilingual, arabic, english), use white version on dark theme (sidebar)
    // Sidebar always uses light/white versions for better contrast on dark backgrounds
    if (mode === 'dark') {
      // Always use logo-full-white.svg for all full logo variants in sidebar
      const fullWhite = getLogo('full-white') || getLogo('full_white');
      if (fullWhite) {
        return fullWhite;
      }
      // Fallback: use full-white logo for all variants when in dark mode (sidebar)
      // This ensures we always use a light version in the sidebar
      return '/assets/images/brand/logo-full-white.svg';
    }

    // Light theme - use colored versions
    switch (variant) {
      case 'bilingual':
        return logos.bilingual;
      case 'arabic':
        return logos.arabic;
      case 'english':
        return logos.english;
      default:
        return logos.bilingual;
    }
  };

  // Calculate clear space (half of emblem height)
  // Can be disabled for sidebars or constrained spaces
  const clearSpace = noPadding ? 0 : sizeValue * 0.5;

  // Ensure minimum size requirements
  const minSize = variant === 'shorthand' ? 35 : 35;
  const actualSize = Math.max(sizeValue, minSize);

  // For shorthand (square/emblem), use square container
  // For landscape logos, use width-based sizing with auto height
  const isShorthand = variant === 'shorthand';

  return (
    <div
      className={cn('inline-flex items-center justify-center', className)}
      style={
        isShorthand
          ? {
              padding: `${clearSpace}px`,
              minWidth: `${actualSize + clearSpace * 2}px`,
              minHeight: `${actualSize + clearSpace * 2}px`,
            }
          : {
              padding: `${clearSpace}px 0`,
              minHeight: `${actualSize + clearSpace * 2}px`,
            }
      }
      {...props}
    >
      <img
        src={getLogoPath(variant, finalThemeMode)}
        alt={`${themeConfig.displayName || 'Logo'}`}
        style={{
          width: isShorthand ? `${actualSize}px` : undefined,
          height: isShorthand ? `${actualSize}px` : `${actualSize}px`,
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
        onError={(e) => {
          // Fallback to placeholder if asset not found
          const target = e.target as HTMLImageElement;
          const logoPath = getLogoPath(variant, finalThemeMode);
          console.warn(
            `Logo not found: ${logoPath}. Theme: ${themeConfig.name}, Variant: ${variant}, Mode: ${finalThemeMode}`,
          );

          // Try fallback to default logo
          // if (logoPath !== '/assets/images/brand/logo-bilingual.svg') {
          //     target.src = '/assets/images/brand/logo-bilingual.svg';
          //     return;
          // }

          // Last resort: show placeholder
          target.style.display = 'none';
          const placeholder = document.createElement('div');
          placeholder.className =
            'flex items-center justify-center bg-gray-100 text-gray-400 text-xs rounded';
          placeholder.style.width = `${actualSize}px`;
          placeholder.style.height = isShorthand ? `${actualSize}px` : 'auto';
          placeholder.textContent = themeConfig.displayName?.substring(0, 1).toUpperCase() || 'L';
          target.parentElement?.appendChild(placeholder);
        }}
      />
    </div>
  );
}
