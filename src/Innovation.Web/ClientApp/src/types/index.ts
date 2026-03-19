import type { IAuthUser } from './generated';
import type { ThemeConfig } from './brand';

export interface Auth {
    user: IAuthUser | null;
}

export interface Localization {
    currentLocale: string;
    currentLocaleDirection: 'rtl' | 'ltr';
    supportedLocales: {
        [key: string]: {
            name: string;
            native: string;
        };
    };
}

export interface SharedData {
    auth: Auth;
    name?: string;
    quote?: { message: string; author: string };
    sidebarOpen?: boolean;
    localization?: Localization;
    theme?: ThemeConfig;
    [key: string]: unknown;
}
