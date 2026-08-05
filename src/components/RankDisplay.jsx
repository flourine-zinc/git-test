import XPBar from "./XPBar.jsx";
import { formatMinutes } from "../utils/gameMath.js";

/**
 * Mastery rank card based on lifetime focus time. Shows the current
 * title, progress toward the next rank, and hours accumulated.
 */
export default function RankDisplay({ rankInfo, totalFocusMinutes = 0 }) {
  const { rank, nextRank, minutesToNext, progressPercent } = rankInfo ?? {};

  return (
    <section className="card rank-display" aria-label="Mastery rank">
      <div className="rank-display__header">
        <span className="rank-display__icon" aria-hidden="true">
          🏅
        </span>
        <div>
          <p className="card__label">MASTERY RANK</p>
          <h3 className="rank-display__title">{rank?.title ?? "Beginner"}</h3>
        </div>
      </div>

      <XPBar
        label={nextRank ? `Next: ${nextRank.title}` : "Max rank reached"}
        value={formatMinutes(totalFocusMinutes)}
        max={nextRank ? formatMinutes(nextRank.minMinutes) : ""}
        percent={progressPercent ?? 0}
        ariaLabel="Mastery rank progress"
      />

      {nextRank ? (
        <p className="rank-display__hint">
          {formatMinutes(minutesToNext)} until {nextRank.title}
        </p>
      ) : (
        <p className="rank-display__hint">You reached the highest rank! 👑</p>
      )}
    </section>
  );
}
