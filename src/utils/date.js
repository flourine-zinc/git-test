/**
 * Local-timezone date helpers. All date keys use the local calendar
 * (not UTC) so daily resets happen at the user's midnight.
 */

/** Returns "YYYY-MM-DD" for the given date (defaults to now). */
export function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Returns "YYYY-MM-DD" for today, in the local timezone. */
export function getTodayKey() {
  return getDateKey();
}

/** Returns "YYYY-MM-DD" for yesterday, in the local timezone. */
export function getYesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return getDateKey(date);
}
