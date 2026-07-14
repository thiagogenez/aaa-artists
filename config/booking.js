// Validation rules shared by the browser and first-party booking Worker.
export const BOOKING_LIMITS = Object.freeze({
  bodyBytes: 64 * 1024,
  artists: 12,
  name: 100,
  email: 254,
  company: 120,
  phone: 32,
  whatsappUsername: 65,
  whatsappUsernameKey: 64,
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

export const DURATION_VALUES = Object.freeze(
  DURATION_HOURS.flatMap((hours) => DURATION_MINUTES.map((minutes) => String(hours * 60 + minutes))),
);

export function formatDuration(total) {
  const minutes = Number(total);
  if (!Number.isInteger(minutes) || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [
    hours ? `${hours} ${hours === 1 ? "hour" : "hours"}` : "",
    remainder ? `${remainder} ${remainder === 1 ? "minute" : "minutes"}` : "",
  ].filter(Boolean).join(" ");
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
