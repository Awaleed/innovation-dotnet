import { Head } from '@inertiajs/react';
import { LoaderCircle, Lock, Mail } from 'lucide-react';
import { useState } from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useHookForm } from '@/hooks/use-hook-form';
import { useTheme } from '@/hooks/use-theme';
import AuthLayout from '@/layouts/auth-layout';
import { login, register as registerRoute } from '@/routes';
import { useTranslation } from 'react-i18next';

interface LoginFormData {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { t } = useTranslation();
    const theme = useTheme();
    const [processing, setProcessing] = useState(false);

    const form = useHookForm<LoginFormData>({
        formKey: 'login',
        resetFields: ['password'],
        defaultValues: { email: '', password: '', remember: false },
    });

    const onSubmit = (data: LoginFormData) => {
        setProcessing(true);
        
        form.post(login.url(), {
            onFinish: () => setProcessing(false),
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

            <Form {...form}>
                <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
                    {/* Email */}
                    <FormField
                        control={form.control}
                        name="email"
                        rules={{ required: t('auth:login.email') + ' is required' }}
                        render={({ field }) => (
                            <FormItem className="grid gap-1.5">
                                <FormLabel
                                    className="font-sans text-sm font-medium"
                                    style={{ color: foreground }}
                                >
                                    {t('auth:login.email')}
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Mail
                                            className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                            style={{ color: mutedFg }}
                                        />
                                        <Input
                                            type="email"
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder={t('auth:login.email_placeholder', 'email@example.com')}
                                            className="h-11 ps-10 font-sans"
                                            style={{
                                                borderColor: form.formState.errors.email ? destructive : border,
                                                backgroundColor: cardBg,
                                                color: foreground,
                                            }}
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Password */}
                    <FormField
                        control={form.control}
                        name="password"
                        rules={{ required: t('auth:login.password') + ' is required' }}
                        render={({ field }) => (
                            <FormItem className="grid gap-1.5">
                                <div className="flex items-center justify-between">
                                    <FormLabel
                                        className="font-sans text-sm font-medium"
                                        style={{ color: foreground }}
                                    >
                                        {t('auth:login.password')}
                                    </FormLabel>
                                    {canResetPassword && (
                                        <TextLink
                                            href="#"
                                            className="font-sans text-xs font-medium"
                                            style={{ color: mutedFg }}
                                            tabIndex={5}
                                        >
                                            {t('auth:login.forgot_password')}
                                        </TextLink>
                                    )}
                                </div>
                                <FormControl>
                                    <div className="relative">
                                        <Lock
                                            className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                            style={{ color: mutedFg }}
                                        />
                                        <Input
                                            type="password"
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            className="h-11 ps-10 font-sans"
                                            style={{
                                                borderColor: form.formState.errors.password ? destructive : border,
                                                backgroundColor: cardBg,
                                                color: foreground,
                                            }}
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Remember me */}
                    <FormField
                        control={form.control}
                        name="remember"
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-2.5">
                                <FormControl>
                                    <Checkbox
                                        id="remember"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        tabIndex={3}
                                    />
                                </FormControl>
                                <Label
                                    htmlFor="remember"
                                    className="cursor-pointer font-sans text-sm"
                                    style={{ color: foreground }}
                                >
                                    {t('auth:login.remember')}
                                </Label>
                            </FormItem>
                        )}
                    />

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

                    {/* SSO login */}
                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t" style={{ borderColor: border }} />
                        <span className="mx-3 flex-shrink font-sans text-xs" style={{ color: mutedFg }}>
                            {t('auth:login.or', 'or')}
                        </span>
                        <div className="flex-grow border-t" style={{ borderColor: border }} />
                    </div>

                    <a
                        href="/login/sso"
                        className="flex h-11 w-full items-center justify-center rounded-md border font-sans text-sm font-medium transition-colors hover:opacity-90"
                        style={{
                            borderColor: border,
                            color: foreground,
                            backgroundColor: cardBg,
                        }}
                        tabIndex={5}
                    >
                        {t('auth:login.sso', 'Login with Company Account')}
                    </a>

                    {/* Divider + register link */}
                    <div className="border-t pt-4 text-center" style={{ borderColor: border }}>
                        <p className="font-sans text-sm" style={{ color: mutedFg }}>
                            {t('auth:login.no_account', "Don't have an account?")}{' '}
                            <TextLink
                                href={registerRoute.url()}
                                className="font-medium"
                                style={{ color: primary }}
                                tabIndex={6}
                            >
                                {t('app:register')}
                            </TextLink>
                        </p>
                    </div>
                </form>
            </Form>

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
