"use client";

// Spotify is loaded only after an explicit click. This avoids a third-party
// request, cookies and a heavy iframe for visitors who only read the profile.
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

export default function SpotifyPlayer({ src, title }: { src: string; title: string }) {
  const { theme } = useTheme();
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    return (
      <div
        className="flex h-[352px] w-full flex-col items-center justify-center gap-3 px-6 text-center"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="btn-cta min-h-[44px] px-6 py-3 text-xs font-semibold uppercase tracking-widest"
        >
          Load Spotify player
        </button>
        <p className="max-w-sm text-xs" style={{ color: "var(--text-40)" }}>
          Loads media from Spotify and shares your IP address with Spotify.
        </p>
      </div>
    );
  }

  const sep = src.includes("?") ? "&" : "?";
  return (
    <iframe
      src={`${src}${sep}theme=${theme === "light" ? 1 : 0}`}
      width="100%"
      height="352"
      title={title}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      className="w-full"
      style={{ border: 0 }}
    />
  );
}
