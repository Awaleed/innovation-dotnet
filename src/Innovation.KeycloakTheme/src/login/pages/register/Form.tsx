/**
 * This file has been claimed for ownership from @keycloakify/login-ui version 250004.7.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "login/pages/register/Form.tsx" --revert
 */

import { useState, useLayoutEffect } from "react";
import { assert } from "tsafe/assert";
import { useKcContext } from "../../KcContext";
import { useI18n } from "../../i18n";
import { UserProfileFormFields } from "../../components/UserProfileFormFields";
import { TermsAcceptance } from "./TermsAcceptance";

export function Form() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "register.ftl");
    const { msg, msgStr } = useI18n();

    const [isFormSubmittable, setIsFormSubmittable] = useState(false);
    const [areTermsAccepted, setAreTermsAccepted] = useState(false);

    useLayoutEffect(() => {
        (window as any)["onSubmitRecaptcha"] = () => {
            // @ts-expect-error
            document.getElementById("kc-register-form").requestSubmit();
        };

        return () => {
            delete (window as any)["onSubmitRecaptcha"];
        };
    }, []);

    return (
        <form
            id="kc-register-form"
            className="flex flex-col"
            action={kcContext.url.registrationAction}
            method="post"
        >
            <UserProfileFormFields onIsFormSubmittableValueChange={setIsFormSubmittable} />

            {kcContext.termsAcceptanceRequired && (
                <TermsAcceptance
                    areTermsAccepted={areTermsAccepted}
                    onAreTermsAcceptedValueChange={setAreTermsAccepted}
                />
            )}

            {kcContext.recaptchaRequired &&
                (kcContext.recaptchaVisible || kcContext.recaptchaAction === undefined) && (
                    <div className="mb-5">
                        <div
                            className="g-recaptcha"
                            data-size="compact"
                            data-sitekey={kcContext.recaptchaSiteKey}
                            data-action={kcContext.recaptchaAction}
                        />
                    </div>
                )}

            <div className="mt-2 flex flex-col gap-4">
                <a
                    href={kcContext.url.loginUrl}
                    className="text-sm text-[#8b84d7] hover:underline"
                >
                    {msg("backToLogin")}
                </a>

                {kcContext.recaptchaRequired &&
                    !kcContext.recaptchaVisible &&
                    kcContext.recaptchaAction !== undefined ? (
                    <button
                        className="g-recaptcha h-11 w-full rounded-md bg-[#0c2341] text-sm font-semibold tracking-wide text-white transition-colors hover:bg-[#0e2a4d] focus:outline-none focus:ring-2 focus:ring-[#8b84d7] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        data-sitekey={kcContext.recaptchaSiteKey}
                        data-callback="onSubmitRecaptcha"
                        data-action={kcContext.recaptchaAction}
                        type="submit"
                    >
                        {msg("doRegister")}
                    </button>
                ) : (
                    <button
                        disabled={
                            !isFormSubmittable ||
                            (kcContext.termsAcceptanceRequired && !areTermsAccepted)
                        }
                        type="submit"
                        className="h-11 w-full rounded-md bg-[#0c2341] text-sm font-semibold tracking-wide text-white transition-colors hover:bg-[#0e2a4d] focus:outline-none focus:ring-2 focus:ring-[#8b84d7] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {msgStr("doRegister")}
                    </button>
                )}
            </div>
        </form>
    );
}
