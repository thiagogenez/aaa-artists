// Insert proposed gigs into data/artists/*.yml as *text*.
//
// js-yaml cannot round-trip comments, and the artist files are full of them —
// "his real account (soundcloud.com/krevix is someone else)", "reconfirm when
// tickets go live". Those comments are the human verification trail, so a
// load/dump cycle would be a real regression. Instead this parses only to
// decide WHERE a gig belongs in the oldest-to-newest order, then splices the
// new block in and leaves every other byte untouched.

import * as yaml from "js-yaml";
import { gigFields, isUpcoming, isUsableCandidate, suggestEventId } from "./merge-events.mjs";

const GIGS_HEADING = /^gigs:\s*$/;
const ITEM_START = /^ {2}-\s/;
const ITEM_DATE = /^\s*-\s+date:\s*(['"]?)([0-9]{4}-[0-9]{2}(?:-[0-9]{2})?)\1/;
/** Plain scalars must not start a YAML construct or contain ": " / " #". */
const NEEDS_QUOTES = /^[\s>|*&!%@`?-]|:\s|\s#|^$|^(?:true|false|null|yes|no|on|off|~)$/i;

function scalar(value) {
  if (typeof value === "boolean") return String(value);
  const text = String(value);
  if (NEEDS_QUOTES.test(text) || /^[\d.]+$/.test(text)) return JSON.stringify(text);
  return text;
}

/** Render one gig as the indented YAML block used throughout data/artists.
 *
 *  `past: true` drops the ticketing fields. PastDates never renders them, no
 *  one can buy a ticket to a gig that has happened, and a stale
 *  `ticketStatus: available` on a past date is simply untrue — the hand-written
 *  history in data/artists carries none of it either. */
export function formatGigBlock(candidate, { eventId, comment, past = false } = {}) {
  const gig = gigFields(candidate);
  if (past) {
    delete gig.ticketLink;
    delete gig.ticketStatus;
  }
  const lines = [];
  if (comment) lines.push(`  # ${comment}`);
  // Dates are always quoted so YAML never reads them as sexagesimal numbers.
  lines.push(`  - date: ${JSON.stringify(gig.date)}`);
  if (eventId) lines.push(`    eventId: ${eventId}`);
  for (const field of ["venue", "city", "country", "ticketLink", "ticketStatus"]) {
    if (gig[field] !== undefined) lines.push(`    ${field}: ${scalar(gig[field])}`);
  }
  if (gig.freeEntry) lines.push("    freeEntry: true");
  return lines;
}

/** Locate the `gigs:` list and every item inside it. */
export function locateGigs(lines) {
  const heading = lines.findIndex((line) => GIGS_HEADING.test(line));
  if (heading === -1) return null;

  let end = lines.length;
  for (let i = heading + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === "") continue;
    // A non-indented, non-comment line ends the block.
    if (!/^\s/.test(line)) { end = i; break; }
  }

  const items = [];
  for (let i = heading + 1; i < end; i += 1) {
    if (!ITEM_START.test(lines[i])) continue;
    const match = lines[i].match(ITEM_DATE);
    items.push({ start: i, date: match ? match[2] : null });
  }
  for (let i = 0; i < items.length; i += 1) {
    items[i].end = i + 1 < items.length ? items[i + 1].start : end;
  }
  return { heading, end, items };
}

/** Line index at which a gig of `date` should be inserted to keep the list
 *  ordered oldest to newest, along with any leading comment lines that belong
 *  to the following item. */
function insertionPoint(lines, block, date) {
  const following = block.items.find((item) => item.date && item.date > date);
  if (!following) return block.end;
  // Comment lines directly above an item describe that item, so insert above them.
  let at = following.start;
  while (at - 1 > block.heading && lines[at - 1].trim().startsWith("#")) at -= 1;
  return at;
}

/**
 * Insert `candidates` into an artist YAML document.
 *
 * Returns the new text plus the applied entries. Purely additive: an existing
 * gig is never moved, rewritten or removed.
 */
export function insertGigs(text, candidates, { comment, today = new Date().toISOString().slice(0, 10) } = {}) {
  if (candidates.length === 0) return { text, applied: [], skipped: [] };

  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  let lines = text.split(/\r?\n/);
  const applied = [];
  const skipped = [];

  // Newest first, so each insertion offset stays valid for the ones after it.
  const ordered = [...candidates].sort((a, b) => b.date.localeCompare(a.date));

  for (const candidate of ordered) {
    // Last gate before touching a curated file: a malformed candidate is
    // dropped, never written. Callers normally filter with mergeCandidates,
    // but this must not depend on that.
    if (!isUsableCandidate(candidate)) {
      skipped.push({ candidate, reason: "incomplete or malformed gig (needs a valid date, venue, city and country)" });
      continue;
    }
    const block = locateGigs(lines);
    if (!block) {
      skipped.push({ candidate, reason: "no gigs: list found" });
      continue;
    }
    // gen-artists only requires an eventId while a date is today or later, and
    // history does not need one — a backfilled past gig stays uncluttered.
    const upcoming = isUpcoming(candidate.date, today);
    const eventId = upcoming ? suggestEventId(candidate) : null;
    const at = insertionPoint(lines, block, candidate.date);
    const rendered = formatGigBlock(candidate, {
      eventId,
      past: !upcoming,
      comment: comment?.(candidate),
    });
    lines = [...lines.slice(0, at), ...rendered, ...lines.slice(at)];
    applied.push({ candidate, eventId });
  }

  return { text: lines.join(eol), applied: applied.reverse(), skipped };
}

/**
 * Apply insertions and prove the file is still sound before returning it.
 *
 * The automation writes to files a human curates, so a silent corruption would
 * be worse than no automation at all. Every write must satisfy: it still
 * parses, the gig count grew by exactly the number applied, and every gig that
 * was already there is byte-identical.
 */
export function insertGigsChecked(text, candidates, options = {}) {
  const before = yaml.load(text);
  const beforeGigs = Array.isArray(before?.gigs) ? before.gigs : [];
  const result = insertGigs(text, candidates, options);
  if (result.applied.length === 0) return result;

  let after;
  try {
    after = yaml.load(result.text);
  } catch (error) {
    throw new Error(`insertion produced invalid YAML: ${error.message.split("\n")[0]}`);
  }

  const afterGigs = Array.isArray(after?.gigs) ? after.gigs : [];
  if (afterGigs.length !== beforeGigs.length + result.applied.length) {
    throw new Error(
      `expected ${beforeGigs.length + result.applied.length} gigs after insertion, found ${afterGigs.length}`,
    );
  }

  const serialize = (gig) => JSON.stringify(gig, Object.keys(gig).sort());
  const survivors = new Set(afterGigs.map(serialize));
  for (const gig of beforeGigs) {
    if (!survivors.has(serialize(gig))) {
      throw new Error(`insertion altered an existing gig (${gig.date} ${gig.venue})`);
    }
  }

  const dates = afterGigs.map((gig) => String(gig.date));
  for (let i = 1; i < dates.length; i += 1) {
    if (dates[i - 1] > dates[i]) throw new Error("insertion broke the oldest-to-newest gig order");
  }

  return result;
}
