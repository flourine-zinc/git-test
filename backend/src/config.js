import dotenv from "dotenv";

dotenv.config();

const toBool = (v) => v === "true" || v === "1";

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 4000,
  apiPrefix: "/api/v1",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
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
  // "auto" (or missing) → default to the local Vite dev origin.
  // Must resolve to an absolute URL — Express res.redirect treats
  // strings like "auto" as relative paths (→ /api/v1/auth/google/auto).
  appRedirectUrl:
    process.env.APP_REDIRECT_URL && process.env.APP_REDIRECT_URL !== "auto"
      ? process.env.APP_REDIRECT_URL
      : "http://localhost:5173",
};

export default config;
