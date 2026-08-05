import XPBar from "./XPBar.jsx";

/**
 * Achievement grid showing locked/unlocked states with progress
 * toward locked goals.
 */
export default function AchievementCard({ achievements = [] }) {
  const unlockedCount = achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;

  return (
    <section className="card achievement-card" aria-label="Achievements">
      <div className="achievement-card__header">
        <p className="card__label">ACHIEVEMENTS</p>
        <span className="achievement-card__count">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      {achievements.length === 0 ? (
        <p className="achievement-card__empty">No achievements yet. 🎮</p>
      ) : (
        <ul className="achievement-card__grid">
          {achievements.map((achievement) => (
            <li
              className={`achievement-card__item${achievement.unlocked ? " achievement-card__item--unlocked" : " achievement-card__item--locked"}`}
              key={achievement.id}
            >
              <span className="achievement-card__icon" aria-hidden="true">
                {achievement.unlocked ? achievement.icon : "🔒"}
              </span>
              <div className="achievement-card__body">
                <span className="achievement-card__title">
                  {achievement.title}
                </span>
                <span className="achievement-card__desc">
                  {achievement.description}
                </span>
              </div>
              {!achievement.unlocked && (
                <XPBar
                  percent={achievement.progress ?? 0}
                  ariaLabel={`Progress for ${achievement.title}`}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
