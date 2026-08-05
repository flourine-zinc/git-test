import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_FOCUS_MINUTES } from "../constants/gameConfig.js";

const TICK_INTERVAL_MS = 1000;

/**
 * Pomodoro-style timer state machine.
 *
 * States: "idle" -> "running" -> "paused" -> "running" ... -> "finished"
 *
 * Exposes:
 * - status            "idle" | "running" | "paused" | "finished"
 * - secondsLeft       remaining seconds in the current session
 * - totalSeconds      configured session length in seconds
 * - start(), pause(), resume(), reset(), complete()
 * - activeSession     { startedAt } while a session is in progress
 */
export default function useTimer(initialMinutes = DEFAULT_FOCUS_MINUTES) {
  const [status, setStatus] = useState("idle");
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [startedAt, setStartedAt] = useState(null);
  const intervalRef = useRef(null);

  // Stop ticking on unmount.
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const stopTicking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (status === "running") {
      return;
    }
    if (status !== "paused") {
      // Fresh (or reset) session.
      setStartedAt(Date.now());
    }
    setStatus("running");
    stopTicking();
    intervalRef.current = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          // Finished: stop the interval and mark completion.
          stopTicking();
          setStatus("finished");
          return 0;
        }
        return current - 1;
      });
    }, TICK_INTERVAL_MS);
  }, [status, stopTicking]);

  const pause = useCallback(() => {
    if (status !== "running") {
      return;
    }
    stopTicking();
    setStatus("paused");
  }, [status, stopTicking]);

  const resume = useCallback(() => {
    if (status !== "paused") {
      return;
    }
    setStatus("running");
    stopTicking();
    intervalRef.current = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          stopTicking();
          setStatus("finished");
          return 0;
        }
        return current - 1;
      });
    }, TICK_INTERVAL_MS);
  }, [status, stopTicking]);

  const reset = useCallback(() => {
    stopTicking();
    setStatus("idle");
    setSecondsLeft(totalSeconds);
    setStartedAt(null);
  }, [stopTicking, totalSeconds]);

  /**
   * Finishes the session early and reports the duration in minutes
   * (rounded up to a whole minute, minimum 1). Resets for the next
   * session. Returns null when there was no active session.
   */
  const complete = useCallback(() => {
    if (status === "idle") {
      return null;
    }
    stopTicking();
    const elapsedMs = startedAt ? Date.now() - startedAt : 0;
    const durationMinutes = Math.max(1, Math.ceil(elapsedMs / 60000));
    setStatus("idle");
    setSecondsLeft(totalSeconds);
    setStartedAt(null);
    return {
      startedAt,
      endedAt: Date.now(),
      durationMinutes,
    };
  }, [status, startedAt, totalSeconds, stopTicking]);

  return {
    status,
    secondsLeft,
    totalSeconds,
    startedAt,
    start,
    pause,
    resume,
    reset,
    complete,
  };
}
