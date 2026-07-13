"use client";

import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CAPACITY_RANGES, CURRENCIES, BUDGET_RANGES, COUNTRIES } from "@/data/formOptions";
import { Suspense } from "react";
import CountryCombobox from "./CountryCombobox";
import CityCombobox from "./CityCombobox";
import PhoneField from "./PhoneField";
import type { Iso2 } from "intl-tel-input";

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

const TICKETING = ["Ticketed", "Free entry", "Private / guestlist"];

const HEAR_ABOUT = ["Instagram", "SoundCloud / YouTube", "Google search", "Personal referral", "Booked with us before", "Other"];

const DURATION_HOURS = [1, 2, 3, 4, 5, 6];
const DURATION_MINUTES = [0, 15, 30, 45];
// One duration source of truth: every combination exposed by the hours/minutes
// menus: one to six hours, in quarter-hour increments.
const SET_DURATIONS = DURATION_HOURS.flatMap((hours) => (
  DURATION_MINUTES.map((minutes) => hours * 60 + minutes)
));

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      style={{ color: "#25D366" }}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.247-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.99c-.003 5.45-4.437 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.144 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function formatDurationMinutes(value: string): string {
  const totalMinutes = Number(value);
  if (!Number.isInteger(totalMinutes) || totalMinutes <= 0) return "";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [
    hours ? `${hours} ${hours === 1 ? "hour" : "hours"}` : "",
    minutes ? `${minutes} ${minutes === 1 ? "minute" : "minutes"}` : "",
  ].filter(Boolean).join(" ");
}

const EURO_COUNTRIES = new Set([
  "Austria", "Belgium", "Croatia", "Cyprus", "Estonia", "Finland", "France", "Germany",
  "Greece", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta",
  "Netherlands", "Portugal", "Slovakia", "Slovenia", "Spain",
]);

function currencyForCountry(country: string): string | null {
  if (country === "United Kingdom") return "GBP";
  if (country === "United States") return "USD";
  if (EURO_COUNTRIES.has(country)) return "EUR";
  return null;
}

function calculateSetDuration(start: string, finish: string): string {
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const startMatch = start.match(timePattern);
  const finishMatch = finish.match(timePattern);
  if (!startMatch || !finishMatch || start === finish) return "";

  const startMinutes = Number(startMatch[1]) * 60 + Number(startMatch[2]);
  const finishMinutes = Number(finishMatch[1]) * 60 + Number(finishMatch[2]);
  const crossesMidnight = finishMinutes < startMinutes;
  const durationMinutes = finishMinutes - startMinutes + (crossesMidnight ? 24 * 60 : 0);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const parts = [
    hours ? `${hours} ${hours === 1 ? "hour" : "hours"}` : "",
    minutes ? `${minutes} ${minutes === 1 ? "minute" : "minutes"}` : "",
  ].filter(Boolean);

  return `${parts.join(" ")}${crossesMidnight ? " · finishes next day" : ""}`;
}

type ArtistBooking = {
  id: number;
  artist: string;
  timingMode: "duration" | "times";
  durationMinutes: string;
  startTime: string;
  finishTime: string;
};

function selectedDurationLabel(booking: ArtistBooking): string {
  return SET_DURATIONS.includes(Number(booking.durationMinutes))
    ? formatDurationMinutes(booking.durationMinutes)
    : "";
}

function bookingIntervalsOverlap(first: ArtistBooking, second: ArtistBooking): boolean {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  if (first.timingMode !== "times" || second.timingMode !== "times"
    || !calculateSetDuration(first.startTime, first.finishTime)
    || !calculateSetDuration(second.startTime, second.finishTime)) return false;

  const firstStart = toMinutes(first.startTime);
  const firstFinishBase = toMinutes(first.finishTime);
  const firstFinish = firstFinishBase <= firstStart ? firstFinishBase + 24 * 60 : firstFinishBase;
  const secondStartBase = toMinutes(second.startTime);
  const secondFinishBase = toMinutes(second.finishTime);
  const secondDuration = secondFinishBase <= secondStartBase
    ? secondFinishBase + 24 * 60 - secondStartBase
    : secondFinishBase - secondStartBase;

  return [-24 * 60, 0, 24 * 60].some((offset) => {
    const secondStart = secondStartBase + offset;
    const secondFinish = secondStart + secondDuration;
    return Math.max(firstStart, secondStart) < Math.min(firstFinish, secondFinish);
  });
}

