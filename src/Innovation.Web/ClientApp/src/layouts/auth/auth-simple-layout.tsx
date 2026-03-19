import AppLogo from '@/components/app-logo';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
    showAnimatedBackground?: boolean;
    animationPosition?: 'left' | 'right';
    animationTheme?: 'blue' | 'orange';
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="flex h-svh overflow-hidden">
            {/* ── Brand panel — dots background (desktop only) ── */}
            <div
                className="relative hidden flex-col items-center justify-center lg:flex lg:w-1/2"
                style={{ backgroundColor: '#0c2341' }}
            >
                {/* Repeating dot grid */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1.5px, transparent 1.5px)',
                        backgroundSize: '26px 26px',
                    }}
                />

                {/* Edge vignette — fades dots toward borders */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse 75% 65% at 50% 50%, transparent 30%, rgba(12,35,65,0.72) 100%)',
                    }}
                />

                {/* Subtle lavender glow behind logo */}
                <div
                    className="absolute"
                    style={{
                        width: '420px',
                        height: '420px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(139,132,215,0.18) 0%, transparent 70%)',
                        filter: 'blur(56px)',
                    }}
                />

                {/* Centered logo */}
                <div className="relative z-10">
                    <Link href={home.url()}>
                        <AppLogo size={240} noPadding theme="dark" />
                    </Link>
                </div>
            </div>

            {/* ── Form panel ── */}
            <div className="relative flex w-full flex-col items-center justify-center bg-white px-6 py-12 dark:bg-[#0a1628] sm:px-10 lg:w-1/2 lg:px-16">
                {/* Logo shown only on mobile (brand panel hidden on mobile) */}
                <div className="mb-8 lg:hidden">
                    <Link href={home.url()}>
                        <AppLogo size={140} noPadding theme="light" />
                    </Link>
                </div>

                <div className="w-full max-w-sm">
                    {(title || description) && (
                        <div className="mb-8">
                            {title && (
                                <h1 className="font-heading text-2xl font-bold text-[#0c2341] dark:text-white">
                                    {title}
                                </h1>
                            )}
                            {description && (
                                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                            )}
                            <div className="mt-4 h-0.5 w-10 rounded-full bg-[#8b84d7]" />
                        </div>
                    )}

                    {children}
                </div>
            </div>
        </div>
    );
}
