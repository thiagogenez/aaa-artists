"use client";

import { useState } from "react";
import type { Gig } from "@/data/artists";

/** How many past dates are visible before the "Show all" control appears. */
const VISIBLE_COUNT = 4;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Past-dates list — shows the 4 most recent gigs, with an inline
 *  expand/collapse control when there are more. */
export default function PastDates({ gigs }: { gigs: Gig[] }) {
  const [expanded, setExpanded] = useState(false);

  // Newest first (the data files list gigs oldest → newest).
  const newestFirst = [...gigs].reverse();
  const hasMore = newestFirst.length > VISIBLE_COUNT;
  const visible = expanded ? newestFirst : newestFirst.slice(0, VISIBLE_COUNT);

  return (
    <>
      <ul className="flex flex-col gap-3">
        {visible.map((gig, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-4 border p-5 opacity-60"
            style={{ borderColor: "var(--border)" }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{gig.venue}</p>
              <p className="text-xs" style={{ color: "var(--text-40)" }}>
                {gig.city}, {gig.country}
              </p>
            </div>
            <p className="text-xs" style={{ color: "var(--text-40)" }}>{formatDate(gig.date)}</p>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="btn-outline mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-widest"
        >
          {expanded ? "Show fewer" : `Show all ${newestFirst.length} dates`}
          <svg
            className={`h-3 w-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </>
  );
}
