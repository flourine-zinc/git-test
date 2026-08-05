import crypto from "crypto";
import { getPrisma } from "../lib/prisma.js";

/**
 * Verifies a Google OAuth OIDC id_token using Google's JWKS.
 * Returns the verified claims (payload) or throws.
 */
export async function verifyGoogleIdToken(idToken) {
  // Decode JWT parts
  const [headerB64, payloadB64, signatureB64] = idToken.split(".");
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error("Malformed id_token");
  }

  const base64UrlDecode = (str) => {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  };

  const header = base64UrlDecode(headerB64);
  const payload = base64UrlDecode(payloadB64);

  // Verify signature using JWKS from Google
  const verifyUrl = "https://www.googleapis.com/oauth2/v3/certs";
  const fetch = globalThis.fetch;
  const resp = await fetch(verifyUrl);
  if (!resp.ok) throw new Error("Failed to fetch Google JWKS");
  const { keys } = await resp.json();

  const key = keys.find((k) => k.kid === header.kid);
  if (!key) throw new Error("No matching signing key");

  // Import public key and verify signature
  const { createPublicKey, verify } = await import("crypto");

  const publicKey = createPublicKey({
    key: {
      kty: key.kty,
      n: key.n,
      e: key.e,
    },
    format: "jwk",
  });

  const data = Buffer.from(`${headerB64}.${payloadB64}`);
  const signature = Buffer.from(
    signatureB64.replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  );

  const valid = verify("sha256", data, publicKey, signature);
  if (!valid) throw new Error("Invalid id_token signature");

  // Validate essential claims
  const now = Math.floor(Date.now() / 1000);
  if (
    payload.iss !== "https://accounts.google.com" &&
    payload.iss !== "accounts.google.com"
  ) {
    throw new Error("Invalid issuer");
  }
  if (payload.exp < now) throw new Error("Token expired");
  if (payload.aud && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Invalid audience");
  }
  if (payload.email_verified !== true) throw new Error("Email not verified");

  return payload;
}

export function generateOAuthState() {
  return crypto.randomBytes(16).toString("hex");
}

export async function createOrUpdateUser(profile) {
  const prisma = getPrisma();
  const { sub, email, name, picture, email_verified } = profile;

  const existing = await prisma.user.findUnique({ where: { googleSub: sub } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        email,
        emailVerified: email_verified ?? true,
        lastLoginAt: new Date(),
        avatarUrl: picture || existing.avatarUrl,
      },
      include: { profile: true },
    });
  }

  // Sanitize username from email prefix, ensure uniqueness
  let username =
    (name || email.split("@")[0]).replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20) ||
    "player";
  let suffix = 1;
  let finalUsername = username;
  while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
    finalUsername = `${username}${suffix++}`;
  }

  // Create user + profile in a transaction
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        googleSub: sub,
        email,
        emailVerified: email_verified ?? true,
        username: finalUsername,
        avatarUrl: picture || null,
        lastLoginAt: new Date(),
        profile: {
          create: {
            level: 1,
            xp: 0,
            rank: "Beginner",
            currentStreak: 0,
            bestStreak: 0,
            totalCompletedTasks: 0,
            totalFocusMinutes: 0,
          },
        },
      },
      include: { profile: true },
    });
    return user;
  });
}
