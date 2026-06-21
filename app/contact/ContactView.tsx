"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { artists } from "@/data/artists";
import { CAPACITY_RANGES, CURRENCIES, BUDGET_RANGES, COUNTRIES } from "@/data/formOptions";
import { Suspense } from "react";

const EVENT_TYPES = [
  "Club Night",
  "Festival",
  "Private Party",
  "Corporate / Brand",
  "Wedding",
  "Bar / Lounge",
  "Livestream",
  "Tour",
  "Other",
];

const SET_LENGTHS = ["45 minutes", "60 minutes", "90 minutes", "2 hours", "2+ hours / open to close", "Not sure yet"];

const TICKETING = ["Ticketed", "Free entry", "Private / guestlist"];

const HEAR_ABOUT = ["Instagram", "SoundCloud / YouTube", "Google search", "Personal referral", "Booked with us before", "Other"];

const EMAIL_DOMAINS = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "proton.me"];

// Build "local@domain" suggestions from what the user has typed so far.
function emailSuggestions(value: string): string[] {
  if (!value || /\s/.test(value)) return [];
  const [local, domainPart = ""] = value.split("@");
  if (!local) return [];
  if (value.includes("@")) {
    return EMAIL_DOMAINS.filter((d) => d.startsWith(domainPart.toLowerCase()) && d !== domainPart.toLowerCase())
      .map((d) => `${local}@${d}`);
  }
  return EMAIL_DOMAINS.map((d) => `${local}@${d}`);
}

// Formspree delivers booking enquiries straight to your inbox + dashboard with no
// backend. Create a free form at https://formspree.io, then set the form ID via the
// NEXT_PUBLIC_FORMSPREE_ID environment variable (e.g. "xnqkergb"). Until it is set,
// the form falls back to opening the visitor's email client (mailto).
const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID ?? "";
const FORMSPREE_ENDPOINT = FORMSPREE_ID ? `https://formspree.io/f/${FORMSPREE_ID}` : "";

