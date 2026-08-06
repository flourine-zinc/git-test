/**
 * Minimal API client for the Quest Log backend.
 * Cookies (httpOnly session) are sent/required for all protected routes.
 *
 * The session cookie is set by the API origin itself (localhost:4000 in dev),
 * so all requests go straight to the backend with credentials included
 * (same-site → SameSite=Lax cookies are attached; CORS allowlists the app origin).
 */

// Production backend — used whenever no real override is configured.
const PROD_API_URL = "https://git-test-vnpu.onrender.com/api/v1";

/**
 * Dev-only fallback URL.
 *
 * `import.meta.env.DEV` is statically replaced (true/false) by Vite at build
 * time, so in a production build this constant is constant-folded to
 * PROD_API_URL and the "localhost:4000" literal is erased from the bundle.
 * This guarantees the deployed frontend can never contain a localhost API URL,
 * even when a developer accidentally builds with a stale local .env.
 */
const DEV_API_URL = import.meta.env.DEV
  ? "http://localhost:4000/api/v1"
  : PROD_API_URL;

/**
 * Resolve the API base URL.
 *
 * Development:
 *   - VITE_API_URL wins if provided (e.g. a remote/staging backend).
 *   - Otherwise falls back to the local dev server (localhost:4000).
 *
 * Production:
 *   - A real, non-local VITE_API_URL override is honored.
 *   - A localhost/127.0.0.1 override is ALWAYS rejected (a misconfigured
 *     VITE_API_URL copied from a dev environment must never point production
 *     users at their own machine).
 *   - Defaults to the deployed Render backend.
 */
function resolveBaseUrl() {
  const configured = String(import.meta.env.VITE_API_URL || "")
    .trim()
    .replace(/\/+$/, "");

  if (import.meta.env.PROD) {
    const isLocalHost =
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(configured);

    if (configured && !isLocalHost) return configured;
    return PROD_API_URL;
  }

  return configured || DEV_API_URL;
}

const BASE_URL = resolveBaseUrl();

async function request(path, options = {}) {
  // TEMPORARY auth diagnostics — remove after production debugging is done.
  const isAuthReq = path === "/auth/me" || path === "/auth/logout";
  if (isAuthReq) {
    console.debug(
      "[api] REQUEST",
      path,
      "credentials=include origin=",
      window.location.origin,
      "api=",
      BASE_URL,
    );
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (isAuthReq) {
    console.debug("[api] RESPONSE", path, response.status, response.url);
  }

  // 204 / empty responses
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      body?.error?.message || `Request failed (${response.status})`,
    );
    error.status = response.status;
    error.body = body;
    throw error;
  }

  // Success envelope: { success, message, data }
  return body?.data ?? body;
}

export const api = {
  // Auth
  getMe() {
    return request("/auth/me");
  },
  logout() {
    return request("/auth/logout", { method: "POST" });
  },
  loginUrl() {
    return `${BASE_URL}/auth/google`;
  },

  // Todos
  getTodos() {
    return request("/todos");
  },
  createTodo(payload) {
    return request("/todos", { method: "POST", body: JSON.stringify(payload) });
  },
  updateTodo(id, payload) {
    return request(`/todos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteTodo(id) {
    return request(`/todos/${id}`, { method: "DELETE" });
  },
  toggleTodo(id) {
    return request(`/todos/${id}/toggle`, { method: "PATCH" });
  },

  // Focus
  getFocusSessions() {
    return request("/focus");
  },
  createFocusSession(payload) {
    return request("/focus", { method: "POST", body: JSON.stringify(payload) });
  },

  // Missions
  getTodayMissions() {
    return request("/missions/today");
  },
  updateMissionProgress(payload) {
    return request("/missions/progress", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Achievements
  getAchievements() {
    return request("/achievements");
  },

  // XP / profile
  getXp() {
    return request("/xp");
  },
  gainXp(amount) {
    return request("/xp/gain", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },
  recordTaskCompleted(xp) {
    return request("/xp/task-completed", {
      method: "POST",
      body: JSON.stringify({ xp }),
    });
  },
};

export default api;
