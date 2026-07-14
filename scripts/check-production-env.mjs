const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

if (!key || key === "test-site-key" || key.length < 16) {
  console.error("Production build blocked: set NEXT_PUBLIC_TURNSTILE_SITE_KEY to the public Cloudflare Turnstile site key.");
  process.exit(1);
}

console.log("✓ Production public security configuration is present.");
