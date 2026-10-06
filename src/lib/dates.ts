const DAY = 24 * 60 * 60 * 1000;

export function drawMonth(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** The draw runs on the last day of each month. */
export function drawDate(month = drawMonth()) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0);
}

export function endOfMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0, 23, 59, 59);
}

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Final balance is due 30 days before departure. */
export function finalBalanceDate(departure: Date) {
  return new Date(departure.getTime() - 30 * DAY);
}

export function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * DAY);
}

export function addMonths(d: Date, n: number) {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

export function longDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function shortDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Academic terms for the termly draw. Placeholder dates: real ones vary by uni,
// so set them per year. Breaks roll into the next term.
export const TERMS = [
  { key: "2026-autumn", label: "Autumn term", end: "2026-12-11" },
  { key: "2027-spring", label: "Spring term", end: "2027-03-26" },
  { key: "2027-summer", label: "Summer term", end: "2027-06-11" },
] as const;

export function termFor(d = new Date()) {
  return TERMS.find((t) => d <= new Date(`${t.end}T23:59:59`)) ?? TERMS[TERMS.length - 1];
}

export function termByKey(key: string) {
  return TERMS.find((t) => t.key === key) ?? TERMS[0];
}

export function termDrawDate(key: string) {
  return new Date(`${termByKey(key).end}T12:00:00`);
}

/** Monday 00:00 of this week: story shares are capped at one a week. */
export function weekStart(d = new Date()) {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}

export function daysUntil(d: Date, from = new Date()) {
  return Math.max(0, Math.ceil((d.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)));
}
