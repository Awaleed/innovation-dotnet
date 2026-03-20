import { router, usePage } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import { SharedData } from '@/types';
import { useEffect } from 'react';
import { DefaultValues, FieldValues, Path, useForm, UseFormProps, UseFormReturn } from 'react-hook-form';

// Module-level store: survives React remounts within the SPA session.
// When InertiaCore remounts a component after a POST validation failure,
// saved values are restored into defaultValues so the user's input is preserved.
const formValueStore = new Map<string, Record<string, unknown>>();

interface UseHookFormOptions<TForm extends FieldValues> extends UseFormProps<TForm> {
    /** Unique key for this form. Enables Inertia state preservation across remounts. */
    formKey?: string;
    /** Fields to clear from saved values (not restored on remount). Default: ['password', 'password_confirmation'] */
    resetFields?: string[];
    /** Sync server-side validation errors from Inertia page props. Default: true */
    syncServerErrors?: boolean;
}

type UseHookFormReturn<TForm extends FieldValues> = UseFormReturn<TForm> & {
    /** Inertia-aware POST: saves form values before submission, restores on remount if validation fails. */
    post: (url: string, options?: Parameters<typeof router.post>[2]) => void;
};

/**
 * React Hook Form enhanced for Inertia.js on .NET (InertiaCore).
 *
 * InertiaCore remounts components when returning Inertia.Render() from POST handlers,
 * which destroys react-hook-form state. This hook solves that by:
 * 1. Saving form values to a module-level Map before each Inertia POST
 * 2. Restoring them into defaultValues when the component remounts
 * 3. Automatically syncing server validation errors from page props
 */
export function useHookForm<TForm extends FieldValues = FieldValues>({
    formKey,
    resetFields = [],
    syncServerErrors = true,
    ...options
}: UseHookFormOptions<TForm> = {}): UseHookFormReturn<TForm> {
    // Restore saved values on mount (if any exist from a prior failed submission)
    const savedValues = formKey ? formValueStore.get(formKey) : undefined;

    const form = useForm<TForm>({
        ...options,
        defaultValues: savedValues
            ? ({ ...options.defaultValues, ...savedValues } as DefaultValues<TForm>)
            : options.defaultValues,
    });

    const { props } = usePage<SharedData>();

    // Clean up saved values after they've been applied
    useEffect(() => {
        if (formKey && savedValues) {
            formValueStore.delete(formKey);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync server-side validation errors from Inertia page props
    useEffect(() => {
        const serverErrors = props.errors || {};
        if (syncServerErrors && Object.keys(serverErrors).length > 0) {
            Object.keys(serverErrors).forEach((fieldName) => {
                form.setError(fieldName as Path<TForm>, {
                    type: 'server',
                    message: Array.isArray(serverErrors[fieldName])
                        ? serverErrors[fieldName][0]
                        : serverErrors[fieldName],
                });
            });
        }
    }, [props.errors, syncServerErrors, form]);

    // Inertia-aware POST that preserves form values across remounts
    const post = (url: string, routerOptions?: Parameters<typeof router.post>[2]) => {
        if (formKey) {
            const values = { ...form.getValues() } as Record<string, unknown>;
            resetFields.forEach((f) => delete values[f]);
            formValueStore.set(formKey, values);
        }

        router.post(url, form.getValues() as Record<string, FormDataConvertible>, {
            preserveScroll: true,
            ...routerOptions,
            onSuccess: (page) => {
                if (formKey) formValueStore.delete(formKey);
                routerOptions?.onSuccess?.(page);
            },
        });
    };

    return { ...form, post };
}
