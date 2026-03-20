/**
 * This file has been claimed for ownership from @keycloakify/login-ui version 250004.7.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "login/components/Template/Template.tsx" --revert
 */

import type { ReactNode } from "react";
import { useEffect } from "react";
import { clsx } from "@keycloakify/login-ui/tools/clsx";
import { kcSanitize } from "@keycloakify/login-ui/kcSanitize";
import { useSetClassName } from "@keycloakify/login-ui/tools/useSetClassName";
import { useInitializeTemplate } from "./useInitializeTemplate";
import { useKcClsx } from "@keycloakify/login-ui/useKcClsx";
import { useI18n } from "../../i18n";
import { useKcContext } from "../../KcContext";

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
        bodyClassName,
        children
    } = props;

    const { kcContext } = useKcContext();
    const { msg, msgStr, currentLanguage, enabledLanguages } = useI18n();
    const { kcClsx } = useKcClsx();

    useEffect(() => {
        document.title =
            documentTitle ?? msgStr("loginTitle", kcContext.realm.displayName || kcContext.realm.name);
    }, []);

    useSetClassName({
        qualifiedName: "html",
        className: kcClsx("kcHtmlClass")
    });

    useSetClassName({
        qualifiedName: "body",
        className: bodyClassName ?? kcClsx("kcBodyClass")
    });

    const { isReadyToRender } = useInitializeTemplate();

    if (!isReadyToRender) {
        return null;
    }

    const realmName = kcContext.realm.displayName || kcContext.realm.name;

    return (
        <div style={{ display: "flex", height: "100svh", overflow: "hidden" }}>
            {/* ── Brand panel (desktop only) ── */}
            <div
                id="brand-panel"
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "50%",
                    backgroundColor: "#0c2341",
                }}
            >
                {/* Dot grid */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage:
                            "radial-gradient(circle, rgba(255,255,255,0.12) 1.5px, transparent 1.5px)",
                        backgroundSize: "26px 26px",
                    }}
                />
                {/* Vignette */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "radial-gradient(ellipse 75% 65% at 50% 50%, transparent 30%, rgba(12,35,65,0.72) 100%)",
                    }}
                />
                {/* Lavender glow */}
                <div
                    style={{
                        position: "absolute",
                        width: "420px",
                        height: "420px",
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(139,132,215,0.18) 0%, transparent 70%)",
                        filter: "blur(56px)",
                    }}
                />
                {/* Realm name */}
                <div style={{ position: "relative", zIndex: 10 }}>
                    <span style={{ fontSize: "1.875rem", fontWeight: 700, color: "#fff" }}>
                        {realmName}
                    </span>
                </div>
            </div>

            {/* ── Form panel ── */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    width: "50%",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    overflowY: "auto",
                    backgroundColor: "#ffffff",
                    padding: "3rem 4rem",
                }}
            >
                {/* Default Keycloak content inside a constrained container */}
                <div style={{ width: "100%", maxWidth: "24rem" }}>
                    <div className={kcClsx("kcLoginClass")}>
                        <div id="kc-header" className={kcClsx("kcHeaderClass")}>
                            <div id="kc-header-wrapper" className={kcClsx("kcHeaderWrapperClass")}>
                                {msg("loginTitleHtml", kcContext.realm.displayNameHtml || kcContext.realm.name)}
                            </div>
                        </div>
                        <div className={kcClsx("kcFormCardClass")}>
                            <header className={kcClsx("kcFormHeaderClass")}>
                                {enabledLanguages.length > 1 && (
                                    <div className={kcClsx("kcLocaleMainClass")} id="kc-locale">
                                        <div id="kc-locale-wrapper" className={kcClsx("kcLocaleWrapperClass")}>
                                            <div
                                                id="kc-locale-dropdown"
                                                className={clsx("menu-button-links", kcClsx("kcLocaleDropDownClass"))}
                                            >
                                                <button
                                                    tabIndex={1}
                                                    id="kc-current-locale-link"
                                                    aria-label={msgStr("languages")}
                                                    aria-haspopup="true"
                                                    aria-expanded="false"
                                                    aria-controls="language-switch1"
                                                >
                                                    {currentLanguage.label}
                                                </button>
                                                <ul
                                                    role="menu"
                                                    tabIndex={-1}
                                                    aria-labelledby="kc-current-locale-link"
                                                    aria-activedescendant=""
                                                    id="language-switch1"
                                                    className={kcClsx("kcLocaleListClass")}
                                                >
                                                    {enabledLanguages.map(({ languageTag, label, href }, i) => (
                                                        <li key={languageTag} className={kcClsx("kcLocaleListItemClass")} role="none">
                                                            <a role="menuitem" id={`language-${i + 1}`} className={kcClsx("kcLocaleItemClass")} href={href}>
                                                                {label}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {(() => {
                                    const node = !(
                                        kcContext.auth !== undefined &&
                                        kcContext.auth.showUsername &&
                                        !kcContext.auth.showResetCredentials
                                    ) ? (
                                        <h1 id="kc-page-title">{headerNode}</h1>
                                    ) : (
                                        <div id="kc-username" className={kcClsx("kcFormGroupClass")}>
                                            <label id="kc-attempted-username">{kcContext.auth.attemptedUsername}</label>
                                            <a id="reset-login" href={kcContext.url.loginRestartFlowUrl} aria-label={msgStr("restartLoginTooltip")}>
                                                <div className="kc-login-tooltip">
                                                    <i className={kcClsx("kcResetFlowIcon")}></i>
                                                    <span className="kc-tooltip-text">{msg("restartLoginTooltip")}</span>
                                                </div>
                                            </a>
                                        </div>
                                    );

                                    if (displayRequiredFields) {
                                        return (
                                            <div className={kcClsx("kcContentWrapperClass")}>
                                                <div className={clsx(kcClsx("kcLabelWrapperClass"), "subtitle")}>
                                                    <span className="subtitle">
                                                        <span className="required">*</span>
                                                        {msg("requiredFields")}
                                                    </span>
                                                </div>
                                                <div className="col-md-10">{node}</div>
                                            </div>
                                        );
                                    }

                                    return node;
                                })()}
                            </header>
                            <div id="kc-content">
                                <div id="kc-content-wrapper">
                                    {displayMessage &&
                                        kcContext.message !== undefined &&
                                        (kcContext.message.type !== "warning" || !kcContext.isAppInitiatedAction) && (
                                            <div
                                                className={clsx(
                                                    `alert-${kcContext.message.type}`,
                                                    kcClsx("kcAlertClass"),
                                                    `pf-m-${kcContext.message?.type === "error" ? "danger" : kcContext.message.type}`
                                                )}
                                            >
                                                <div className="pf-c-alert__icon">
                                                    {kcContext.message.type === "success" && <span className={kcClsx("kcFeedbackSuccessIcon")}></span>}
                                                    {kcContext.message.type === "warning" && <span className={kcClsx("kcFeedbackWarningIcon")}></span>}
                                                    {kcContext.message.type === "error" && <span className={kcClsx("kcFeedbackErrorIcon")}></span>}
                                                    {kcContext.message.type === "info" && <span className={kcClsx("kcFeedbackInfoIcon")}></span>}
                                                </div>
                                                <span
                                                    className={kcClsx("kcAlertTitleClass")}
                                                    dangerouslySetInnerHTML={{ __html: kcSanitize(kcContext.message.summary) }}
                                                />
                                            </div>
                                        )}
                                    {children}
                                    {kcContext.auth !== undefined && kcContext.auth.showTryAnotherWayLink && (
                                        <form id="kc-select-try-another-way-form" action={kcContext.url.loginAction} method="post">
                                            <div className={kcClsx("kcFormGroupClass")}>
                                                <input type="hidden" name="tryAnotherWay" value="on" />
                                                <a
                                                    href="#"
                                                    id="try-another-way"
                                                    onClick={event => {
                                                        event.preventDefault();
                                                        document.forms["kc-select-try-another-way-form" as never].requestSubmit();
                                                        return false;
                                                    }}
                                                >
                                                    {msg("doTryAnotherWay")}
                                                </a>
                                            </div>
                                        </form>
                                    )}
                                    {socialProvidersNode}
                                    {displayInfo && (
                                        <div id="kc-info" className={kcClsx("kcSignUpClass")}>
                                            <div id="kc-info-wrapper" className={kcClsx("kcInfoAreaWrapperClass")}>
                                                {infoNode}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile responsive: hide brand panel, full-width form */}
            <style>{`
                @media (max-width: 1023px) {
                    #brand-panel { display: none !important; }
                    #brand-panel + div { width: 100% !important; padding: 1.5rem !important; }
                }
            `}</style>
        </div>
    );
}
