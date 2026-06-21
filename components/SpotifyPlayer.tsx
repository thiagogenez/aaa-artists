// Renders both the light (theme=1) and dark (theme=0) Spotify players and shows
// the one matching the active theme purely via CSS (.theme-light-only /
// .theme-dark-only in globals.css). Both are present up front, so flipping the
// site theme is instant — no iframe reload/flash. `src` is the embed URL without
// a theme param (built by spotifyEmbedSrc).
export default function SpotifyPlayer({ src, title }: { src: string; title: string }) {
  const sep = src.includes("?") ? "&" : "?";
  return (
    <>
      <iframe
        src={`${src}${sep}theme=1`}
        width="100%"
        height="352"
        title={title}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="theme-light-only w-full"
        style={{ border: 0 }}
      />
      <iframe
        src={`${src}${sep}theme=0`}
        width="100%"
        height="352"
        title={title}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="theme-dark-only w-full"
        style={{ border: 0 }}
      />
    </>
  );
}
