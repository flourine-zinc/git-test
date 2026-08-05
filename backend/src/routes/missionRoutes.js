import { Router } from "express";
import requireAuth from "../middlewares/requireAuth.js";
import { getPrisma } from "../lib/prisma.js";
import { success } from "../utils/http.js";

const router = Router();

// GET /api/v1/missions/today - Get today's daily missions with progress
router.get("/today", requireAuth, async (req, res, next) => {
  try {
    const today = new Date();
    const dayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    // Get templates
    const templates = await getPrisma().dailyMissionTemplate.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Get user's progress for today
    const progress = await getPrisma().dailyMissionProgress.findMany({
      where: {
        userId: req.user.id,
        day: { gte: dayStart, lt: dayEnd },
      },
    });

    const progressByTemplate = new Map(progress.map((p) => [p.templateId, p]));

    const missions = templates.map((template) => {
      const p = progressByTemplate.get(template.id);
      return {
        ...template,
        progress: p?.progress ?? 0,
        completed: p?.completed ?? false,
      };
    });

    return success(res, 200, missions);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/missions/progress - Update mission progress
router.post("/progress", requireAuth, async (req, res, next) => {
  try {
    const { templateCode, progress, completed } = req.body;
    if (!templateCode)
      return res
        .status(400)
        .json({
          success: false,
          error: { code: 400, message: "templateCode is required" },
        });

    const today = new Date();
    const dayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const template = await getPrisma().dailyMissionTemplate.findUnique({
      where: { code: templateCode },
    });
    if (!template)
      return res
        .status(404)
        .json({
          success: false,
          error: { code: 404, message: "Template not found" },
        });

    const existing = await getPrisma().dailyMissionProgress.findUnique({
      where: {
        userId_templateId_day: {
          userId: req.user.id,
          templateId: template.id,
          day: dayStart,
        },
      },
    });

    if (existing) {
      await getPrisma().dailyMissionProgress.update({
        where: { id: existing.id },
        data: {
          progress: progress !== undefined ? progress : existing.progress,
          completed: completed !== undefined ? completed : existing.completed,
        },
      });
    } else {
      await getPrisma().dailyMissionProgress.create({
        data: {
          userId: req.user.id,
          templateId: template.id,
          day: dayStart,
          progress: progress ?? 0,
          completed: completed ?? false,
        },
      });
    }

    return success(res, 200, null, "Mission progress updated");
  } catch (err) {
    next(err);
  }
});

export default router;
