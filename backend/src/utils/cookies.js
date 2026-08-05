import config from "../config.js";

export function setAuthCookie(res, token) {
  res.cookie(config.cookie.name, token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.secure ? "strict" : "lax",
    maxAge: config.cookie.maxAgeMs,
    path: "/",
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.cookie.name, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.secure ? "strict" : "lax",
    path: "/",
  });
}
