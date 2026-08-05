import { getPrisma } from "../lib/prisma.js";
import { hashToken } from "../utils/sessionToken.js";
import config from "../config.js";

/**
 * Protected-route middleware: reads the httpOnly session cookie,
 * looks up the session by token hash, attaches req.user + req.profile.
 */
export default async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[config.cookie.name];
    if (!token) {
      return res
        .status(401)
        .json({
          success: false,
          error: { code: 401, message: "Not authenticated" },
        });
    }

    const prisma = getPrisma();
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { include: { profile: true } } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return res
        .status(401)
        .json({
          success: false,
          error: { code: 401, message: "Session expired or revoked" },
        });
    }

    req.user = session.user;
    req.profile = session.user.profile;
    req.sessionId = session.id;
    next();
  } catch (err) {
    next(err);
  }
}
