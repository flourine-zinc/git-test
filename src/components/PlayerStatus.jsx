import { formatMinutes } from "../utils/gameMath.js";

/**
 * Pure display component for the player progression dashboard.
 * Receives profile data and derived info through props — no game
 * logic lives here.
 */
export default function PlayerStatus({
  profile,
  levelInfo,
  rankInfo,
  minutesLabel,
}) {
  const xpPercent = levelInfo?.progressPercent ?? 0;
  const rankPercent = rankInfo?.progressPercent ?? 0;
  const focusMinutes =
    typeof profile?.totalFocusMinutes === "number"
      ? profile.totalFocusMinutes
      : 0;
  const completedTasks =
    typeof profile?.totalCompletedTasks === "number"
      ? profile.totalCompletedTasks
      : 0;

  return (
    <section className="player-status" aria-label="Player status">
      <div className="player-status__header">
        <div>
          <p className="player-status__label">PLAYER STATUS</p>
          <h2 className="player-status__level">Level {profile?.level ?? 1}</h2>
          <p className="player-status__rank">{profile?.rank ?? "Beginner"}</p>
        </div>
        <div className="player-status__stats">
          <div className="player-status__stat">
            <span className="player-status__stat-value">{completedTasks}</span>
            <span className="player-status__stat-label">Tasks Done</span>
          </div>
        </div>
      </div>

      <div className="player-status__xp">
        <div className="player-status__bar-label">
          <span>XP</span>
          <span>
            {levelInfo?.currentLevelXp ?? 0} /{" "}
            {levelInfo?.xpForNextLevel ?? 100}
          </span>
        </div>
        <div
          className="player-status__bar"
          role="progressbar"
          aria-valuenow={xpPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Experience points"
        >
          <span
            className="player-status__bar-fill"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>

      <div className="player-status__grid">
        <div className="player-status__cell">
          <span className="player-status__cell-label">Focus Time</span>
          <span className="player-status__cell-value">
            {formatMinutes(focusMinutes)}
          </span>
        </div>
        <div className="player-status__cell">
          <span className="player-status__cell-label">Rank Progress</span>
          <div
            className="player-status__bar player-status__bar--small"
            role="progressbar"
            aria-valuenow={rankPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Rank progress"
          >
            <span
              className="player-status__bar-fill"
              style={{ width: `${rankPercent}%` }}
            />
          </div>
          <span className="player-status__cell-hint">
            {rankInfo?.nextRank
              ? `${formatMinutes(rankInfo.minutesToNext)} to ${rankInfo.nextRank.title}`
              : "Max rank reached"}
          </span>
        </div>
      </div>

      {minutesLabel && (
        <p className="player-status__minutes-hint">{minutesLabel}</p>
      )}
    </section>
  );
}
