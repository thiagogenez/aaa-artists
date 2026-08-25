# Code quality gates

What each tool is for, when it runs, and why it was set up the way it was. Added for
issue #42.

## One command

```bash
npm run check:quality     # format:check + lint (ESLint + Biome) + knip + arch
```

That is the same set `checks / verify` runs on every pull request, so a green local run
means a green gate.

## The tools

| Command | Tool | Answers |
| --- | --- | --- |
| `npm run format` / `format:check` | Biome | Is the code formatted the one agreed way? |
| `npm run lint` | ESLint + Biome | Framework rules, correctness, accessibility, import boundaries |
| `npm run knip` | Knip | Is anything here unused — files, exports, dependencies? |
| `npm run arch` | arch-contract | Did a change cross an architectural boundary? |
| `npm run test:mutation` | Stryker | Would the tests actually notice if the code were wrong? |
| Pull request title check | commitlint | Will the squash commit on `main` be Conventional? |

## Biome does not replace ESLint

Both run. They do different jobs and do not overlap:

- **ESLint** keeps `eslint-config-next`, which carries the Next.js App Router, `next/image`
  and React hooks rules. Biome has no equivalent for those.
- **Biome** owns formatting and general correctness/accessibility. It is roughly two orders of
  magnitude faster than ESLint on this repository, which is why it is the one wired into
  `format:check`.

ESLint contributes no formatting rules here, so the two never fight over the same code.

Biome's first run found 87 formatting deviations and 22 lint findings, including an unused
import in `worker/index.js`, two dead duplicated option lists in `data/formOptions.ts`, and 14
accessibility problems that ESLint never checked for. Issue #45 replaced the improvised
semantics and removed the temporary warning overrides, so the recommended accessibility rules
now fail CI when they regress.

## One contract, two enforcement tools

`arch-contract.yaml` declares six layers and the allowed dependencies between them. It works,
and it caught a real boundary crossing while being written.

**arch-contract analyses TypeScript only.** Deliberate probes in `worker/` (`.js`) and
`scripts/` (`.mjs`) confirmed that it does not see those files. Their matching
`no-restricted-imports` rules therefore live in `eslint.config.mjs`; ESLint does see both.

The enforcement for those lives in `eslint.config.mjs` as `no-restricted-imports` rules, which
were verified to fail on the same probes. **If you change one, change the other**, and say so
in the pull request. The invariant either way is:

> The Worker may import from `config/` and nothing else. It runs in the Cloudflare Workers
> runtime, where React, Next.js, and the static export do not exist.

Tooling may import from `config/`, `worker/` and other files in `scripts/`; it may not import
from `app/`, `components/`, `lib/` or `data/`. Browser code may never import `scripts/`, and
generated artist JSON must be accessed through `data/artists.ts`.

## Commit messages

`commitlint` runs in CI (`.github/workflows/commit-style.yml`) against the pull request title,
because squash-merging turns that title into the commit on `main`. Intermediate commits are not
retained and are deliberately not linted.

The repository does not install a local Git hook: commits here are signed from the maintainer's
own terminal, and GitHub CI is the authoritative gate.

The same workflow also fails a pull request whose description does not reference an issue
(`Closes #N` or `Refs #N`), which enforces the shared standard in `AGENTS.md`.

## Local checks

Run checks in proportion to the change. The complete local quality and tooling suite remains one
explicit command:

```bash
npm run check:local   # check:quality + test:tooling
```

The tooling suite includes a structural test for the PR-description job: checkout and Node setup
must happen before the job invokes `scripts/validate-pr-body.mjs`. That test covers the failure
first seen on PR #75, where ordinary linting passed but GitHub could not load the script because
the job had no checkout step.

Dependency installation does not change `core.hooksPath` or install repository hooks. This keeps
local iteration and signed commits independent from project setup while GitHub CI remains the
merge authority.

## Mutation testing

```bash
npm run test:mutation     # reports/mutation/index.html
```

Scoped to `worker/index.js`, `scripts/lib/merge-events.mjs` and `config/booking.js` — the code
where a weak test is expensive. It runs the whole suite once per mutant, so it is minutes, not
seconds, and it is deliberately **not** part of `checks / verify`: adding it would push the
required gate past its 20-minute budget for a signal that is useful weekly, not per commit.

`thresholds.break` is `null`, so it reports rather than fails. If it ever becomes a gate, raise
the floor as the score improves; never lower it to make a red run green.

## Targeted public-surface review

Issue #67 reviewed the public surface on 2026-08-24. The site is a static export with no login,
database, session or user content; the only body-accepting route is `POST /api/enquiries`.

- **Email content and headers:** every dynamic HTML value passes through `escapeHtml()`. Values
  that reach the subject, recipient metadata or address fields must be bounded single-line text,
  so CR/LF injection is rejected before Brevo is called. The Worker tests exercise HTML payloads
  and CR/LF in the name, email and artist fields.
- **Turnstile:** production fails closed without its secret and validates every token with
  Siteverify, a five-second timeout, the `booking_enquiry` action and the canonical hostname.
  Cloudflare documents tokens as single-use; the tests cover a replay response as well as the
  wrong action, hostname and production testing key. See:
  <https://developers.cloudflare.com/turnstile/get-started/server-side-validation/>.
- **Rate limits:** the actor key is a SHA-256 hash of Cloudflare's connecting IP and the email key
  hashes the lower-cased address. `submissionId` does not affect either key. Tests verify those
  properties without retaining the raw values. An attacker can still rotate real source IPs and
  Cloudflare's counters are deliberately permissive and per-location, so the actor limit reduces
  abuse rather than identifying a person; Turnstile and the email limit remain separate gates.
  See: <https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/>.
- **Submission reference:** a browser-generated UUIDv4 is accepted only as a stable customer and
  mail thread reference. It is not forwarded as an idempotency control. Brevo's current
  documentation and a recent upstream live reproduction disagree about the supported placement
  and behaviour; issue #86 records why the project makes no provider-side deduplication guarantee.
- **Redirects:** destinations are constructed from fixed canonical host and path values. Existing
  tests prove that HTTP and `www` preserve path/query while `/events` changes only the fixed path
  to `/artists`; no request value becomes a destination host.
- **Errors and logs:** retained logs use an allowlist and responses expose only public fallback
  copy plus a random request ID. Tests prove that enquiry fields, raw IPs and provider error text
  do not survive the boundary.
- **Body exhaustion:** the Worker rejects declared or streamed bodies over 64 KiB and never calls
  `request.json()` on an unbounded body. Tests cover both an oversized stream and a dishonest
  `Content-Length`. Cloudflare's proxy and DDoS protection own incomplete slow connections before
  they can exhaust an origin. See:
  <https://developers.cloudflare.com/ddos-protection/frequently-asked-questions/>.
- **Build and deploy:** third-party event data can only produce validated artist YAML in a draft
  pull request; it cannot merge or deploy. Production remains manual, check-gated and transactional
  through an inactive candidate. Scheduled date refreshes may rebuild production only when `main`
  matches the commit already live.

Strix was rejected for this scope. An autonomous model-backed scanner would add another credential,
spend and staging automation before this one-file surface has shown a gap that targeted tests cannot
cover. Reconsider it only if a reproducible class of findings outgrows this review approach.

## Dead code

```bash
npm run knip
npm run knip -- --fix     # applies the safe removals
```

Knip's first run found that `data/formOptions.ts` still exported `CAPACITY_RANGES` and
`BUDGET_RANGES` that nothing read — the live copies live in `config/booking.js`, which the
Worker also validates against. That was a real drift hazard, not just clutter: editing the dead
copy would have produced form values the Worker rejects.
