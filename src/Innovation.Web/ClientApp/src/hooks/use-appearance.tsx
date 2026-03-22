import { useCallback, useEffect } from 'react';

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
  const updateAppearance = useCallback((_mode: Appearance) => {
    // Always force light mode regardless of input
    localStorage.setItem('appearance', 'light');
    setCookie('appearance', 'light');
    applyTheme('light');
  }, []);

  useEffect(() => {
    // Initialize light mode on mount (side effects only, no state update)
    localStorage.setItem('appearance', 'light');
    setCookie('appearance', 'light');
    applyTheme('light');

    return () => mediaQuery()?.removeEventListener('change', handleSystemThemeChange);
  }, []);

  return { appearance: 'light', updateAppearance } as const;
}
