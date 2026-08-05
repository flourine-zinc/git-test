const STORAGE_KEY = "todos";

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
