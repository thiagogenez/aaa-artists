"use client";

// Spotify is loaded only once media consent is granted (or the visitor loads
// this one player). Until then no third-party request is made at all.
import { useTheme } from "@/components/ThemeProvider";
import ThirdPartyConsent from "@/components/ThirdPartyConsent";

export default function SpotifyPlayer({
  src,
  title,
  className = "h-[352px]",
}: {
  src: string;
  title: string;
  className?: string;
}) {
  const { theme } = useTheme();
  const sep = src.includes("?") ? "&" : "?";
  return (
    <ThirdPartyConsent provider="Spotify" className={`w-full ${className}`}>
      <iframe
        src={`${src}${sep}theme=${theme === "light" ? 1 : 0}`}
        width="100%"
        height="100%"
        title={title}
        loading="lazy"
        referrerPolicy="no-referrer"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="block h-full w-full"
        style={{ border: 0 }}
      />
    </ThirdPartyConsent>
  );
}
