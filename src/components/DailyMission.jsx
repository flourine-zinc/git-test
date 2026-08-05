import XPBar from "./XPBar.jsx";

/**
 * Displays the daily mission list with per-mission progress bars and
 * completion states.
 */
export default function DailyMission({ missionState }) {
  const { missions = [] } = missionState ?? {};

  if (missions.length === 0) {
    return (
      <section className="card daily-mission" aria-label="Daily missions">
        <p className="card__label">DAILY MISSIONS</p>
        <p className="daily-mission__empty">No missions today. 🎉</p>
      </section>
    );
  }

  return (
    <section className="card daily-mission" aria-label="Daily missions">
      <p className="card__label">DAILY MISSIONS</p>
      <ul className="daily-mission__list">
        {missions.map((mission) => {
          const percent = Math.min(
            100,
            Math.round((mission.progress / mission.target) * 100),
          );
          return (
            <li
              className={`daily-mission__item${mission.completed ? " daily-mission__item--completed" : ""}`}
              key={mission.id}
            >
              <div className="daily-mission__row">
                <span className="daily-mission__icon" aria-hidden="true">
                  {mission.completed ? "✅" : "📜"}
                </span>
                <span className="daily-mission__label">{mission.label}</span>
                <span className="daily-mission__progress">
                  {Math.min(mission.progress, mission.target)}/{mission.target}
                </span>
              </div>
              <XPBar
                percent={percent}
                ariaLabel={`Progress for ${mission.label}`}
                fillColor={
                  mission.completed
                    ? "var(--color-success)"
                    : "var(--color-primary)"
                }
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
