import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Lock, Mail } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/hooks/use-theme';
import AuthLayout from '@/layouts/auth-layout';
import { login, register } from '@/routes';
import password from '@/routes/password';
import { useTranslation } from 'react-i18next';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
    [key: string]: string | boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { t } = useTranslation();
    const theme = useTheme();
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(login.url(), {
            onFinish: () => reset('password'),
        });
    };

    const primary = theme.colors['primary'] || '#233968';
    const border = theme.colors['border'] || '#e5e7eb';
    const foreground = theme.colors['foreground'] || '#111827';
    const mutedFg = theme.colors['muted-foreground'] || '#6b7280';
    const cardBg = theme.colors['card'] || '#ffffff';
    const destructive = theme.colors['destructive'] || '#ef4444';

    return (
        <AuthLayout
            title={t('auth:login.title')}
            description={t('auth:login.description', 'Enter your email and password below to log in')}
            showAnimatedBackground={true}
        >
            <Head title={t('auth:login.title')} />

            <form method="POST" className="flex flex-col gap-5" onSubmit={submit}>
                {/* Email */}
                <div className="grid gap-1.5">
                    <Label
                        htmlFor="email"
                        className="font-sans text-sm font-medium"
                        style={{ color: foreground }}
                    >
                        {t('auth:login.email')}
                    </Label>
                    <div className="relative">
                        <Mail
                            className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2"
                            style={{ color: mutedFg }}
                        />
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder={t('auth:login.email_placeholder', 'email@example.com')}
                            className="h-11 ps-10 font-sans"
                            style={{
                                borderColor: errors.email ? destructive : border,
                                backgroundColor: cardBg,
                                color: foreground,
                            }}
                        />
                    </div>
                    {errors.email && <InputError message={errors.email} className="text-xs" />}
                </div>

                {/* Password */}
                <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                        <Label
                            htmlFor="password"
                            className="font-sans text-sm font-medium"
                            style={{ color: foreground }}
                        >
                            {t('auth:login.password')}
                        </Label>
                        {canResetPassword && (
                            <TextLink
                                href={password.request.url()}
                                className="font-sans text-xs font-medium"
                                style={{ color: mutedFg }}
                                tabIndex={5}
                            >
                                {t('auth:login.forgot_password')}
                            </TextLink>
                        )}
                    </div>
                    <div className="relative">
                        <Lock
                            className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2"
                            style={{ color: mutedFg }}
                        />
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            className="h-11 ps-10 font-sans"
                            style={{
                                borderColor: errors.password ? destructive : border,
                                backgroundColor: cardBg,
                                color: foreground,
                            }}
                        />
                    </div>
                    {errors.password && <InputError message={errors.password} className="text-xs" />}
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2.5">
                    <Checkbox
                        id="remember"
                        name="remember"
                        checked={data.remember}
                        onClick={() => setData('remember', !data.remember)}
                        tabIndex={3}
                    />
                    <Label
                        htmlFor="remember"
                        className="cursor-pointer font-sans text-sm"
                        style={{ color: foreground }}
                    >
                        {t('auth:login.remember')}
                    </Label>
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    className="mt-1 h-11 w-full font-sans text-sm font-semibold tracking-wide"
                    tabIndex={4}
                    disabled={processing}
                    style={{
                        backgroundColor: primary,
                        color: theme.colors['primary-foreground'] || '#ffffff',
                    }}
                >
                    {processing ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                        t('auth:login.submit')
                    )}
                </Button>

                {/* Divider + register link */}
                <div
                    className="border-t pt-4 text-center"
                    style={{ borderColor: border }}
                >
                    <p className="font-sans text-sm" style={{ color: mutedFg }}>
                        {t('auth:login.no_account', "Don't have an account?")}{' '}
                        <TextLink
                            href={register.url()}
                            className="font-medium"
                            style={{ color: primary }}
                            tabIndex={6}
                        >
                            {t('app:register')}
                        </TextLink>
                    </p>
                </div>
            </form>

            {status && (
                <div
                    className="mt-4 rounded-md border p-3 text-center font-sans text-sm"
                    style={{
                        backgroundColor: theme.colors['muted'] || '#f3f4f6',
                        borderColor: border,
                        color: foreground,
                    }}
                >
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