function formatArtistBooking(booking: ArtistBooking, index: number): string {
  if (booking.timingMode === "duration") {
    const duration = selectedDurationLabel(booking);
    return `${index + 1}. ${booking.artist} — ${duration ? `${duration} set · times TBC` : "Timing TBC"}`;
  }
  const duration = calculateSetDuration(booking.startTime, booking.finishTime);
  const schedule = booking.startTime && booking.finishTime
    ? ` — ${booking.startTime}–${booking.finishTime}${duration ? ` — ${duration}` : ""}`
    : " — Exact times TBC";
  return `${index + 1}. ${booking.artist}${schedule}`;
}

// Broad domain list so the datalist helper completes as many addresses as
// possible (ordered by popularity; UK variants included for a London agency).
// NOTE: this is only a typing shortcut — it is NOT the browser's real autofill.
// A <datalist> cannot show the user's saved addresses (that store is private to
// the browser/OS); attaching one also hides Chrome's native autofill dropdown.
// autocomplete="email" is kept so Safari/Firefox can still autofill saved emails.
const EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "yahoo.com",
  "yahoo.co.uk",
  "icloud.com",
  "me.com",
  "live.com",
  "live.co.uk",
  "msn.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
];
// How many "local@domain" options to show before the user has typed an "@"
// (keeps the initial dropdown short; the full list is matched once they do).
const TOP_DOMAINS = 6;

// Build "local@domain" suggestions from what the user has typed so far.
function emailSuggestions(value: string): string[] {
  if (!value || /\s/.test(value)) return [];
  const [local, domainPart = ""] = value.split("@");
  if (!local) return [];
  if (value.includes("@")) {
    return EMAIL_DOMAINS.filter((d) => d.startsWith(domainPart.toLowerCase()) && d !== domainPart.toLowerCase())
      .map((d) => `${local}@${d}`);
  }
  return EMAIL_DOMAINS.slice(0, TOP_DOMAINS).map((d) => `${local}@${d}`);
}

// Formspree delivers booking enquiries straight to your inbox + dashboard with no
// backend. Create a free form at https://formspree.io, then set the form ID via the
// NEXT_PUBLIC_FORMSPREE_ID environment variable (e.g. "xnqkergb"). Until it is set,
// the form falls back to opening the visitor's email client (mailto).
const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID ?? "";
const FORMSPREE_ENDPOINT = FORMSPREE_ID ? `https://formspree.io/f/${FORMSPREE_ID}` : "";

// Slim shape passed from the server page — keeps the full artist dataset
// (bios, gig history) out of the client bundle.
export type ArtistOption = { name: string; slug: string };

