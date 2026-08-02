"use client";

import { useState } from "react";
import type { Gig } from "@/data/artists";
import { formatEventDate } from "@/lib/events";

/** Past dates are initially limited by year rather than an arbitrary row count.
 *  The current year is shown first; when it has no dates, the most recent year
 *  with a gig becomes the useful fallback. Older years are revealed one at a
 *  time so a long career history never overwhelms the dates column. */
export default function PastDates({ gigs, currentYear }: { gigs: Gig[]; currentYear: string }) {
  const grouped = [...gigs]
    .reverse()
    .reduce<Array<{ year: string; gigs: Gig[] }>>((years, gig) => {
      const year = gig.date.slice(0, 4);
      const group = years.find((entry) => entry.year === year);
      if (group) group.gigs.push(gig);
      else years.push({ year, gigs: [gig] });
      return years;
    }, []);

  const initialGroupIndex = Math.max(0, grouped.findIndex((group) => group.year === currentYear));
  const relevantGroups = grouped.slice(initialGroupIndex);
  const [visibleYearCount, setVisibleYearCount] = useState(1);
  const visibleGroups = relevantGroups.slice(0, visibleYearCount);
  const nextGroup = relevantGroups[visibleYearCount];

  return (
    <>
      <div className="flex flex-col gap-6">
        {visibleGroups.map((group) => (
          <div key={group.year}>
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--text-30)" }}
            >
              {group.year}
            </p>
            <ul className="flex flex-col gap-3">
              {group.gigs.map((gig) => (
                <li
                  key={`${gig.date}-${gig.venue}-${gig.city}`}
                  className="border p-4 opacity-70"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>{gig.venue}</p>
                      <p className="text-xs" style={{ color: "var(--text-40)" }}>
                        {gig.city}, {gig.country}
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-xs" style={{ color: "var(--text-40)" }}>
                      {formatEventDate(gig.date)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {(visibleYearCount > 1 || nextGroup) && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {visibleYearCount > 1 && (
            <button
              type="button"
              onClick={() => setVisibleYearCount(1)}
              className="btn-outline inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-widest"
            >
              Show fewer
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          {nextGroup && (
            <button
              type="button"
              onClick={() => setVisibleYearCount((count) => count + 1)}
              className="btn-outline inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-widest"
            >
              {`Show ${nextGroup.year} dates (${nextGroup.gigs.length})`}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}