function ContactForm() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("artist") ?? "";

  const [form, setForm] = useState({
    // Your details
    name: "",
    company: "",
    email: "",
    phone: "",
    // The booking
    artist: preselected,
    eventName: "",
    eventType: "",
    date: "",
    setTime: "",
    setLength: "",
    // Venue & audience
    venue: "",
    city: "",
    country: "",
    capacity: "",
    ticketing: "",
    // Budget & extras
    currency: "GBP",
    budgetRange: "",
    lineup: "",
    hearAbout: "",
    // Message
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({ details: true });
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Only the essentials are required; the rest help us quote but stay optional.
  const REQUIRED_FIELDS: { key: keyof typeof form; label: string; section: string }[] = [
    { key: "name", label: "Name", section: "details" },
    { key: "email", label: "Email", section: "details" },
    { key: "artist", label: "Artist", section: "booking" },
    { key: "date", label: "Event date", section: "booking" },
  ];
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate() {
    const e: Record<string, string> = {};
    for (const { key, label } of REQUIRED_FIELDS) {
      if (!String(form[key] ?? "").trim()) e[key] = `${label} is required`;
    }
    if (form.email.trim() && !EMAIL_RE.test(form.email)) e.email = "Invalid email address";
    return e;
  }

  function fieldError(name: string, value: string): string {
    const def = REQUIRED_FIELDS.find((f) => f.key === name);
    if (!def) return "";
    if (!value.trim()) return `${def.label} is required`;
    if (name === "email" && !EMAIL_RE.test(value)) return "Invalid email address";
    return "";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  }

  // Validate a field when the user leaves it (only flags real problems, never premature).
  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const msg = fieldError(e.target.name, e.target.value);
    if (msg) setErrors((prev) => ({ ...prev, [e.target.name]: msg }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Open every collapsed section that contains an error so it is visible.
      const sectionsWithErrors = REQUIRED_FIELDS.filter((f) => errs[f.key]).map((f) => f.section);
      setOpen((o) => {
        const next = { ...o };
        for (const s of sectionsWithErrors) next[s] = true;
        return next;
      });
      // Move focus to the first invalid field (after collapsed sections expand).
      const firstInvalid = REQUIRED_FIELDS.map((f) => f.key).find((k) => errs[k]);
      if (firstInvalid) {
        requestAnimationFrame(() => {
          (document.querySelector(`[name="${firstInvalid}"]`) as HTMLElement | null)?.focus();
        });
      }
      return;
    }

    const subject = `Booking Enquiry${form.artist ? `: ${form.artist}` : ""} from ${form.name}`;
    const location = [form.venue, form.city, form.country].filter(Boolean).join(", ");
    const budget = form.budgetRange
      ? form.budgetRange === "Prefer to discuss"
        ? form.budgetRange
        : `${form.budgetRange} ${form.currency}`
      : "";

    // Preferred path: submit straight to Formspree (lands in inbox + dashboard).
    if (FORMSPREE_ENDPOINT) {
      setSending(true);
      setSendError("");
      try {
        const payload: Record<string, string> = {
          _subject: subject,
          email: form.email, // Formspree uses this as the reply-to address
          Name: form.name,
          Email: form.email,
          ...(form.company && { "Company / promoter": form.company }),
          ...(form.phone && { Phone: form.phone }),
          ...(form.artist && { Artist: form.artist }),
          ...(form.eventName && { "Event name": form.eventName }),
          ...(form.eventType && { "Event type": form.eventType }),
          ...(form.date && { "Event date": form.date }),
          ...(form.setTime && { "Set time": form.setTime }),
          ...(form.setLength && { "Set length": form.setLength }),
          ...(location && { Location: location }),
          ...(form.capacity && { "Expected capacity": form.capacity }),
          ...(form.ticketing && { Ticketing: form.ticketing }),
          ...(budget && { "Budget / fee offer": budget }),
          ...(form.lineup && { "Other artists on the bill": form.lineup }),
          ...(form.hearAbout && { "How they heard about us": form.hearAbout }),
          Message: form.message,
        };
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Request failed");
        setSubmitted(true);
      } catch {
        setSendError("Something went wrong sending your enquiry. Please email booking@aaaevents.com directly.");
      } finally {
        setSending(false);
      }
      return;
    }

    // Fallback when no form service is configured: open the visitor's email client.
    const body = [
      "YOUR DETAILS",
      `Name: ${form.name}`,
      form.company ? `Company / promoter: ${form.company}` : null,
      `Email: ${form.email}`,
      form.phone ? `Phone: ${form.phone}` : null,
      "",
      "THE BOOKING",
      form.artist ? `Artist: ${form.artist}` : null,
      form.eventName ? `Event name: ${form.eventName}` : null,
      form.eventType ? `Event type: ${form.eventType}` : null,
      form.date ? `Event date: ${form.date}` : null,
      form.setTime ? `Set time: ${form.setTime}` : null,
      form.setLength ? `Set length: ${form.setLength}` : null,
      "",
      "VENUE & AUDIENCE",
      location ? `Location: ${location}` : null,
      form.capacity ? `Expected capacity: ${form.capacity}` : null,
      form.ticketing ? `Ticketing: ${form.ticketing}` : null,
      "",
      "BUDGET & EXTRAS",
      budget ? `Budget / fee offer: ${budget}` : null,
      form.lineup ? `Other artists on the bill: ${form.lineup}` : null,
      form.hearAbout ? `How they heard about us: ${form.hearAbout}` : null,
      "",
      "MESSAGE",
      form.message,
    ]
      .filter((l) => l !== null)
      .join("\n");

    window.open(
      `mailto:booking@aaaevents.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center border"
          style={{ borderColor: "var(--border)" }}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--text)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mb-3 text-2xl font-bold" style={{ color: "var(--text)" }}>Enquiry sent</h2>
        <p className="mb-8 max-w-sm text-sm" style={{ color: "var(--text-40)" }}>
          Your email client should have opened with your message pre-filled. We aim to respond within 48 hours.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-sm underline underline-offset-4 transition-opacity hover:opacity-60"
          style={{ color: "var(--text-40)" }}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {submitAttempted && Object.values(errors).some(Boolean) && (
        <div
          role="alert"
          className="border px-4 py-3 text-sm"
          style={{ borderColor: "var(--error)", color: "var(--error)", backgroundColor: "var(--surface)" }}
        >
          <span className="font-semibold">Please check the highlighted fields:</span>{" "}
          {Object.keys(errors)
            .filter((k) => errors[k])
            .map((k) => REQUIRED_FIELDS.find((f) => f.key === k)?.label ?? k)
            .join(", ")}
        </div>
      )}
      <div className="space-y-3">
      <Collapsible step="01" title="Your details" open={open.details} onToggle={() => toggle("details")} error={Boolean(errors.name || errors.company || errors.email || errors.phone)}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Your Name" required error={errors.name}>
            <Input name="name" placeholder="Jane Smith" value={form.name} onChange={handleChange} onBlur={handleBlur} error={errors.name} />
          </Field>
          <Field label="Company / Promoter">
            <Input name="company" placeholder="Your venue, brand or agency" value={form.company} onChange={handleChange} onBlur={handleBlur} error={errors.company} />
          </Field>
          <Field label="Email Address" required error={errors.email}>
            <EmailField
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              onSelect={(val) => {
                setForm((f) => ({ ...f, email: val }));
                setErrors((p) => ({ ...p, email: "" }));
              }}
              error={errors.email}
            />
          </Field>
          <Field label="Phone Number">
            <Input name="phone" type="tel" placeholder="+44 7700 000000" value={form.phone} onChange={handleChange} onBlur={handleBlur} error={errors.phone} />
          </Field>
        </div>
      </Collapsible>

      <Collapsible step="02" title="The booking" open={open.booking} onToggle={() => toggle("booking")} error={Boolean(errors.artist || errors.eventName || errors.eventType || errors.date || errors.setTime || errors.setLength)}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Artist You Want to Book" required error={errors.artist}>
            <Select name="artist" value={form.artist} onChange={handleChange} error={errors.artist}>
              <option value="">Select an artist…</option>
              {artists.map((a) => (
                <option key={a.slug} value={a.name}>{a.name}</option>
              ))}
              <option value="Open to suggestions">Open to suggestions</option>
            </Select>
          </Field>
          <Field label="Event Name">
            <Input name="eventName" placeholder="e.g. Saturday Sessions" value={form.eventName} onChange={handleChange} onBlur={handleBlur} error={errors.eventName} />
          </Field>
          <Field label="Event Type">
            <Select name="eventType" value={form.eventType} onChange={handleChange} error={errors.eventType}>
              <option value="">Select type…</option>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Event Date" required error={errors.date}>
            <Input name="date" type="date" value={form.date} onChange={handleChange} onBlur={handleBlur} error={errors.date} />
          </Field>
          <Field label="Set Time">
            <Input name="setTime" placeholder="e.g. 23:00 – 01:00" value={form.setTime} onChange={handleChange} onBlur={handleBlur} error={errors.setTime} />
          </Field>
          <Field label="Set Length">
            <Select name="setLength" value={form.setLength} onChange={handleChange} error={errors.setLength}>
              <option value="">Select length…</option>
              {SET_LENGTHS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
        </div>
      </Collapsible>

      <Collapsible step="03" title="Venue & audience" open={open.venue} onToggle={() => toggle("venue")} error={Boolean(errors.venue || errors.city || errors.country || errors.capacity || errors.ticketing)}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Venue / Location Name">
            <Input name="venue" placeholder="e.g. Fabric" value={form.venue} onChange={handleChange} onBlur={handleBlur} error={errors.venue} />
          </Field>
          <Field label="City">
            <Input name="city" placeholder="e.g. London" value={form.city} onChange={handleChange} onBlur={handleBlur} error={errors.city} />
          </Field>
          <Field label="Country">
            <Select name="country" value={form.country} onChange={handleChange} error={errors.country}>
              <option value="">Select country…</option>
              <option value={COUNTRIES[0]}>{COUNTRIES[0]}</option>
              <option disabled>──────────</option>
              {COUNTRIES.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Expected Capacity">
            <Select name="capacity" value={form.capacity} onChange={handleChange} error={errors.capacity}>
              <option value="">Select capacity…</option>
              {CAPACITY_RANGES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Ticketing">
            <Select name="ticketing" value={form.ticketing} onChange={handleChange} error={errors.ticketing}>
              <option value="">Select…</option>
              {TICKETING.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
        </div>
      </Collapsible>

      <Collapsible step="04" title="Budget & extras" open={open.budget} onToggle={() => toggle("budget")} error={Boolean(errors.budgetRange || errors.lineup || errors.hearAbout)}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Budget / Fee Offer" hint="A rough range helps us reply faster">
            <Select name="budgetRange" value={form.budgetRange} onChange={handleChange} error={errors.budgetRange}>
              <option value="">Select a range…</option>
              {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
            </Select>
          </Field>
          <Field label="Currency">
            <Select name="currency" value={form.currency} onChange={handleChange}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </Select>
          </Field>
          <Field label="How Did You Hear About Us?">
            <Select name="hearAbout" value={form.hearAbout} onChange={handleChange} error={errors.hearAbout}>
              <option value="">Select…</option>
              {HEAR_ABOUT.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Other Artists on the Bill">
            <Input name="lineup" placeholder="Anyone else playing alongside?" value={form.lineup} onChange={handleChange} onBlur={handleBlur} error={errors.lineup} />
          </Field>
        </div>
      </Collapsible>

      <Collapsible step="05" title="Anything else (optional)" open={open.message} onToggle={() => toggle("message")}>
        <Field label="Message">
          <textarea
            name="message"
            rows={5}
            placeholder="Tell us about the event, the crowd, timings, and anything else that helps us quote accurately…"
            value={form.message}
            onChange={handleChange}
            className="w-full resize-none border px-4 py-3 text-sm outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
            }}
          />
        </Field>
      </Collapsible>
      </div>

      <div>
        <button
          type="submit"
          disabled={sending}
          className="btn-cta w-full py-4 text-sm font-semibold uppercase tracking-widest sm:w-auto sm:px-12"
          style={{
            opacity: sending ? 0.6 : 1,
            cursor: sending ? "wait" : "pointer",
          }}
        >
          {sending ? "Sending…" : "Send Enquiry"}
        </button>
        {sendError && (
          <p className="mt-4 text-xs" style={{ color: "var(--error)" }}>{sendError}</p>
        )}
        <p className="mt-4 text-xs" style={{ color: "var(--text-30)" }}>
          {FORMSPREE_ENDPOINT
            ? "We aim to respond within 48 hours."
            : "Submitting this form opens your email client with your details pre-filled. We aim to respond within 48 hours."}
        </p>
      </div>
    </form>
  );
}

function Collapsible({
  step,
  title,
  open,
  onToggle,
  error,
  children,
}: {
  step?: string;
  title: string;
  open?: boolean;
  onToggle: () => void;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border" style={{ borderColor: error ? "var(--error)" : "var(--border)" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-all"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <span className="flex items-center gap-3">
          {step && <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-30)" }}>{step}</span>}
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-60)" }}>{title}</span>
          {error && (
            <span className="text-xs font-normal normal-case tracking-normal" style={{ color: "var(--error)" }}>Needs attention</span>
          )}
        </span>
        <svg
          className="h-5 w-5 shrink-0 transition-transform duration-300"
          style={{ color: "var(--text-40)", transform: open ? "rotate(45deg)" : "none" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      {open && (
        <div className="space-y-6 border-t p-5 md:p-6" style={{ borderColor: "var(--border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Input({
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  error,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className="w-full border px-4 py-3 text-sm outline-none transition-all"
      style={{
        borderColor: error ? "var(--error)" : "var(--border)",
        backgroundColor: "var(--surface)",
        color: "var(--text)",
      }}
    />
  );
}

function EmailField({
  value,
  onChange,
  onBlur,
  onSelect,
  error,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onSelect: (val: string) => void;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const suggestions = focused ? emailSuggestions(value) : [];
  return (
    <div className="relative">
      <input
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="jane@example.com"
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          onBlur(e);
          // delay so a suggestion click can register before the list hides
          setTimeout(() => setFocused(false), 120);
        }}
        className="w-full border px-4 py-3 text-sm outline-none transition-all"
        style={{
          borderColor: error ? "var(--error)" : "var(--border)",
          backgroundColor: "var(--surface)",
          color: "var(--text)",
        }}
      />
      {suggestions.length > 0 && (
        <ul
          className="absolute left-0 right-0 z-20 mt-1 border"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus so blur doesn't fire first
                  onSelect(s);
                  setFocused(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm transition-colors hover:[background-color:var(--surface-2)]"
                style={{ color: "var(--text-60)" }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Select({
  name,
  value,
  onChange,
  onBlur,
  error,
  children,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className="w-full border px-4 py-3 text-sm outline-none"
      style={{ borderColor: error ? "var(--error)" : "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
    >
      {children}
    </select>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    // Wrapping the control in <label> implicitly associates them (no id needed).
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-60)" }}>
        {label}{required && <span className="ml-0.5">*</span>}
      </span>
      {children}
      {hint && !error && <span className="text-xs" style={{ color: "var(--text-40)" }}>{hint}</span>}
      {error && <span className="text-xs" role="alert" style={{ color: "var(--error)" }}>{error}</span>}
    </label>
  );
}

/** Contextual back link — returns to the artist's profile when arriving from a
 *  "Book {artist}" action, otherwise to the full roster. */
function BackLink() {
  const name = useSearchParams().get("artist") ?? "";
  const artist = name ? artists.find((a) => a.name === name) : undefined;
  const href = artist ? `/artist/${artist.slug}` : "/artists";
  const label = artist ? `Back to ${artist.name}` : "All Artists";
  return (
    <Link
      href={href}
      className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest transition-colors"
      style={{ color: "var(--text-30)" }}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen px-6 py-20" style={{ backgroundColor: "var(--bg)" }}>
      <div className="mx-auto max-w-3xl">
        <Suspense>
          <BackLink />
        </Suspense>
        <div className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            AAA Artists
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl" style={{ color: "var(--text)" }}>
            Book an Artist
          </h1>
          <p className="max-w-xl text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
            The more you can tell us about the event, the faster we can confirm availability and a fee.
            Only your name, email, and a short message are required, but a fuller brief gets a quicker reply.
          </p>
        </div>

        <div className="border p-8 md:p-12" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
          <Suspense>
            <ContactForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
