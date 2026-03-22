/// <reference types="vite/client" />
import './app.css';
// import './bootstrap'; // TODO: add when Echo/Ably is configured

import { SharedData } from '@/types';
import { createInertiaApp } from '@inertiajs/react';
// resolvePageComponent from laravel-vite-plugin replaced with direct glob
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { RTLProvider } from './components/rtl-provider';
import { ThemeProvider } from './providers/theme-provider';
import { initializeTheme } from './hooks/use-appearance';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react';
import './i18n'; // Initialize i18n
import './lib/api-client'; // Initialize axios defaults + CSRF
import { AppWrapper } from './components/app-wrapper';
import { ErrorBoundary } from './components/ui/error-boundary';
import { FlashToaster } from './components/flash-toaster';

const appName = import.meta.env.VITE_APP_NAME || 'Innovation Platform';

// Extend HTMLElement to include _reactRootContainer property
declare global {
  interface HTMLElement {
    _reactRootContainer?: Root;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

// Pre-define page globs at module level for Vite to statically analyze
const appPages = import.meta.glob('./Pages/**/*.tsx', { eager: true }) as Record<
  string,
  { default: React.ComponentType<SharedData> }
>;

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name: string) => {
    const page = appPages[`./Pages/${name}.tsx`];
    if (!page) {
      throw new Error(`Page not found: ${name}`);
    }

    const Component = page.default;

    // Wrap each page component with providers and per-page error boundary
    const WrappedComponent = (props: SharedData) => (
      <ThemeProvider>
        <RTLProvider>
          <ErrorBoundary>
            <Component {...props} />
          </ErrorBoundary>
          <FlashToaster />
        </RTLProvider>
      </ThemeProvider>
    );

    return WrappedComponent;
  },
  setup({ el, App, props }) {
    const root = createRoot(el);

    root.render(
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <NuqsAdapter>
            <AppWrapper>
              <App {...props} />
            </AppWrapper>
          </NuqsAdapter>
        </QueryClientProvider>
      </ErrorBoundary>,
    );
  },
  progress: {
    color: '#4B5563',
  },
});

// Force light theme only
initializeTheme();

// Additional force light mode on page load
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.remove('dark');
});

// Force light mode on any theme changes
const observer = new MutationObserver(() => {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
  }
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class'],
});
