const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Deterministically formats dates to '15 Oct 2026' without timezone conversion
 * or locale differences, completely preventing React hydration error #418.
 */
export function formatDeterministicDate(value: string | null | undefined): string {
  if (!value) return "—";
  const clean = value.split("T")[0].trim();
  const parts = clean.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
      return `${day} ${MONTH_NAMES[monthIndex]} ${year}`;
    }
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Normalizes two-digit year departure month labels into clear 4-digit years.
 * e.g. "January 27" -> "January 2027", "October 26" -> "October 2026".
 * This prevents search engines and users from reading the year as a day-of-month.
 */
export function formatDepartureMonthName(label: string | null | undefined): string {
  if (!label) return "";
  return label.replace(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{2})\b/gi,
    (match, month, year) => `${month} 20${year}`
  );
}
