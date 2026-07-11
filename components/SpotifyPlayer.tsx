"use client";

// Renders a single Spotify embed matching the active theme. Spotify bakes the
// theme into the iframe URL, so flipping the site theme reloads the player —
// the trade-off for not downloading two full embeds on every page view (a
// display:none iframe still loads). Waits for mount so the visitor's stored
// theme, not the SSR default, decides which iframe loads first.
import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

export default function SpotifyPlayer({ src, title }: { src: string; title: string }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="h-[352px] w-full"
        style={{ backgroundColor: "var(--surface)" }}
        aria-hidden="true"
      />
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
