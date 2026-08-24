"use client";

import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CURRENCIES, COUNTRIES } from "@/data/formOptions";
import { Suspense } from "react";
import CountryCombobox from "./CountryCombobox";
import CityCombobox from "./CityCombobox";
import PhoneField from "./PhoneField";
import TurnstileWidget from "./TurnstileWidget";
import type { Iso2 } from "intl-tel-input";
import {
  BOOKING_LIMITS,
  BUDGET_RANGES,
  CAPACITY_RANGES,
  DURATION_HOURS,
  DURATION_MINUTES,
  DURATION_VALUES,
  EMAIL_PATTERN,
  EVENT_TYPES,
  HEAR_ABOUT_OPTIONS,
  TIME_PATTERN,
  TICKETING_OPTIONS,
  durationBetween,
  formatDuration,
} from "@/config/booking";
import { BOOKING_EMAIL } from "@/lib/site";

const WHATSAPP_CONTACT_METHODS = [
  { value: "none", label: "None" },
  { value: "number", label: "Number" },
  { value: "username", label: "Username" },
] as const;
// One duration source of truth: every combination exposed by the hours/minutes
// menus: one to six hours, in quarter-hour increments.
const SET_DURATIONS = DURATION_VALUES.map(Number);

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
  return formatDuration(value);
}

const EURO_COUNTRIES = new Set([
  "Austria",
  "Belgium",
  "Croatia",
  "Cyprus",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Ireland",
  "Italy",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Netherlands",
  "Portugal",
  "Slovakia",
  "Slovenia",
  "Spain",
]);

function currencyForCountry(country: string): string | null {
  if (country === "United Kingdom") return "GBP";
  if (country === "United States") return "USD";
  if (EURO_COUNTRIES.has(country)) return "EUR";
  return null;
}

function calculateSetDuration(start: string, finish: string): string {
  return durationBetween(start, finish);
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
  if (
    first.timingMode !== "times" ||
    second.timingMode !== "times" ||
    !calculateSetDuration(first.startTime, first.finishTime) ||
    !calculateSetDuration(second.startTime, second.finishTime)
  )
    return false;

  const firstStart = toMinutes(first.startTime);
  const firstFinishBase = toMinutes(first.finishTime);
  const firstFinish = firstFinishBase <= firstStart ? firstFinishBase + 24 * 60 : firstFinishBase;
  const secondStartBase = toMinutes(second.startTime);
  const secondFinishBase = toMinutes(second.finishTime);
  const secondDuration =
    secondFinishBase <= secondStartBase
      ? secondFinishBase + 24 * 60 - secondStartBase
      : secondFinishBase - secondStartBase;

  return [-24 * 60, 0, 24 * 60].some((offset) => {
    const secondStart = secondStartBase + offset;
    const secondFinish = secondStart + secondDuration;
    return Math.max(firstStart, secondStart) < Math.min(firstFinish, secondFinish);
  });
}

// Common domains used for one inline completion after the visitor starts typing
// the domain. Unlike <datalist>, this never opens an obstructive mobile popup and
// does not replace the browser/OS saved-email autofill supplied by autocomplete.
const EMAIL_DOMAINS = [
  // Global providers
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "ymail.com",
  "googlemail.com",
  "icloud.com",
  "me.com",
  "live.com",
  "msn.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "mail.com",
  "zoho.com",
  "fastmail.com",
  "hey.com",
  "tuta.com",
  "tutanota.com",

  // United Kingdom and Ireland
  "hotmail.co.uk",
  "outlook.co.uk",
  "yahoo.co.uk",
  "ymail.co.uk",
  "live.co.uk",
  "btinternet.com",
  "sky.com",
  "virginmedia.com",
  "talktalk.net",
  "ntlworld.com",
  "eircom.net",

  // Germany, Austria and Switzerland
  "gmx.de",
  "gmx.at",
  "gmx.ch",
  "web.de",
  "outlook.de",
  "t-online.de",
  "freenet.de",
  "aon.at",
  "bluewin.ch",

  // France, Benelux, Spain, Portugal and Italy
  "orange.fr",
  "hotmail.fr",
  "outlook.fr",
  "yahoo.fr",
  "free.fr",
  "sfr.fr",
  "laposte.net",
  "wanadoo.fr",
  "ziggo.nl",
  "kpnmail.nl",
  "planet.nl",
  "xs4all.nl",
  "telenet.be",
  "skynet.be",
  "proximus.be",
  "hotmail.es",
  "outlook.es",
  "yahoo.es",
  "orange.es",
  "telefonica.net",
  "sapo.pt",
  "iol.pt",
  "libero.it",
  "virgilio.it",
  "alice.it",
  "hotmail.it",
  "outlook.it",
  "yahoo.it",

  // Nordic countries
  "telia.com",
  "telia.se",
  "bredband.net",
  "online.no",
  "start.no",
  "yousee.dk",
  "mail.dk",
  "elisa.fi",
  "kolumbus.fi",
  "simnet.is",

  // Central and Eastern Europe
  "wp.pl",
  "onet.pl",
  "interia.pl",
  "o2.pl",
  "gazeta.pl",
  "seznam.cz",
  "centrum.cz",
  "azet.sk",
  "zoznam.sk",
  "freemail.hu",
  "citromail.hu",
  "abv.bg",
  "inbox.lv",
  "mail.ee",
  "ukr.net",
  "i.ua",
  "mail.ru",
  "yandex.ru",
  "rambler.ru",

  // United States and Canada
  "comcast.net",
  "att.net",
  "sbcglobal.net",
  "verizon.net",
  "cox.net",
  "charter.net",
  "spectrum.net",
  "rogers.com",
  "bell.net",
  "shaw.ca",
  "videotron.ca",
  "yahoo.ca",

  // Latin America
  "outlook.com.br",
  "hotmail.com.br",
  "yahoo.com.br",
  "uol.com.br",
  "bol.com.br",
  "terra.com.br",
  "globo.com",
  "yahoo.com.ar",
  "yahoo.cl",
  "yahoo.com.co",
  "yahoo.com.mx",
  "yahoo.com.pe",
  "yahoo.com.ve",
  "prodigy.net.mx",

  // Turkey, Israel and Africa
  "hotmail.com.tr",
  "outlook.com.tr",
  "yahoo.com.tr",
  "walla.co.il",
  "yahoo.co.za",
  "mweb.co.za",
  "telkomsa.net",

  // Asia-Pacific
  "yahoo.co.jp",
  "docomo.ne.jp",
  "ezweb.ne.jp",
  "softbank.ne.jp",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "kakao.com",
  "qq.com",
  "163.com",
  "126.com",
  "yeah.net",
  "foxmail.com",
  "sina.com",
  "rediffmail.com",
  "yahoo.co.in",
  "yahoo.in",
  "indiatimes.com",
  "yahoo.com.hk",
  "yahoo.com.tw",
  "yahoo.com.sg",
  "yahoo.com.ph",
  "yahoo.com.my",
  "yahoo.co.id",
  "hotmail.com.au",
  "outlook.com.au",
  "yahoo.com.au",
  "bigpond.com",
  "bigpond.net.au",
  "optusnet.com.au",
  "iinet.net.au",
  "westnet.com.au",
  "internode.on.net",
  "yahoo.co.nz",
  "xtra.co.nz",
];

