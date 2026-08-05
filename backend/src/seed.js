import { getPrisma } from "./lib/prisma.js";

/**
 * Seed script — idempotent. Inserts the static achievement definitions
 * and daily-mission templates that the frontend's gameConfig.js uses.
 * Safe to re-run: existing rows are left untouched.
 */

const ACHIEVEMENTS = [
  {
    code: "first-task",
    title: "First Task",
    description: "Complete your first task",
    icon: "⚔️",
  },
  {
    code: "getting-started",
    title: "Getting Started",
    description: "Complete 10 tasks",
    icon: "🛡️",
  },
  {
    code: "focused-10h",
    title: "Focused",
    description: "Reach 10 hours focus time",
    icon: "⏳",
  },
  {
    code: "master-500h",
    title: "Master",
    description: "Reach 500 focus hours",
    icon: "👑",
  },
];

const DAILY_MISSION_TEMPLATES = [
  {
    code: "mission-tasks-5",
    type: "tasks",
    label: "Complete 5 tasks",
    target: 5,
  },
  { code: "mission-xp-100", type: "xp", label: "Earn 100 XP", target: 100 },
  {
    code: "mission-focus-60",
    type: "focus",
    label: "Focus for 60 minutes",
    target: 60,
  },
];

async function seed() {
  const prisma = getPrisma();

  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {},
      create: achievement,
    });
  }

  for (const template of DAILY_MISSION_TEMPLATES) {
    await prisma.dailyMissionTemplate.upsert({
      where: { code: template.code },
      update: {},
      create: template,
    });
  }

  console.log(
    `[seed] ${ACHIEVEMENTS.length} achievements, ${DAILY_MISSION_TEMPLATES.length} daily mission templates ready`,
  );
}

seed()
  .catch((error) => {
    console.error("[seed] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const prisma = getPrisma();
    await prisma.$disconnect();
  });
