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
import axios from 'axios';
import { NuqsAdapter } from 'nuqs/adapters/react';
import './i18n'; // Initialize i18n
// import './zod-setup'; // Initialize zod i18n error map
import { AppWrapper } from './components/app-wrapper';
import { ErrorBoundary } from './components/ui/error-boundary';

const appName = import.meta.env.VITE_APP_NAME || 'Innovation Platform';

// Configure Axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add CSRF token to all requests
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

// Add response interceptor for better error handling
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle common HTTP errors globally if needed
        if (error.response?.status === 401) {
            // Handle unauthorized - could redirect to login
            console.warn('Unauthorized request detected');
        } else if (error.response?.status === 403) {
            console.warn('Forbidden request detected');
        } else if (error.response?.status === 500) {
            console.error('Server error detected');
        }

        return Promise.reject(error);
    },
);

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
const appPages = import.meta.glob('./Pages/**/*.tsx', { eager: true }) as Record<string, { default: React.ComponentType<SharedData> }>;

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name: string) => {
        const page = appPages[`./Pages/${name}.tsx`];
        if (!page) {
            throw new Error(`Page not found: ${name}`);
        }

        const Component = page.default;

        // Wrap each page component with providers
        const WrappedComponent = (props: SharedData) => (
            <ThemeProvider>
                <RTLProvider>
                    <Component {...props} />
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
                        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
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
