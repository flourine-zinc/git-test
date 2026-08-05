import { formatSeconds } from "../utils/gameMath.js";

/**
 * Focus session timer: start / pause / resume / reset / complete.
 * When a session finishes, the caller (TodoApp) awards focus minutes,
 * XP, and updates missions.
 */
export default function FocusTimer({
  status,
  secondsLeft,
  totalSeconds,
  onStart,
  onPause,
  onResume,
  onReset,
  onComplete,
}) {
  const progressPercent =
    totalSeconds > 0
      ? Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100)
      : 0;

  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isFinished = status === "finished";

  return (
    <section className="card focus-timer" aria-label="Focus timer">
      <p className="card__label">FOCUS TIMER</p>

      <div className="focus-timer__time" role="timer" aria-live="off">
        {formatSeconds(secondsLeft)}
      </div>

      <div className="focus-timer__bar">
        <span
          className="focus-timer__bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {isFinished && (
        <p className="focus-timer__finished" role="status">
          🎉 Session complete! Focus minutes awarded.
        </p>
      )}

      <div className="focus-timer__controls">
        {!isRunning && !isPaused && !isFinished && (
          <button
            type="button"
            className="focus-timer__button"
            onClick={onStart}
          >
            ▶ Start
          </button>
        )}
        {isRunning && (
          <button
            type="button"
            className="focus-timer__button focus-timer__button--paused"
            onClick={onPause}
          >
            ⏸ Pause
          </button>
        )}
        {isPaused && (
          <button
            type="button"
            className="focus-timer__button"
            onClick={onResume}
          >
            ▶ Resume
          </button>
        )}
        {(isRunning || isPaused || isFinished) && (
          <button
            type="button"
            className="focus-timer__button focus-timer__button--secondary"
            onClick={onReset}
          >
            ↺ Reset
          </button>
        )}
        {isFinished && (
          <button
            type="button"
            className="focus-timer__button focus-timer__button--complete"
            onClick={onComplete}
          >
            ✓ Complete Session
          </button>
        )}
      </div>
    </section>
  );
}
