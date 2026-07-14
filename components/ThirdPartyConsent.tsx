"use client";

import { useState } from "react";

export default function ThirdPartyConsent({
  provider,
  className,
  children,
}: {
  provider: string;
  className: string;
  children: React.ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) return children;

  return (
    <div className={`flex flex-col items-center justify-center gap-3 px-6 text-center ${className}`} style={{ backgroundColor: "var(--surface)" }}>
      <button type="button" onClick={() => setLoaded(true)} className="btn-cta min-h-[44px] px-6 py-3 text-xs font-semibold uppercase tracking-widest">
        Load {provider} player
      </button>
      <p className="max-w-sm text-xs" style={{ color: "var(--text-40)" }}>
        Loads media from {provider} and shares your IP address with {provider}.
      </p>
    </div>
  );
}
