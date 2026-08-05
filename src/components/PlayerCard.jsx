import XPBar from "./XPBar.jsx";
import { formatMinutes } from "../utils/gameMath.js";

/**
 * Hero card of the RPG dashboard: player identity, level, XP
 * progress, rank, streak, and key lifetime stats.
 */
export default function PlayerCard({ profile, levelInfo, rankInfo, streak }) {
  const {
    level = 1,
    xp = 0,
    rank = "Beginner",
    totalCompletedTasks = 0,
    totalFocusMinutes = 0,
  } = profile ?? {};

  const {
    currentStreak = 0,
    bestStreak = 0,
    showStreakWarning = false,
    isNewRecord = false,
  } = streak ?? {};

  return (
    <section className="card player-card" aria-label="Player status">
      <div className="player-card__top">
        <div className="player-card__identity">
          <div className="player-card__avatar" aria-hidden="true">
            🎮
          </div>
          <div>
            <p className="player-card__label">PLAYER STATUS</p>
            <h2 className="player-card__level">Level {level}</h2>
            <p className="player-card__rank">{rank}</p>
          </div>
        </div>
        <div className="player-card__streak" title="Current streak">
          <span className="player-card__streak-icon">🔥</span>
          <span className="player-card__streak-value">{currentStreak}</span>
          <span className="player-card__streak-label">day streak</span>
        </div>
      </div>

      <XPBar
        label="XP"
        value={levelInfo?.currentLevelXp ?? 0}
        max={levelInfo?.xpForNextLevel ?? 100}
        ariaLabel="Experience points"
      />

      {showStreakWarning && (
        <p className="player-card__warning" role="status">
          ⚠️ Complete your daily missions to keep your streak alive!
        </p>
      )}
      {isNewRecord && currentStreak > 1 && (
        <p className="player-card__record" role="status">
          🏆 New streak record!
        </p>
      )}

      <div className="player-card__stats">
        <div className="player-card__stat">
          <span className="player-card__stat-value">{totalCompletedTasks}</span>
          <span className="player-card__stat-label">Tasks Done</span>
        </div>
        <div className="player-card__stat">
          <span className="player-card__stat-value">
            {formatMinutes(totalFocusMinutes)}
          </span>
          <span className="player-card__stat-label">Focus Time</span>
        </div>
        <div className="player-card__stat">
          <span className="player-card__stat-value">{bestStreak}</span>
          <span className="player-card__stat-label">Best Streak</span>
        </div>
      </div>
    </section>
  );
}
