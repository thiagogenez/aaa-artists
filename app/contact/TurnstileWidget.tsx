"use client";

import Script from "next/script";
import { useEffect, useId, useState } from "react";

declare global {
  interface Window {
    turnstile?: { reset: () => void };
    [key: `aaaTurnstile${string}`]: (() => void) | undefined;
  }
}

export default function TurnstileWidget({ siteKey }: { siteKey: string }) {
  const callbackId = useId().replace(/[^A-Za-z0-9]/g, "");
  const [status, setStatus] = useState("");
  const successCallback = `aaaTurnstileSuccess${callbackId}` as const;
  const expiredCallback = `aaaTurnstileExpired${callbackId}` as const;
  const errorCallback = `aaaTurnstileError${callbackId}` as const;

  useEffect(() => {
    window[successCallback] = () => setStatus("");
    window[expiredCallback] = () => setStatus("The security check expired. Please complete it again.");
    window[errorCallback] = () => setStatus("The security check could not load. Check your connection and try again.");
    return () => {
      delete window[successCallback];
      delete window[expiredCallback];
      delete window[errorCallback];
    };
  }, [errorCallback, expiredCallback, successCallback]);

  if (!siteKey || siteKey === "test-site-key") return null;

  return (
    <div className="mb-5 max-w-full overflow-hidden">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onError={() => setStatus("The security check could not load. Check your connection and try again.")}
      />
      <div
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
