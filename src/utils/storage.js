const STORAGE_KEY = "todos";

/** Key under which the gamified user profile is persisted. */
const PROFILE_STORAGE_KEY = "gamify.user";

const MAX_TITLE_LENGTH = 200;

/**
 * Validates a single todo item.
 * Returns true only if the item has a valid shape: a string id,
 * a non-empty string title, and a boolean completed flag.
 */
function isValidTodo(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    typeof item.completed === "boolean"
  );
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
    return parsed.filter(isValidTodo);
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
  };
}

/** Returns true when the value is a plain, non-null object. */
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Returns true when the value is a non-negative finite number. */
function isNonNegativeNumber(value) {
  return Number.isFinite(value) && value >= 0 && typeof value === "number";
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
