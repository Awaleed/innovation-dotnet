import { Slot } from '@radix-ui/react-slot';
import { createContext, forwardRef, useContext, useId } from 'react';
import { Controller, type ControllerProps, type FieldPath, type FieldValues, FormProvider, useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useThemeContext } from '@/providers/theme-provider';

const Form = FormProvider;

type FormFieldContextValue<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
    name: TName;
};

const FormFieldContext = createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    ...props
}: ControllerProps<TFieldValues, TName>) => {
    return (
        <FormFieldContext.Provider value={{ name: props.name }}>
            <Controller {...props} />
        </FormFieldContext.Provider>
    );
};

const useFormField = () => {
    const fieldContext = useContext(FormFieldContext);
    const itemContext = useContext(FormItemContext);
    const { getFieldState, formState } = useFormContext();

    const fieldState = getFieldState(fieldContext.name, formState);

    if (!fieldContext) {
        throw new Error('useFormField should be used within <FormField>');
    }

    const { id } = itemContext;

    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        ...fieldState,
    };
};

type FormItemContextValue = {
    id: string;
};

const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

const FormItem = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    const id = useId();

    return (
        <FormItemContext.Provider value={{ id }}>
            <div ref={ref} className={cn('space-y-2', className)} {...props} />
        </FormItemContext.Provider>
    );
});
FormItem.displayName = 'FormItem';

const FormLabel = forwardRef<
    React.ElementRef<typeof Label>,
    React.ComponentPropsWithoutRef<typeof Label>
>(({ className, style, ...props }, ref) => {
    const { error, formItemId } = useFormField();
    const { getColor } = useThemeContext();
    const destructive = getColor('destructive');

    return (
        <Label
            ref={ref}
            className={className}
            htmlFor={formItemId}
            style={error ? { color: destructive, ...style } : style}
            {...props}
        />
    );
});
FormLabel.displayName = 'FormLabel';

const FormControl = forwardRef<
    React.ElementRef<typeof Slot>,
    React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
        <Slot
            ref={ref}
            id={formItemId}
            aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
            aria-invalid={!!error}
            {...props}
        />
    );
});
FormControl.displayName = 'FormControl';

const FormDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => {
        const { formDescriptionId } = useFormField();

        return (
            <p
                ref={ref}
                id={formDescriptionId}
                className={cn('text-sm text-muted-foreground', className)}
                {...props}
            />
        );
    },
);
FormDescription.displayName = 'FormDescription';

const FormMessage = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, children, style, ...props }, ref) => {
        const { error, formMessageId } = useFormField();
        const { getColor } = useThemeContext();
        const destructive = getColor('destructive');
        const body = error ? String(error?.message) : children;

        if (!body) {
            return null;
        }

        return (
            <p
                ref={ref}
                id={formMessageId}
                className={cn('text-sm font-medium', className)}
                style={{ color: destructive, ...style }}
                {...props}
            >
                {body}
            </p>
        );
    },
);
FormMessage.displayName = 'FormMessage';

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField };