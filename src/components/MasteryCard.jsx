import XPBar from "./XPBar.jsx";
import { formatMinutes, RANKS } from "../utils/gameMath.js";

/**
 * Lifetime mastery tracker inspired by rank progression:
 * shows total focus hours, the next milestone, and percentage.
 */
export default function MasteryCard({ totalFocusMinutes = 0 }) {
  const currentMinutes = Math.max(0, totalFocusMinutes);

  // Find the highest milestone reached with a plain loop for
  // broad browser support (avoids Array.findLastIndex).
  let currentIndex = 0;
  for (let i = 0; i < RANKS.length; i += 1) {
    if (currentMinutes >= RANKS[i].minMinutes) {
      currentIndex = i;
    }
  }

  const current = RANKS[currentIndex];
  const next = RANKS[currentIndex + 1] ?? null;

  const progressPercent = next
    ? Math.min(
        100,
        Math.round(
          ((currentMinutes - current.minMinutes) /
            (next.minMinutes - current.minMinutes)) *
            100,
        ),
      )
    : 100;

  return (
    <section className="card mastery-card" aria-label="Mastery progress">
      <div className="mastery-card__header">
        <span className="mastery-card__icon" aria-hidden="true">
          🧙
        </span>
        <div>
          <p className="card__label">MASTERY</p>
          <h3 className="mastery-card__title">{current.title}</h3>
        </div>
      </div>

      <XPBar
        label={`${formatMinutes(currentMinutes)} of ${
          next ? formatMinutes(next.minMinutes) : "max"
        }`}
        percent={progressPercent}
        ariaLabel="Mastery milestone progress"
        fillColor="var(--color-primary)"
      />

      {next ? (
        <p className="mastery-card__hint">
          {formatMinutes(Math.max(0, next.minMinutes - currentMinutes))} until{" "}
          {next.title}
        </p>
      ) : (
        <p className="mastery-card__hint">Max mastery achieved! 👑</p>
      )}
    </section>
  );
}