const VISIBLE_EMAIL_COMPLETIONS = 3;

const REGION_DOMAIN_SUFFIXES: Record<string, string[]> = {
  GB: [".co.uk"],
  BR: [".com.br"],
  MX: [".com.mx"],
  AR: [".com.ar"],
  CO: [".com.co"],
  PE: [".com.pe"],
  VE: [".com.ve"],
  TR: [".com.tr"],
  ZA: [".co.za"],
  JP: [".co.jp", ".ne.jp"],
  IN: [".co.in", ".in"],
  HK: [".com.hk"],
  TW: [".com.tw"],
  SG: [".com.sg"],
  PH: [".com.ph"],
  MY: [".com.my"],
  ID: [".co.id"],
  AU: [".com.au", ".net.au"],
  NZ: [".co.nz"],
  IL: [".co.il"],
};

function browserLocaleRegion(): string {
  if (typeof navigator === "undefined") return "";
  for (const language of navigator.languages) {
    try {
      const region = new Intl.Locale(language).region;
      if (region) return region.toUpperCase();
    } catch {
      // Ignore malformed custom browser locales and try the next preference.
    }
  }
  return "";
}

function domainRegionRank(domain: string, region: string): number {
  if (!region) return domain.endsWith(".com") ? 1 : 2;
  const regionalSuffixes = [...(REGION_DOMAIN_SUFFIXES[region] ?? []), `.${region.toLowerCase()}`];
  if (regionalSuffixes.some((suffix) => domain.endsWith(suffix))) return 0;
  return domain.endsWith(".com") ? 1 : 2;
}

function emailCompletions(value: string, region = ""): Array<{ email: string; domain: string }> {
  if (!value || /\s/.test(value)) return [];
  const firstAt = value.indexOf("@");

  // Wait for the first domain character rather than assuming a provider.
  if (firstAt === -1) return [];
  if (firstAt === 0 || firstAt !== value.lastIndexOf("@")) return [];

  const local = value.slice(0, firstAt);
  const domainPart = value.slice(firstAt + 1).toLowerCase();
  if (!domainPart || EMAIL_DOMAINS.includes(domainPart)) return [];
  return EMAIL_DOMAINS.map((domain, index) => ({ domain, index }))
    .filter(({ domain }) => domain.startsWith(domainPart))
    .sort(
      (first, second) =>
        domainRegionRank(first.domain, region) - domainRegionRank(second.domain, region) ||
        first.index - second.index
    )
    .map(({ domain }) => ({ email: `${local}@${domain}`, domain }));
}

const CONTACT_API_ENDPOINT = "/api/enquiries";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const IS_PRODUCTION_BUILD = process.env.NODE_ENV === "production";

// In-progress enquiries are kept in sessionStorage so a visitor who navigates
// away mid-form and comes back does not lose their draft. sessionStorage is
// per-tab, never leaves the device, and is cleared when the tab closes —
// strictly functional storage for a user-initiated action, holding only what
// the visitor typed. Never store the security token or honeypot here.
const DRAFT_STORAGE_KEY = "aaa-booking-draft-v1";

type DraftShape = {
  form: Record<string, string>;
  artistBookings: ArtistBooking[];
  dateTbc: boolean;
  whatsappMode: "none" | "same" | "different" | "username";
  phoneCountry: string;
  currencyTouched: boolean;
};

// Dropdown fields the Worker validates against a fixed list. A draft written
// before one of those lists changed can hold a value that no longer exists — the
// select would render blank while still holding the stale value, and the Worker
// would reject the submission. Restore only values that are still offered.
const DRAFT_ENUM_FIELDS: Record<string, readonly string[]> = {
  eventType: EVENT_TYPES,
  capacity: CAPACITY_RANGES,
  ticketing: TICKETING_OPTIONS,
  budgetRange: BUDGET_RANGES,
  hearAbout: HEAR_ABOUT_OPTIONS,
};

function readDraft(validArtists: Set<string>): DraftShape | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: number } & Partial<DraftShape>;
    if (parsed.version !== 1 || typeof parsed.form !== "object" || !parsed.form) return null;
    const form: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.form)) {
      if (typeof value !== "string") continue;
      const allowed = DRAFT_ENUM_FIELDS[key];
      if (allowed && value !== "" && !allowed.includes(value)) continue;
      form[key] = value.slice(0, 2000);
    }
    const bookings = (Array.isArray(parsed.artistBookings) ? parsed.artistBookings : [])
      .filter((booking) => booking && typeof booking === "object")
      .map((booking, index) => ({
        id: index,
        artist:
          typeof booking.artist === "string" && validArtists.has(booking.artist)
            ? booking.artist
            : "",
        timingMode: booking.timingMode === "times" ? ("times" as const) : ("duration" as const),
        durationMinutes:
          typeof booking.durationMinutes === "string" ? booking.durationMinutes : "60",
        startTime: typeof booking.startTime === "string" ? booking.startTime : "",
        finishTime: typeof booking.finishTime === "string" ? booking.finishTime : "",
      }));
    return {
      form,
      artistBookings: bookings.length > 0 ? bookings : [],
      dateTbc: parsed.dateTbc === true,
      whatsappMode: ["none", "same", "different", "username"].includes(parsed.whatsappMode ?? "")
        ? (parsed.whatsappMode as DraftShape["whatsappMode"])
        : "none",
      phoneCountry:
        typeof parsed.phoneCountry === "string" && /^[a-z]{2}$/.test(parsed.phoneCountry)
          ? parsed.phoneCountry
          : "gb",
      currencyTouched: parsed.currencyTouched === true,
    };
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Storage may be unavailable (private mode restrictions); losing the draft is fine.
  }
}

// Slim shape passed from the server page — keeps the full artist dataset
// (bios, gig history) out of the client bundle.
export type ArtistOption = { name: string; slug: string };

