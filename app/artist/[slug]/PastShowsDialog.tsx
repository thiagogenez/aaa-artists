"use client";

import { useEffect, useRef, useState } from "react";
import type { Gig } from "@/data/artists";
import { formatEventDate } from "@/lib/events";

/** Past dates behind a dialog, so the page devotes its width to the dates a
 *  promoter can still book.
 *
 *  Uses the native <dialog> element deliberately: showModal() gives focus
 *  trapping, Escape-to-close, an inert background and a ::backdrop for free.
 *  A hand-rolled modal has to reimplement all of that and usually gets the
 *  focus handling wrong. */
export default function PastShowsDialog({ gigs }: { gigs: Gig[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  // Newest first, grouped by year — a career reads backwards from now.
  const grouped = [...gigs]
    .reverse()
    .reduce<Array<{ year: string; gigs: Gig[] }>>((years, gig) => {
      const year = gig.date.slice(0, 4);
      const group = years.find((entry) => entry.year === year);
      if (group) group.gigs.push(gig);
      else years.push({ year, gigs: [gig] });
      return years;
    }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // The dialog can close without going through React (Escape, backdrop), so the
  // state has to follow the element rather than the other way round.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => setOpen(false);
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  return (
    <>
      <button
        type="button"
        data-testid="past-shows-trigger"
        onClick={() => setOpen(true)}
        className="link-quiet inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold uppercase tracking-widest underline underline-offset-8"
      >
        Past shows
      </button>

      {/* `m-auto` below is what centres a modal <dialog>: the UA stylesheet pins
          it with `inset: 0` and relies on `margin: auto`, which Tailwind's
          preflight resets to 0 — without it the panel sits in the top-left. */}
      <dialog
        ref={dialogRef}
        data-testid="past-shows-dialog"
        aria-label="Past shows"
        onClick={(event) => {
          // Clicking the backdrop closes; clicking the panel must not.
          if (event.target === dialogRef.current) setOpen(false);
        }}
        className="m-auto w-[min(44rem,92vw)] max-w-none border p-0 backdrop:bg-black/60"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text)" }}
      >
        <div className="flex items-center justify-between gap-4 border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            Past shows
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close past shows"
            className="btn-outline flex h-11 w-11 cursor-pointer items-center justify-center"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* The dialog owns this scroll and the page behind it is inert, so unlike
            an in-page scroller it cannot compete with the page's own scrolling. */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-6">
            {grouped.map((group) => (
              <div key={group.year}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--text-30)" }}>
                  {group.year}
                </p>
                <ul className="flex flex-col gap-3">
                  {group.gigs.map((gig) => (
                    <li
                      key={`${gig.date}-${gig.venue}-${gig.city}`}
                      className="border p-4"
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
        </div>
      </dialog>
    </>
  );
}
