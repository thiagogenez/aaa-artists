"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

declare global {
  interface Window {
    turnstile?: {
      render?: (container: HTMLElement, params: Record<string, unknown>) => string | undefined;
      reset: (widgetId?: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}

const EXPIRED_MESSAGE = "The security check expired. Please complete it again.";
const ERROR_MESSAGE = "The security check could not load. Check your connection and try again.";

/** Renders the Turnstile widget explicitly (never via the script's one-time DOM
 *  scan) so it survives remounts — the form remounts it after reset or a failed
 *  submission to obtain a fresh single-use token — and so it can follow the
 *  SITE theme toggle rather than Turnstile's "auto", which tracks the OS
 *  preference and can clash with the page. A theme change re-renders the
 *  widget, the same trade-off SpotifyPlayer makes. */
export default function TurnstileWidget({ siteKey }: { siteKey: string }) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const container = containerRef.current;
    // scriptReady covers the first load; the window check covers remounts,
    // where the script is already present and onLoad will not fire again.
    if (!container || !window.turnstile?.render) return;
    const widgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      action: "booking_enquiry",
      theme,
      size: "flexible",
      callback: () => setStatus(""),
      "expired-callback": () => setStatus(EXPIRED_MESSAGE),
      "error-callback": () => setStatus(ERROR_MESSAGE),
    });
    widgetIdRef.current = widgetId;
    return () => {
      widgetIdRef.current = undefined;
      if (widgetId) window.turnstile?.remove?.(widgetId);
    };
  }, [scriptReady, siteKey, theme]);

  if (!siteKey || siteKey === "test-site-key") return null;

  return (
    <div className="mb-5 max-w-full overflow-hidden">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setStatus(ERROR_MESSAGE)}
      />
      <div ref={containerRef} />
      {status && (
        <div className="mt-3 flex flex-wrap items-center gap-3" role="alert" aria-live="assertive">
          <p className="text-xs" style={{ color: "var(--error)" }}>{status}</p>
          <button
            type="button"
            className="btn-outline min-h-[44px] px-3 text-xs font-semibold uppercase tracking-widest"
            onClick={() => {
              setStatus("");
              window.turnstile?.reset(widgetIdRef.current);
            }}
          >
            Retry security check
          </button>
        </div>
      )}
      <noscript>
        <p className="text-sm">JavaScript is required to send this enquiry securely.</p>
      </noscript>
    </div>
  );
}
