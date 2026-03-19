import { usePage } from '@inertiajs/react';
import { ThemeConfig } from '@/types/brand';

/**
 * Hook to access current theme configuration from Inertia shared props
 */
export function useTheme(): ThemeConfig {
    const { theme } = usePage<{ theme: ThemeConfig }>().props;

    if (!theme) {
        // Fallback to default theme if not provided
        return {
            name: 'alinma',
            displayName: 'Alinma Bank',
            colors: {},
            fonts: {
                heading: {
                    arabic: 'DIN Next LT Arabic',
                    english: 'Tahoma',
                    fallback: 'sans-serif',
                },
                body: {
                    arabic: 'IBM Plex Sans Arabic',
                    english: 'Tahoma',
                    fallback: 'sans-serif',
                },
            },
            logos: {
                bilingual: '/assets/images/brand/logo-bilingual.svg',
                arabic: '/assets/images/brand/logo-arabic.svg',
                english: '/assets/images/brand/logo-english.svg',
                shorthand: '/assets/images/brand/logo-shorthand.svg',
            },
            elements: {},
            tabs: {
                indicatorColor: 'primary',
                autoContrast: true,
            },
        };
    }

    return theme;
}

/**
 * Get a color value from the current theme
 */
export function useThemeColor(colorName: string): string | undefined {
    const theme = useTheme();
    return theme.colors[colorName];
}
