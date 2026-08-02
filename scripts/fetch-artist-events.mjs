// Propose upcoming gigs for the roster from external ticketing APIs.
//
//   node scripts/fetch-artist-events.mjs            # dry run, prints proposals
//   node scripts/fetch-artist-events.mjs --write    # edits data/artists/*.yml
//   node scripts/fetch-artist-events.mjs --pr-body out.md
//
// The output is a *proposal*, never a publication: --write only edits local
// YAML, and the workflow turns that into a draft pull request for a human to
// review. Nothing here merges, deploys, or rewrites a gig a human already
// verified.
//
// Adapters skip silently when their API key is missing or when an artist has no
// id for that source, so a partially configured run still works — it just has
// fewer sources.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as yaml from "js-yaml";
import { diffAgainstExisting, mergeCandidates } from "./lib/merge-events.mjs";
import { insertGigsChecked } from "./lib/propose-yaml.mjs";
import { SourceError } from "./lib/source-http.mjs";
import * as bandsintown from "./sources/bandsintown.mjs";
import * as skiddle from "./sources/skiddle.mjs";

const DIR = "data/artists";
// Skiddle is where the roster's tickets actually live; Bandsintown adds dates an
// artist maintains themselves. RA is deliberately absent — it blocks automated
// reads outright, so it appears as a review link instead. A further source is a
// new file in sources/ plus one entry here and in SOURCE_FIELDS.
const ADAPTERS = [skiddle, bandsintown];

const args = process.argv.slice(2);
const write = args.includes("--write");
const prBodyPath = args[args.indexOf("--pr-body") + 1];
const wantsPrBody = args.includes("--pr-body") && prBodyPath && !prBodyPath.startsWith("--");
const today = new Date().toISOString().slice(0, 10);

// --since YYYY-MM-DD backfills history: a one-off, run by hand, for filling in
// past dates a source knows and the files do not. The scheduled workflow never
// passes it — proposing history on a recurring basis would produce a churn of
// pull requests about gigs that have already happened.
const sinceIndex = args.indexOf("--since");
const since = sinceIndex !== -1 ? args[sinceIndex + 1] : null;
if (sinceIndex !== -1 && !/^\d{4}-\d{2}-\d{2}$/.test(since ?? "")) {
  console.error("--since needs a YYYY-MM-DD date, e.g. --since 2024-01-01");
  process.exit(1);
}
const cutoff = since ?? today;

function loadArtists() {
  return readdirSync(DIR)
    .filter((file) => /\.ya?ml$/i.test(file))
    .sort()
    .map((file) => {
      const path = join(DIR, file);
      const text = readFileSync(path, "utf8");
      return { file, path, text, doc: yaml.load(text) ?? {} };
    })
    .filter((artist) => artist.doc.disabled !== true);
}

/** Review links a human can open in a normal browser. RA is here rather than in
 *  the adapters on purpose: ra.co/dj/<slug> returns an outright Cloudflare block
 *  to scripts and to headless browsers alike, so it cannot be fetched from CI —
 *  but it opens fine for a person. See docs/artist-events-automation.md. */
function reviewLinks(doc) {
  const links = [];
  const raSlug = doc.sources?.ra;
  if (raSlug) links.push([`RA tour dates`, `https://ra.co/dj/${raSlug}/tour-dates`]);
  for (const [platform, url] of Object.entries(doc.socials ?? {})) {
    if (url) links.push([platform, url]);
  }
  return links;
}

async function collect(doc, env, problems) {
  const lists = [];
  for (const adapter of ADAPTERS) {
    if (!env[adapter.credential]) continue;
    if (!doc.sources?.[adapter.id]) continue;
    try {
      lists.push(await adapter.fetchEvents(doc, env, { since }));
    } catch (error) {
      problems.push(error instanceof SourceError ? error.message : `${adapter.id}: ${error.message}`);
      lists.push([]);
    }
  }
  return mergeCandidates(lists, cutoff);
}

function describe(candidate) {
  const where = [candidate.venue, candidate.city, candidate.country].filter(Boolean).join(", ");
  const via = (candidate.sources ?? [candidate.source]).filter(Boolean).join(" + ");
  const extras = [
    candidate.ticketStatus ? `status: ${candidate.ticketStatus}` : null,
    candidate.freeEntry ? "free entry" : null,
    candidate.ticketLink ? `[tickets](${candidate.ticketLink})` : null,
    candidate.flyerUrl ? `[flyer](${candidate.flyerUrl})` : null,
  ].filter(Boolean);
  return `${candidate.date} — ${where} _(via ${via})_${extras.length ? ` · ${extras.join(" · ")}` : ""}`;
}

