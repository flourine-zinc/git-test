import XPBar from "./XPBar.jsx";

/**
 * Shows today's overall mission progress as a single bar.
 */
export default function DailyProgressCard({ missionState }) {
  const { missions = [] } = missionState ?? {};
  const completedCount = missions.filter((mission) => mission.completed).length;
  const total = missions.length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <section className="card daily-progress-card" aria-label="Daily progress">
      <div className="daily-progress-card__header">
        <div>
          <p className="card__label">DAILY PROGRESS</p>
          <h3 className="daily-progress-card__title">Today's Missions</h3>
        </div>
        <span className="daily-progress-card__count">
          {completedCount}/{total}
        </span>
      </div>

      <XPBar
        percent={percent}
        ariaLabel="Daily mission completion"
        fillColor="var(--color-success)"
      />
    </section>
  );
}
