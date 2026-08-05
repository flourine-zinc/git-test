import { Router } from "express";
import requireAuth from "../middlewares/requireAuth.js";
import { getPrisma } from "../lib/prisma.js";
import { success } from "../utils/http.js";

const router = Router();

// GET /api/v1/achievements - Get user's unlocked achievements
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userAchievements = await getPrisma().userAchievement.findMany({
      where: { userId: req.user.id },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
    });

    const achievements = userAchievements.map((ua) => ({
      ...ua.achievement,
      unlockedAt: ua.unlockedAt,
    }));

    return success(res, 200, achievements);
  } catch (err) {
    next(err);
  }
});

export default router;
