import { getXpForPriority } from "./gameMath.js";

const STORAGE_KEY = "todos";

/**
 * Schema version for all persisted data. Bump when the data shape
 * changes; `ensureStorageVersion` runs any needed migrations at
 * app boot so old saves keep working.
 */
export const STORAGE_VERSION = 2;

/** Key under which the storage schema version is persisted. */
const STORAGE_VERSION_KEY = "gamify.storageVersion";

/**
 * True when localStorage can be read and written (private mode,
 * sandboxed iframes, and disabled storage return false).
 */
export function isStorageAvailable() {
  try {
    const testKey = "__quest_log_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures the storage schema version is persisted and runs any
 * migrations needed for older saves. All loaders already normalize
 * legacy shapes, so the version marker primarily documents the
 * schema and reserves a hook for future migrations.
 */
export function ensureStorageVersion() {
  if (!isStorageAvailable()) {
    return false;
  }
  try {
    const storedVersion = Number(
      window.localStorage.getItem(STORAGE_VERSION_KEY),
    );
    if (!Number.isFinite(storedVersion) || storedVersion < STORAGE_VERSION) {
      // Future migrations go here, keyed off the old version.
      window.localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
    }
    return true;
  } catch {
    return false;
  }
}

/** Key under which the gamified user profile is persisted. */
const PROFILE_STORAGE_KEY = "gamify.user";

/** Key under which today's daily mission progress is persisted. */
const DAILY_MISSIONS_STORAGE_KEY = "gamify.dailyMissions";

/** Key under which completed focus sessions are persisted. */
const FOCUS_SESSIONS_STORAGE_KEY = "gamify.focusSessions";

/** Key under which unlocked achievements are persisted. */
const ACHIEVEMENTS_STORAGE_KEY = "gamify.achievements";

const MAX_TITLE_LENGTH = 200;

/** Valid priority values. */
const PRIORITIES = new Set(["low", "medium", "high", "critical"]);

/** Valid category values. */
const CATEGORIES = new Set([
  "coding",
  "study",
  "exercise",
  "personal",
  "learning",
]);

/** Validates the item has a valid priority (or none stored yet). */
function hasValidPriority(item) {
  return item.priority === undefined || PRIORITIES.has(item.priority);
}

/** Validates the item has a valid category (or none stored yet). */
function hasValidCategory(item) {
  return item.category === undefined || CATEGORIES.has(item.category);
}

/**
 * Validates a single todo item.
 * Returns true only if the item has a valid shape: a string id,
 * a non-empty string title, a boolean completed flag, and, when
 * present, a valid priority/category.
 */
function isValidTodo(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    typeof item.completed === "boolean" &&
    hasValidPriority(item) &&
    hasValidCategory(item)
  );
}

/** Returns true when the value is a non-negative finite number. */
function isNonNegativeNumber(value) {
  return Number.isFinite(value) && value >= 0 && typeof value === "number";
}

/** Returns true when the value is a positive finite number. */
function isPositiveNumber(value) {
  return Number.isFinite(value) && value > 0 && typeof value === "number";
}

/** Returns true when the value is a valid timestamp (number > 0). */
function isTimestamp(value) {
  return isPositiveNumber(value);
}

/** Returns true when the value is a plain object. */
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Fills in gamification fields for an existing todo so older saved
 * data keeps working without a manual migration. Unknown values fall
 * back to safe defaults.
 */
function normalizeTodo(item) {
  const { priority = "medium", category = "personal" } = item;
  return {
    id: item.id,
    title: item.title,
    completed: item.completed,
    priority,
    category,
    xpReward: getXpForPriority(priority),
    createdAt: isTimestamp(item.createdAt) ? item.createdAt : Date.now(),
    updatedAt: isTimestamp(item.updatedAt) ? item.updatedAt : Date.now(),
    completedAt: isTimestamp(item.completedAt) ? item.completedAt : null,
  };
}

/**
 * Reads todos from localStorage.
 * Returns an empty array when nothing is stored or when the stored
 * data is malformed, so invalid data never breaks the app.
 */
export function loadTodos() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidTodo).map(normalizeTodo);
  } catch {
    return [];
  }
}

/**
 * Saves todos to localStorage.
 */
export function saveTodos(todos) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // localStorage can fail (private mode, quota). The app keeps
    // working in memory; persistence is best-effort.
  }
}

/**
 * Validates a task title.
 * Returns an error message string, or null when the title is valid.
 */
export function validateTitle(title) {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return "Task cannot be empty.";
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return `Task cannot be longer than ${MAX_TITLE_LENGTH} characters.`;
  }
  return null;
}

/* ===== Player Profile Persistence ===== */

/** Returns a fresh profile with sensible starting values. */
export function createDefaultProfile() {
  return {
    level: 1,
    xp: 0,
    totalCompletedTasks: 0,
    totalFocusMinutes: 0,
    rank: "Beginner",
    currentStreak: 0,
    bestStreak: 0,
    lastCompletedDay: null,
  };
}

/**
 * Validates a stored profile object. Unknown or malformed fields
 * fall back to defaults so old or corrupt data never breaks the app.
 */
