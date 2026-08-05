import { getTodayKey, getYesterdayKey } from "../utils/date.js";

/**
 * Streak domain logic. Owns no storage writes itself — it reads the
 * profile (single source of truth) and computes derived streak
 * status for the UI. Day completion is delegated to the provided
 * callback so a single owner updates the profile.
 *
 * Derived state:
 * - currentStreak / bestStreak from the profile
 * - canCompleteToday    the day hasn't been completed yet today
 * - isStreakBroken      last completed day is older than yesterday
 * - showStreakWarning   yesterday was missed but today can still save it
 * - isNewRecord         today's completion would set a new best
 */
export default function useStreak(profile, registerDayCompleted) {
  const today = getTodayKey();
  const yesterday = getYesterdayKey();

  const lastCompletedDay = profile?.lastCompletedDay ?? null;
  const currentStreak = profile?.currentStreak ?? 0;
  const bestStreak = profile?.bestStreak ?? 0;

  /** True when the day hasn't been completed yet today. */
  const canCompleteToday = lastCompletedDay !== today;

  /** True when the last completed day is before yesterday. */
  const isStreakBroken =
    lastCompletedDay !== null &&
    lastCompletedDay !== today &&
    lastCompletedDay !== yesterday;

  /** True when yesterday was missed but today can still save it. */
  const showStreakWarning = canCompleteToday && lastCompletedDay === yesterday;

  /** True when completing today would beat the best streak. */
  const isNewRecord = canCompleteToday && currentStreak + 1 > bestStreak;

  /** Registers today as a completed day (delegates to the caller). */
  function completeToday() {
    if (canCompleteToday) {
      registerDayCompleted();
    }
  }

  return {
    currentStreak,
    bestStreak,
    lastCompletedDay,
    canCompleteToday,
    isStreakBroken,
    showStreakWarning,
    isNewRecord,
    completeToday,
  };
}
