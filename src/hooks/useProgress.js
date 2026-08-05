import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createDefaultProfile,
  loadAchievements,
  loadFocusSessions,
  loadProfile,
  saveAchievements,
  saveFocusSessions,
  saveProfile,
} from "../utils/storage.js";
import {
  FOCUS_XP_PER_MINUTE,
  addXp as addXpToProfile,
  calculateRank,
  getLevelInfo,
  getRankInfo,
} from "../utils/gameMath.js";
import { getDateKey, getTodayKey, getYesterdayKey } from "../utils/date.js";

/**
 * Single owner of the player's persistent progression data:
 * - profile (XP, level, rank, streak, focus minutes, tasks done)
 * - focus sessions
 * - unlocked achievement ids
 *
 * Exposes actions that update state and persist through effects.
 * Contains no UI logic — components consume data + callbacks.
 */
export default function useProgress() {
  const [profile, setProfile] = useState(loadProfile);
  const [focusSessions, setFocusSessions] = useState(loadFocusSessions);
  const [unlockedAchievements, setUnlockedAchievements] =
    useState(loadAchievements);

  // Persist whenever any slice of progression data changes.
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveFocusSessions(focusSessions);
  }, [focusSessions]);

  useEffect(() => {
    saveAchievements(unlockedAchievements);
  }, [unlockedAchievements]);

  /** Adds raw XP to the profile and recalculates the level. */
  const addXp = useCallback((amount) => {
    setProfile((current) => addXpToProfile(current, amount));
  }, []);

  /**
   * Awards a task's XP reward and increments the completed-task
   * counter. The caller supplies the XP amount (from the todo's
   * stored xpReward).
   */
  const registerTaskCompleted = useCallback((xpReward = 0) => {
    setProfile((current) => {
      const withXp = addXpToProfile(current, xpReward);
      return {
        ...withXp,
        totalCompletedTasks: (current.totalCompletedTasks ?? 0) + 1,
      };
    });
  }, []);

  /**
   * Reverts a task completion: refunds its XP and decrements the
   * completed-task counter (never below zero).
   */
  const registerTaskUncompleted = useCallback((xpReward = 0) => {
    setProfile((current) => ({
      ...current,
      xp: Math.max(0, (current.xp ?? 0) - Math.max(0, xpReward)),
      totalCompletedTasks: Math.max(0, (current.totalCompletedTasks ?? 0) - 1),
    }));
  }, []);

  /**
   * Registers today as a streak-completed day. Handles the
   * continuation, the broken-streak reset, and the best-streak
   * record update in a single profile update.
   */
  const registerDayCompleted = useCallback(() => {
    const today = getTodayKey();
    const yesterdayKey = getYesterdayKey();
    setProfile((current) => {
      const lastDay = current.lastCompletedDay;
      // Already completed today: no-op.
      if (lastDay === today) {
        return current;
      }
      const continuesStreak = lastDay === yesterdayKey;
      const nextStreak = continuesStreak ? current.currentStreak + 1 : 1;
      return {
        ...current,
        currentStreak: nextStreak,
        bestStreak: Math.max(current.bestStreak, nextStreak),
        lastCompletedDay: today,
      };
    });
  }, []);

  /**
   * Records a completed focus session: appends it to the session
   * list, adds its minutes to the lifetime total, recalculates the
   * rank, and awards focus XP. Returns the session + XP gained so
   * the caller can update daily missions.
   */
  const addFocusSession = useCallback((sessionInput) => {
    if (!sessionInput || !Number.isFinite(sessionInput.durationMinutes)) {
      return null;
    }
    const durationMinutes = sessionInput.durationMinutes;
    const session = {
      id:
        typeof sessionInput.id === "string"
          ? sessionInput.id
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      startedAt: sessionInput.startedAt ?? Date.now(),
      endedAt: sessionInput.endedAt ?? Date.now(),
      durationMinutes,
    };

    setFocusSessions((current) => [...current, session]);

    const xpGained = Math.max(
      1,
      Math.round(durationMinutes * FOCUS_XP_PER_MINUTE),
    );
    setProfile((current) => {
      const withXp = addXpToProfile(current, xpGained);
      const totalFocusMinutes =
        (current.totalFocusMinutes ?? 0) + durationMinutes;
      return {
        ...withXp,
        totalFocusMinutes,
        rank: calculateRank(totalFocusMinutes),
      };
    });
    return { session, xpGained };
  }, []);

  /** Appends newly unlocked achievement ids (deduped). */
  const unlockAchievements = useCallback((ids = []) => {
    const safeIds = ids.filter((id) => typeof id === "string" && id.length > 0);
    if (safeIds.length === 0) {
      return;
    }
    setUnlockedAchievements((current) => {
      const unique = new Set(current);
      let changed = false;
      for (const id of safeIds) {
        if (!unique.has(id)) {
          unique.add(id);
          changed = true;
        }
      }
      return changed ? Array.from(unique) : current;
    });
  }, []);

  /** Resets the profile to default starting values. */
  const resetProfile = useCallback(() => {
    setProfile(createDefaultProfile());
  }, []);

  const levelInfo = useMemo(() => getLevelInfo(profile.xp), [profile.xp]);

  const rankInfo = useMemo(
    () => getRankInfo(profile.totalFocusMinutes),
    [profile.totalFocusMinutes],
  );

  /** Today's accumulated focus minutes, from completed sessions. */
  const todayFocusMinutes = useMemo(() => {
    const today = getTodayKey();
    return focusSessions.reduce((sum, session) => {
      const sessionDay = getDateKey(new Date(session.startedAt));
      return sessionDay === today ? sum + session.durationMinutes : sum;
    }, 0);
  }, [focusSessions]);

  return {
    profile,
    levelInfo,
    rankInfo,
    focusSessions,
    todayFocusMinutes,
    unlockedAchievements,
    addXp,
    registerTaskCompleted,
    registerTaskUncompleted,
    registerDayCompleted,
    addFocusSession,
    unlockAchievements,
    resetProfile,
  };
}
