"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render?: (container: HTMLElement, params: Record<string, unknown>) => string | undefined;
      reset: (widgetId?: string) => void;
      remove?: (widgetId: string) => void;
    };
    [key: `aaaTurnstile${string}`]: (() => void) | undefined;
  }
}

const EXPIRED_MESSAGE = "The security check expired. Please complete it again.";
const ERROR_MESSAGE = "The security check could not load. Check your connection and try again.";

export default function TurnstileWidget({ siteKey }: { siteKey: string }) {
  const callbackId = useId().replace(/[^A-Za-z0-9]/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("");
  const successCallback = `aaaTurnstileSuccess${callbackId}` as const;
  const expiredCallback = `aaaTurnstileExpired${callbackId}` as const;
  const errorCallback = `aaaTurnstileError${callbackId}` as const;

  useEffect(() => {
    window[successCallback] = () => setStatus("");
    window[expiredCallback] = () => setStatus(EXPIRED_MESSAGE);
    window[errorCallback] = () => setStatus(ERROR_MESSAGE);
    return () => {
      delete window[successCallback];
      delete window[expiredCallback];
      delete window[errorCallback];
    };
  }, [errorCallback, expiredCallback, successCallback]);

  // Cloudflare's api.js only auto-renders .cf-turnstile elements that exist when
  // the script loads. This component is remounted (key bump) after form reset or
  // a failed submission to obtain a fresh single-use token, so when the script is
  // already present the new container must be rendered explicitly or the widget
  // silently disappears.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !window.turnstile?.render) return;
    if (container.childElementCount > 0) return;
    const widgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      action: "booking_enquiry",
      theme: "auto",
      size: "flexible",
      callback: () => setStatus(""),
      "expired-callback": () => setStatus(EXPIRED_MESSAGE),
      "error-callback": () => setStatus(ERROR_MESSAGE),
    });
    return () => {
      if (widgetId) window.turnstile?.remove?.(widgetId);
    };
  }, [siteKey]);

  if (!siteKey || siteKey === "test-site-key") return null;

  return (
    <div className="mb-5 max-w-full overflow-hidden">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onError={() => setStatus(ERROR_MESSAGE)}
      />
      <div
        ref={containerRef}
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-action="booking_enquiry"
        data-theme="auto"
        data-size="flexible"
        data-callback={successCallback}
        data-expired-callback={expiredCallback}
        data-error-callback={errorCallback}
      />
      {status && (
        <div className="mt-3 flex flex-wrap items-center gap-3" role="alert" aria-live="assertive">
          <p className="text-xs" style={{ color: "var(--error)" }}>{status}</p>
          <button
            type="button"
            className="btn-outline min-h-[44px] px-3 text-xs font-semibold uppercase tracking-widest"
            onClick={() => {
              setStatus("");
              window.turnstile?.reset();
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
