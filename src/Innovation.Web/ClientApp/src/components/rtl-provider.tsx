import { changeLanguage } from '@/i18n';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { DirectionProvider } from '@radix-ui/react-direction';
import { createContext, ReactNode, useContext, useEffect } from 'react';

interface RTLContextType {
    currentLocale: string;
    currentLocaleDirection: 'rtl' | 'ltr';
    isRtl: boolean;
    supportedLocales: Record<string, { name: string; native: string }>;
}

const RTLContext = createContext<RTLContextType>({
    currentLocale: 'en',
    currentLocaleDirection: 'ltr',
    isRtl: false,
    supportedLocales: {},
});

export function useRTL() {
    return useContext(RTLContext);
}

interface RTLProviderProps {
    children: ReactNode;
}

export function RTLProvider({ children }: RTLProviderProps) {
    const localization = usePage<SharedData>().props.localization;

    // Provide fallback values if localization is not defined
    const currentLocale = localization?.currentLocale ?? 'ar';
    const currentLocaleDirection = localization?.currentLocaleDirection ?? 'rtl';
    const supportedLocales = localization?.supportedLocales ?? {
        en: { name: 'English', native: 'English' },
        ar: { name: 'Arabic', native: 'العربية' },
    };
    const isRtl = currentLocaleDirection === 'rtl';

    // Sync i18next with Laravel's current locale
    useEffect(() => {
        changeLanguage(currentLocale);
    }, [currentLocale]);

    // Handle document direction
    useEffect(() => {
        document.documentElement.dir = currentLocaleDirection;
        if (isRtl) {
            document.documentElement.classList.add('rtl');
        } else {
            document.documentElement.classList.remove('rtl');
        }
    }, [currentLocaleDirection, isRtl]);

    return (
        <RTLContext.Provider value={{ currentLocale, currentLocaleDirection, isRtl, supportedLocales }}>
            <DirectionProvider dir={currentLocaleDirection}>{children}</DirectionProvider>
        </RTLContext.Provider>
    );
}
