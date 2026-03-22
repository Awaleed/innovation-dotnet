/**
 * Brand Type Definitions
 *
 * Type definitions for brand components and utilities.
 * Supports semantic color names that map to theme-specific colors.
 */

/**
 * Semantic color names that work across all themes
 */
export type SemanticColor =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'muted'
  | 'destructive'
  | 'background'
  | 'foreground'
  | 'border'
  | 'ring';

/**
 * Theme-specific color names (for backward compatibility)
 * These may not exist in all themes
 */
export type ThemeSpecificColor =
  | 'alinma-deep-blue'
  | 'lavender'
  | 'light-lavender'
  | 'soft-lavender'
  | 'heritage-brown'
  | 'copper'
  | 'light-copper'
  | 'warm-white'
  | 'off-white'
  | 'private-black'
  | 'desert-rose'
  | 'white';

/**
 * All color names (semantic + theme-specific)
 */
export type BrandColor = SemanticColor | ThemeSpecificColor;

/**
 * Theme configuration interface
 */
export interface ThemeColors {
  [key: string]: string;
}

export interface ThemeFonts {
  heading: {
    arabic: string;
    english: string;
    fallback: string;
  };
  body: {
    arabic: string;
    english: string;
    fallback: string;
  };
  preload?: string[];
  google_fonts?: string[];
}

export interface ThemeLogos {
  bilingual: string;
  arabic: string;
  english: string;
  shorthand: string;
  shorthand_white?: string;
  'shorthand-white'?: string;
  full_white?: string;
  'full-white'?: string;
  [key: string]: string | undefined;
}

export interface ThemeElements {
  [componentName: string]: string;
}

export interface ThemeTabs {
  indicatorColor?: string; // Color for active tab indicator (defaults to 'primary')
  autoContrast?: boolean; // Automatically adjust text color based on indicator darkness (defaults to true)
}

export interface ThemeConfig {
  name: string;
  displayName?: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  logos: ThemeLogos;
  elements?: ThemeElements;
  tabs?: ThemeTabs;
  effects?: string[];
  css?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
}

export type IconVariant = 'functional' | 'expressive';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface IconProps {
  name: string;
  variant?: IconVariant;
  size?: IconSize;
  color?: BrandColor | string;
  className?: string;
}

/**
 * Brand color palette with HEX values
 * All values must match brand.txt exactly
 */
export const BRAND_COLORS: Partial<Record<BrandColor, string>> = {
  'alinma-deep-blue': '#0C2337',
  lavender: '#8B84D7',
  'light-lavender': '#CFCCEF',
  'soft-lavender': '#E7E5F7',
  'heritage-brown': '#623B2A',
  copper: '#CE654B',
  'light-copper': '#FFA38B',
  'warm-white': '#F0EBE0',
  'off-white': '#FCF4EF',
  'private-black': '#121935',
  'desert-rose': '#BE8E85',
  white: '#FFFFFF',
} as const;
