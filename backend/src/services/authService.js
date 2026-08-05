import { getPrisma } from "../lib/prisma.js";
import { generateSessionToken, hashToken } from "../utils/sessionToken.js";
import { createOrUpdateUser, verifyGoogleIdToken } from "../utils/oauth.js";
import config from "../config.js";

export const authService = {
  async googleCallback(code) {
    // Exchange code for tokens
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResp.ok) {
      const errText = await tokenResp.text();
      throw new Error(`Google token exchange failed: ${errText}`);
    }

    const tokens = await tokenResp.json();
    if (!tokens.id_token) throw new Error("No id_token from Google");

    // Verify id_token (signature, iss, aud, exp, email_verified)
    const claims = await verifyGoogleIdToken(tokens.id_token);

    // Find-or-create user + profile
    const user = await createOrUpdateUser(claims);

    // Create session
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + config.cookie.maxAgeMs);
    const ip = undefined;
    const userAgent = undefined;

    await getPrisma().session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt,
        ip,
        userAgent,
      },
    });

    return { user, sessionToken: token };
  },

  async getUserById(userId) {
    return getPrisma().user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
  },

  async logout(sessionId) {
    if (!sessionId) return;
    await getPrisma().session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  },
};

export default authService;