function ContactForm({ artistOptions }: { artistOptions: ArtistOption[] }) {
  const searchParams = useSearchParams();
  const queryValue = (key: string, maxLength = 120) =>
    (searchParams.get(key) ?? "").trim().slice(0, maxLength);
  const requestedArtist = queryValue("artist");
  const preselected = artistOptions.some((artist) => artist.name === requestedArtist) ? requestedArtist : "";
  const requestedDate = queryValue("date", 10);
  const preselectedDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : "";
  const requestedCountry = queryValue("country", 80);
  const preselectedCountry = COUNTRIES.includes(requestedCountry) ? requestedCountry : "";

  const [form, setForm] = useState({
    // Your details
    name: "",
    company: "",
    email: "",
    phone: "",
    whatsapp: "",
    // The booking
    eventName: queryValue("event", 120),
    eventType: "",
    date: preselectedDate,
    // Venue & audience
    venue: queryValue("venue", 120),
    city: queryValue("city", 80),
    country: preselectedCountry,
    capacity: "",
    ticketing: "",
    // Budget & extras
    currency: currencyForCountry(preselectedCountry) ?? "GBP",
    budgetRange: "",
    lineup: "",
    hearAbout: "",
    // Message
    message: "",
  });
  const [artistBookings, setArtistBookings] = useState<ArtistBooking[]>([
    {
      id: 0,
      artist: preselected,
      timingMode: "duration",
      durationMinutes: "60",
      startTime: "",
      finishTime: "",
    },
  ]);
  const nextBookingId = useRef(1);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({ quick: true });
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [dateTbc, setDateTbc] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);
  const [phoneCountry, setPhoneCountry] = useState<Iso2>("gb");
  const [whatsappValid, setWhatsappValid] = useState(true);
  const [whatsappMode, setWhatsappMode] = useState<"none" | "same" | "different">("none");
  const [currencyTouched, setCurrencyTouched] = useState(false);
  const selectedArtists = new Set(artistBookings.map((booking) => booking.artist).filter(Boolean));
  const overlapArtists = new Map<number, string[]>();
  for (let first = 0; first < artistBookings.length; first += 1) {
    for (let second = first + 1; second < artistBookings.length; second += 1) {
      if (!artistBookings[first].artist || !artistBookings[second].artist) continue;
      if (!bookingIntervalsOverlap(artistBookings[first], artistBookings[second])) continue;
      overlapArtists.set(artistBookings[first].id, [
        ...(overlapArtists.get(artistBookings[first].id) ?? []),
        artistBookings[second].artist,
      ]);
      overlapArtists.set(artistBookings[second].id, [
        ...(overlapArtists.get(artistBookings[second].id) ?? []),
        artistBookings[first].artist,
      ]);
    }
  }
  const hasBookingErrors = Object.entries(errors).some(
    ([key, value]) => key.startsWith("booking-") && Boolean(value),
  );
  const canAddArtist = artistBookings.length < artistOptions.length + 1
    && artistBookings.every((booking) => booking.artist);

  // Move focus to the confirmation heading when the form is replaced by the
  // success screen, so screen readers announce the outcome.
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (submitted) successHeadingRef.current?.focus();
  }, [submitted]);

  // Only the essentials are required; the rest help us quote but stay optional.
  const REQUIRED_FIELDS: { key: keyof typeof form; label: string; section: string }[] = [
    { key: "name", label: "Name", section: "quick" },
    { key: "email", label: "Email", section: "quick" },
    { key: "date", label: "Event date", section: "quick" },
  ];
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate() {
    const e: Record<string, string> = {};
    for (const { key, label } of REQUIRED_FIELDS) {
      if (key === "date" && dateTbc) continue;
      if (!String(form[key] ?? "").trim()) e[key] = `${label} is required`;
    }
    if (form.email.trim() && !EMAIL_RE.test(form.email)) e.email = "Invalid email address";
    if (form.phone && !phoneValid) e.phone = "Enter a valid international phone number";
    if (whatsappMode === "different") {
      if (!form.whatsapp) e.whatsapp = "Enter the WhatsApp number";
      else if (!whatsappValid) e.whatsapp = "Enter a valid international WhatsApp number";
    }
    const allowedArtists = new Set([...artistOptions.map((artist) => artist.name), "Open to suggestions"]);
    const allowedDurations = new Set(SET_DURATIONS.map(String));
    const seenArtists = new Set<string>();
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    for (const booking of artistBookings) {
      const artistKey = `booking-${booking.id}-artist`;
      const durationKey = `booking-${booking.id}-duration`;
      const startKey = `booking-${booking.id}-start`;
      const finishKey = `booking-${booking.id}-finish`;
      if (!booking.artist) e[artistKey] = "Select an artist";
      else if (!allowedArtists.has(booking.artist)) e[artistKey] = "Select an artist from the roster";
      else if (seenArtists.has(booking.artist)) e[artistKey] = "This artist is already in the booking";
      else seenArtists.add(booking.artist);

      if (booking.timingMode === "duration") {
        if (!booking.durationMinutes) {
          e[durationKey] = "Select a set duration";
        } else if (!allowedDurations.has(booking.durationMinutes)) {
          e[durationKey] = "Select a valid set duration";
        }
      } else if (booking.timingMode === "times") {
        if (booking.startTime && !timePattern.test(booking.startTime)) e[startKey] = "Enter a valid start time";
        if (booking.finishTime && !timePattern.test(booking.finishTime)) e[finishKey] = "Enter a valid finish time";
        if (booking.startTime && !booking.finishTime) e[finishKey] = "Add a finish time";
        if (!booking.startTime && booking.finishTime) e[startKey] = "Add a start time";
        if (booking.startTime && booking.startTime === booking.finishTime) {
          e[finishKey] = "Finish time must be different from start time";
        }
      }
    }
    return e;
  }

  function fieldError(name: string, value: string): string {
    const def = REQUIRED_FIELDS.find((f) => f.key === name);
    if (!def) return "";
    if (name === "date" && dateTbc) return "";
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

  function handlePhoneChange(phone: string) {
    setForm((current) => ({ ...current, phone: phone.slice(0, 32) }));
    setErrors((current) => ({ ...current, phone: "" }));
    if (!phone) setWhatsappMode((current) => current === "same" ? "none" : current);
  }

  function handleWhatsAppChange(whatsapp: string) {
    setForm((current) => ({ ...current, whatsapp: whatsapp.slice(0, 32) }));
    setErrors((current) => ({ ...current, whatsapp: "" }));
  }

  function handleWhatsAppMode(mode: "none" | "same" | "different") {
    setWhatsappMode(mode);
    if (mode !== "different") {
      setForm((current) => ({ ...current, whatsapp: "" }));
      setWhatsappValid(true);
    }
    setErrors((current) => ({ ...current, whatsapp: "" }));
  }

  function handleCountryChange(country: string) {
    if (!COUNTRIES.includes(country)) return;
    setForm((current) => ({
      ...current,
      country,
      city: current.country === country ? current.city : "",
      currency: !currencyTouched ? currencyForCountry(country) ?? current.currency : current.currency,
    }));
    setErrors((current) => ({ ...current, country: "" }));
  }

  function handleCityChange(city: string) {
    setForm((current) => ({ ...current, city: city.slice(0, 80) }));
    setErrors((current) => ({ ...current, city: "" }));
  }

  function handleDateTbcChange(checked: boolean) {
    setDateTbc(checked);
    setErrors((current) => ({ ...current, date: "" }));
  }

  function updateArtistBooking(
    id: number,
    field: "artist" | "timingMode" | "durationMinutes" | "startTime" | "finishTime",
    value: string,
  ) {
    setArtistBookings((current) => current.map((booking) => {
      if (booking.id !== id) return booking;
      if (field === "timingMode") {
        return { ...booking, timingMode: value === "times" ? "times" : "duration" };
      }
      return { ...booking, [field]: value.slice(0, 80) };
    }));
    setErrors((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => !key.startsWith(`booking-${id}-`)),
    ));
  }

  function updateArtistDurationPart(id: number, part: "hours" | "minutes", value: string) {
    setArtistBookings((current) => current.map((booking) => {
      if (booking.id !== id) return booking;

      const currentTotal = SET_DURATIONS.includes(Number(booking.durationMinutes))
        ? Number(booking.durationMinutes)
        : 60;
      const currentHours = Math.floor(currentTotal / 60);
      const currentMinutes = currentTotal % 60;

      if (part === "hours") {
        const hours = DURATION_HOURS.includes(Number(value)) ? Number(value) : 1;
        return { ...booking, durationMinutes: String(hours * 60 + currentMinutes) };
      }

      const minutes = DURATION_MINUTES.includes(Number(value)) ? Number(value) : 0;
      return { ...booking, durationMinutes: String(currentHours * 60 + minutes) };
    }));
    setErrors((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => !key.startsWith(`booking-${id}-`)),
    ));
  }

  function addArtistBooking() {
    if (artistBookings.length >= artistOptions.length + 1) return;
    const id = nextBookingId.current;
    nextBookingId.current += 1;
    setArtistBookings((current) => [
      ...current,
      {
        id,
        artist: "",
        timingMode: "duration",
        durationMinutes: "60",
        startTime: "",
        finishTime: "",
      },
    ]);
  }

  function removeArtistBooking(id: number) {
    if (artistBookings.length === 1) return;
    setArtistBookings((current) => current.filter((booking) => booking.id !== id));
    setErrors((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => !key.startsWith(`booking-${id}-`)),
    ));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Open every collapsed section that contains an error so it is visible.
      const sectionsWithErrors = REQUIRED_FIELDS.filter((f) => errs[f.key]).map((f) => f.section);
      if (Object.keys(errs).some((key) => key.startsWith("booking-"))) sectionsWithErrors.push("quick");
      setOpen((o) => {
        const next = { ...o };
        for (const s of sectionsWithErrors) next[s] = true;
        return next;
      });
      // Move focus to the first invalid field (after collapsed sections expand).
      const firstInvalid = Object.keys(errs)[0];
      if (firstInvalid) {
        requestAnimationFrame(() => {
          (document.querySelector(`[name="${firstInvalid}"]`) as HTMLElement | null)?.focus();
        });
      }
      return;
    }

    const artistNames = artistBookings.map((booking) => booking.artist).filter(Boolean);
    const artistSchedule = artistBookings.map(formatArtistBooking).join("\n");
    const subjectArtists = artistNames.length > 2
      ? `${artistNames.slice(0, 2).join(", ")} +${artistNames.length - 2}`
      : artistNames.join(", ");
    const subject = `Booking Enquiry${subjectArtists ? `: ${subjectArtists}` : ""} from ${form.name}`;
    const location = [form.venue, form.city, form.country].filter(Boolean).join(", ");
    const budget = form.budgetRange
      ? form.budgetRange === "Prefer to discuss"
        ? form.budgetRange
        : `${form.budgetRange} ${form.currency}`
      : "";
    const whatsappNumber = whatsappMode === "same"
      ? form.phone
      : whatsappMode === "different" ? form.whatsapp : "";

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
          ...(whatsappNumber && { WhatsApp: whatsappNumber }),
          "Artist schedule": artistSchedule,
          ...(form.eventName && { "Event name": form.eventName }),
          ...(form.eventType && { "Event type": form.eventType }),
          "Event date": dateTbc ? "TBC" : form.date,
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
      whatsappNumber ? `WhatsApp: ${whatsappNumber}` : null,
      "",
      "ARTIST SCHEDULE",
      ...artistBookings.map(formatArtistBooking),
      "",
      "THE EVENT",
      form.eventName ? `Event name: ${form.eventName}` : null,
      form.eventType ? `Event type: ${form.eventType}` : null,
      `Event date: ${dateTbc ? "TBC" : form.date}`,
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
      <div role="status" className="flex flex-col items-center justify-center py-32 text-center">
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center border"
          style={{ borderColor: "var(--border)" }}
        >
          <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--text)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 ref={successHeadingRef} tabIndex={-1} className="mb-3 text-2xl font-bold outline-none" style={{ color: "var(--text)" }}>Enquiry sent</h2>
        <p className="mb-8 max-w-sm text-sm" style={{ color: "var(--text-40)" }}>
          {FORMSPREE_ENDPOINT
            ? "Your enquiry has been sent. We aim to respond within 48 hours."
            : "Your email client should have opened with your message pre-filled. We aim to respond within 48 hours."}
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
          {Array.from(new Set(Object.keys(errors)
            .filter((key) => errors[key])
            .map((key) => REQUIRED_FIELDS.find((field) => field.key === key)?.label
              ?? (key === "phone" ? "Phone" : key === "whatsapp" ? "WhatsApp" : key.startsWith("booking-") ? "Artist schedule" : key))))
            .join(", ")}
        </div>
      )}
      <p className="text-xs" style={{ color: "var(--text-40)" }}>
        Fields marked with <span aria-hidden="true">*</span>
        <span className="sr-only">an asterisk</span> are required.
      </p>
      <div className="space-y-3">
      <Collapsible id="quick" step="01" title="Quick enquiry" open={open.quick} onToggle={() => toggle("quick")} error={Boolean(errors.name || errors.email || errors.phone || errors.whatsapp || errors.date || hasBookingErrors)}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Your Name" required error={errors.name}>
            <Input name="name" autoComplete="name" maxLength={100} placeholder="Jane Smith" value={form.name} onChange={handleChange} onBlur={handleBlur} error={errors.name} />
          </Field>
          <Field label="Email Address" required error={errors.email}>
            <EmailField maxLength={254} value={form.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} />
          </Field>
          <Field label="Phone Number" error={errors.phone}>
            <PhoneField
              value={form.phone}
              error={errors.phone}
              onChange={handlePhoneChange}
              onCountryChange={setPhoneCountry}
              onValidityChange={setPhoneValid}
              onBlur={() => {
                setErrors((current) => ({
                  ...current,
                  phone: form.phone && !phoneValid ? "Enter a valid international phone number" : "",
                }));
              }}
            />
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-60)" }}>
              <span className="flex items-center gap-1.5">
                <WhatsAppIcon />
                WhatsApp <span className="font-normal normal-case tracking-normal" style={{ color: "var(--text-40)" }}>(optional)</span>
              </span>
            </legend>
            <label
              className="flex min-h-[50px] cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition-colors duration-200 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
            >
              <input
                type="checkbox"
                checked={whatsappMode === "same"}
                disabled={!form.phone}
                onChange={(event) => handleWhatsAppMode(event.target.checked ? "same" : "none")}
                className="h-5 w-5 shrink-0 accent-current"
              />
              Same as phone number
            </label>
            {whatsappMode === "different" ? (
              <div className="mt-3">
                <Field label="WhatsApp Number" required error={errors.whatsapp}>
                  <PhoneField
                    name="whatsapp"
                    initialCountry={phoneCountry}
                    value={form.whatsapp}
                    error={errors.whatsapp}
                    onChange={handleWhatsAppChange}
                    onValidityChange={setWhatsappValid}
                    onBlur={() => {
                      setErrors((current) => ({
                        ...current,
                        whatsapp: !form.whatsapp
                          ? "Enter the WhatsApp number"
                          : !whatsappValid ? "Enter a valid international WhatsApp number" : "",
                      }));
                    }}
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => handleWhatsAppMode("none")}
                  className="link-quiet mt-1 min-h-[44px] text-xs uppercase tracking-widest"
                >
                  Remove WhatsApp number
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleWhatsAppMode("different")}
                className="link-quiet mt-1 min-h-[44px] text-xs uppercase tracking-widest"
              >
                Add a different WhatsApp number
              </button>
            )}
          </fieldset>
          <div className="sm:col-span-2">
            <Field label="Event Date" required={!dateTbc} error={errors.date}>
              <Input
                name="date"
                type="date"
                disabled={dateTbc}
                value={form.date}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.date}
              />
            </Field>
            <label className="mt-3 inline-flex min-h-[44px] cursor-pointer items-center gap-3 text-sm" style={{ color: "var(--text-60)" }}>
              <input
                type="checkbox"
                checked={dateTbc}
                onChange={(event) => handleDateTbcChange(event.target.checked)}
                className="h-5 w-5 accent-current"
              />
              Date not confirmed yet
            </label>
          </div>

          <div className="space-y-4 sm:col-span-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-60)" }}>
                Artist schedule <span aria-hidden="true">*</span>
              </h3>
              <p className="mt-1 text-xs" style={{ color: "var(--text-40)" }}>
                Add every AAA artist for this event. Give a set duration, exact times, or leave timing as TBC.
              </p>
            </div>

            {artistBookings.map((booking, index) => {
              const exactDuration = booking.timingMode === "times"
                ? calculateSetDuration(booking.startTime, booking.finishTime)
                : "";
              const overlaps = overlapArtists.get(booking.id) ?? [];
              return (
                <div
                  key={booking.id}
                  className="border p-4 md:p-5"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}
                >
                  <div className="mb-4 flex min-h-[32px] items-center justify-between gap-4">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-40)" }}>
                      Artist {index + 1}
                    </p>
                    {artistBookings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArtistBooking(booking.id)}
                        className="link-quiet min-h-[44px] px-2 text-xs uppercase tracking-widest"
                        aria-label={`Remove ${booking.artist || `artist ${index + 1}`} from booking`}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                    <div className="sm:col-start-1 sm:row-start-1">
                      <Field label="Artist" required error={errors[`booking-${booking.id}-artist`]}>
                        <Select
                          name={`booking-${booking.id}-artist`}
                          value={booking.artist}
                          onChange={(event) => updateArtistBooking(booking.id, "artist", event.target.value)}
                          error={errors[`booking-${booking.id}-artist`]}
                        >
                          <option value="">Select an artist…</option>
                          {artistOptions.map((artist) => (
                            <option
                              key={artist.slug}
                              value={artist.name}
                              disabled={artist.name !== booking.artist && selectedArtists.has(artist.name)}
                            >
                              {artist.name}
                            </option>
                          ))}
                          <option
                            value="Open to suggestions"
                            disabled={booking.artist !== "Open to suggestions" && selectedArtists.has("Open to suggestions")}
                          >
                            Open to suggestions
                          </option>
                        </Select>
                      </Field>
                    </div>

                    <div className="sm:col-start-2 sm:row-start-1">
                      <fieldset aria-describedby={`booking-${booking.id}-timing-hint`}>
                        <legend className="mb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-60)" }}>
                          Timing
                        </legend>
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            ["duration", "Duration only"],
                            ["times", "Exact times"],
                          ] as const).map(([value, label]) => (
                            <label
                              key={value}
                              className="flex min-h-[44px] cursor-pointer items-center gap-2 border px-3 py-2 text-sm transition-colors duration-200"
                              style={{
                                borderColor: booking.timingMode === value ? "var(--text)" : "var(--border)",
                                backgroundColor: booking.timingMode === value ? "var(--surface)" : "transparent",
                                color: "var(--text)",
                              }}
                            >
                              <input
                                type="radio"
                                name={`booking-${booking.id}-timing-mode`}
                                value={value}
                                checked={booking.timingMode === value}
                                onChange={(event) => updateArtistBooking(booking.id, "timingMode", event.target.value)}
                                className="h-4 w-4 shrink-0 accent-current"
                              />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                        <p id={`booking-${booking.id}-timing-hint`} className="mt-1.5 text-xs" style={{ color: "var(--text-40)" }}>
                          Use whatever is known now. Timing can be confirmed later.
                        </p>
                      </fieldset>
                    </div>

                    {booking.timingMode === "duration" ? (
                      <fieldset className="contents">
                        <legend className="sr-only">Set duration</legend>
                        <div className="sm:col-start-1 sm:row-start-2">
                          <Field
                            label="Hours"
                            hint={`Total: ${selectedDurationLabel(booking)}`}
                            error={errors[`booking-${booking.id}-duration`]}
                          >
                            <Select
                              name={`booking-${booking.id}-duration`}
                              value={String(Math.floor(Number(booking.durationMinutes || "60") / 60))}
                              onChange={(event) => updateArtistDurationPart(booking.id, "hours", event.target.value)}
                              error={errors[`booking-${booking.id}-duration`]}
                            >
                              {DURATION_HOURS.map((hours) => (
                                <option key={hours} value={hours}>{hours}</option>
                              ))}
                            </Select>
                          </Field>
                        </div>
                        <div className="sm:col-start-2 sm:row-start-2">
                          <Field label="Minutes">
                            <Select
                              name={`booking-${booking.id}-duration-minutes`}
                              value={String(Number(booking.durationMinutes || "60") % 60)}
                              onChange={(event) => updateArtistDurationPart(booking.id, "minutes", event.target.value)}
                            >
                              {DURATION_MINUTES.map((minutes) => (
                                <option key={minutes} value={minutes}>
                                  {String(minutes).padStart(2, "0")}
                                </option>
                              ))}
                            </Select>
                          </Field>
                        </div>
                      </fieldset>
                    ) : (
                      <>
                        <div className="sm:col-start-1 sm:row-start-2">
                          <Field label="Start Time" error={errors[`booking-${booking.id}-start`]}>
                            <Input
                              name={`booking-${booking.id}-start`}
                              type="time"
                              step={300}
                              value={booking.startTime}
                              onChange={(event) => updateArtistBooking(booking.id, "startTime", event.target.value)}
                              error={errors[`booking-${booking.id}-start`]}
                            />
                          </Field>
                        </div>
                        <div className="sm:col-start-2 sm:row-start-2">
                          <Field label="Finish Time" error={errors[`booking-${booking.id}-finish`]}>
                            <Input
                              name={`booking-${booking.id}-finish`}
                              type="time"
                              step={300}
                              value={booking.finishTime}
                              onChange={(event) => updateArtistBooking(booking.id, "finishTime", event.target.value)}
                              error={errors[`booking-${booking.id}-finish`]}
                            />
                          </Field>
                        </div>
                      </>
                    )}
                  </div>

                  {exactDuration && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="mt-4 flex items-center justify-between gap-4 border px-4 py-3"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                    >
                      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-40)" }}>
                        Duration
                      </span>
                      <span className="text-sm font-semibold text-right" style={{ color: "var(--text)" }}>{exactDuration}</span>
                    </div>
                  )}
                  {overlaps.length > 0 && (
                    <p className="mt-3 text-xs" role="status" style={{ color: "var(--error)" }}>
                      Time overlaps with {overlaps.join(", ")}. You can still submit if this is intentional.
                    </p>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={addArtistBooking}
              disabled={!canAddArtist}
              className="btn-outline inline-flex min-h-[44px] w-full items-center justify-center px-5 py-3 text-xs font-semibold uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add another artist
            </button>
          </div>
        </div>
      </Collapsible>

      <Collapsible id="event" step="02" title="Event details (optional)" open={open.event} onToggle={() => toggle("event")} error={Boolean(errors.company || errors.eventName || errors.eventType || errors.venue || errors.city || errors.country || errors.capacity || errors.ticketing)}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Company / Promoter">
            <Input name="company" autoComplete="organization" maxLength={120} placeholder="Your venue, brand or agency" value={form.company} onChange={handleChange} onBlur={handleBlur} error={errors.company} />
          </Field>
          <Field label="Event Name">
            <Input name="eventName" maxLength={120} placeholder="e.g. Saturday Sessions" value={form.eventName} onChange={handleChange} onBlur={handleBlur} error={errors.eventName} />
          </Field>
          <Field label="Event Type">
            <Select name="eventType" value={form.eventType} onChange={handleChange} error={errors.eventType}>
              <option value="">Select type…</option>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Venue / Location Name">
            <Input name="venue" maxLength={120} placeholder="e.g. Fabric" value={form.venue} onChange={handleChange} onBlur={handleBlur} error={errors.venue} />
          </Field>
          <Field label="Country" hint="Choose the country first to enable city suggestions">
            <CountryCombobox name="country" value={form.country} onChange={handleCountryChange} error={errors.country} />
          </Field>
          <Field label="City">
            <CityCombobox
              key={form.country || "no-country"}
              name="city"
              country={form.country}
              value={form.city}
              onChange={handleCityChange}
              maxLength={80}
              error={errors.city}
            />
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

      <Collapsible id="budget" step="03" title="Budget & extras (optional)" open={open.budget} onToggle={() => toggle("budget")} error={Boolean(errors.budgetRange || errors.lineup || errors.hearAbout)}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Budget / Fee Offer" hint="A rough range helps us reply faster">
            <Select name="budgetRange" value={form.budgetRange} onChange={handleChange} error={errors.budgetRange}>
              <option value="">Select a range…</option>
              {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
            </Select>
          </Field>
          <Field label="Currency">
            <Select
              name="currency"
              value={form.currency}
              onChange={(event) => {
                setCurrencyTouched(true);
                handleChange(event);
              }}
            >
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </Select>
          </Field>
          <Field label="How Did You Hear About Us?">
            <Select name="hearAbout" value={form.hearAbout} onChange={handleChange} error={errors.hearAbout}>
              <option value="">Select…</option>
              {HEAR_ABOUT.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Other / External Artists on the Bill">
            <Input name="lineup" maxLength={500} placeholder="Anyone else playing alongside?" value={form.lineup} onChange={handleChange} onBlur={handleBlur} error={errors.lineup} />
          </Field>
        </div>
      </Collapsible>

      <Collapsible id="message" step="04" title="Anything else (optional)" open={open.message} onToggle={() => toggle("message")}>
        <Field label="Message">
          <textarea
            name="message"
            rows={5}
            maxLength={4000}
            placeholder="Tell us about the event, the crowd, timings, and anything else that helps us quote accurately…"
            value={form.message}
            onChange={handleChange}
            className="w-full resize-none border px-4 py-3 text-base outline-none"
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
  id,
  step,
  title,
  open,
  onToggle,
  error,
  children,
}: {
  id: string;
  step?: string;
  title: string;
  open?: boolean;
  onToggle: () => void;
  error?: boolean;
  children: React.ReactNode;
}) {
  const contentId = `section-${id}`;
  return (
    <div className="border" style={{ borderColor: error ? "var(--error)" : "var(--border)" }}>
      {/* h2 wrapper keeps the page's heading outline intact (h1 → h2 per section);
          preflight resets heading font styles, so it doesn't change the look. */}
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={Boolean(open)}
          aria-controls={contentId}
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-all"
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
            aria-hidden="true"
            className="h-5 w-5 shrink-0 transition-transform duration-300"
            style={{ color: "var(--text-40)", transform: open ? "rotate(45deg)" : "none" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </h2>
      {open && (
        <div id={contentId} className="space-y-6 border-t p-5 md:p-6" style={{ borderColor: "var(--border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// text-base (16px) on all controls: iOS Safari auto-zooms the page when focusing
// any input below 16px. Extra props (autoComplete, aria-* injected by Field) are
// spread straight onto the native element.
function Input({
  error,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      {...rest}
      className="w-full border px-4 py-3 text-base outline-none transition-all"
      style={{
        borderColor: error ? "var(--error)" : "var(--border)",
        backgroundColor: "var(--surface)",
        color: "var(--text)",
      }}
    />
  );
}

// Domain suggestions via a native <datalist>: the browser supplies the dropdown,
// arrow-key navigation, and screen-reader announcements — no blur-timeout tricks,
// and picking an option fires a normal change event on the input.
function EmailField({
  value,
  onChange,
  onBlur,
  error,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const listId = useId();
  const suggestions = emailSuggestions(String(value ?? ""));
  return (
    <>
      <input
        {...rest}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        list={listId}
        placeholder="jane@example.com"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full border px-4 py-3 text-base outline-none transition-all"
        style={{
          borderColor: error ? "var(--error)" : "var(--border)",
          backgroundColor: "var(--surface)",
          color: "var(--text)",
        }}
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  );
}

function Select({
  error,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <select
      {...rest}
      className="min-h-[50px] w-full border px-4 py-3 text-base outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
  // Injects the field-state ARIA into the wrapped control (Input/Select/EmailField/
  // textarea all spread unknown props onto the native element), and ties the error
  // or hint text to it via aria-describedby.
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        "aria-required": required || undefined,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : hint ? hintId : undefined,
      })
    : children;
  return (
    // Wrapping the control in <label> implicitly associates them (no id needed).
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-60)" }}>
        {label}{required && <span className="ml-0.5" aria-hidden="true">*</span>}
      </span>
      {control}
      {hint && !error && <span id={hintId} className="text-xs" style={{ color: "var(--text-40)" }}>{hint}</span>}
      {error && <span id={errorId} className="text-xs" role="alert" style={{ color: "var(--error)" }}>{error}</span>}
    </label>
  );
}

/** Contextual back link — returns to the artist's profile when arriving from a
 *  "Book {artist}" action, otherwise to the full roster. */
function BackLink({ artistOptions }: { artistOptions: ArtistOption[] }) {
  const name = useSearchParams().get("artist") ?? "";
  const artist = name ? artistOptions.find((a) => a.name === name) : undefined;
  const href = artist ? `/artist/${artist.slug}` : "/artists";
  const label = artist ? `Back to ${artist.name}` : "All Artists";
  return (
    <Link
      href={href}
      className="link-quiet mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest"
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}

export default function ContactView({ artistOptions }: { artistOptions: ArtistOption[] }) {
  return (
    <div className="min-h-screen px-6 py-24" style={{ backgroundColor: "var(--bg)" }}>
      <div className="mx-auto max-w-3xl">
        <Suspense>
          <BackLink artistOptions={artistOptions} />
        </Suspense>
        <div className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            AAA Artists
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl" style={{ color: "var(--text)" }}>
            Book Artists
          </h1>
          <p className="max-w-xl text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
            Start with your name, email, one or more artists, and the event date—or mark the date as not confirmed.
            Everything else is optional, but a fuller brief helps us reply faster.
          </p>
        </div>

        <div className="border p-8 md:p-12" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
          <Suspense>
            <ContactForm artistOptions={artistOptions} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
