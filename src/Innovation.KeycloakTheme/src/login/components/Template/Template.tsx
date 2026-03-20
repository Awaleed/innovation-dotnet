/**
 * This file has been claimed for ownership from @keycloakify/login-ui version 250004.7.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "login/components/Template/Template.tsx" --revert
 */

import type { ReactNode } from "react";
import { useEffect, useState, useRef } from "react";
import { kcSanitize } from "@keycloakify/login-ui/kcSanitize";
import { useInitializeTemplate } from "./useInitializeTemplate";
import { useI18n } from "../../i18n";
import { useKcContext } from "../../KcContext";
import { Globe, ChevronDown, Check } from "lucide-react";

export function Template(props: {
    displayInfo?: boolean;
    displayMessage?: boolean;
    displayRequiredFields?: boolean;
    headerNode: ReactNode;
    socialProvidersNode?: ReactNode;
    infoNode?: ReactNode;
    documentTitle?: string;
    bodyClassName?: string;
    children: ReactNode;
}) {
    const {
        displayInfo = false,
        displayMessage = true,
        displayRequiredFields = false,
        headerNode,
        socialProvidersNode = null,
        infoNode = null,
        documentTitle,
        children,
    } = props;

    const { kcContext } = useKcContext();
    const { msg, msgStr, currentLanguage, enabledLanguages } = useI18n();

    useEffect(() => {
        document.title =
            documentTitle ??
            msgStr("loginTitle", kcContext.realm.displayName || kcContext.realm.name);
    }, []);

    const { isReadyToRender } = useInitializeTemplate();

    if (!isReadyToRender) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-white font-sans">
            {/* ── Brand panel — dots background (desktop only) ── */}
            <div
                className="relative hidden flex-col items-center justify-center lg:flex lg:w-1/2"
                style={{ backgroundColor: "#0c2341" }}
            >
                {/* Repeating dot grid */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle, rgba(255,255,255,0.12) 1.5px, transparent 1.5px)",
                        backgroundSize: "26px 26px",
                    }}
                />

                {/* Edge vignette */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(ellipse 75% 65% at 50% 50%, transparent 30%, rgba(12,35,65,0.72) 100%)",
                    }}
                />

                {/* Lavender glow behind logo */}
                <div
                    className="absolute rounded-full"
                    style={{
                        width: "420px",
                        height: "420px",
                        background:
                            "radial-gradient(circle, rgba(139,132,215,0.18) 0%, transparent 70%)",
                        filter: "blur(56px)",
                    }}
                />

                {/* Logo */}
                <div className="relative z-10">
                    <img
                        src={`${(kcContext.url as Record<string, string>).resourcesPath ?? ""}/img/logo-full-white.svg`}
                        alt={kcContext.realm.displayName || "Innovation"}
                        className="h-28 object-contain"
                        onError={(e) => {
                            // Fallback: show realm name as text
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const fallback = document.createElement("span");
                            fallback.className = "text-3xl font-bold text-white";
                            fallback.textContent =
                                kcContext.realm.displayName || kcContext.realm.name;
                            target.parentElement?.appendChild(fallback);
                        }}
                    />
                </div>
            </div>

            {/* ── Form panel ── */}
            <div className="relative flex w-full flex-col items-center justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:px-16">
                {/* Mobile logo */}
                <div className="mb-8 lg:hidden">
                    <img
                        src={`${(kcContext.url as Record<string, string>).resourcesPath ?? ""}/img/logo-full.svg`}
                        alt={kcContext.realm.displayName || "Innovation"}
                        className="h-16 object-contain"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                        }}
                    />
                </div>

                {/* Language switcher */}
                {enabledLanguages.length > 1 && (
                    <LanguageSwitcher
                        currentLanguage={currentLanguage}
                        enabledLanguages={enabledLanguages}
                    />
                )}

                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="mb-8">
                        {(() => {
                            const node =
                                kcContext.auth !== undefined &&
                                kcContext.auth.showUsername &&
                                !kcContext.auth.showResetCredentials ? (
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700">
                                            {kcContext.auth.attemptedUsername}
                                        </span>
                                        <a
                                            href={kcContext.url.loginRestartFlowUrl}
                                            className="text-xs text-[#8b84d7] hover:underline"
                                            aria-label={msgStr("restartLoginTooltip")}
                                        >
                                            {msg("restartLoginTooltip")}
                                        </a>
                                    </div>
                                ) : (
                                    <h1 className="text-2xl font-bold text-[#0c2341]">
                                        {headerNode}
                                    </h1>
                                );

                            if (displayRequiredFields) {
                                return (
                                    <div>
                                        <span className="mb-2 block text-xs text-gray-500">
                                            <span className="text-red-500">*</span>{" "}
                                            {msg("requiredFields")}
                                        </span>
                                        {node}
                                    </div>
                                );
                            }

                            return node;
                        })()}
                        {/* Accent line */}
                        <div className="mt-4 h-0.5 w-10 rounded-full bg-[#8b84d7]" />
                    </div>

                    {/* Messages */}
                    {displayMessage &&
                        kcContext.message !== undefined &&
                        (kcContext.message.type !== "warning" ||
                            !kcContext.isAppInitiatedAction) && (
                            <div
                                className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                                    kcContext.message.type === "error"
                                        ? "border-red-200 bg-red-50 text-red-700"
                                        : kcContext.message.type === "warning"
                                          ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                                          : kcContext.message.type === "success"
                                            ? "border-green-200 bg-green-50 text-green-700"
                                            : "border-blue-200 bg-blue-50 text-blue-700"
                                }`}
                            >
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: kcSanitize(kcContext.message.summary),
                                    }}
                                />
                            </div>
                        )}

                    {/* Form content */}
                    {children}

                    {/* Try another way */}
                    {kcContext.auth !== undefined &&
                        kcContext.auth.showTryAnotherWayLink && (
                            <form
                                id="kc-select-try-another-way-form"
                                action={kcContext.url.loginAction}
                                method="post"
                                className="mt-4"
                            >
                                <input type="hidden" name="tryAnotherWay" value="on" />
                                <a
                                    href="#"
                                    className="text-sm text-[#8b84d7] hover:underline"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document.forms[
                                            "kc-select-try-another-way-form" as never
                                        ].requestSubmit();
                                    }}
                                >
                                    {msg("doTryAnotherWay")}
                                </a>
                            </form>
                        )}

                    {/* Social providers */}
                    {socialProvidersNode}

                    {/* Info (e.g., registration link) */}
                    {displayInfo && (
                        <div className="mt-6 border-t border-gray-200 pt-4 text-center text-sm text-gray-500">
                            {infoNode}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function LanguageSwitcher(props: {
    currentLanguage: { languageTag: string; label: string };
    enabledLanguages: { languageTag: string; label: string; href: string }[];
}) {
    const { currentLanguage, enabledLanguages } = props;
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div className="absolute right-6 top-6" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition-colors hover:bg-gray-50 focus:border-[#8b84d7] focus:outline-none focus:ring-2 focus:ring-[#8b84d7]/20"
            >
                <Globe className="h-4 w-4" />
                <span>{currentLanguage.label}</span>
                <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-1.5 min-w-[160px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {enabledLanguages.map(({ languageTag, label, href }) => {
                        const isActive = languageTag === currentLanguage.languageTag;
                        return (
                            <a
                                key={languageTag}
                                href={href}
                                className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                    isActive
                                        ? "bg-[#f3f2fc] font-medium text-[#0c2341]"
                                        : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                <span>{label}</span>
                                {isActive && (
                                    <Check className="h-4 w-4 text-[#8b84d7]" />
                                )}
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
