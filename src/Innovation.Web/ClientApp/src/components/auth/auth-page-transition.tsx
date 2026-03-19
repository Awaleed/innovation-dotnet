import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AuthPageTransitionProps {
    children: ReactNode;
}

// Define auth page hierarchy for navigation direction
const getAuthPageHierarchy = (t: any) => [
    { path: '/login', name: t('auth:login.title'), icon: '🔐', level: 0, category: 'auth' },
    { path: '/register', name: t('auth:register.title'), icon: '👤', level: 1, category: 'auth' },
    { path: '/forgot-password', name: t('auth:forgot_password.title'), icon: '🔑', level: 2, category: 'auth' },
    { path: '/reset-password', name: t('auth:reset_password.title'), icon: '🔄', level: 3, category: 'auth' },
    { path: '/verify-email', name: t('auth:verify_email.title'), icon: '📧', level: 4, category: 'auth' },
];

function getPageIndex(path: string, authPageHierarchy: any[]): number {
    const cleanPath = path.split('?')[0];
    return authPageHierarchy.findIndex((page) => page.path === cleanPath);
}

function getPageInfo(path: string, authPageHierarchy: any[], t: any) {
    const cleanPath = path.split('?')[0];
    const index = authPageHierarchy.findIndex((page) => page.path === cleanPath);
    return {
        index,
        level: authPageHierarchy[index]?.level || 0,
        category: authPageHierarchy[index]?.category || 'unknown',
        info: authPageHierarchy[index] || {
            path: cleanPath,
            name: t('navigation:unknown_page'),
            icon: '❓',
            level: 0,
            category: 'unknown',
        },
    };
}

export function AuthPageTransition({ children }: AuthPageTransitionProps) {
    const { url } = usePage();
    const { t } = useTranslation();
    const [direction, setDirection] = useState(1);
    const [previousUrl, setPreviousUrl] = useState(url);
    const authPageHierarchy = getAuthPageHierarchy(t);

    useEffect(() => {
        const currentPath = url.split('?')[0];
        const prevPath = previousUrl.split('?')[0];

        if (currentPath !== prevPath) {
            // Determine direction based on level hierarchy
            const currentPageInfo = getPageInfo(currentPath, authPageHierarchy, t);
            const prevPageInfo = getPageInfo(prevPath, authPageHierarchy, t);

            const currentLevel = currentPageInfo.level;
            const prevLevel = prevPageInfo.level;

            if (currentLevel > prevLevel) {
                setDirection(1); // Going deeper (forward) - slide in from right
            } else if (currentLevel < prevLevel) {
                setDirection(-1); // Going up (backward) - slide in from left
            } else {
                // Same level - check array index as fallback
                const currentIndex = getPageIndex(currentPath, authPageHierarchy);
                const prevIndex = getPageIndex(prevPath, authPageHierarchy);

                if (currentIndex > prevIndex) {
                    setDirection(1); // Forward within same level
                } else {
                    setDirection(-1); // Backward within same level
                }
            }

            setPreviousUrl(url);
        }
    }, [url, previousUrl, authPageHierarchy, t]);

    // Simple swipe animation variants
    const swipeVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 100 : -100,
            opacity: 0,
        }),
    };

    // Simple transition configuration
    const transitionConfig = {
        duration: 0.3,
        ease: 'easeInOut' as const,
    };

    return (
        <div className="relative h-full w-full">
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={url}
                    custom={direction}
                    variants={swipeVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={transitionConfig}
                    className="h-full w-full"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
