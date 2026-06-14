import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Generate a fully static site (no Node.js server needed at runtime).
  // Output goes to `out/` — serve with `npx serve out` or any static host.
  output: "export",

  // next/image optimisation requires a server; with static export we serve
  // the originals as-is (still perfectly fine for this site).
  images: { unoptimized: true },

  // Allow ngrok tunnels to access the dev server.
  // Without this, Next.js 15+ blocks _next/static JS from external hosts,
  // causing React hydration to fail silently (animations, theme toggle stop working).
  allowedDevOrigins: [
    "*.ngrok-free.app",   // ngrok free tier (.app)
    "*.ngrok-free.dev",   // ngrok free tier (.dev) — current default
    "*.ngrok.app",        // ngrok paid
    "*.ngrok.io",         // ngrok legacy
    "*.eu.ngrok.io",      // ngrok EU region
  ],
};

export default nextConfig;
