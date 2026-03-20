/**
 * This file has been claimed for ownership from @keycloakify/login-ui version 250004.7.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "login/pages/login/Form.tsx" --revert
 */

import { useState } from "react";
import { assert } from "tsafe/assert";
import { useI18n } from "../../i18n";
import { useKcContext } from "../../KcContext";
import { kcSanitize } from "@keycloakify/login-ui/kcSanitize";
import { useScript } from "./useScript";
import { Mail, Lock } from "lucide-react";

export function Form() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "login.ftl");

    const { msg, msgStr } = useI18n();

    const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);

    const webAuthnButtonId = "authenticateWebAuthnButton";

    useScript({ webAuthnButtonId });

    const hasError = kcContext.messagesPerField.existsError("username", "password");

    return (
        <>
            <div>
                {kcContext.realm.password && (
                    <form
                        id="kc-form-login"
                        className="flex flex-col gap-5"
                        onSubmit={() => {
                            setIsLoginButtonDisabled(true);
                            return true;
                        }}
                        action={kcContext.url.loginAction}
                        method="post"
                    >
                        {/* Email / Username */}
                        {!kcContext.usernameHidden && (
                            <div className="grid gap-1.5">
                                <label
                                    htmlFor="username"
                                    className="text-sm font-medium text-[#111827]"
                                >
                                    {!kcContext.realm.loginWithEmailAllowed
                                        ? msg("username")
                                        : !kcContext.realm.registrationEmailAsUsername
                                          ? msg("usernameOrEmail")
                                          : msg("email")}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                                    <input
                                        tabIndex={2}
                                        id="username"
                                        name="username"
                                        defaultValue={kcContext.login.username ?? ""}
                                        type="text"
                                        autoFocus
                                        autoComplete={
                                            kcContext.enableWebAuthnConditionalUI
                                                ? "username webauthn"
                                                : "username"
                                        }
                                        aria-invalid={hasError}
                                        placeholder="email@example.com"
                                        className={`h-11 w-full rounded-md border bg-white pl-10 pr-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#8b84d7] focus:ring-2 focus:ring-[#8b84d7]/20 ${
                                            hasError
                                                ? "border-[#ef4444]"
                                                : "border-[#e5e7eb]"
                                        }`}
                                    />
                                </div>
                                {hasError && (
                                    <span
                                        className="text-xs text-[#ef4444]"
                                        aria-live="polite"
                                        dangerouslySetInnerHTML={{
                                            __html: kcSanitize(
                                                kcContext.messagesPerField.getFirstError(
                                                    "username",
                                                    "password"
                                                )
                                            ),
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Password */}
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-[#111827]"
                                >
                                    {msg("password")}
                                </label>
                                {kcContext.realm.resetPasswordAllowed && (
                                    <a
                                        tabIndex={6}
                                        href={kcContext.url.loginResetCredentialsUrl}
                                        className="text-xs font-medium text-[#6b7280] hover:text-[#8b84d7]"
                                    >
                                        {msg("doForgotPassword")}
                                    </a>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                                <input
                                    tabIndex={3}
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    aria-invalid={hasError}
                                    placeholder="••••••••"
                                    className={`h-11 w-full rounded-md border bg-white pl-10 pr-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#8b84d7] focus:ring-2 focus:ring-[#8b84d7]/20 ${
                                        hasError
                                            ? "border-[#ef4444]"
                                            : "border-[#e5e7eb]"
                                    }`}
                                />
                            </div>
                            {kcContext.usernameHidden && hasError && (
                                <span
                                    className="text-xs text-[#ef4444]"
                                    aria-live="polite"
                                    dangerouslySetInnerHTML={{
                                        __html: kcSanitize(
                                            kcContext.messagesPerField.getFirstError(
                                                "username",
                                                "password"
                                            )
                                        ),
                                    }}
                                />
                            )}
                        </div>

                        {/* Remember me */}
                        {kcContext.realm.rememberMe && !kcContext.usernameHidden && (
                            <div className="flex items-center gap-2.5">
                                <input
                                    tabIndex={5}
                                    id="rememberMe"
                                    name="rememberMe"
                                    type="checkbox"
                                    defaultChecked={!!kcContext.login.rememberMe}
                                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#0c2341] focus:ring-[#8b84d7]"
                                />
                                <label
                                    htmlFor="rememberMe"
                                    className="cursor-pointer text-sm text-[#111827]"
                                >
                                    {msg("rememberMe")}
                                </label>
                            </div>
                        )}

                        {/* Submit */}
                        <input type="hidden" id="id-hidden-input" name="credentialId" value={kcContext.auth.selectedCredential} />
                        <button
                            tabIndex={7}
                            disabled={isLoginButtonDisabled}
                            name="login"
                            id="kc-login"
                            type="submit"
                            className="mt-1 h-11 w-full rounded-md bg-[#0c2341] text-sm font-semibold tracking-wide text-white transition-colors hover:bg-[#0e2a4d] focus:outline-none focus:ring-2 focus:ring-[#8b84d7] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoginButtonDisabled ? (
                                <svg
                                    className="mx-auto h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                            ) : (
                                msgStr("doLogIn")
                            )}
                        </button>
                    </form>
                )}
            </div>

            {/* WebAuthn passkey */}
            {kcContext.enableWebAuthnConditionalUI && (
                <>
                    <form id="webauth" action={kcContext.url.loginAction} method="post">
                        <input type="hidden" id="clientDataJSON" name="clientDataJSON" />
                        <input type="hidden" id="authenticatorData" name="authenticatorData" />
                        <input type="hidden" id="signature" name="signature" />
                        <input type="hidden" id="credentialId" name="credentialId" />
                        <input type="hidden" id="userHandle" name="userHandle" />
                        <input type="hidden" id="error" name="error" />
                    </form>
                    {kcContext.authenticators !== undefined &&
                        kcContext.authenticators.authenticators.length !== 0 && (
                            <form id="authn_select">
                                {kcContext.authenticators.authenticators.map((authenticator, i) => (
                                    <input
                                        key={i}
                                        type="hidden"
                                        name="authn_use_chk"
                                        readOnly
                                        value={authenticator.credentialId}
                                    />
                                ))}
                            </form>
                        )}
                    <div className="mt-4">
                        <input
                            id={webAuthnButtonId}
                            type="button"
                            className="h-11 w-full rounded-md border border-[#e5e7eb] bg-white text-sm font-medium text-[#111827] transition-colors hover:bg-gray-50"
                            value={msgStr("passkey-doAuthenticate")}
                        />
                    </div>
                </>
            )}
        </>
    );
}
