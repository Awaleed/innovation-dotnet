import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    description: string;
    showAnimatedBackground?: boolean;
    animationPosition?: 'left' | 'right';
    animationTheme?: 'blue' | 'orange';
}

export default function AuthLayout({
    children,
    title,
    description,
    showAnimatedBackground = false,
    animationPosition = 'left',
    animationTheme = 'blue',
    ...props
}: AuthLayoutProps) {
    return (
        <AuthLayoutTemplate
            title={title}
            description={description}
            showAnimatedBackground={showAnimatedBackground}
            animationPosition={animationPosition}
            animationTheme={animationTheme}
            {...props}
        >
            {children}
        </AuthLayoutTemplate>
    );
}
