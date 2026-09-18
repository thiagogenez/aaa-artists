// Reads every artist file in data/artists/*.yml, validates it, and writes the
// combined data/artists.data.json that the site imports. Run automatically
// before `npm run dev` and `npm run build`; run `npm run check` to validate
// without writing (it prints friendly errors and exits non-zero on problems).
import * as yaml from "js-yaml";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BPM_DOMAIN, NIGHT_MOMENTS, SOUND_GROUPS } from "../config/artist-discovery.mjs";

const DIR = "data/artists";
const OUT = "data/artists.data.json";
const REQUIRED = ["name", "artistType", "slug", "genre", "tagline", "bio", "image"];
const GIG_REQUIRED = ["date", "venue", "city", "country"];
const SOCIAL_FIELDS = new Set([
  "instagram",
  "soundcloud",
  "facebook",
  "spotify",
  "youtube",
  "beatport",
  "website",
]);
// Ids used by scripts/fetch-artist-events.mjs to look this artist up on each
// gig source. Build tooling only — stripped from the generated JSON below, so
// none of it ships to the browser. "ra" is a review link, never fetched.
const SOURCE_FIELDS = new Set(["skiddle", "bandsintown", "ra"]);
const SOUND_STYLE_IDS = new Set(
  SOUND_GROUPS.flatMap((group) => group.styles.map((style) => style.id))
);
const NIGHT_MOMENT_IDS = new Set(NIGHT_MOMENTS.map((moment) => moment.id));

const errors = [];
const seenSlugs = new Map();
const today = new Date().toISOString().slice(0, 10);

// Matches lib/events.ts isUpcomingEventDate: exact dates compare to today,
// month-only (YYYY-MM) dates count as upcoming for their whole month.
function isUpcomingDate(date) {
  return date.length === 7 ? date >= today.slice(0, 7) : date >= today;
}

function asDateString(value) {
  // YAML may parse an unquoted date as a Date object — normalise to "YYYY-MM-DD".
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value == null ? value : String(value);
}

function isValidDate(value) {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return year >= 2000 && month >= 1 && month <= 12;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isLocalAsset(value) {
  return (
    typeof value === "string" &&
    /^\/[A-Za-z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/i.test(value) &&
    !value.includes("..")
  );
}

function checkSoundProfiles(profiles, file) {
  if (!Array.isArray(profiles) || profiles.length === 0) {
    errors.push(`${file}: "soundProfiles" must contain at least one profile`);
    return [];
  }

  const seenStyles = new Set();
  return profiles.map((profile, index) => {
    const where = `${file} → soundProfiles[${index + 1}]`;
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      errors.push(`${where}: must be an object`);
      return profile;
    }
    if (!SOUND_STYLE_IDS.has(profile.style)) {
      errors.push(`${where}: unsupported style "${profile.style ?? ""}"`);
    } else if (seenStyles.has(profile.style)) {
      errors.push(`${where}: style "${profile.style}" is already listed for this artist`);
    }
    seenStyles.add(profile.style);

    const min = profile.bpm?.min;
    const max = profile.bpm?.max;
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      errors.push(`${where}: "bpm.min" and "bpm.max" must be whole numbers`);
    } else if (min < BPM_DOMAIN.min || max > BPM_DOMAIN.max || min > max) {
      errors.push(
        `${where}: BPM range must stay between ${BPM_DOMAIN.min} and ${BPM_DOMAIN.max}, with min not greater than max`
      );
    }

    if (!Array.isArray(profile.moments) || profile.moments.length === 0) {
      errors.push(`${where}: "moments" must contain at least one moment`);
    } else {
      const seenMoments = new Set();
      for (const moment of profile.moments) {
        if (!NIGHT_MOMENT_IDS.has(moment)) {
          errors.push(`${where}: unsupported moment "${moment}"`);
        } else if (seenMoments.has(moment)) {
          errors.push(`${where}: moment "${moment}" is listed more than once`);
        }
        seenMoments.add(moment);
      }
    }

    return profile;
  });
}

function checkGigs(gigs, file, listName) {
  if (gigs == null) return [];
  if (!Array.isArray(gigs)) {
    errors.push(`${file}: "${listName}" must be a list of gigs`);
    return [];
  }
  const normalized = gigs.map((gig, i) => {
    const where = `${file} → ${listName}[${i + 1}]`;
    for (const field of GIG_REQUIRED) {
      if (!gig?.[field]) errors.push(`${where}: missing "${field}"`);
    }
    const date = asDateString(gig?.date);
    if (date && !isValidDate(date))
      errors.push(`${where}: "date" must be a real YYYY-MM-DD or YYYY-MM date`);
    // The date decides past vs upcoming. Future-dated entries need a stable
    // eventId so /events can merge shared line-ups; once the date has passed
    // the requirement lapses (it only ever relaxes, so scheduled rebuilds can
    // never start failing on their own).
    if (!gig?.eventId && date && isValidDate(date) && isUpcomingDate(date)) {
      errors.push(`${where}: missing "eventId" (required while the date is today or later)`);
    }
    if (gig?.eventId && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gig.eventId)) {
      errors.push(
        `${where}: "eventId" must contain lowercase letters, numbers and single hyphens only`
      );
    }
    if (gig?.ticketLink && !isHttpsUrl(gig.ticketLink))
      errors.push(`${where}: "ticketLink" must be an https URL`);
    if (gig?.ticketStatus && !["available", "sold-out", "unavailable"].includes(gig.ticketStatus)) {
      errors.push(`${where}: "ticketStatus" must be "available", "sold-out", or "unavailable"`);
    }
    if (gig?.ticketStatus && !gig?.ticketLink)
      errors.push(`${where}: "ticketStatus" requires "ticketLink"`);
    if (gig?.freeEntry !== undefined && typeof gig.freeEntry !== "boolean") {
      errors.push(`${where}: "freeEntry" must be true or false`);
    }
    // A free event has no ticket availability to report; claiming both would be
    // contradictory on the card and in the event schema.
    if (gig?.freeEntry && gig?.ticketStatus) {
      errors.push(`${where}: "freeEntry" cannot be combined with "ticketStatus"`);
    }
    if (gig?.flyer && !isLocalAsset(gig.flyer))
      errors.push(`${where}: "flyer" must be a local /path image`);
    return { ...gig, date };
  });
  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index - 1].date > normalized[index].date) {
      errors.push(`${file}: "${listName}" must be ordered oldest to newest`);
      break;
    }
  }
  return normalized;
}