function normalizeProfile(profile) {
  if (!isObject(profile)) {
    return createDefaultProfile();
  }
  return {
    level: isNonNegativeNumber(profile.level) ? Math.floor(profile.level) : 1,
    xp: isNonNegativeNumber(profile.xp) ? profile.xp : 0,
    totalCompletedTasks: isNonNegativeNumber(profile.totalCompletedTasks)
      ? Math.floor(profile.totalCompletedTasks)
      : 0,
    totalFocusMinutes: isNonNegativeNumber(profile.totalFocusMinutes)
      ? profile.totalFocusMinutes
      : 0,
    rank: typeof profile.rank === "string" ? profile.rank : "Beginner",
    currentStreak: isNonNegativeNumber(profile.currentStreak)
      ? Math.floor(profile.currentStreak)
      : 0,
    bestStreak: isNonNegativeNumber(profile.bestStreak)
      ? Math.floor(profile.bestStreak)
      : 0,
    lastCompletedDay:
      typeof profile.lastCompletedDay === "string"
        ? profile.lastCompletedDay
        : null,
  };
}

/**
 * Reads the player profile from localStorage.
 * Returns a default profile when nothing is stored or the stored
 * data is malformed.
 */
export function loadProfile() {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw === null) {
      return createDefaultProfile();
    }
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return createDefaultProfile();
  }
}

/**
 * Saves the player profile to localStorage.
 * Persistence is best-effort, matching the todo behavior.
 */
export function saveProfile(profile) {
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage can fail (private mode, quota). The app keeps
    // working in memory; persistence is best-effort.
  }
}

/* ===== Daily Missions Persistence ===== */

/**
 * Validates a daily mission and fills in missing fields.
 * Returns null when the mission is malformed beyond repair.
 */
function normalizeMission(mission) {
  if (!isObject(mission)) {
    return null;
  }
  const progress = isNonNegativeNumber(mission.progress)
    ? Math.floor(mission.progress)
    : 0;
  const target = isPositiveNumber(mission.target)
    ? Math.floor(mission.target)
    : 1;
  return {
    id: typeof mission.id === "string" ? mission.id : "",
    type: typeof mission.type === "string" ? mission.type : "",
    target,
    progress,
    completed:
      typeof mission.completed === "boolean" ? mission.completed : false,
  };
}

/** Validates a stored daily-mission state. */
function normalizeDailyState(state) {
  if (!isObject(state) || typeof state.date !== "string") {
    return null;
  }
  const missions = Array.isArray(state.missions)
    ? state.missions.map(normalizeMission).filter(Boolean)
    : [];
  return { date: state.date, missions };
}

/**
 * Reads daily mission progress from localStorage.
 * Returns a default zero-progress state for the given date when
 * nothing is stored or the stored data is malformed.
 */
export function loadDailyMissions(dateKey) {
  try {
    const raw = window.localStorage.getItem(DAILY_MISSIONS_STORAGE_KEY);
    if (raw === null) {
      return { date: dateKey, missions: [] };
    }
    const state = normalizeDailyState(JSON.parse(raw));
    if (!state || state.date !== dateKey) {
      // Stored state belongs to an older day (or is corrupt):
      // treat it as a fresh day.
      return { date: dateKey, missions: [] };
    }
    return state;
  } catch {
    return { date: dateKey, missions: [] };
  }
}

/** Saves daily mission progress to localStorage. */
export function saveDailyMissions(state) {
  try {
    window.localStorage.setItem(
      DAILY_MISSIONS_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch {
    // best-effort persistence
  }
}

/* ===== Focus Sessions Persistence ===== */

/**
 * Validates a focus session and fills in missing fields.
 * Returns null when the session is malformed beyond repair.
 */
function normalizeFocusSession(session) {
  if (
    !isObject(session) ||
    typeof session.id !== "string" ||
    !isTimestamp(session.startedAt) ||
    !isTimestamp(session.endedAt) ||
    !isPositiveNumber(session.durationMinutes)
  ) {
    return null;
  }
  return {
    id: session.id,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationMinutes: session.durationMinutes,
  };
}

/** Reads completed focus sessions from localStorage. */
export function loadFocusSessions() {
  try {
    const raw = window.localStorage.getItem(FOCUS_SESSIONS_STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeFocusSession).filter(Boolean);
  } catch {
    return [];
  }
}

/** Saves focus sessions to localStorage. */
export function saveFocusSessions(sessions) {
  try {
    window.localStorage.setItem(
      FOCUS_SESSIONS_STORAGE_KEY,
      JSON.stringify(sessions),
    );
  } catch {
    // best-effort persistence
  }
}

/* ===== Achievements Persistence ===== */

/** Reads unlocked achievement ids from localStorage. */
export function loadAchievements() {
  try {
    const raw = window.localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const unique = new Set();
    for (const id of parsed) {
      if (typeof id === "string" && id.length > 0) {
        unique.add(id);
      }
    }
    return Array.from(unique);
  } catch {
    return [];
  }
}

/** Saves unlocked achievement ids to localStorage. */
export function saveAchievements(ids) {
  try {
    window.localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // best-effort persistence
  }
}
