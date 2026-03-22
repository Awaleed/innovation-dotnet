import type { IAuthUser } from './generated';
import type { ThemeConfig } from './brand';

export interface Auth {
  user: IAuthUser | null;
  roles: string[];
  permissions: string[];
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

export interface Flash {
  success?: string | null;
  error?: string | null;
}

export interface SharedData {
  name: string;
  auth: Auth;
  errors: Record<string, string | string[]>;
  sidebarOpen: boolean;
  localization: Localization;
  theme?: ThemeConfig;
  flash: Flash;
  [key: string]: unknown;
}
