/**
 * Streak summary card, including a friendly warning before loss.
 */
export default function StreakCard({
  currentStreak = 0,
  bestStreak = 0,
  showStreakWarning = false,
  isStreakBroken = false,
}) {
  return (
    <section className="card streak-card" aria-label="Streak status">
      <p className="card__label">STREAK</p>
      <div className="streak-card__stats">
        <div className="streak-card__stat">
          <span className="streak-card__icon" aria-hidden="true">
            🔥
          </span>
          <span className="streak-card__value">{currentStreak}</span>
          <span className="streak-card__label">Current</span>
        </div>
        <div className="streak-card__stat">
          <span className="streak-card__icon" aria-hidden="true">
            🏆
          </span>
          <span className="streak-card__value">{bestStreak}</span>
          <span className="streak-card__label">Best</span>
        </div>
      </div>
      {showStreakWarning && (
        <p className="streak-card__warning" role="status">
          ⚠️ Complete your daily missions today to keep the streak alive!
        </p>
      )}
      {isStreakBroken && (
        <p className="streak-card__broken" role="status">
          💔 Streak lost. Start a new one today!
        </p>
      )}
    </section>
  );
}
