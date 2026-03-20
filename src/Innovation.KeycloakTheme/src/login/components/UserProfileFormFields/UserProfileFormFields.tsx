/**
 * This file has been claimed for ownership from @keycloakify/login-ui version 250004.7.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "login/components/UserProfileFormFields/UserProfileFormFields.tsx" --revert
 */

import type { JSX } from "@keycloakify/login-ui/tools/JSX";
import { useEffect, Fragment } from "react";
import {
    useUserProfileForm,
    type FormAction,
    type FormFieldError,
} from "@keycloakify/login-ui/useUserProfileForm";
import { GroupLabel } from "./GroupLabel";
import { FieldErrors } from "./FieldErrors";
import { InputFieldByType } from "./InputFieldByType";
import type { Attribute } from "@keycloakify/login-ui/KcContext";
import { useKcContext } from "../../KcContext";
import { useI18n } from "../../i18n";
import { DO_MAKE_USER_CONFIRM_PASSWORD } from "./DO_MAKE_USER_CONFIRM_PASSWORD";
import { assert } from "tsafe/assert";

export type UserProfileFormFieldsProps = {
    onIsFormSubmittableValueChange: (isFormSubmittable: boolean) => void;
    BeforeField?: (props: BeforeAfterFieldProps) => JSX.Element | null;
    AfterField?: (props: BeforeAfterFieldProps) => JSX.Element | null;
};

type BeforeAfterFieldProps = {
    attribute: Attribute;
    dispatchFormAction: React.Dispatch<FormAction>;
    displayableErrors: FormFieldError[];
    valueOrValues: string | string[];
};

export function UserProfileFormFields(props: UserProfileFormFieldsProps) {
    const { onIsFormSubmittableValueChange, BeforeField, AfterField } = props;

    const { kcContext } = useKcContext();

    assert("profile" in kcContext);

    const i18n = useI18n();
    const { advancedMsg } = i18n;

    const {
        formState: { formFieldStates, isFormSubmittable },
        dispatchFormAction,
    } = useUserProfileForm({
        kcContext,
        i18n,
        doMakeUserConfirmPassword: DO_MAKE_USER_CONFIRM_PASSWORD,
    });

    useEffect(() => {
        onIsFormSubmittableValueChange(isFormSubmittable);
    }, [isFormSubmittable]);

    const groupNameRef = { current: "" };

    return (
        <>
            {formFieldStates.map(({ attribute, displayableErrors, valueOrValues }) => (
                <Fragment key={attribute.name}>
                    <GroupLabel attribute={attribute} groupNameRef={groupNameRef} />
                    {BeforeField !== undefined && (
                        <BeforeField
                            attribute={attribute}
                            dispatchFormAction={dispatchFormAction}
                            displayableErrors={displayableErrors}
                            valueOrValues={valueOrValues}
                        />
                    )}
                    <div
                        className="mb-5"
                        style={{
                            display:
                                attribute.annotations.inputType === "hidden"
                                    ? "none"
                                    : undefined,
                        }}
                    >
                        <div className="mb-1.5">
                            <label
                                htmlFor={attribute.name}
                                className="text-sm font-medium text-[#111827]"
                            >
                                {advancedMsg(attribute.displayName ?? "")}
                                {attribute.required && (
                                    <span className="ml-0.5 text-red-500">*</span>
                                )}
                            </label>
                        </div>
                        <div>
                            {attribute.annotations.inputHelperTextBefore !== undefined && (
                                <div
                                    className="mb-1 text-xs text-gray-500"
                                    id={`form-help-text-before-${attribute.name}`}
                                    aria-live="polite"
                                >
                                    {advancedMsg(attribute.annotations.inputHelperTextBefore)}
                                </div>
                            )}
                            <InputFieldByType
                                attribute={attribute}
                                valueOrValues={valueOrValues}
                                displayableErrors={displayableErrors}
                                dispatchFormAction={dispatchFormAction}
                            />
                            <FieldErrors
                                attribute={attribute}
                                displayableErrors={displayableErrors}
                                fieldIndex={undefined}
                            />
                            {attribute.annotations.inputHelperTextAfter !== undefined && (
                                <div
                                    className="mt-1 text-xs text-gray-500"
                                    id={`form-help-text-after-${attribute.name}`}
                                    aria-live="polite"
                                >
                                    {advancedMsg(attribute.annotations.inputHelperTextAfter)}
                                </div>
                            )}
                            {AfterField !== undefined && (
                                <AfterField
                                    attribute={attribute}
                                    dispatchFormAction={dispatchFormAction}
                                    displayableErrors={displayableErrors}
                                    valueOrValues={valueOrValues}
                                />
                            )}
                        </div>
                    </div>
                </Fragment>
            ))}
        </>
    );
}
