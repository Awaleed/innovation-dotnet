import { BrandColor, SemanticColor } from '@/types/brand';

/**
 * Brand Color Utilities
 *
 * Utility functions for working with theme-aware brand colors.
 * Colors are resolved dynamically from the current theme configuration.
 *
 * Note: getBrandColor() uses static fallback colors. For React components,
 * use useBrandColor() hook to get theme-aware colors.
 */

/**
 * Static color fallback (Alinma defaults)
 * Used when theme context is not available (SSR, non-React contexts)
 */
const staticColors: Record<string, string> = {
  // Semantic colors (Alinma defaults)
  primary: '#0C2337',
  secondary: '#8B84D7',
  accent: '#CE654B',
  muted: '#E7E5F7',
  destructive: '#CE654B',
  background: '#F0EBE0',
  foreground: '#0C2337',
  border: '#CFCCEF',
  ring: '#8B84D7',
  // Theme-specific colors (backward compatibility)
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
};

/**
 * Get brand color HEX value (static fallback)
 *
 * For React components, prefer useBrandColor() hook for theme-aware colors.
 * This function uses static fallback colors and works in non-React contexts.
 *
 * @param color - Semantic color name (e.g., 'primary', 'secondary') or theme-specific color name
 * @returns HEX color value
 */
export function getBrandColor(color: BrandColor): string {
  return staticColors[color] ?? '#0C2337';
}

/**
 * Get brand color CSS variable name
 * Maps semantic colors to CSS variable names
 */
export function getBrandColorVar(color: BrandColor): string {
  // Map semantic colors to CSS variables
  const semanticVarMap: Record<SemanticColor, string> = {
    primary: '--primary',
    secondary: '--secondary',
    accent: '--accent',
    muted: '--muted',
    destructive: '--destructive',
    background: '--background',
    foreground: '--foreground',
    border: '--border',
    ring: '--ring',
  };

  // Check if it's a semantic color
  if (color in semanticVarMap) {
    return semanticVarMap[color as SemanticColor];
  }

  // Map theme-specific colors (for backward compatibility)
  const themeVarMap: Record<string, string> = {
    'alinma-deep-blue': '--alinma-deep-blue',
    lavender: '--lavender',
    'light-lavender': '--light-lavender',
    'soft-lavender': '--soft-lavender',
    'heritage-brown': '--heritage-brown',
    copper: '--copper',
    'light-copper': '--light-copper',
    'warm-white': '--warm-white',
    'off-white': '--off-white',
    'private-black': '--alinma-black',
    'desert-rose': '--desert-rose',
    white: '--white',
  };

  return themeVarMap[color] ?? '--primary';
}

/**
 * Get brand color as CSS variable reference
 */
export function getBrandColorCssVar(color: BrandColor): string {
  return `var(${getBrandColorVar(color)})`;
}

/**
 * Convert HEX to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1] ?? '0', 16),
        g: parseInt(result[2] ?? '0', 16),
        b: parseInt(result[3] ?? '0', 16),
      }
    : null;
}

/**
 * Convert RGB to HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Validate if a color is an approved brand color
 */
export function isValidBrandColor(color: string): color is BrandColor {
  // Check semantic colors
  const semanticColors: SemanticColor[] = [
    'primary',
    'secondary',
    'accent',
    'muted',
    'destructive',
    'background',
    'foreground',
    'border',
    'ring',
  ];

  if (semanticColors.includes(color as SemanticColor)) {
    return true;
  }

  // Check theme-specific colors (for backward compatibility)
  const themeColors = [
    'alinma-deep-blue',
    'lavender',
    'light-lavender',
    'soft-lavender',
    'heritage-brown',
    'copper',
    'light-copper',
    'warm-white',
    'off-white',
    'private-black',
    'desert-rose',
    'white',
  ];

  return themeColors.includes(color);
}

/**
 * Get color contrast ratio (for accessibility)
 * Returns ratio between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const [r = 0, g = 0, b = 0] = [rgb.r, rgb.g, rgb.b].map((val) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG AA contrast requirements
 */
export function meetsWCAGAA(color1: string, color2: string): boolean {
  const ratio = getContrastRatio(color1, color2);
  return ratio >= 4.5; // WCAG AA standard for normal text
}

/**
 * Get luminance of a color (0-1 scale)
 * Returns relative luminance according to WCAG standards
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r = 0, g = 0, b = 0] = [rgb.r, rgb.g, rgb.b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Check if a color is dark (luminance < 0.5)
 * Useful for determining text color on backgrounds
 */
export function isDarkColor(hex: string): boolean {
  return getLuminance(hex) < 0.5;
}

/**
 * Check if a color is light (luminance >= 0.5)
 * Useful for determining text color on backgrounds
 */
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) >= 0.5;
}

/**
 * Get appropriate text color (white or black) for a given background color
 * Returns '#FFFFFF' for dark backgrounds, '#000000' for light backgrounds
 */
export function getContrastTextColor(backgroundColor: string): string {
  return isDarkColor(backgroundColor) ? '#FFFFFF' : '#000000';
}
