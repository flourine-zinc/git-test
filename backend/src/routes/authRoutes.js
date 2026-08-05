import { Router } from "express";
import { authController } from "../controllers/authController.js";
import requireAuth from "../middlewares/requireAuth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

router.get("/google", authLimiter, authController.startGoogleAuth);
router.get("/google/callback", authLimiter, authController.googleCallback);
router.get("/me", authLimiter, requireAuth, authController.me);
router.post("/logout", authLimiter, requireAuth, authController.logout);

export default router;