const files = readdirSync(DIR)
  .filter((f) => /\.ya?ml$/i.test(f))
  .sort();
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
  if (doc.artistType && !["solo", "group"].includes(doc.artistType)) {
    errors.push(`${file}: "artistType" must be "solo" or "group"`);
  }
  if (doc.slug) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(doc.slug)) {
      errors.push(
        `${file}: "slug" must contain lowercase letters, numbers and single hyphens only`
      );
    }
    if (seenSlugs.has(doc.slug)) {
      errors.push(`${file}: slug "${doc.slug}" is already used in ${seenSlugs.get(doc.slug)}`);
    }
    seenSlugs.set(doc.slug, file);
  }
  if (doc.image && !isLocalAsset(doc.image))
    errors.push(`${file}: "image" must be a local /path image`);

  doc.soundProfiles = checkSoundProfiles(doc.soundProfiles, file);

  doc.socials = doc.socials ?? {};
  if (!doc.socials || typeof doc.socials !== "object" || Array.isArray(doc.socials)) {
    errors.push(`${file}: "socials" must be an object`);
    doc.socials = {};
  }
  for (const [platform, url] of Object.entries(doc.socials)) {
    if (!SOCIAL_FIELDS.has(platform))
      errors.push(`${file}: unsupported social platform "${platform}"`);
    if (url && !isHttpsUrl(url)) errors.push(`${file}: social "${platform}" must be an https URL`);
  }
  if (doc.spotifyEmbed && !isHttpsUrl(doc.spotifyEmbed)) {
    errors.push(`${file}: "spotifyEmbed" must be an https URL`);
  }
  // The artist page is audio-only, so a youtubeEmbed would silently do nothing.
  if (doc.youtubeEmbed) {
    errors.push(
      `${file}: "youtubeEmbed" is no longer rendered — the "Listen" section is audio-only`
    );
  }
  for (const legacyKey of ["pastGigs", "upcomingGigs"]) {
    if (legacyKey in doc) {
      errors.push(
        `${file}: "${legacyKey}" was merged into a single "gigs" list (ordered oldest to newest; the date decides past vs upcoming) — see data/artists/README.md`
      );
    }
  }
  if (doc.sources !== undefined) {
    if (typeof doc.sources !== "object" || doc.sources === null || Array.isArray(doc.sources)) {
      errors.push(`${file}: "sources" must be an object of platform ids`);
      doc.sources = {};
    } else {
      for (const [platform, value] of Object.entries(doc.sources)) {
        if (!SOURCE_FIELDS.has(platform)) {
          errors.push(
            `${file}: unsupported event source "${platform}" (expected ${[...SOURCE_FIELDS].join(", ")})`
          );
        }
        if (value === null || value === undefined || String(value).trim() === "") {
          errors.push(
            `${file}: event source "${platform}" needs the artist's id on that platform, or remove the line`
          );
        }
      }
    }
  }

  doc.gigs = checkGigs(doc.gigs, file, "gigs");
  artists.push(doc);
}

const eventsById = new Map();
for (const artist of artists) {
  for (const gig of artist.gigs) {
    if (!gig.eventId) continue;
    const existing = eventsById.get(gig.eventId);
    const comparable = JSON.stringify({
      date: gig.date,
      venue: gig.venue,
      city: gig.city,
      country: gig.country,
      ticketLink: gig.ticketLink ?? "",
      ticketStatus: gig.ticketStatus ?? "",
      flyer: gig.flyer ?? "",
    });
    if (existing && existing.comparable !== comparable) {
      errors.push(`${artist.slug}: eventId "${gig.eventId}" conflicts with ${existing.artist}`);
    } else if (!existing) {
      eventsById.set(gig.eventId, { comparable, artist: artist.slug });
    }
  }
}

if (errors.length > 0) {
  console.error("\n✗ Found problems in the artist data:\n");
  for (const e of errors) console.error(`   • ${e}`);
  console.error("\nFix the file(s) above, then run `npm run check` again.\n");
  process.exit(1);
}

const skippedNote =
  skipped.length > 0 ? ` (${skipped.length} disabled: ${skipped.join(", ")})` : "";

if (process.argv.includes("--check")) {
  console.log(`✓ All ${artists.length} artist files look good.${skippedNote}`);
  process.exit(0);
}

// `sources` is lookup data for the event fetcher, not page content — keep it
// out of the bundle the browser downloads.
const published = artists.map(({ sources, ...artist }) => artist);

writeFileSync(OUT, `${JSON.stringify(published, null, 2)}\n`);
console.log(`✓ Built ${OUT} from ${artists.length} artist files.${skippedNote}`);
