import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createDefaultProfile,
  loadProfile,
  saveProfile,
} from "../utils/storage.js";
import {
  TASK_COMPLETION_XP,
  addXp as addXpToProfile,
  calculateRank,
  getLevelInfo,
  getRankInfo,
} from "../utils/gameMath.js";

/**
 * Owns the player progression state: XP, level, rank, completed
 * task count, and focus minutes, with localStorage persistence.
 *
 * This hook contains no UI logic — components receive plain data
 * and callback actions.
 */
export default function useProgress() {
  const [profile, setProfile] = useState(loadProfile);

  // Persist the profile whenever it changes.
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  /** Adds raw XP to the profile and recalculates the level. */
  const addXp = useCallback((amount) => {
    setProfile((current) => addXpToProfile(current, amount));
  }, []);

  /**
   * Awards standard task-completion XP and increments the
   * completed-task counter. Use when a task is toggled to done.
   */
  const registerTaskCompleted = useCallback(() => {
    setProfile((current) => {
      const withXp = addXpToProfile(current, TASK_COMPLETION_XP);
      return {
        ...withXp,
        totalCompletedTasks: (current.totalCompletedTasks ?? 0) + 1,
      };
    });
  }, []);

  /**
   * Adds focus minutes to the lifetime total and refreshes the
   * rank. Ignores invalid (non-positive, non-finite) input.
   */
  const addFocusMinutes = useCallback((minutes) => {
    setProfile((current) => {
      const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
      const totalFocusMinutes = (current.totalFocusMinutes ?? 0) + safeMinutes;
      return {
        ...current,
        totalFocusMinutes,
        rank: calculateRank(totalFocusMinutes),
      };
    });
  }, []);

  /** Resets the profile to its default starting values. */
  const resetProfile = useCallback(() => {
    setProfile(createDefaultProfile());
  }, []);

  const levelInfo = useMemo(() => getLevelInfo(profile.xp), [profile.xp]);

  const rankInfo = useMemo(
    () => getRankInfo(profile.totalFocusMinutes),
    [profile.totalFocusMinutes],
  );

  return {
    profile,
    levelInfo,
    rankInfo,
    addXp,
    registerTaskCompleted,
    addFocusMinutes,
    resetProfile,
  };
}
