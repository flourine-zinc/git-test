import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DAILY_MISSIONS } from "../constants/gameConfig.js";
import { loadDailyMissions, saveDailyMissions } from "../utils/storage.js";
import { getTodayKey } from "../utils/date.js";

const REFRESH_INTERVAL_MS = 60 * 1000; // check for midnight rollover every minute

/** Builds a fresh zero-progress mission list for the given date. */
function createMissionState(dateKey) {
  return {
    date: dateKey,
    missions: DAILY_MISSIONS.map((mission) => ({
      id: mission.id,
      type: mission.type,
      label: mission.label,
      target: mission.target,
      progress: 0,
      completed: false,
    })),
  };
}

/**
 * Tracks today's daily missions with automatic midnight reset.
 *
 * The hook exposes:
 * - missionState   { date, missions[] } with per-mission progress
 * - recordProgress(type, amount) to add progress for a mission type
 *   ("tasks" | "xp" | "focus")
 * - overallProgressPercent and allCompleted derived values
 *
 * Persists under "gamify.dailyMissions" keyed by the local date.
 */
export default function useDailyMission() {
  const [missionState, setMissionState] = useState(() => {
    const today = getTodayKey();
    const stored = loadDailyMissions(today);
    // Stored state matches today but may be missing missions added
    // after the user's first visit, so merge with templates.
    if (stored.missions.length === 0) {
      return createMissionState(today);
    }
    return stored;
  });

  const lastDateRef = useRef(missionState.date);

  /** Resets to a fresh day when the local date changes (midnight). */
  useEffect(() => {
    const checkDate = () => {
      const today = getTodayKey();
      if (today !== lastDateRef.current) {
        lastDateRef.current = today;
        setMissionState(createMissionState(today));
      }
    };
    const intervalId = setInterval(checkDate, REFRESH_INTERVAL_MS);
    // Also check immediately in case the tab was open across midnight.
    checkDate();
    return () => clearInterval(intervalId);
  }, []);

  // Persist whenever the mission state changes (after the reset effect
  // has had a chance to run).
  useEffect(() => {
    saveDailyMissions(missionState);
  }, [missionState]);

  /**
   * Adds progress to all missions of the given type and marks any
   * mission as completed once its target is reached.
   */
  const recordProgress = useCallback((type, amount) => {
    const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
    if (safeAmount === 0) {
      return;
    }
    setMissionState((current) => {
      const today = getTodayKey();
      const base = current.date === today ? current : createMissionState(today);
      return {
        ...base,
        missions: base.missions.map((mission) => {
          if (mission.type !== type || mission.completed) {
            return mission;
          }
          const progress = Math.min(
            mission.target,
            mission.progress + safeAmount,
          );
          return {
            ...mission,
            progress,
            completed: progress >= mission.target,
          };
        }),
      };
    });
  }, []);

  const overallProgressPercent = useMemo(() => {
    const totalTarget = missionState.missions.reduce(
      (sum, mission) => sum + mission.target,
      0,
    );
    if (totalTarget === 0) {
      return 0;
    }
    const totalProgress = missionState.missions.reduce(
      (sum, mission) => sum + Math.min(mission.progress, mission.target),
      0,
    );
    return Math.floor((totalProgress / totalTarget) * 100);
  }, [missionState]);

  const allCompleted = useMemo(
    () =>
      missionState.missions.length > 0 &&
      missionState.missions.every((mission) => mission.completed),
    [missionState],
  );

  return {
    missionState,
    recordProgress,
    overallProgressPercent,
    allCompleted,
  };
}
