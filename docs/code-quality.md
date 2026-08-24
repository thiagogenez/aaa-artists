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
| `npm run test:coverage` | Node test runner | What did the tests not reach? |
| `npm run test:mutation` | Stryker | Would the tests actually notice if the code were wrong? |
| `npm run lint:commits` | commitlint | Are the commit messages Conventional Commits? |

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
accessibility problems that ESLint never checked for. Those a11y rules are set to `"warn"` with
a comment in `biome.jsonc` pointing at issue #45; promote each back to `"error"` as it clears.

## The architecture contract has one blind spot — read this

`arch-contract.yaml` declares six layers and the allowed dependencies between them. It works,
and it caught a real boundary crossing while being written.

**It analyses TypeScript only.** A deliberate probe — a `.js` file in `worker/` importing
`../lib/site` and `react` — was *not* flagged (verified 2026-08-11). So the `worker` (`.js`) and
`tooling` (`.mjs`) layers are documented by the contract but not enforced by it.

The enforcement for those lives in `eslint.config.mjs` as `no-restricted-imports` rules, which
*were* verified to fail on the same probe. **If you change one, change the other**, and say so
in the pull request. The invariant either way is:

> The Worker may import from `config/` and nothing else. It runs in the Cloudflare Workers
> runtime, where React, Next.js, and the static export do not exist.

## Commit messages

`commitlint` runs in CI (`.github/workflows/commit-style.yml`) against every commit in a pull
request *and* against the pull request title, because squash-merging turns the title into the
commit on `main`.

It is deliberately **not** a local husky `commit-msg` hook: commits here are signed from the
maintainer's own terminal, and a hook in that path risks breaking the one place where signing
works. To check locally before pushing:

```bash
npm run lint:commits
```

The same workflow also fails a pull request whose description does not reference an issue
(`Closes #N` or `Refs #N`), which is the enforcement behind the standard in `CLAUDE.md`.

## Coverage

```bash
npm run test:coverage     # writes coverage/lcov.info, prints a table
```

Uploaded to Codecov from `checks / verify` under the `unit` flag. The repository is public, so
the upload is tokenless, and `fail_ci_if_error` is `false` — a flaky third-party upload must
never fail the required gate.

Baseline on 2026-08-11: **95.01% lines, 72.58% branches, 94.29% functions** across `worker/`,
`config/` and `scripts/lib/`.

Codecov is **informational**, with no blocking threshold (`codecov.yml`). A hard coverage gate
tends to produce assertions written to move a number. The honest question — *would the tests
notice if this code were wrong?* — is what mutation testing answers.

**Not yet covered:** the Playwright suite runs in CI but does not report coverage. Instrumenting
a static export and mapping V8 coverage back to source needs more machinery than it is worth
right now; tracked on issue #43.

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

## Dead code

```bash
npm run knip
npm run knip -- --fix     # applies the safe removals
```

Knip's first run found that `data/formOptions.ts` still exported `CAPACITY_RANGES` and
`BUDGET_RANGES` that nothing read — the live copies live in `config/booking.js`, which the
Worker also validates against. That was a real drift hazard, not just clutter: editing the dead
copy would have produced form values the Worker rejects.
