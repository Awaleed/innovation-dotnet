import React, { useState, useEffect, useRef } from 'react';
import { IntroScreen } from './intro-screen';
import { router } from '@inertiajs/react';

declare global {
    interface Window {
        hideServerIntro?: () => void;
    }
}

interface AppWrapperProps {
    children: React.ReactNode;
}

/**
 * App Wrapper - Global loading indicator with animated intro
 *
 * Shows animated intro screen on:
 * - Initial page load
 * - All Inertia page navigations (login, refresh, navigation, etc.)
 *
 * Hides when page finishes loading.
 */
export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
    const [showIntro, setShowIntro] = useState(false); // Don't show on initial load (server handles it)
    const [shouldExitIntro, setShouldExitIntro] = useState(false);
    const hasShownIntroRef = useRef(false);
    const hasHiddenServerIntroRef = useRef(false);

    // Hide server intro once React has mounted and page is loaded
    useEffect(() => {
        const hideServerIntro = () => {
            if (hasHiddenServerIntroRef.current) return;
            hasHiddenServerIntroRef.current = true;

            // Call global function to hide server intro
            if (typeof window !== 'undefined' && window.hideServerIntro) {
                // Wait a brief moment to ensure React has rendered
                setTimeout(() => {
                    window.hideServerIntro?.();
                }, 100);
            }
        };

        // If page is already loaded, hide immediately
        if (document.readyState === 'complete') {
            hideServerIntro();
            return;
        }

        // Otherwise wait for page load
        window.addEventListener('load', hideServerIntro);
        return () => window.removeEventListener('load', hideServerIntro);
    }, []);

    useEffect(() => {
        let showIntroTimer: ReturnType<typeof setTimeout> | null = null;

        // Listen to Inertia navigation events (for SPA navigation only)
        const handleStart = (event: { detail?: { visit?: { prefetch?: boolean } } }) => {
            // Ignore prefetch requests - only show intro for actual navigation
            if (event.detail?.visit?.prefetch) {
                return;
            }

            // Reset exit flag when new navigation starts
            setShouldExitIntro(false);

            // Only show intro if navigation takes longer than 300ms
            // This prevents showing it for instant page transitions
            showIntroTimer = setTimeout(() => {
                setShowIntro(true);
                hasShownIntroRef.current = true;
            }, 300);
        };

        const handleFinish = () => {
            // Cancel the timer if page loaded before 300ms
            if (showIntroTimer) {
                clearTimeout(showIntroTimer);
                showIntroTimer = null;
            }

            // If intro was shown, signal it to exit
            // If intro was NOT shown (fast navigation), hide immediately
            if (hasShownIntroRef.current) {
                setShouldExitIntro(true);
            } else {
                setShowIntro(false);
            }
        };

        // Subscribe to Inertia router events
        const startUnsubscribe = router.on('start', handleStart);
        const finishUnsubscribe = router.on('finish', handleFinish);
        const errorUnsubscribe = router.on('error', handleFinish);

        return () => {
            if (showIntroTimer) {
                clearTimeout(showIntroTimer);
            }
            startUnsubscribe();
            finishUnsubscribe();
            errorUnsubscribe();
        };
    }, []);

    const handleIntroComplete = () => {
        setShowIntro(false);
        setShouldExitIntro(false);
        // Reset the flag so next navigation can show intro again
        hasShownIntroRef.current = false;
    };

    return (
        <>
            {children}
            {showIntro && <IntroScreen onComplete={handleIntroComplete} shouldExit={shouldExitIntro} />}
        </>
    );
};
