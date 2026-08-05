import { Router } from "express";
import requireAuth from "../middlewares/requireAuth.js";
import { getPrisma } from "../lib/prisma.js";
import { success, error } from "../utils/http.js";

// XP threshold for each level (matches frontend gameConfig)
const XP_PER_LEVEL = 100;

const calculateLevel = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;

const rankByMinutes = [
  { min: 10000, rank: "Legendary" },
  { min: 5000, rank: "Epic" },
  { min: 2000, rank: "Master" },
  { min: 1000, rank: "Expert" },
  { min: 500, rank: "Skilled" },
  { min: 100, rank: "Enthusiast" },
  { min: 0, rank: "Beginner" },
];

const calculateRank = (totalFocusMinutes) =>
  rankByMinutes.find((r) => totalFocusMinutes >= r.min).rank;

const router = Router();

// GET /api/v1/xp - Get user's XP and profile stats
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const profile = await getPrisma().profile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) return error(res, 404, "Profile not found");

    return success(res, 200, {
      xp: profile.xp,
      level: profile.level,
      rank: profile.rank,
      currentStreak: profile.currentStreak,
      bestStreak: profile.bestStreak,
      totalCompletedTasks: profile.totalCompletedTasks,
      totalFocusMinutes: profile.totalFocusMinutes,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/xp/gain - Award XP (e.g. task completed)
router.post("/gain", requireAuth, async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return error(res, 400, "amount must be a positive number");
    }

    const profile = await getPrisma().profile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) return error(res, 404, "Profile not found");

    const newXp = profile.xp + amount;
    const newLevel = calculateLevel(newXp);

    const updated = await getPrisma().profile.update({
      where: { userId: req.user.id },
      data: {
        xp: newXp,
        level: newLevel,
        rank: calculateRank(profile.totalFocusMinutes),
      },
    });

    return success(res, 200, updated, "XP awarded");
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/xp/task-completed - Record a completed task (updates streak + xp)
router.post("/task-completed", requireAuth, async (req, res, next) => {
  try {
    const { xp } = req.body;
    const amount = xp || 25;

    const profile = await getPrisma().profile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) return error(res, 404, "Profile not found");

    const today = new Date();
    const dayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // Get yesterday's date
    const yesterday = new Date(dayStart);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayRecord = await getPrisma().streakHistory.findUnique({
      where: {
        userId_day: { userId: req.user.id, day: yesterday },
      },
    });

    const todayRecord = await getPrisma().streakHistory.findUnique({
      where: {
        userId_day: { userId: req.user.id, day: dayStart },
      },
    });

    let currentStreak = profile.currentStreak;
    let bestStreak = profile.bestStreak;

    if (!todayRecord) {
      // New day completion
      currentStreak = yesterdayRecord ? profile.currentStreak + 1 : 1;
      bestStreak = Math.max(bestStreak, currentStreak);

      await getPrisma().streakHistory.create({
        data: {
          userId: req.user.id,
          day: dayStart,
        },
      });

      await getPrisma().profile.update({
        where: { userId: req.user.id },
        data: {
          currentStreak,
          bestStreak,
          lastCompletedDay: dayStart,
        },
      });
    }

    const newXp = profile.xp + amount;
    const newLevel = calculateLevel(newXp);

    const updated = await getPrisma().profile.update({
      where: { userId: req.user.id },
      data: {
        xp: newXp,
        level: newLevel,
        totalCompletedTasks: { increment: 1 },
      },
    });

    return success(res, 200, updated, "Task completion recorded");
  } catch (err) {
    next(err);
  }
});

export default router;
