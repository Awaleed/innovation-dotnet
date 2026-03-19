import { HTMLAttributes } from 'react';
import LogoIcon from './brand/LogoIcon';

interface AppLogoIconProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'light' | 'dark';
}

/**
 * App Logo Icon Component
 *
 * Uses the Alinma brandmark shorthand (emblem only) for app icons.
 * This component wraps the brand LogoIcon component.
 */
export default function AppLogoIcon({ variant = 'light', ...props }: AppLogoIconProps) {
    return <LogoIcon size={32} variant={variant} {...props} />;
}
