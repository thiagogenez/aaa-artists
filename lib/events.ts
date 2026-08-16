export function isExactEventDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function isUpcomingEventDate(date: string, today: string): boolean {
  return isExactEventDate(date) ? date >= today : date >= today.slice(0, 7);
}

export function formatEventDate(date: string): string {
  if (!isExactEventDate(date)) {
    return `${new Date(`${date}-01T00:00:00Z`).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })} · exact date TBC`;
  }
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function eventDateBadge(date: string): { day: string; month: string } {
  const parsed = new Date(`${date}${isExactEventDate(date) ? "" : "-01"}T00:00:00Z`);
  return {
    day: isExactEventDate(date)
      ? parsed.toLocaleDateString("en-GB", { day: "numeric", timeZone: "UTC" })
      : "TBC",
    month: parsed.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }).toUpperCase(),
  };
}
