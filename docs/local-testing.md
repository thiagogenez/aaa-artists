# Testing locally, including the booking email

How to check the site and the booking form on your own machine, and what each method
does and does not prove. Written for issue #62.

## The booking email

**There is no local `sendmail`, and nothing goes to `root`.** The Worker delivers over
HTTPS to Brevo's API, not over SMTP, so no local mail transfer agent is involved at any
point. Three ways to look at the email, from cheapest to most real:

### 1. Just look at the email — no server, no key, no network

```bash
npm run preview:email          # writes .preview/enquiry-email.html and .txt
npm run preview:email -- --open
```

This calls the **same `enquiryEmail()` the Worker calls**, so what opens in the browser is
byte-for-byte what Brevo would be asked to send. The sample enquiry is deliberately full —
two artists, both timing modes, every optional field — because a sparse one hides most of
the template.

Use it when you are changing the email's wording or layout. It proves nothing about the
form or the Worker.

### 2. The full round trip, still emailing nobody

```bash
# terminal 1
npm run dev:mail               # mail catcher on http://127.0.0.1:8025

# terminal 2 — .dev.vars must contain BREVO_API_BASE=http://127.0.0.1:8025
npm run dev:worker             # builds, then wrangler dev on http://localhost:8787
```

Then fill in the form at <http://localhost:8787/contact>.

The catcher accepts the exact POST the Worker sends to Brevo, writes the email to
`.preview/`, prints a summary, and answers with a Brevo-shaped `201` so the Worker's
success path runs for real. This exercises the form, Turnstile, the Worker's validation,
the stable submission reference, the email rendering, and the `enquiry_delivered` log record.

**Not** the rate limits. Rate Limit bindings only exist on the named environments, and
`withinLimit()` returns `true` when the binding is absent, so every local submission is
unthrottled. That path is covered instead by `tests/worker/enquiries.test.mjs`, which
drives it with stub bindings.

`.dev.vars` for this (never commit it — it is gitignored):

```ini
ENVIRONMENT=development
BREVO_API_KEY=not-used-by-the-catcher-but-must-be-present
BREVO_API_BASE=http://127.0.0.1:8025
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

That Turnstile secret is Cloudflare's documented **always-passes** test key.

`dev:worker` deliberately runs **without** `--env`. Wrangler only passes through the
`.dev.vars` keys the chosen environment declares, and `env.staging` declares no
`BREVO_API_KEY` on purpose, so `--env staging` drops both Brevo variables and the enquiry
fails closed with a 503 before it ever reaches the catcher.

**The seam is closed in production by construction.** `BREVO_API_BASE` is only honoured
when `ENVIRONMENT !== "production"`, so the variable cannot divert real booking mail even
if it is set by accident.

### 3. A real email to your own inbox

The only way to see what a real mail client does with it — threading, the sender identity,
whether it lands in spam, and whether Brevo's DKIM is aligned for a mailbox that Microsoft
365 receives.

```ini
BREVO_API_KEY=<a real key>
BOOKING_BCC_OVERRIDE=your.own@address        # replaces bookings@aaaartists.co on the BCC
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

Leave `BREVO_API_BASE` unset, run `npm run dev:worker`, and use your own address in the
form. `BOOKING_BCC_OVERRIDE` keeps the agency's shared inbox out of it — like
`BREVO_API_BASE`, it is honoured only when `ENVIRONMENT !== "production"`, so in production
the BCC is always the real booking address. It still spends a send from the daily quota.

This is **not** part of the regression suite and is not run on every change: levels 1 and 2
cover everything a code change can break, without credentials and without emailing anyone.
A real send proves delivery and deliverability, which is infrastructure, not code — do it
once, and again only when the sender, the domain or the DNS changes. Tracked on
[#48](https://github.com/thiagogenez/aaa-artists/issues/48).

## Is the site still consistent?

```bash
npm run test:visual                          # build, then compare in canonical Linux
npm run test:visual -- --update-snapshots    # build, then accept the current look
```

Docker Desktop (macOS) or Docker Engine (Linux) must be running. The command uses the
same digest-pinned Playwright Linux image as CI, so fonts and browser rasterisation are
identical instead of producing a second set of platform-specific screenshots.

42 screenshots: 7 routes × light and dark × desktop Chromium, tablet WebKit and mobile
WebKit. The baseline was captured from a **clean build of the deployed `main`**, not from a
working tree mid-change, so it describes the site as it is in production.

Third-party frames never load (consent stays denied) and every animation is frozen, so the
images are deterministic rather than a race against SoundCloud.

**What it proves:** the resting appearance of every page is unchanged. It was verified to
catch a real regression — an 8px change to the navbar height failed all 42 screenshots.

**What it does not prove:** anything about interaction states. The mobile menu open, the
modal open, a hovered card and a mid-submit form are not photographed — tracked on #63.
Animation itself is outside this baseline and remains tracked by issue #40.

Accepting a diff is a decision. When screenshots change, say in the pull request which ones
and why they are supposed to look different.

## The rest of the suite

```bash
npm run check           # artist and event YAML
npm run lint            # ESLint
npm test                # Worker and events suites
npm run build
npm run test:e2e        # build + the whole Playwright suite
```

## Re-capturing the visual baseline from `main`

Only needed to re-bootstrap from production rather than accept the working tree:

```bash
git worktree add --detach /tmp/aaa-baseline origin/main
cd /tmp/aaa-baseline && npm ci && NEXT_PUBLIC_TURNSTILE_SITE_KEY=test-site-key npm run build
cd -   # back to the working tree
SITE_DIR=/tmp/aaa-baseline/out npm run test:visual:run -- --update-snapshots
git worktree remove /tmp/aaa-baseline
```

`SITE_DIR` is read by `playwright.config.ts`; it points the static server at a different
build so the same specs can photograph either one. Do **not** symlink `node_modules` into
the worktree — Turbopack rejects a symlink that leaves the project root, which is why the
recipe above runs a real `npm ci`.

Only the 42 `-linux.png` files are committed. Both local visual checks and CI use the
official Playwright 1.62.0 Linux image pinned to the same immutable digest. Update that
digest in `scripts/run-visual-tests.mjs` and `.github/workflows/checks.yml` together.
