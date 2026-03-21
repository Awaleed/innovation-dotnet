import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (_appearance: Appearance) => {
    // Force light theme only - ignore appearance parameter
    const isDark = false;

    document.documentElement.classList.toggle('dark', isDark);
    // Remove any existing theme classes and ensure clean state
    document.documentElement.classList.remove('light');
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = () => {
    const currentAppearance = localStorage.getItem('appearance') as Appearance;
    applyTheme(currentAppearance || 'system');
};

export function initializeTheme() {
    // Force light theme only
    const savedAppearance = 'light' as Appearance;

    applyTheme(savedAppearance);

    // Remove dark mode class if it exists
    document.documentElement.classList.remove('dark');

    // No need to add event listener since we're forcing light mode
}

export function useAppearance() {
    const [_appearance, setAppearance] = useState<Appearance>('light');

    const updateAppearance = useCallback((_mode: Appearance) => {
        // Always force light mode regardless of input
        setAppearance('light');

        // Store light mode in localStorage
        localStorage.setItem('appearance', 'light');

        // Store light mode in cookie for SSR
        setCookie('appearance', 'light');

        // Always apply light theme
        applyTheme('light');
    }, []);

    useEffect(() => {
        // Always set to light mode
        updateAppearance('light');

        return () => mediaQuery()?.removeEventListener('change', handleSystemThemeChange);
    }, [updateAppearance]);

    return { appearance: 'light', updateAppearance } as const;
}