function ContactForm({ artistOptions }: { artistOptions: ArtistOption[] }) {
  const searchParams = useSearchParams();
  const queryValue = (key: string, maxLength = 120) =>
    (searchParams.get(key) ?? "").trim().slice(0, maxLength);
  const requestedArtist = queryValue("artist");
  const preselected = artistOptions.some((artist) => artist.name === requestedArtist)
    ? requestedArtist
    : "";
  const requestedDate = queryValue("date", 10);
  const preselectedDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : "";
  const requestedCountry = queryValue("country", BOOKING_LIMITS.country);
  const preselectedCountry = COUNTRIES.includes(requestedCountry) ? requestedCountry : "";

  const initialForm = {
    // Your details
    name: "",
    company: "",
    email: "",
    phone: "",
    whatsapp: "",
    whatsappUsername: "",
    // The booking
    eventName: queryValue("event", BOOKING_LIMITS.eventName),
    eventType: "",
    date: preselectedDate,
    // Venue & audience
    venue: queryValue("venue", BOOKING_LIMITS.venue),
    city: queryValue("city", BOOKING_LIMITS.city),
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
  };
  const initialArtistBookings: ArtistBooking[] = [
    {
      id: 0,
      artist: preselected,
      timingMode: "duration",
      durationMinutes: "60",
      startTime: "",
      finishTime: "",
    },
  ];
  const [form, setForm] = useState(initialForm);
  const [artistBookings, setArtistBookings] = useState<ArtistBooking[]>(initialArtistBookings);
  const [expandedBookingIds, setExpandedBookingIds] = useState<Set<number>>(() => new Set([0]));
  const nextBookingId = useRef(1);
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
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
  const [whatsappMode, setWhatsappMode] = useState<"none" | "same" | "different" | "username">(
    "none"
  );
  const [resetVersion, setResetVersion] = useState(0);
  const [currencyTouched, setCurrencyTouched] = useState(false);
  const [turnstileVersion, setTurnstileVersion] = useState(0);
  const draftRestored = useRef(false);
  // Arriving with booking query parameters (artist page "Book Now", shared
  // links) is a fresh enquiry intent — it wins over any stored draft.
  const hasPrefillParams = ["artist", "event", "date", "venue", "city", "country"].some((key) =>
    Boolean(searchParams.get(key))
  );
  const whatsappContactType =
    whatsappMode === "username" ? "username" : whatsappMode === "none" ? "none" : "number";
  const isFormDirty =
    JSON.stringify(form) !== JSON.stringify(initialForm) ||
    JSON.stringify(artistBookings) !== JSON.stringify(initialArtistBookings) ||
    dateTbc ||
    whatsappMode !== "none";
  const canResetForm = isFormDirty || submitAttempted || Boolean(sendError);

  // Restore a saved draft once, after hydration (initialising state from
  // sessionStorage during render would mismatch the server-rendered markup).
  useEffect(() => {
    if (draftRestored.current) return;
    draftRestored.current = true;
    if (hasPrefillParams) return;
    const draft = readDraft(new Set(artistOptions.map((artist) => artist.name)));
    if (!draft) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setForm((current) => {
      const restored = { ...current };
      for (const key of Object.keys(current) as Array<keyof typeof current>) {
        if (typeof draft.form[key] === "string") restored[key] = draft.form[key];
      }
      return restored;
    });
    if (draft.artistBookings.length > 0) {
      setArtistBookings(draft.artistBookings);
      setExpandedBookingIds(new Set(draft.artistBookings.map((booking) => booking.id)));
      nextBookingId.current = draft.artistBookings.length;
    }
    setDateTbc(draft.dateTbc);
    setWhatsappMode(draft.whatsappMode);
    setPhoneCountry(draft.phoneCountry as Iso2);
    setCurrencyTouched(draft.currencyTouched);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only restore
  }, []);

  // Keep the draft current while the visitor types (debounced). Only clear the
  // stored draft when the form transitions dirty -> clean: clearing on initial
  // cleanliness would race the mount-time restore and delete the draft it is
  // about to apply.
  const formWasDirty = useRef(false);
  useEffect(() => {
    if (!draftRestored.current || submitted) return;
    const handle = setTimeout(() => {
      if (!isFormDirty) {
        if (formWasDirty.current) {
          formWasDirty.current = false;
          clearDraft();
        }
        return;
      }
      formWasDirty.current = true;
      try {
        window.sessionStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            version: 1,
            form,
            artistBookings,
            dateTbc,
            whatsappMode,
            phoneCountry,
            currencyTouched,
          })
        );
      } catch {
        // Storage full or unavailable — the form still works without drafts.
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [
    form,
    artistBookings,
    dateTbc,
    whatsappMode,
    phoneCountry,
    currencyTouched,
    isFormDirty,
    submitted,
  ]);
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
    ([key, value]) => key.startsWith("booking-") && Boolean(value)
  );
  const canAddArtist =
    artistBookings.length < artistOptions.length + 1 &&
    artistBookings.every((booking) => booking.artist);

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
  const EMAIL_RE = EMAIL_PATTERN;

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
    if (whatsappMode === "username") {
      if (!form.whatsappUsername.trim()) {
        e.whatsappUsername = "Enter the WhatsApp username";
      } else if (/[@\s]/.test(form.whatsappUsername)) {
        e.whatsappUsername = "Enter the username without @ or spaces";
      }
    }
    const allowedArtists = new Set([
      ...artistOptions.map((artist) => artist.name),
      "Open to suggestions",
    ]);
    const allowedDurations = new Set(SET_DURATIONS.map(String));
    const seenArtists = new Set<string>();
    for (const booking of artistBookings) {
      const artistKey = `booking-${booking.id}-artist`;
      const durationKey = `booking-${booking.id}-duration`;
      const startKey = `booking-${booking.id}-start`;
      const finishKey = `booking-${booking.id}-finish`;
      if (!booking.artist) e[artistKey] = "Select an artist";
      else if (!allowedArtists.has(booking.artist))
        e[artistKey] = "Select an artist from the roster";
      else if (seenArtists.has(booking.artist))
        e[artistKey] = "This artist is already in the booking";
      else seenArtists.add(booking.artist);

      if (booking.timingMode === "duration") {
        if (!booking.durationMinutes) {
          e[durationKey] = "Select a set duration";
        } else if (!allowedDurations.has(booking.durationMinutes)) {
          e[durationKey] = "Select a valid set duration";
        }
      } else if (booking.timingMode === "times") {
        if (booking.startTime && !TIME_PATTERN.test(booking.startTime))
          e[startKey] = "Enter a valid start time";
        if (booking.finishTime && !TIME_PATTERN.test(booking.finishTime))
          e[finishKey] = "Enter a valid finish time";
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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  }

  function handleEmailCompletion(email: string) {
    setForm((current) => ({ ...current, email: email.slice(0, BOOKING_LIMITS.email) }));
    setErrors((current) => ({ ...current, email: "" }));
  }

  // Validate a field when the user leaves it (only flags real problems, never premature).
  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const msg = fieldError(e.target.name, e.target.value);
    if (msg) setErrors((prev) => ({ ...prev, [e.target.name]: msg }));
  }

  function handlePhoneChange(phone: string) {
    setForm((current) => ({ ...current, phone: phone.slice(0, BOOKING_LIMITS.phone) }));
    setErrors((current) => ({ ...current, phone: "" }));
    if (!phone) setWhatsappMode((current) => (current === "same" ? "different" : current));
  }

  function handleWhatsAppChange(whatsapp: string) {
    setForm((current) => ({ ...current, whatsapp: whatsapp.slice(0, BOOKING_LIMITS.phone) }));
    setErrors((current) => ({ ...current, whatsapp: "" }));
  }

  function handleWhatsAppUsernameChange(event: React.ChangeEvent<HTMLInputElement>) {
    const whatsappUsername = event.target.value
      .replace(/^@+/, "")
      .slice(0, BOOKING_LIMITS.whatsappUsername - 1);
    setForm((current) => ({ ...current, whatsappUsername }));
    setErrors((current) => ({ ...current, whatsappUsername: "" }));
  }

  function handleWhatsAppMode(mode: "none" | "same" | "different" | "username") {
    setWhatsappMode(mode);
    if (mode !== "different") {
      setForm((current) => ({ ...current, whatsapp: "" }));
      setWhatsappValid(true);
    }
    if (mode !== "username") {
      setForm((current) => ({
        ...current,
        whatsappUsername: "",
      }));
    }
    setErrors((current) => ({
      ...current,
      whatsapp: "",
      whatsappUsername: "",
    }));
  }

  function handleCountryChange(country: string) {
    if (!COUNTRIES.includes(country)) return;
    setForm((current) => ({
      ...current,
      country,
      city: current.country === country ? current.city : "",
      currency: !currencyTouched
        ? (currencyForCountry(country) ?? current.currency)
        : current.currency,
    }));
    setErrors((current) => ({ ...current, country: "" }));
  }

  function handleCityChange(city: string) {
    setForm((current) => ({ ...current, city: city.slice(0, BOOKING_LIMITS.city) }));
    setErrors((current) => ({ ...current, city: "" }));
  }

  function handleDateTbcChange(checked: boolean) {
    setDateTbc(checked);
    setErrors((current) => ({ ...current, date: "" }));
  }

  function updateArtistBooking(
    id: number,
    field: "artist" | "timingMode" | "durationMinutes" | "startTime" | "finishTime",
    value: string
  ) {
    setArtistBookings((current) =>
      current.map((booking) => {
        if (booking.id !== id) return booking;
        if (field === "timingMode") {
          return { ...booking, timingMode: value === "times" ? "times" : "duration" };
        }
        return { ...booking, [field]: value.slice(0, 80) };
      })
    );
    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => !key.startsWith(`booking-${id}-`))
      )
    );
  }

  function updateArtistDurationPart(id: number, part: "hours" | "minutes", value: string) {
    setArtistBookings((current) =>
      current.map((booking) => {
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
      })
    );
    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => !key.startsWith(`booking-${id}-`))
      )
    );
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
    // Keep the newest task in view; completed artist cards can be reopened at any time.
    setExpandedBookingIds(new Set([id]));
  }

  function removeArtistBooking(id: number) {
    if (artistBookings.length === 1) return;
    const remaining = artistBookings.filter((booking) => booking.id !== id);
    setArtistBookings(remaining);
    setExpandedBookingIds((current) => {
      const next = new Set([...current].filter((bookingId) => bookingId !== id));
      if (next.size === 0 && remaining[0]) next.add(remaining[0].id);
      return next;
    });
    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => !key.startsWith(`booking-${id}-`))
      )
    );
  }

  function toggleArtistBooking(id: number) {
    setExpandedBookingIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetForm(confirmReset = true) {
    if (
      confirmReset &&
      isFormDirty &&
      !window.confirm("Reset this form? Your changes will be cleared.")
    )
      return;

    setForm(initialForm);
    setArtistBookings(initialArtistBookings);
    setExpandedBookingIds(new Set([0]));
    nextBookingId.current = 1;
    setSubmitted(false);
    setSending(false);
    setSendError("");
    setOpen({ quick: true });
    setErrors({});
    setSubmitAttempted(false);
    setDateTbc(false);
    setPhoneValid(true);
    setPhoneCountry("gb");
    setWhatsappValid(true);
    setWhatsappMode("none");
    setCurrencyTouched(false);
    setTurnstileVersion((current) => current + 1);
    setSubmissionId(crypto.randomUUID());
    setResetVersion((current) => current + 1);
    clearDraft();
    requestAnimationFrame(() => {
      (document.querySelector('[name="name"]') as HTMLInputElement | null)?.focus();
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const submittedForm = e.currentTarget as HTMLFormElement;
    const browserFormData = new FormData(submittedForm);
    const turnstileToken = String(browserFormData.get("cf-turnstile-response") ?? "");
    setSubmitAttempted(true);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Open every collapsed section that contains an error so it is visible.
      const sectionsWithErrors = REQUIRED_FIELDS.filter((f) => errs[f.key]).map((f) => f.section);
      const bookingIdsWithErrors = Object.keys(errs)
        .filter((key) => key.startsWith("booking-"))
        .map((key) => Number(key.split("-")[1]))
        .filter(Number.isFinite);
      if (bookingIdsWithErrors.length > 0) {
        sectionsWithErrors.push("quick");
        setExpandedBookingIds((current) => new Set([...current, ...bookingIdsWithErrors]));
      }
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

    if (TURNSTILE_SITE_KEY && TURNSTILE_SITE_KEY !== "test-site-key" && !turnstileToken) {
      setSendError("Please complete the security check, then send your enquiry again.");
      return;
    }

    const whatsappNumber =
      whatsappMode === "same" ? form.phone : whatsappMode === "different" ? form.whatsapp : "";
    const whatsappUsername = whatsappMode === "username" ? `@${form.whatsappUsername.trim()}` : "";
    setSending(true);
    setSendError("");
    try {
      const response = await fetch(CONTACT_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          phone: form.phone,
          whatsappNumber,
          whatsappUsername,
          submissionId,
          bookings: artistBookings.map(
            ({ artist, timingMode, durationMinutes, startTime, finishTime }) => ({
              artist,
              timingMode,
              durationMinutes,
              startTime,
              finishTime,
            })
          ),
          eventName: form.eventName,
          eventType: form.eventType,
          eventDate: dateTbc ? "TBC" : form.date,
          venue: form.venue,
          city: form.city,
          country: form.country,
          capacity: form.capacity,
          ticketing: form.ticketing,
          currency: form.currency,
          budgetRange: form.budgetRange,
          lineup: form.lineup,
          hearAbout: form.hearAbout,
          message: form.message,
          turnstileToken,
          website: String(browserFormData.get("website") ?? ""),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        requestId?: string;
      };
      if (!response.ok) {
        const reference = result.requestId ? ` Reference: ${result.requestId}.` : "";
        throw new Error(`${result.error || "Request failed"}${reference}`);
      }
      setSubmitted(true);
      clearDraft();
    } catch (error) {
      setTurnstileVersion((current) => current + 1);
      setSendError(
        error instanceof Error && error.message !== "Request failed"
          ? error.message
          : `Something went wrong sending your enquiry. Please email ${BOOKING_EMAIL} directly.`
      );
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div role="status" className="flex flex-col items-center justify-center py-32 text-center">
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center border"
          style={{ borderColor: "var(--border)" }}
        >
          <svg
            aria-hidden="true"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: "var(--text)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2
          ref={successHeadingRef}
          tabIndex={-1}
          className="mb-3 text-2xl font-bold outline-none"
          style={{ color: "var(--text)" }}
        >
          Enquiry sent
        </h2>
        <p className="mb-8 max-w-sm text-sm" style={{ color: "var(--text-40)" }}>
          Your enquiry has been sent, and a copy has been emailed to {form.email}. Reply to that
          email if you need to add or correct anything. We aim to respond within 48 hours.
        </p>
        <button
          type="button"
          onClick={() => resetForm(false)}
          className="text-sm underline underline-offset-4 transition-opacity hover:opacity-60"
          style={{ color: "var(--text-40)" }}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  if (IS_PRODUCTION_BUILD && !TURNSTILE_SITE_KEY) {
    return (
      <div
        role="alert"
        className="border px-5 py-6 text-sm leading-relaxed"
        style={{
          borderColor: "var(--error)",
          backgroundColor: "var(--surface)",
          color: "var(--text-60)",
        }}
      >
        <p className="font-semibold" style={{ color: "var(--text)" }}>
          Online enquiries are temporarily unavailable
        </p>
        <p className="mt-2">
          Please email{" "}
          <a className="underline underline-offset-4" href={`mailto:${BOOKING_EMAIL}`}>
            {BOOKING_EMAIL}
          </a>{" "}
          directly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-8"
      // Build-time marker: e2e tests wait for a Turnstile token only when a
      // widget is actually rendered (hermetic CI builds use test-site-key).
      data-turnstile={
        TURNSTILE_SITE_KEY && TURNSTILE_SITE_KEY !== "test-site-key" ? "widget" : "disabled"
      }
    >
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {submitAttempted && Object.values(errors).some(Boolean) && (
        <div
          role="alert"
          className="border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--error)",
            color: "var(--error)",
            backgroundColor: "var(--surface)",
          }}
        >
          <span className="font-semibold">Please check the highlighted fields:</span>{" "}
          {Array.from(
            new Set(
              Object.keys(errors)
                .filter((key) => errors[key])
                .map(
                  (key) =>
                    REQUIRED_FIELDS.find((field) => field.key === key)?.label ??
                    (key === "phone"
                      ? "Phone"
                      : key === "whatsapp" || key.startsWith("whatsappUsername")
                        ? "WhatsApp"
                        : key.startsWith("booking-")
                          ? "Artist schedule"
                          : key)
                )
            )
          ).join(", ")}
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs" style={{ color: "var(--text-40)" }}>
          Fields marked with <span aria-hidden="true">*</span>
          <span className="sr-only">an asterisk</span> are required.
        </p>
        {canResetForm && (
          <button
            type="button"
            disabled={sending}
            onClick={() => resetForm(true)}
            className="btn-outline min-h-[44px] shrink-0 px-3 text-xs font-semibold uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-35"
            style={{ backgroundColor: "var(--surface)" }}
          >
            Clear form
          </button>
        )}
      </div>
      <div className="space-y-3">
        <Collapsible
          id="quick"
          step="01"
          title="Quick enquiry"
          open={open.quick}
          onToggle={() => toggle("quick")}
          error={Boolean(
            errors.name ||
              errors.email ||
              errors.phone ||
              errors.whatsapp ||
              errors.whatsappUsername ||
              errors.date ||
              hasBookingErrors
          )}
        >
          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
            <Field label="Your Name" required error={errors.name}>
              <Input
                name="name"
                autoComplete="name"
                maxLength={BOOKING_LIMITS.name}
                placeholder="Jane Smith"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
              />
            </Field>
            <Field label="Email Address" required error={errors.email}>
              <EmailField
                maxLength={BOOKING_LIMITS.email}
                value={form.email}
                regionHint={form.phone ? phoneCountry : undefined}
                onChange={handleChange}
                onComplete={handleEmailCompletion}
                onBlur={handleBlur}
                error={errors.email}
              />
            </Field>
            <Field label="Phone Number" error={errors.phone}>
              <PhoneField
                key={`phone-${resetVersion}`}
                value={form.phone}
                error={errors.phone}
                onChange={handlePhoneChange}
                onCountryChange={setPhoneCountry}
                onValidityChange={setPhoneValid}
                onBlur={() => {
                  setErrors((current) => ({
                    ...current,
                    phone:
                      form.phone && !phoneValid ? "Enter a valid international phone number" : "",
                  }));
                }}
              />
            </Field>
            <fieldset>
              <legend
                className="mb-1.5 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-60)" }}
              >
                <span className="flex items-center gap-1.5">
                  <WhatsAppIcon />
                  WhatsApp{" "}
                  <span
                    className="font-normal normal-case tracking-normal"
                    style={{ color: "var(--text-40)" }}
                  >
                    (optional)
                  </span>
                </span>
              </legend>
              <div
                role="radiogroup"
                aria-label="WhatsApp contact method"
                className="grid grid-cols-3 overflow-hidden border"
                style={{ borderColor: "var(--border)" }}
              >
                {WHATSAPP_CONTACT_METHODS.map((method, index) => {
                  const selected = whatsappContactType === method.value;
                  return (
                    <label
                      key={method.value}
                      className="flex min-h-[44px] cursor-pointer items-center justify-center px-2 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-200 has-[:focus-visible]:relative has-[:focus-visible]:z-10 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-inset"
                      style={{
                        borderLeft: index > 0 ? "1px solid var(--border)" : undefined,
                        backgroundColor: selected ? "var(--text)" : "var(--surface)",
                        color: selected ? "var(--bg)" : "var(--text-40)",
                      }}
                    >
                      <input
                        type="radio"
                        name="whatsapp-contact-method"
                        value={method.value}
                        checked={selected}
                        onChange={() =>
                          handleWhatsAppMode(
                            method.value === "number"
                              ? form.phone
                                ? "same"
                                : "different"
                              : method.value
                          )
                        }
                        className="sr-only"
                      />
                      {method.label}
                    </label>
                  );
                })}
              </div>

              {whatsappContactType === "number" && (
                <div className="mt-3 space-y-3">
                  {form.phone && (
                    <label
                      className="flex min-h-[50px] cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition-colors duration-200"
                      style={{
                        borderColor: "var(--border)",
                        backgroundColor: "var(--surface)",
                        color: "var(--text)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={whatsappMode === "same"}
                        onChange={(event) =>
                          handleWhatsAppMode(event.target.checked ? "same" : "different")
                        }
                        className="h-5 w-5 shrink-0 accent-current"
                      />
                      Same as phone number
                    </label>
                  )}
                  {whatsappMode === "different" && (
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
                              : !whatsappValid
                                ? "Enter a valid international WhatsApp number"
                                : "",
                          }));
                        }}
                      />
                    </Field>
                  )}
                </div>
              )}

              {whatsappMode === "username" && (
                <div className="mt-3 space-y-4">
                  <Field
                    label="WhatsApp Username"
                    required
                    hint="Enter the exact username shown in WhatsApp"
                    error={errors.whatsappUsername}
                  >
                    <UsernameInput
                      name="whatsappUsername"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={BOOKING_LIMITS.whatsappUsername - 1}
                      placeholder="username"
                      value={form.whatsappUsername}
                      onChange={handleWhatsAppUsernameChange}
                      onBlur={() => {
                        const username = form.whatsappUsername.trim();
                        setErrors((current) => ({
                          ...current,
                          whatsappUsername: !username
                            ? "Enter the WhatsApp username"
                            : /[@\s]/.test(username)
                              ? "Enter the username without @ or spaces"
                              : "",
                        }));
                      }}
                      error={errors.whatsappUsername}
                    />
                  </Field>
                </div>
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
              <label
                className="mt-3 inline-flex min-h-[44px] cursor-pointer items-center gap-3 text-sm"
                style={{ color: "var(--text-60)" }}
              >
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
                <h3
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-60)" }}
                >
                  Artist schedule <span aria-hidden="true">*</span>
                </h3>
                <p className="mt-1 text-xs" style={{ color: "var(--text-40)" }}>
                  Add every AAA artist for this event. Give a set duration, exact times, or leave
                  timing as TBC.
                </p>
              </div>

              {artistBookings.map((booking, index) => {
                const exactDuration =
                  booking.timingMode === "times"
                    ? calculateSetDuration(booking.startTime, booking.finishTime)
                    : "";
                const overlaps = overlapArtists.get(booking.id) ?? [];
                const expanded = expandedBookingIds.has(booking.id);
                const timingSummary =
                  booking.timingMode === "duration"
                    ? selectedDurationLabel(booking) || "Duration TBC"
                    : booking.startTime && booking.finishTime
                      ? `${booking.startTime}–${booking.finishTime}`
                      : "Exact times TBC";
                return (
                  <div
                    key={booking.id}
                    className="min-w-0 border p-3 sm:p-4 md:p-5"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}
                  >
                    <div
                      className={`flex min-h-[44px] items-center justify-between gap-2 ${expanded ? "mb-4" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleArtistBooking(booking.id)}
                        aria-expanded={expanded}
                        aria-controls={`artist-booking-${booking.id}`}
                        className="flex min-h-[44px] min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        <span className="min-w-0">
                          <span
                            className="block text-xs font-semibold uppercase tracking-widest"
                            style={{ color: "var(--text-40)" }}
                          >
                            Artist {index + 1}
                          </span>
                          <span
                            className="mt-1 block truncate text-sm"
                            style={{ color: "var(--text)" }}
                          >
                            {booking.artist || "Choose an artist"} · {timingSummary}
                          </span>
                        </span>
                        <svg
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 transition-transform duration-200"
                          style={{
                            color: "var(--text-40)",
                            transform: expanded ? "rotate(180deg)" : "none",
                          }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="m6 9 6 6 6-6"
                          />
                        </svg>
                      </button>
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

                    {expanded && (
                      <div id={`artist-booking-${booking.id}`}>
                        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                          <div className="sm:col-start-1 sm:row-start-1">
                            <Field
                              label="Artist"
                              required
                              error={errors[`booking-${booking.id}-artist`]}
                            >
                              <Select
                                name={`booking-${booking.id}-artist`}
                                value={booking.artist}
                                onChange={(event) =>
                                  updateArtistBooking(booking.id, "artist", event.target.value)
                                }
                                error={errors[`booking-${booking.id}-artist`]}
                              >
                                <option value="">Select an artist…</option>
                                {artistOptions.map((artist) => (
                                  <option
                                    key={artist.slug}
                                    value={artist.name}
                                    disabled={
                                      artist.name !== booking.artist &&
                                      selectedArtists.has(artist.name)
                                    }
                                  >
                                    {artist.name}
                                  </option>
                                ))}
                                <option
                                  value="Open to suggestions"
                                  disabled={
                                    booking.artist !== "Open to suggestions" &&
                                    selectedArtists.has("Open to suggestions")
                                  }
                                >
                                  Open to suggestions
                                </option>
                              </Select>
                            </Field>
                          </div>

                          <div className="sm:col-start-2 sm:row-start-1">
                            <fieldset aria-describedby={`booking-${booking.id}-timing-hint`}>
                              <legend
                                className="mb-1.5 text-xs font-semibold uppercase tracking-widest"
                                style={{ color: "var(--text-60)" }}
                              >
                                Timing
                              </legend>
                              <div className="grid grid-cols-2 gap-2">
                                {(
                                  [
                                    ["duration", "Duration only"],
                                    ["times", "Exact times"],
                                  ] as const
                                ).map(([value, label]) => (
                                  <label
                                    key={value}
                                    className="flex min-h-[44px] cursor-pointer items-center gap-2 border px-2 py-2 text-xs transition-colors duration-200 sm:px-3 sm:text-sm"
                                    style={{
                                      borderColor:
                                        booking.timingMode === value
                                          ? "var(--text)"
                                          : "var(--border)",
                                      backgroundColor:
                                        booking.timingMode === value
                                          ? "var(--surface)"
                                          : "transparent",
                                      color: "var(--text)",
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name={`booking-${booking.id}-timing-mode`}
                                      value={value}
                                      checked={booking.timingMode === value}
                                      onChange={(event) =>
                                        updateArtistBooking(
                                          booking.id,
                                          "timingMode",
                                          event.target.value
                                        )
                                      }
                                      className="h-4 w-4 shrink-0 accent-current"
                                    />
                                    <span>{label}</span>
                                  </label>
                                ))}
                              </div>
                              <p
                                id={`booking-${booking.id}-timing-hint`}
                                className="mt-1.5 text-xs"
                                style={{ color: "var(--text-40)" }}
                              >
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
                                    value={String(
                                      Math.floor(Number(booking.durationMinutes || "60") / 60)
                                    )}
                                    onChange={(event) =>
                                      updateArtistDurationPart(
                                        booking.id,
                                        "hours",
                                        event.target.value
                                      )
                                    }
                                    error={errors[`booking-${booking.id}-duration`]}
                                  >
                                    {DURATION_HOURS.map((hours) => (
                                      <option key={hours} value={hours}>
                                        {hours}
                                      </option>
                                    ))}
                                  </Select>
                                </Field>
                              </div>
                              <div className="sm:col-start-2 sm:row-start-2">
                                <Field label="Minutes">
                                  <Select
                                    name={`booking-${booking.id}-duration-minutes`}
                                    value={String(Number(booking.durationMinutes || "60") % 60)}
                                    onChange={(event) =>
                                      updateArtistDurationPart(
                                        booking.id,
                                        "minutes",
                                        event.target.value
                                      )
                                    }
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
                                <Field
                                  label="Start Time"
                                  error={errors[`booking-${booking.id}-start`]}
                                >
                                  <Input
                                    name={`booking-${booking.id}-start`}
                                    type="time"
                                    step={300}
                                    value={booking.startTime}
                                    onChange={(event) =>
                                      updateArtistBooking(
                                        booking.id,
                                        "startTime",
                                        event.target.value
                                      )
                                    }
                                    error={errors[`booking-${booking.id}-start`]}
                                  />
                                </Field>
                              </div>
                              <div className="sm:col-start-2 sm:row-start-2">
                                <Field
                                  label="Finish Time"
                                  error={errors[`booking-${booking.id}-finish`]}
                                >
                                  <Input
                                    name={`booking-${booking.id}-finish`}
                                    type="time"
                                    step={300}
                                    value={booking.finishTime}
                                    onChange={(event) =>
                                      updateArtistBooking(
                                        booking.id,
                                        "finishTime",
                                        event.target.value
                                      )
                                    }
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
                            style={{
                              borderColor: "var(--border)",
                              backgroundColor: "var(--surface)",
                            }}
                          >
                            <span
                              className="text-xs font-semibold uppercase tracking-widest"
                              style={{ color: "var(--text-40)" }}
                            >
                              Duration
                            </span>
                            <span
                              className="text-sm font-semibold text-right"
                              style={{ color: "var(--text)" }}
                            >
                              {exactDuration}
                            </span>
                          </div>
                        )}
                        {overlaps.length > 0 && (
                          <p
                            className="mt-3 text-xs"
                            role="status"
                            style={{ color: "var(--error)" }}
                          >
                            Time overlaps with {overlaps.join(", ")}. You can still submit if this
                            is intentional.
                          </p>
                        )}
                      </div>
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

        <Collapsible
          id="event"
          step="02"
          title="Event details (optional)"
          open={open.event}
          onToggle={() => toggle("event")}
          error={Boolean(
            errors.company ||
              errors.eventName ||
              errors.eventType ||
              errors.venue ||
              errors.city ||
              errors.country ||
              errors.capacity ||
              errors.ticketing
          )}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="Company / Promoter">
              <Input
                name="company"
                autoComplete="organization"
                maxLength={BOOKING_LIMITS.company}
                placeholder="Your venue, brand or agency"
                value={form.company}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.company}
              />
            </Field>
            <Field label="Event Name">
              <Input
                name="eventName"
                maxLength={BOOKING_LIMITS.eventName}
                placeholder="e.g. Saturday Sessions"
                value={form.eventName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.eventName}
              />
            </Field>
            <Field label="Event Type">
              <Select
                name="eventType"
                value={form.eventType}
                onChange={handleChange}
                error={errors.eventType}
              >
                <option value="">Select type…</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Venue / Location Name">
              <Input
                name="venue"
                maxLength={BOOKING_LIMITS.venue}
                placeholder="e.g. Fabric"
                value={form.venue}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.venue}
              />
            </Field>
            <Field label="Country" hint="Choose the country first to enable city suggestions">
              <CountryCombobox
                name="country"
                value={form.country}
                onChange={handleCountryChange}
                error={errors.country}
              />
            </Field>
            <Field label="City">
              <CityCombobox
                key={form.country || "no-country"}
                name="city"
                country={form.country}
                value={form.city}
                onChange={handleCityChange}
                maxLength={BOOKING_LIMITS.city}
                error={errors.city}
              />
            </Field>
            <Field label="Expected Capacity">
              <Select
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                error={errors.capacity}
              >
                <option value="">Select capacity…</option>
                {CAPACITY_RANGES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ticketing">
              <Select
                name="ticketing"
                value={form.ticketing}
                onChange={handleChange}
                error={errors.ticketing}
              >
                <option value="">Select…</option>
                {TICKETING_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Collapsible>

        <Collapsible
          id="budget"
          step="03"
          title="Budget & extras (optional)"
          open={open.budget}
          onToggle={() => toggle("budget")}
          error={Boolean(errors.budgetRange || errors.lineup || errors.hearAbout)}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="Budget / Fee Offer" hint="A rough range helps us reply faster">
              <Select
                name="budgetRange"
                value={form.budgetRange}
                onChange={handleChange}
                error={errors.budgetRange}
              >
                <option value="">Select a range…</option>
                {BUDGET_RANGES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
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
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="How Did You Hear About Us?">
              <Select
                name="hearAbout"
                value={form.hearAbout}
                onChange={handleChange}
                error={errors.hearAbout}
              >
                <option value="">Select…</option>
                {HEAR_ABOUT_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Other / External Artists on the Bill">
              <Input
                name="lineup"
                maxLength={BOOKING_LIMITS.lineup}
                placeholder="Anyone else playing alongside?"
                value={form.lineup}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.lineup}
              />
            </Field>
          </div>
        </Collapsible>

        <Collapsible
          id="message"
          step="04"
          title="Anything else (optional)"
          open={open.message}
          onToggle={() => toggle("message")}
        >
          <Field label="Message">
            <textarea
              name="message"
              rows={5}
              maxLength={BOOKING_LIMITS.message}
              placeholder="Tell us about the event, the crowd, timings, and anything else that helps us quote accurately…"
              value={form.message}
              onChange={handleChange}
              className="w-full min-w-0 max-w-full resize-none border px-4 py-3 text-base outline-none"
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
        <TurnstileWidget key={turnstileVersion} siteKey={TURNSTILE_SITE_KEY} />
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
        </div>
        {sendError && (
          <p
            className="mt-4 text-xs"
            role="alert"
            aria-live="assertive"
            style={{ color: "var(--error)" }}
          >
            {sendError}
          </p>
        )}
        <p className="mt-4 text-xs" style={{ color: "var(--text-30)" }}>
          AAA Artists uses your details to respond to and manage this booking enquiry. We will email
          you a copy so you can reply in the same booking thread. Delivery is handled by Brevo. Read
          our{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            privacy notice
          </Link>
          . We aim to respond within 48 hours.
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
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left transition-all sm:px-5"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <span className="flex items-center gap-3">
            {step && (
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ color: "var(--text-30)" }}
              >
                {step}
              </span>
            )}
            <span
              className="text-sm font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-60)" }}
            >
              {title}
            </span>
            {error && (
              <span
                className="text-xs font-normal normal-case tracking-normal"
                style={{ color: "var(--error)" }}
              >
                Needs attention
              </span>
            )}
          </span>
          <svg
            aria-hidden="true"
            className="h-5 w-5 shrink-0 transition-transform duration-300"
            style={{ color: "var(--text-40)", transform: open ? "rotate(45deg)" : "none" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </h2>
      {open && (
        <div
          id={contentId}
          className="min-w-0 space-y-6 border-t p-4 sm:p-5 md:p-6"
          style={{ borderColor: "var(--border)" }}
        >
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
  className = "",
  style,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      {...rest}
      className={`w-full min-w-0 max-w-full border px-4 py-3 text-base outline-none transition-all ${className}`}
      style={{
        borderColor: error ? "var(--error)" : "var(--border)",
        backgroundColor: "var(--surface)",
        color: "var(--text)",
        ...style,
      }}
    />
  );
}

function UsernameInput({
  error,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div
      className="flex min-w-0 max-w-full items-center border focus-within:outline focus-within:outline-2 focus-within:outline-offset-2"
      style={{
        borderColor: error ? "var(--error)" : "var(--border)",
        backgroundColor: "var(--surface)",
        color: "var(--text)",
      }}
    >
      <span aria-hidden="true" className="pl-4 text-base" style={{ color: "var(--text-40)" }}>
        @
      </span>
      <input
        {...rest}
        className="min-w-0 flex-1 border-0 bg-transparent px-2 py-3 text-base outline-none"
      />
    </div>
  );
}

// A single inline completion replaces the native datalist. It appears once the
// visitor starts the domain, so iPhone users get help without an assumed provider
// or a popup covering the fields below. OS saved-email autofill remains available.
function EmailField({
  value,
  onChange,
  onComplete,
  onBlur,
  error,
  regionHint,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  regionHint?: string;
  onComplete: (email: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [localeRegion] = useState(browserLocaleRegion);
  const suggestionsId = useId();
  const suggestionsStatusId = useId();
  const completions = emailCompletions(
    String(value ?? ""),
    regionHint?.toUpperCase() || localeRegion
  );
  const inheritedDescribedBy = rest["aria-describedby"];
  const describedBy =
    [inheritedDescribedBy, completions.length > 0 ? suggestionsStatusId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  const visibleCompletions = showAll
    ? completions
    : completions.slice(0, VISIBLE_EMAIL_COMPLETIONS);
  const hiddenCompletionCount = completions.length - visibleCompletions.length;
  return (
    <div className="min-w-0">
      <input
        {...rest}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="jane@example.com"
        value={value}
        aria-controls={completions.length > 0 ? suggestionsId : undefined}
        aria-describedby={describedBy}
        onChange={(event) => {
          setShowAll(false);
          onChange?.(event);
        }}
        onBlur={onBlur}
        className="w-full min-w-0 max-w-full border px-4 py-3 text-base outline-none transition-all"
        style={{
          borderColor: error ? "var(--error)" : "var(--border)",
          backgroundColor: "var(--surface)",
          color: "var(--text)",
        }}
      />
      <div>
        {completions.length > 0 && (
          <div
            className="border border-t-0 p-3"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}
          >
            <p
              id={suggestionsStatusId}
              className="text-xs font-medium"
              aria-live="polite"
              style={{ color: "var(--text-60)" }}
            >
              Add email domain
            </p>
            <fieldset
              id={suggestionsId}
              className={`mt-2 flex min-w-0 flex-wrap gap-2 border-0 p-0 ${showAll ? "max-h-64 overflow-y-auto overscroll-contain pr-1" : ""}`}
            >
              <legend className="sr-only">Email domain suggestions</legend>
              {visibleCompletions.map((completion, index) => (
                <button
                  key={completion.domain}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setShowAll(false);
                    onComplete(completion.email);
                  }}
                  className="min-h-[44px] cursor-pointer border px-3 py-2 text-sm font-semibold transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    borderColor: index === 0 ? "var(--text)" : "var(--border)",
                    backgroundColor: index === 0 ? "var(--text)" : "var(--surface)",
                    color: index === 0 ? "var(--bg)" : "var(--text)",
                  }}
                  aria-label={`Complete email as ${completion.email}`}
                >
                  @{completion.domain}
                </button>
              ))}
              {hiddenCompletionCount > 0 && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setShowAll(true)}
                  aria-expanded={false}
                  aria-controls={suggestionsId}
                  className="min-h-[44px] cursor-pointer border px-3 py-2 text-sm font-semibold transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--bg)",
                    color: "var(--text-60)",
                  }}
                >
                  +{hiddenCompletionCount} more
                </button>
              )}
              {showAll && completions.length > VISIBLE_EMAIL_COMPLETIONS && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setShowAll(false)}
                  aria-expanded="true"
                  aria-controls={suggestionsId}
                  className="min-h-[44px] cursor-pointer border px-3 py-2 text-sm font-semibold transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--bg)",
                    color: "var(--text-60)",
                  }}
                >
                  Show fewer
                </button>
              )}
            </fieldset>
          </div>
        )}
      </div>
    </div>
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
      className="min-h-[50px] min-w-0 max-w-full border px-4 py-3 text-base outline-none disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        borderColor: error ? "var(--error)" : "var(--border)",
        backgroundColor: "var(--surface)",
        color: "var(--text)",
      }}
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
  const controlId = `${id}-control`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id: controlId,
        "aria-required": required || undefined,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : hint ? hintId : undefined,
      })
    : children;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={controlId}
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-60)" }}
      >
        {label}
        {required && (
          <span className="ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {control}
      {hint && !error && (
        <span id={hintId} className="text-xs" style={{ color: "var(--text-40)" }}>
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="text-xs" role="alert" style={{ color: "var(--error)" }}>
          {error}
        </span>
      )}
    </div>
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
      <svg
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}

export default function ContactView({ artistOptions }: { artistOptions: ArtistOption[] }) {
  return (
    <div
      className="min-h-screen px-4 py-20 sm:px-6 sm:py-24"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="mx-auto max-w-3xl">
        <Suspense>
          <BackLink artistOptions={artistOptions} />
        </Suspense>
        <div className="mb-12">
          <p
            className="mb-3 text-sm font-semibold uppercase tracking-[0.4em]"
            style={{ color: "var(--text-30)" }}
          >
            AAA Artists
          </p>
          <h1
            className="mb-4 text-4xl font-bold tracking-tight md:text-5xl"
            style={{ color: "var(--text)" }}
          >
            Book Artists
          </h1>
          <p className="max-w-xl text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
            Start with your name, email, one or more artists, and the event date—or mark the date as
            not confirmed. Everything else is optional, but a fuller brief helps us reply faster.
          </p>
        </div>

        <div
          className="sm:border sm:p-8 md:p-12"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}
        >
          <Suspense>
            <ContactForm artistOptions={artistOptions} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
