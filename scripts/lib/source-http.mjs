// Shared HTTP helper for the event-source adapters.
//
// Adapters must never take the whole run down: a source that is rate limited,
// slow or returning an unexpected shape should narrow the results, not fail the
// scheduled job. Every failure here is reported and swallowed.

const TIMEOUT_MS = 15_000;
const USER_AGENT = "aaa-artists-event-fetcher (+https://aaaartists.co)";

export class SourceError extends Error {
  constructor(source, message) {
    super(`${source}: ${message}`);
    this.name = "SourceError";
    this.source = source;
  }
}

/** GET a JSON endpoint with a bounded timeout. Throws SourceError on failure. */
export async function fetchJson(source, url, { signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  signal?.addEventListener("abort", () => controller.abort(), { once: true });
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json", "user-agent": USER_AGENT },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) {
      throw new SourceError(source, `HTTP ${response.status} from ${new URL(url).host}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof SourceError) throw error;
    const reason = error?.name === "AbortError" ? `timed out after ${TIMEOUT_MS}ms` : error.message;
    throw new SourceError(source, reason);
  } finally {
    clearTimeout(timer);
  }
}

/** ISO date (YYYY-MM-DD) from whatever shape a source reports, or null. */
export function isoDate(value) {
  if (!value) return null;
  const text = String(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

/** Collapse whitespace and drop empties, so blank venue strings never pass
 *  the candidate check as "present". */
export function text(value) {
  const cleaned = String(value ?? "").replace(/\s+/g, " ").trim();
  return cleaned === "" ? undefined : cleaned;
}
