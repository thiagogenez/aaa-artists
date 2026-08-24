# The quality pipeline

What has to pass before code reaches `main`, what runs after it does, and — deliberately — what
was evaluated and left out. Written for issue #61.

## The gate

Every pull request runs these. None of them is optional, and `main` cannot be pushed to
directly: it is protected, force pushes and deletion are blocked, the branch must be up to date,
conversations must be resolved, and **administrators are included** (`enforce_admins: true`).

| Job | Checks | Why it blocks |
| --- | --- | --- |
| `checks / verify` | Content validation, unit + integration tests with coverage, Codecov upload, formatting, ESLint + Biome, Knip, arch-contract, production dependency audit, production-env validation | Correctness and code health |
| `checks / browser` | Static export build, **performance budget**, Wrangler bundle dry-run, Playwright across desktop Chromium, tablet WebKit and mobile WebKit | The site actually builds, is not getting heavier, and works in a real browser |
| `commit-style / commitlint` | Conventional Commits on every commit **and** on the pull request title | The title becomes the commit on `main` when squash-merging |
| `commit-style / description-standard` | Issue reference, and the `Change` / `Verification` / `Risks and limitations` / `Next steps` sections present and non-empty | A pull request is the project's changelog; an empty one is a lie by omission |

After merge: `main` deploys **staging** automatically. Production is a separate manual
dispatch that re-runs the same checks, uploads an inactive candidate, smoke-tests that exact
candidate on its own preview URL, and only then promotes it. A red run means production was
never touched.

Not on the gate, by choice:

- **Stryker** (mutation testing) — minutes per run, useful weekly rather than per commit.
  `npm run test:mutation`.
- **Codecov thresholds** — reporting only. A hard coverage gate produces assertions written to
  move a number.

## Everything in one command

```bash
npm run check           # artist and event content
npm run check:quality   # format + ESLint + Biome + Knip + arch-contract
npm test                # unit + integration
npm run test:coverage   # the same, with an lcov report
npm run build           # static export
npm run check:performance
npm run test:e2e        # build + Playwright, all three viewports
```

## What each part of the pipeline covers

### Observability

Cloudflare Workers Logs, enabled at 100% sampling, with OpenTelemetry-shaped records carrying
the deployed version id. See `docs/observability.md`.

**Not adopted:** Datadog and New Relic — there is no infrastructure here to monitor, only one
Worker and a static export, and each would add a paid vendor and a second data processor for
signal Cloudflare already provides. **Open decision:** Sentry on the Worker only (no browser
SDK), tracked on #41. A browser-side SDK is a controller decision, not an engineering one.

### Code quality

Biome (format + correctness + accessibility), ESLint with `eslint-config-next` (the framework
rules Biome has no equivalent for), commitlint, Knip, arch-contract, Stryker. Full reasoning,
including where arch-contract cannot see and what covers the gap, in `docs/code-quality.md`.

### Tests

Unit and integration on Node's built-in runner; end-to-end on Playwright across three viewports;
coverage published to Codecov.

**Endtest was evaluated and not adopted.** It is a commercial record-and-replay service, and it
would overlap almost entirely with the Playwright suite already running in CI on every pull
request. Three specific reasons against it here:

1. **It cannot gate this pipeline the way Playwright does.** The checks run inside GitHub
   Actions against the freshly built export. A hosted runner testing a deployed URL cannot block
   a merge before deployment, which is the whole point of the gate.
2. **It would need somewhere to point.** Staging is on workers.dev and public; the canonical
   domains 403 datacenter IPs because of Cloudflare Bot Fight Mode — the same reason the release
   workflow never smoke-tests aaaartists.co from CI.
3. **Recorded tests are a liability on a site that changes shape.** The suite here asserts
   layout behaviour from 320px to 1440px, which is exactly the kind of test that recorded
   selectors break on.

Revisit if non-technical people need to author tests themselves. That is the problem Endtest
actually solves, and it is not a problem this repository has today.

### Security and operation

| Item | State |
| --- | --- |
| Rate limiting | Live. Cloudflare rate-limit bindings on hashed actor and on email address, 10/min and 5/min, plus Turnstile before the email quota is spent |
| Security review | Performed over this change set. Findings and evidence recorded on #61; one low-severity input-validation inconsistency opened as #60 |
| Performance budget | New. `npm run check:performance`, enforced in `checks / browser` |
| Backend/frontend separation | Enforced, not just described: arch-contract for TypeScript, ESLint `no-restricted-imports` for the Worker's JavaScript. The Worker may import `config/` and nothing else |
| Privacy notice reviewed and approved | **Not done.** Seven controller decisions hold the release gate — #54 |
| Terms of use reviewed and approved | **Not done.** None exist — #59 |

The last two are not engineering tasks and must not be closed by writing plausible-sounding
legal text. `config/privacy.js` exists precisely to make that impossible.

### Architecture

`docs/architecture-principles.md`: avoid overengineering, know the real bottlenecks,
componentise, apply DRY with judgement, and do not rebuild what already exists — with the
inventory that makes the last one checkable.

## Known gap in the gate

`commit-style / commitlint` and `commit-style / description-standard` **are not yet in the
required-checks list**, because a required check that has never reported blocks every pull
request forever. They can only be added after the workflow exists on `main`.

Once it does:

```bash
gh api -X PATCH repos/thiagogenez/aaa-artists/branches/main/protection/required_status_checks \
  -f 'contexts[]=checks / verify' \
  -f 'contexts[]=checks / browser' \
  -f 'contexts[]=commit-style / commitlint' \
  -f 'contexts[]=commit-style / description-standard'
```

Verify with:

```bash
gh api repos/thiagogenez/aaa-artists/branches/main/protection \
  --jq '.required_status_checks.contexts'
```

Until that runs, the two jobs execute and report but do not block.
