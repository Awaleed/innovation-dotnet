import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';
import { useEffect } from 'react';
import { FieldValues, Path, useForm, UseFormProps, UseFormReturn } from 'react-hook-form';

interface UseHookFormOptions<TForm extends FieldValues> extends UseFormProps<TForm> {
    syncServerErrors?: boolean;
}

/**
 * Enhanced React Hook Form with optional server error synchronization.
 * This hook extends react-hook-form with the ability to sync server-side
 * validation errors from Inertia page props.
 */
export function useHookForm<TForm extends FieldValues = FieldValues>({
    syncServerErrors = true,
    ...options
}: UseHookFormOptions<TForm> = {}): UseFormReturn<TForm> {
    const form = useForm<TForm>(options);
    const { props } = usePage<SharedData>();

    useEffect(() => {
        const serverErrors = props.errors || {};
        if (syncServerErrors && serverErrors && Object.keys(serverErrors).length > 0) {
            // Set server errors on the form
            Object.keys(serverErrors).forEach((fieldName) => {
                form.setError(fieldName as Path<TForm>, {
                    type: 'server',
                    message: Array.isArray(serverErrors[fieldName]) ? serverErrors[fieldName][0] : serverErrors[fieldName],
                });
            });
        }
    }, [props.errors, syncServerErrors, form]);

    return form;
}
