import { useMemo } from "react";
import { ACHIEVEMENTS } from "../constants/gameConfig.js";

/**
 * Achievement evaluation logic. Takes the current profile stats and
 * the set of already-unlocked ids, and returns:
 *
 * - achievements      full list with unlocked + progress booleans
 * - newlyUnlocked     ids that are newly unlocked compared to
 *                     `unlockedIds` (so the caller can persist +
 *                     toast them)
 *
 * No storage writes happen here; the caller owns persistence.
 */
export default function useAchievements(profile, unlockedIds = []) {
  const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);

  const stats = useMemo(
    () => ({
      totalCompletedTasks: profile?.totalCompletedTasks ?? 0,
      totalFocusMinutes: profile?.totalFocusMinutes ?? 0,
    }),
    [profile?.totalCompletedTasks, profile?.totalFocusMinutes],
  );

  /**
   * Recomputes each unlock check every render this hook runs.
   * getDerivedAchievements() returns fresh objects each call so
   * callers can compare against previously unlocked ids.
   */
  function getDerivedAchievements() {
    const achievements = ACHIEVEMENTS.map((definition) => {
      const unlocked =
        unlockedSet.has(definition.id) || definition.check(stats);
      return {
        ...definition,
        unlocked,
        progress: definition.check(stats)
          ? 100
          : Math.min(
              100,
              Math.floor(achievementProgress(definition, stats) * 100),
            ),
      };
    });

    const newlyUnlocked = achievements
      .filter(
        (achievement) =>
          achievement.unlocked && !unlockedSet.has(achievement.id),
      )
      .map((achievement) => achievement.id);

    return { achievements, newlyUnlocked };
  }

  const derived = useMemo(getDerivedAchievements, [
    stats.totalCompletedTasks,
    stats.totalFocusMinutes,
    unlockedIds,
  ]);

  return {
    achievements: derived.achievements,
    newlyUnlocked: derived.newlyUnlocked,
  };
}

/** Rough 0..1 progress estimate for locked achievements. */
function achievementProgress(definition, stats) {
  // Default: no progress info -> 0.
  let numerator = 0;
  let denominator = 1;

  if (definition.id === "first-task") {
    numerator = stats.totalCompletedTasks;
    denominator = 1;
  } else if (definition.id === "getting-started") {
    numerator = stats.totalCompletedTasks;
    denominator = 10;
  } else if (definition.id === "focused-10h") {
    numerator = stats.totalFocusMinutes;
    denominator = 10 * 60;
  } else if (definition.id === "master-500h") {
    numerator = stats.totalFocusMinutes;
    denominator = 500 * 60;
  }

  return Math.min(1, numerator / denominator);
}
