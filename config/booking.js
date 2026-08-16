// Validation rules shared by the browser and first-party booking Worker.
export const BOOKING_LIMITS = Object.freeze({
  bodyBytes: 64 * 1024,
  artists: 12,
  name: 100,
  email: 254,
  company: 120,
  phone: 32,
  whatsappUsername: 65,
  submissionId: 36,
  artist: 80,
  eventName: 120,
  eventType: 80,
  venue: 120,
  city: 80,
  country: 80,
  capacity: 40,
  ticketing: 40,
  currency: 3,
  budgetRange: 40,
  lineup: 500,
  hearAbout: 80,
  message: 4000,
});

export const DURATION_HOURS = Object.freeze([1, 2, 3, 4, 5, 6]);
export const DURATION_MINUTES = Object.freeze([0, 15, 30, 45]);
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

// Electronic-music contexts only — the roster plays club, festival and rave
// bookings, so social-function types (weddings, corporate, bar/lounge) are not
// offered.
export const EVENT_TYPES = Object.freeze([
  "Club Night",
  "Festival",
  "Open Air / Day Party",
  "Other",
]);
export const TICKETING_OPTIONS = Object.freeze(["Ticketed", "Free entry", "Private / guestlist"]);
export const HEAR_ABOUT_OPTIONS = Object.freeze([
  "Instagram",
  "SoundCloud / YouTube",
  "Google search",
  "Personal referral",
  "Booked with us before",
  "Other",
]);
export const CAPACITY_RANGES = Object.freeze([
  "Under 100",
  "100-300",
  "300-500",
  "500-1,000",
  "1,000-3,000",
  "3,000-5,000",
  "5,000-10,000",
  "10,000+",
]);
export const CURRENCY_CODES = Object.freeze(["GBP", "EUR", "USD"]);
export const BUDGET_RANGES = Object.freeze([
  "Under 1,000",
  "1,000-2,500",
  "2,500-5,000",
  "5,000-10,000",
  "10,000-25,000",
  "25,000-50,000",
  "50,000+",
  "Prefer to discuss",
]);

export const DURATION_VALUES = Object.freeze(
  DURATION_HOURS.flatMap((hours) => DURATION_MINUTES.map((minutes) => String(hours * 60 + minutes)))
);

export function formatDuration(total) {
  const minutes = Number(total);
  if (!Number.isInteger(minutes) || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [
    hours ? `${hours} ${hours === 1 ? "hour" : "hours"}` : "",
    remainder ? `${remainder} ${remainder === 1 ? "minute" : "minutes"}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function durationBetween(start, finish) {
  if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(finish) || start === finish) return "";
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [finishHours, finishMinutes] = finish.split(":").map(Number);
  const startTotal = startHours * 60 + startMinutes;
  const finishTotal = finishHours * 60 + finishMinutes;
  const crossesMidnight = finishTotal < startTotal;
  const duration = formatDuration(finishTotal - startTotal + (crossesMidnight ? 1440 : 0));
  return `${duration}${crossesMidnight ? " · finishes next day" : ""}`;
}