const configured = ADAPTERS.filter((adapter) => process.env[adapter.credential]).map((adapter) => adapter.id);
const artists = loadArtists();
const report = [];
const problems = [];
let proposedCount = 0;

for (const artist of artists) {
  const candidates = await collect(artist.doc, process.env, problems);
  const { additions, enrichable, dateConfirmations, conflicts } = diffAgainstExisting(candidates, artist.doc.gigs ?? []);
  if (additions.length === 0 && enrichable.length === 0 && dateConfirmations.length === 0 && conflicts.length === 0) continue;

  let applied = [];
  if (write && additions.length > 0) {
    try {
      const result = insertGigsChecked(artist.text, additions, {
        today,
        comment: (candidate) =>
          `proposed automatically from ${(candidate.sources ?? [candidate.source]).join(" + ")} — verify before merging`,
      });
      writeFileSync(artist.path, result.text);
      applied = result.applied;
    } catch (error) {
      problems.push(`${artist.file}: ${error.message}`);
      continue;
    }
  }

  proposedCount += additions.length;
  report.push({ artist, additions, enrichable, dateConfirmations, conflicts, applied });
}

// ---- Human-readable output -------------------------------------------------

const lines = [];
lines.push(since ? `## Backfilled artist events since ${since} (run ${today})` : `## Proposed artist events (${today})`);
lines.push("");
lines.push(
  configured.length > 0
    ? `Sources queried: **${configured.join(", ")}**.`
    : "_No source API keys are configured, so no source was queried._",
);
lines.push("");
lines.push(since
  ? "**Local history backfill** — not what the scheduled workflow does. Past dates need no `eventId`; check each gig really is this artist before keeping it."
  : "Every entry below is a machine suggestion. Verify the date, venue and line-up before merging, and **replace the generated `eventId`** with the shared id if other roster artists play the same event.");
lines.push("");

if (report.length === 0) {
  lines.push("Nothing new found.");
} else {
  for (const { artist, additions, enrichable, dateConfirmations, conflicts, applied } of report) {
    lines.push(`### ${artist.doc.name ?? artist.file}`);
    lines.push("");
    for (const candidate of additions) {
      const eventId = applied.find((entry) => entry.candidate === candidate)?.eventId;
      lines.push(`- **New:** ${describe(candidate)}${eventId ? ` · \`eventId: ${eventId}\`` : ""}`);
    }
    for (const { candidate, existing } of conflicts) {
      lines.push(`- **⚠️ Same date, different venue:** the file says **${existing.venue}** on \`${existing.date}\`; source says ${describe(candidate)}. Probably one booking recorded two ways — reconcile by hand, nothing was added.`);
    }
    for (const { candidate, existing } of dateConfirmations) {
      lines.push(`- **Possible date for a TBC gig:** the file has \`${existing.date}\` (${existing.venue}, exact day TBC); source reports ${describe(candidate)}. If it is the same booking, set the exact date by hand — nothing was added.`);
    }
    for (const { candidate, gained } of enrichable) {
      lines.push(`- **Already listed**, source also knows \`${gained.join("`, `")}\`: ${describe(candidate)} — apply by hand if correct.`);
    }
    const links = reviewLinks(artist.doc);
    if (links.length > 0) {
      lines.push(`- _Check by hand:_ ${links.map(([label, url]) => `[${label}](${url})`).join(" · ")}`);
    }
    lines.push("");
  }
}

if (problems.length > 0) {
  lines.push("### Source problems");
  lines.push("");
  for (const problem of problems) lines.push(`- ${problem}`);
  lines.push("");
  lines.push("_A failing source narrows this run; it does not invalidate the proposals above._");
  lines.push("");
}

const output = lines.join("\n");
console.log(output);
if (wantsPrBody) writeFileSync(prBodyPath, `${output}\n`);

// Signals to the workflow: only open a pull request when something changed.
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(process.env.GITHUB_OUTPUT, `proposed=${write ? proposedCount : 0}\n`, { flag: "a" });
}

if (!write && proposedCount > 0) {
  console.log(`\n(dry run — ${proposedCount} gig(s) would be added; re-run with --write to apply)`);
}
