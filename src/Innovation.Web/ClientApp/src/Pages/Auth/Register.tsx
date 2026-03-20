import { Head } from '@inertiajs/react';
import { LoaderCircle, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthPageTransition } from '@/components/auth/auth-page-transition';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useHookForm } from '@/hooks/use-hook-form';
import { useTheme } from '@/hooks/use-theme';
import AuthLayout from '@/layouts/auth-layout';
import { login, register } from '@/routes';

interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function Register() {
    const { t } = useTranslation();
    const theme = useTheme();
    const [processing, setProcessing] = useState(false);

    const form = useHookForm<RegisterFormData>({
        formKey: 'register',
        defaultValues: { name: '', email: '', password: '', password_confirmation: '' },
    });

    const onSubmit = (data: RegisterFormData) => {
        setProcessing(true);

        form.post(register.url(), {
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
        <AuthPageTransition>
            <AuthLayout
                title={t('auth:register.title')}
                description={t('auth:register.description')}
                showAnimatedBackground={true}
                animationPosition="right"
                animationTheme="orange"
            >
                <Head title={t('app:register')} />

                <Form {...form}>
                    <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
                        {/* Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            rules={{ required: t('auth:register.name') + ' is required' }}
                            render={({ field }) => (
                                <FormItem className="grid gap-1.5">
                                    <FormLabel
                                        className="font-sans text-sm font-medium"
                                        style={{ color: foreground }}
                                    >
                                        {t('auth:register.name')}
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User
                                                className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                                style={{ color: mutedFg }}
                                            />
                                            <Input
                                                type="text"
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="name"
                                                placeholder={t('auth:register.name_placeholder')}
                                                className="h-11 ps-10 font-sans"
                                                style={{
                                                    borderColor: form.formState.errors.name ? destructive : border,
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

                        {/* Email */}
                        <FormField
                            control={form.control}
                            name="email"
                            rules={{ required: t('auth:register.email') + ' is required' }}
                            render={({ field }) => (
                                <FormItem className="grid gap-1.5">
                                    <FormLabel
                                        className="font-sans text-sm font-medium"
                                        style={{ color: foreground }}
                                    >
                                        {t('auth:register.email')}
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail
                                                className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                                style={{ color: mutedFg }}
                                            />
                                            <Input
                                                type="email"
                                                tabIndex={2}
                                                autoComplete="email"
                                                placeholder={t('auth:register.email_placeholder')}
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
                            rules={{ required: t('auth:register.password') + ' is required' }}
                            render={({ field }) => (
                                <FormItem className="grid gap-1.5">
                                    <FormLabel
                                        className="font-sans text-sm font-medium"
                                        style={{ color: foreground }}
                                    >
                                        {t('auth:register.password')}
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock
                                                className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                                style={{ color: mutedFg }}
                                            />
                                            <Input
                                                type="password"
                                                tabIndex={3}
                                                autoComplete="new-password"
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

                        {/* Confirm Password */}
                        <FormField
                            control={form.control}
                            name="password_confirmation"
                            rules={{ required: t('auth:register.password_confirmation') + ' is required' }}
                            render={({ field }) => (
                                <FormItem className="grid gap-1.5">
                                    <FormLabel
                                        className="font-sans text-sm font-medium"
                                        style={{ color: foreground }}
                                    >
                                        {t('auth:register.password_confirmation')}
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock
                                                className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                                style={{ color: mutedFg }}
                                            />
                                            <Input
                                                type="password"
                                                tabIndex={4}
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                className="h-11 ps-10 font-sans"
                                                style={{
                                                    borderColor: form.formState.errors.password_confirmation ? destructive : border,
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

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="mt-1 h-11 w-full font-sans text-sm font-semibold tracking-wide"
                            tabIndex={5}
                            disabled={processing}
                            style={{
                                backgroundColor: primary,
                                color: theme.colors['primary-foreground'] || '#ffffff',
                            }}
                        >
                            {processing ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                t('auth:register.submit')
                            )}
                        </Button>

                        {/* Divider + login link */}
                        <div className="border-t pt-4 text-center" style={{ borderColor: border }}>
                            <p className="font-sans text-sm" style={{ color: mutedFg }}>
                                {t('auth:register.has_account')}{' '}
                                <TextLink
                                    href={login.url()}
                                    className="font-medium"
                                    style={{ color: primary }}
                                    tabIndex={6}
                                >
                                    {t('auth:register.login_link')}
                                </TextLink>
                            </p>
                        </div>
                    </form>
                </Form>
            </AuthLayout>
        </AuthPageTransition>
    );
}
