// Reads every artist file in data/artists/*.yml, validates it, and writes the
// combined data/artists.data.json that the site imports. Run automatically
// before `npm run dev` and `npm run build`; run `npm run check` to validate
// without writing (it prints friendly errors and exits non-zero on problems).
import * as yaml from "js-yaml";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "data/artists";
const OUT = "data/artists.data.json";
const REQUIRED = ["name", "slug", "genre", "tagline", "bio", "image"];
const GIG_REQUIRED = ["date", "venue", "city", "country"];

const errors = [];
const seenSlugs = new Map();

function asDateString(value) {
  // YAML may parse an unquoted date as a Date object — normalise to "YYYY-MM-DD".
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value == null ? value : String(value);
}

function checkGigs(gigs, file, listName) {
  if (gigs == null) return [];
  if (!Array.isArray(gigs)) {
    errors.push(`${file}: "${listName}" must be a list of gigs`);
    return [];
  }
  return gigs.map((gig, i) => {
    const where = `${file} → ${listName}[${i + 1}]`;
    for (const field of GIG_REQUIRED) {
      if (!gig?.[field]) errors.push(`${where}: missing "${field}"`);
    }
    return { ...gig, date: asDateString(gig?.date) };
  });
}

const files = readdirSync(DIR).filter((f) => /\.ya?ml$/i.test(f)).sort();
if (files.length === 0) errors.push(`No artist files found in ${DIR}/`);

const artists = [];
const skipped = [];
for (const file of files) {
  let doc;
  try {
    doc = yaml.load(readFileSync(join(DIR, file), "utf8"));
  } catch (e) {
    errors.push(`${file}: not valid YAML — ${e.message.split("\n")[0]}`);
    continue;
  }
  if (!doc || typeof doc !== "object") {
    errors.push(`${file}: file is empty or not formatted correctly`);
    continue;
  }
  if (doc.disabled === true) {
    skipped.push(doc.name ?? file);
    continue;
  }

  for (const field of REQUIRED) {
    if (!doc[field]) errors.push(`${file}: missing "${field}"`);
  }
  if (doc.slug) {
    if (seenSlugs.has(doc.slug)) {
      errors.push(`${file}: slug "${doc.slug}" is already used in ${seenSlugs.get(doc.slug)}`);
    }
    seenSlugs.set(doc.slug, file);
  }

  doc.socials = doc.socials ?? {};
  doc.pastGigs = checkGigs(doc.pastGigs, file, "pastGigs");
  doc.upcomingGigs = checkGigs(doc.upcomingGigs, file, "upcomingGigs");
  artists.push(doc);
}

if (errors.length > 0) {
  console.error("\n✗ Found problems in the artist data:\n");
  for (const e of errors) console.error("   • " + e);
  console.error("\nFix the file(s) above, then run `npm run check` again.\n");
  process.exit(1);
}

const skippedNote =
  skipped.length > 0 ? ` (${skipped.length} disabled: ${skipped.join(", ")})` : "";

if (process.argv.includes("--check")) {
  console.log(`✓ All ${artists.length} artist files look good.${skippedNote}`);
  process.exit(0);
}

writeFileSync(OUT, JSON.stringify(artists, null, 2) + "\n");
console.log(`✓ Built ${OUT} from ${artists.length} artist files.${skippedNote}`);
