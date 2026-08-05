import dotenv from "dotenv";

dotenv.config();

const toBool = (v) => v === "true" || v === "1";

// Browsers NEVER send an Origin header with a trailing slash, but the `cors`
// package does exact string matching. Normalize origins so a stray trailing
// slash in env config can't break CORS in production (common footgun).
const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, "");

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 4000,
  apiPrefix: "/api/v1",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean),
  cookie: {
    name: process.env.SESSION_COOKIE_NAME || "quest_session",
    secure: toBool(process.env.COOKIE_SECURE) || false,
    maxAgeDays: parseInt(process.env.SESSION_MAX_AGE_DAYS, 10) || 30,
    maxAgeMs:
      (parseInt(process.env.SESSION_MAX_AGE_DAYS, 10) || 30) *
      24 *
      60 *
      60 *
      1000,
  },
  session: {
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:4000/api/v1/auth/google/callback",
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  // Where Google's OAuth callback redirects the browser after login.
  // In production this MUST be an absolute URL to the deployed frontend
  // (e.g. https://your-app.vercel.app). "auto" (or missing) is only valid
  // for local development and resolves to the Vite dev origin.
  appRedirectUrl:
    process.env.APP_REDIRECT_URL && process.env.APP_REDIRECT_URL !== "auto"
      ? normalizeOrigin(process.env.APP_REDIRECT_URL)
      : "http://localhost:5173",
};

export default config;
