import dotenv from "dotenv";

// Loads backend/.env FIRST (before any config value is read below) so local
// development works out of the box. On Render the .env file isn't deployed
// (it's gitignored), so dotenv is a no-op there and the Render dashboard
// environment variables take precedence — dotenv never overrides existing
// process.env values, so Render env vars always win.
dotenv.config();

const toBool = (v) => v === "true" || v === "1";

// Browsers NEVER send an Origin header with a trailing slash, but the `cors`
// package does exact string matching. Normalize origins so a stray trailing
// slash in env config can't break CORS in production (common footgun).
const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, "");

// Deployed production origins. .env files are gitignored and never reach
// Render, so without these safe production defaults a missing dashboard env
// var would silently fall back to localhost and break OAuth redirects, the
// session cookie, and CORS for real users. Render dashboard env vars (e.g.
// APP_REDIRECT_URL, CORS_ORIGINS, COOKIE_SECURE) still override these.
const PRODUCTION_APP_URL = "https://git-test-seven-dun.vercel.app";
const PRODUCTION_API_URL = "https://git-test-vnpu.onrender.com";

// NODE_ENV is set to "production" by Render automatically.
const isProduction = process.env.NODE_ENV === "production";

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 4000,
  apiPrefix: "/api/v1",
  corsOrigins: (
    process.env.CORS_ORIGINS ||
    (isProduction ? PRODUCTION_APP_URL : "http://localhost:5173")
  )
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean),
  cookie: {
    name: process.env.SESSION_COOKIE_NAME || "quest_session",
    // Secure + SameSite=None are mandatory in production. Default to secure
    // in production so a missing COOKIE_SECURE env var can't silently produce
    // non-cross-site cookies that browsers will drop on the Vercel origin.
    secure:
      process.env.COOKIE_SECURE !== undefined
        ? toBool(process.env.COOKIE_SECURE)
        : isProduction,
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
      (isProduction
        ? `${PRODUCTION_API_URL}/api/v1/auth/google/callback`
        : "http://localhost:4000/api/v1/auth/google/callback"),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  // Where Google's OAuth callback redirects the browser after login.
  // In production this MUST be the deployed Vercel URL. "auto" (or missing)
  // is only valid for local development; in production it resolves to the
  // real deployed frontend so users are never dumped onto localhost.
  appRedirectUrl:
    process.env.APP_REDIRECT_URL && process.env.APP_REDIRECT_URL !== "auto"
      ? normalizeOrigin(process.env.APP_REDIRECT_URL)
      : isProduction
        ? PRODUCTION_APP_URL
        : "http://localhost:5173",
};

export default config;
