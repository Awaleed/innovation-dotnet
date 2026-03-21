import React, { createContext, useContext, ReactNode } from 'react';
import { ThemeConfig } from '@/types/brand';
import { useTheme } from '@/hooks/use-theme';
import { getBrandColor } from '@/lib/utils/brand-colors';

interface ThemeContextValue {
    theme: ThemeConfig;
    getColor: (colorName: string) => string;
    getLogo: (logoName: keyof ThemeConfig['logos']) => string;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

/**
 * Theme Provider
 *
 * Provides theme configuration and utilities to child components.
 * Wraps the application to make theme data available throughout.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
    const theme = useTheme();

    const getColor = (colorName: string): string => {
        return theme.colors[colorName] || getBrandColor(colorName as Parameters<typeof getBrandColor>[0]);
    };

    const getLogo = (logoName: keyof ThemeConfig['logos']): string => {
        return theme.logos[logoName] || theme.logos.bilingual;
    };

    const value: ThemeContextValue = {
        theme,
        getColor,
        getLogo,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access theme context
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useThemeContext(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeContext must be used within ThemeProvider');
    }
    return context;
}
