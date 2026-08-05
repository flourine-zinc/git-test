/**
 * Pure gameplay math: XP, levels, ranks, priorities, and formatting.
 * These functions have no UI or storage dependencies so they can
 * be reused and unit-tested in isolation.
 */

/** XP required to advance one level. */
export const XP_PER_LEVEL = 100;

/** XP rewarded per minute of a completed focus session. */
export const FOCUS_XP_PER_MINUTE = 1;

/** XP reward by task priority. */
export const PRIORITY_XP = {
  low: 10,
  medium: 25,
  high: 50,
  critical: 100,
};

/** Default XP used when a todo has no stored reward. */
export const DEFAULT_TASK_XP = PRIORITY_XP.medium;

/**
 * Rank thresholds by accumulated focus time (in minutes).
 * Sorted ascending — the highest threshold reached wins.
 * Milestones follow the mastery rules: 0h / 50h / 100h / 250h / 500h / 1000h.
 */
export const RANKS = [
  { title: "Beginner", minMinutes: 0 },
  { title: "Apprentice", minMinutes: 50 * 60 },
  { title: "Disciplined", minMinutes: 100 * 60 },
  { title: "Elite", minMinutes: 250 * 60 },
  { title: "Master", minMinutes: 500 * 60 },
  { title: "Legendary", minMinutes: 1000 * 60 },
];

/** Sanitizes a numeric input to a non-negative finite number. */
function toSafeNumber(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Returns the numeric level for a given amount of XP. */
export function calculateLevel(xp) {
  const safeXp = toSafeNumber(xp);
  return Math.floor(safeXp / XP_PER_LEVEL) + 1;
}

/**
 * Returns details about the current level and progress toward
 * the next one.
 */
export function getLevelInfo(xp) {
  const safeXp = toSafeNumber(xp);
  const level = calculateLevel(safeXp);
  const currentLevelXp = safeXp % XP_PER_LEVEL;
  return {
    level,
    currentLevelXp,
    xpForNextLevel: XP_PER_LEVEL,
    progressPercent: Math.min(
      100,
      Math.floor((currentLevelXp / XP_PER_LEVEL) * 100),
    ),
  };
}

/** Returns the XP reward for a given priority. */
export function getXpForPriority(priority) {
  return PRIORITY_XP[priority] ?? DEFAULT_TASK_XP;
}

/** Returns the rank title for a given total of focus minutes. */
export function calculateRank(totalFocusMinutes) {
  const safeMinutes = toSafeNumber(totalFocusMinutes);
  let rank = RANKS[0].title;
  for (const candidate of RANKS) {
    if (safeMinutes >= candidate.minMinutes) {
      rank = candidate.title;
    } else {
      break;
    }
  }
  return rank;
}

/**
 * Returns the current rank, the next rank to unlock, and progress
 * toward it. Returns 100% progress when the highest rank is reached.
 */
export function getRankInfo(totalFocusMinutes) {
  const safeMinutes = toSafeNumber(totalFocusMinutes);
  let currentIndex = 0;
  for (let i = 0; i < RANKS.length; i += 1) {
    if (safeMinutes >= RANKS[i].minMinutes) {
      currentIndex = i;
    }
  }

  const rank = RANKS[currentIndex];
  const nextRank = RANKS[currentIndex + 1] ?? null;
  const minutesToNext = nextRank
    ? Math.max(0, nextRank.minMinutes - safeMinutes)
    : 0;
  const span = nextRank ? nextRank.minMinutes - rank.minMinutes : 1;
  const progressPercent = nextRank
    ? Math.min(100, Math.floor(((safeMinutes - rank.minMinutes) / span) * 100))
    : 100;

  return { rank, nextRank, minutesToNext, progressPercent };
}

/**
 * Adds XP to a profile and returns a new profile object with an
 * updated level. Does not mutate the input.
 */
export function addXp(profile, amount) {
  const safeAmount = toSafeNumber(amount);
  const xp = Math.max(0, (profile.xp ?? 0) + safeAmount);
  return { ...profile, xp, level: calculateLevel(xp) };
}

/** Formats minutes as "Xh Ym" (e.g. 155 -> "2h 35m"). */
export function formatMinutes(minutes) {
  const safeMinutes = Math.max(
    0,
    Math.round(Number.isFinite(minutes) ? minutes : 0),
  );
  const hours = Math.floor(safeMinutes / 60);
  const remaining = safeMinutes % 60;
  if (hours === 0) {
    return `${remaining}m`;
  }
  if (remaining === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remaining}m`;
}

/** Formats seconds as "MM:SS" (e.g. 305 -> "05:05"). */
export function formatSeconds(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}`;
}
