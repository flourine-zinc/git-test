import { Router } from "express";
import requireAuth from "../middlewares/requireAuth.js";
import { getPrisma } from "../lib/prisma.js";
import { success, error } from "../utils/http.js";

const router = Router();

// GET /api/v1/focus - Get all focus sessions for current user
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const sessions = await getPrisma().focusSession.findMany({
      where: { userId: req.user.id },
      orderBy: { startedAt: "desc" },
    });
    return success(res, 200, sessions);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/focus - Record a completed focus session
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { durationMinutes, startedAt, endedAt, source } = req.body;
    if (!durationMinutes || durationMinutes <= 0) {
      return error(
        res,
        400,
        "durationMinutes is required and must be positive",
      );
    }
    const session = await getPrisma().focusSession.create({
      data: {
        userId: req.user.id,
        durationMinutes,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        endedAt: endedAt ? new Date(endedAt) : new Date(),
        source: source || "solo",
      },
    });

    // Update profile total focus minutes
    await getPrisma().profile.update({
      where: { userId: req.user.id },
      data: { totalFocusMinutes: { increment: durationMinutes } },
    });

    return success(res, 201, session, "Focus session recorded");
  } catch (err) {
    next(err);
  }
});

export default router;
