import { useForm as useInertiaBaseForm, usePage } from '@inertiajs/react';
import { SharedData } from '@/types';
import { useEffect } from 'react';

type FormDataConvertible =
    | Array<FormDataConvertible>
    | {
          [key: string]: FormDataConvertible;
      }
    | Blob
    | FormDataEntryValue
    | Date
    | boolean
    | number
    | null
    | undefined;

type FormDataType = Record<string, FormDataConvertible>;

/**
 * Enhanced Inertia form hook with automatic server error handling.
 * This hook extends the base Inertia useForm hook by automatically
 * syncing server-side validation errors from the page props.
 */
export function useInertiaForm<TForm extends FormDataType>(initialValues?: TForm | (() => TForm)): ReturnType<typeof useInertiaBaseForm<TForm>>;
export function useInertiaForm<TForm extends FormDataType>(
    rememberKey: string,
    initialValues?: TForm | (() => TForm),
): ReturnType<typeof useInertiaBaseForm<TForm>>;
export function useInertiaForm<TForm extends FormDataType>(
    ...args: Parameters<typeof useInertiaBaseForm<TForm>>
): ReturnType<typeof useInertiaBaseForm<TForm>> {
    const form = useInertiaBaseForm<TForm>(...args);
    const { props } = usePage<SharedData>();

    useEffect(() => {
        const serverErrors = props.errors || {};
        if (serverErrors && Object.keys(serverErrors).length > 0) {
            // Cast to bypass complex Inertia type constraints
            (form.setError as (errors: Record<string, string | string[]>) => void)(serverErrors);
        }
    }, [props.errors, form]);

    return form;
}
