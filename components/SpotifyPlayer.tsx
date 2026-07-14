"use client";

// Spotify is loaded only after an explicit click. This avoids a third-party
// request, cookies and a heavy iframe for visitors who only read the profile.
import { useTheme } from "@/components/ThemeProvider";
import ThirdPartyConsent from "@/components/ThirdPartyConsent";

export default function SpotifyPlayer({ src, title }: { src: string; title: string }) {
  const { theme } = useTheme();
  const sep = src.includes("?") ? "&" : "?";
  return (
    <ThirdPartyConsent provider="Spotify" className="h-[352px] w-full">
      <iframe
        src={`${src}${sep}theme=${theme === "light" ? 1 : 0}`}
        width="100%"
        height="352"
        title={title}
        loading="lazy"
        referrerPolicy="no-referrer"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="w-full"
        style={{ border: 0 }}
      />
    </ThirdPartyConsent>
  );
}
