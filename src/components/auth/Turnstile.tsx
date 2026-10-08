import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  TURNSTILE_SITE_KEY,
  captchaEnabled,
  getCaptchaState,
  onCaptchaReset,
  onCaptchaToken,
  setCaptchaFailed,
  setCaptchaToken,
} from "@/lib/auth/captcha";

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = SCRIPT_SRC;
      el.async = true;
      el.defer = true;
      el.onload = () => resolve();
      el.onerror = () => {
        scriptPromise = null;
        reject(new Error("Turnstile failed to load"));
      };
      document.head.appendChild(el);
    });
  }
  return scriptPromise;
}

/**
 * Renders the Turnstile check when VITE_TURNSTILE_SITE_KEY is set; renders
 * nothing otherwise, so local, demo and self-hosted builds are unaffected.
 * Place it in any form that signs up, signs in with a password, or requests a
 * password reset.
 */
export function Turnstile({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!captchaEnabled() || !ref.current) return;
    let widgetId: string | undefined;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId = window.turnstile.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: "interaction-only",
          callback: (token: string) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(null),
          "error-callback": () => {
            setCaptchaToken(null);
            setCaptchaFailed(true);
          },
        });
      })
      .catch(() => {
        setCaptchaToken(null);
        setCaptchaFailed(true);
      });
    const offReset = onCaptchaReset(() => {
      if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
    });
    return () => {
      cancelled = true;
      offReset();
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      setCaptchaToken(null);
      setCaptchaFailed(false);
    };
  }, []);

  if (!captchaEnabled()) return null;
  return <div ref={ref} className={className} />;
}

/** True when the form may submit: captcha is off, a token is ready, or the widget failed. */
export function useCaptchaReady(): boolean {
  const state = useSyncExternalStore(onCaptchaToken, getCaptchaState, getCaptchaState);
  return !captchaEnabled() || state !== "none";
}
