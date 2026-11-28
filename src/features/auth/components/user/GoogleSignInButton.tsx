"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useGoogleAuthStatus } from "@features/auth/components/GoogleAuthProvider";

type GoogleSignInButtonProps = {
  label: string;
  /** Another action on the page is running. */
  disabled: boolean;
  /** The backend is checking the Google token. */
  verifying: boolean;
  onAccessToken: (accessToken: string) => void;
  onProblem: (message: string) => void;
};

const BUTTON_CLASS =
  "mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white px-4 text-sm font-semibold text-[#14244B] ring-1 ring-[#DCE4F3] transition-colors hover:bg-[#F7F9FD] disabled:opacity-60";

function GoogleMark() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77a6.59 6.59 0 0 1-9.87-3.47H2.18v2.84A11 11 0 0 0 12 23Z" fill="#34A853" />
      <path d="M5.84 14.09A6.5 6.5 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.95 10.95 0 0 0 2.18 7.07l3.66 2.84A6.58 6.58 0 0 1 12 5.38Z" fill="#EA4335" />
    </svg>
  );
}

/**
 * Google sign-in button. `useGoogleLogin` throws outside GoogleOAuthProvider, so the hook only
 * runs in the inner component, which is mounted once a client ID is configured.
 */
export function GoogleSignInButton(props: GoogleSignInButtonProps) {
  const { t } = useLanguage();
  const status = useGoogleAuthStatus();

  if (status === "unconfigured") {
    return (
      <button
        type="button"
        onClick={() => props.onProblem(t("auth.error.googleNotConfigured"))}
        disabled={props.disabled}
        className={BUTTON_CLASS}
      >
        <GoogleMark />
        <span>{props.label}</span>
      </button>
    );
  }

  return <ConfiguredGoogleButton {...props} scriptReady={status === "ready"} />;
}

function ConfiguredGoogleButton({
  label,
  disabled,
  verifying,
  onAccessToken,
  onProblem,
  scriptReady,
}: GoogleSignInButtonProps & { scriptReady: boolean }) {
  const { t } = useLanguage();
  // True while the Google popup is open. It never disables anything, so the page cannot get stuck on it.
  const [popupOpen, setPopupOpen] = useState(false);

  const startGoogleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: (token) => {
      setPopupOpen(false);
      onAccessToken(token.access_token);
    },
    // Google answered with an OAuth error (e.g. access_denied).
    onError: () => {
      setPopupOpen(false);
      onProblem(t("auth.error.googleFailed"));
    },
    // The popup never produced an answer: closed by the user, blocked by the browser, or unknown.
    onNonOAuthError: (error) => {
      setPopupOpen(false);
      if (error.type === "popup_closed") return;
      onProblem(
        t(error.type === "popup_failed_to_open" ? "auth.error.googlePopupBlocked" : "auth.error.googleFailed")
      );
    },
  });

  // Safety net: if Google never reports that the popup was closed, stop the spinner once the
  // user is back on this window. A successful sign-in still arrives through onSuccess.
  useEffect(() => {
    if (!popupOpen) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onFocus = () => {
      timer = setTimeout(() => setPopupOpen(false), 1500);
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      if (timer) clearTimeout(timer);
    };
  }, [popupOpen]);

  function onClick() {
    // Script blocked (ad blocker, network) or still loading: there is no popup to open.
    if (!scriptReady) {
      onProblem(t("auth.error.googleUnavailable"));
      return;
    }
    onProblem("");
    setPopupOpen(true);
    startGoogleLogin();
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled || verifying} className={BUTTON_CLASS}>
      {verifying || popupOpen ? (
        <LoaderCircle className="animate-spin text-[#204195]" size={18} />
      ) : (
        <GoogleMark />
      )}
      <span>{label}</span>
    </button>
  );
}
