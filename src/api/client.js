/**
 * Minimal API client for the Quest Log backend.
 * Cookies (httpOnly session) are sent/required for all protected routes.
 *
 * The session cookie is set by the API origin itself (localhost:4000 in dev),
 * so all requests go straight to the backend with credentials included
 * (same-site → SameSite=Lax cookies are attached; CORS allowlists the app origin).
 */

// Production fallback: if VITE_API_URL isn't configured on Vercel, default to
// the Render backend. Local dev still falls back to localhost:4000.
const PROD_API_URL = "https://git-test-vnpu.onrender.com/api/v1";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? PROD_API_URL : "http://localhost:4000/api/v1");

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

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
