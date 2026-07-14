"use client";

import Script from "next/script";

export default function TurnstileWidget({ siteKey }: { siteKey: string }) {
  if (!siteKey) return null;

  return (
    <div className="mb-5 max-w-full overflow-hidden">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-action="booking_enquiry"
        data-theme="auto"
        data-size="flexible"
      />
      <noscript>
        <p className="text-sm">JavaScript is required to send this enquiry securely.</p>
      </noscript>
    </div>
  );
}
