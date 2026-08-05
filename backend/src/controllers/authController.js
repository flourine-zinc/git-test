import crypto from "crypto";
import { authService } from "../services/authService.js";
import { setAuthCookie, clearAuthCookie } from "../utils/cookies.js";
import { success } from "../utils/http.js";
import config from "../config.js";

export const authController = {
  async startGoogleAuth(req, res, next) {
    try {
      const state = crypto.randomBytes(16).toString("hex");
      // Store state briefly in a signed cookie for CSRF protection
      res.cookie("oauth_state", state, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.secure ? "strict" : "lax",
        maxAge: 10 * 60 * 1000, // 10 minutes
        path: "/",
      });

      const scope = "openid email profile";
      const params = new URLSearchParams({
        client_id: config.google.clientId,
        redirect_uri: config.google.callbackUrl,
        response_type: "code",
        scope,
        state,
        access_type: "online",
        prompt: "select_account",
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      res.redirect(302, authUrl);
    } catch (err) {
      next(err);
    }
  },

  async googleCallback(req, res, next) {
    try {
      const { code, state } = req.query;
      const storedState = req.cookies?.oauth_state;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: "Missing authorization code" },
        });
      }
      if (!state || state !== storedState) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: "Invalid OAuth state" },
        });
      }

      const { user, sessionToken } = await authService.googleCallback(code);
      setAuthCookie(res, sessionToken);

      // Clear state cookie
      res.clearCookie("oauth_state", { path: "/" });

      // Redirect back to frontend (config.appRedirectUrl is always absolute)
      return res.redirect(config.appRedirectUrl);
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      // requireAuth already attached req.user
      const user = await authService.getUserById(req.user.id);
      return success(
        res,
        200,
        { user, profile: user.profile },
        "Authenticated",
      );
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      await authService.logout(req.sessionId);
      clearAuthCookie(res);
      return success(res, 200, null, "Logged out");
    } catch (err) {
      next(err);
    }
  },
};

export default authController;
