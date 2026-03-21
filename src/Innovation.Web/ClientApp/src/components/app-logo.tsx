import { useTranslation } from 'react-i18next';
import Logo from './brand/Logo';

interface AppLogoProps {
    theme?: 'light' | 'dark'; // Optional - if not provided, Logo will auto-detect based on background
    showText?: boolean;
    size?: 'small' | 'medium' | 'large' | number;
    noPadding?: boolean; // Disable clear space padding
}

export default function AppLogo({ theme, size = 'medium', noPadding = false }: AppLogoProps) {
    const { i18n } = useTranslation();

    // Determine logo variant based on language
    const logoVariant = i18n.language === 'ar' ? 'arabic' : 'english';

    return (
        <div className="flex items-start gap-2">
            <Logo
                variant={logoVariant}
                size={size}
                theme={theme}
                noPadding={noPadding}
                className="shrink-0"
            />
            {/* {showText && (
                <div className="ml-1 grid flex-1 text-start text-sm">
                    <span className="mb-0.5 truncate leading-tight font-semibold">{t('app:innovation_management')}</span>
                </div>
            )} */}
        </div>
    );
}
