/**
 * Grid of lifetime stats shown on the dashboard.
 */
export default function StatsCard({ profile }) {
  const {
    totalCompletedTasks = 0,
    totalFocusMinutes = 0,
    currentStreak = 0,
    bestStreak = 0,
  } = profile ?? {};

  const stats = [
    { icon: "✅", label: "Tasks Done", value: totalCompletedTasks },
    {
      icon: "⏱️",
      label: "Focus Hours",
      value: `${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`,
    },
    { icon: "🔥", label: "Current Streak", value: currentStreak },
    { icon: "🏆", label: "Best Streak", value: bestStreak },
  ];

  return (
    <section className="card stats-card" aria-label="Lifetime statistics">
      <p className="card__label">STATISTICS</p>
      <div className="stats-card__grid">
        {stats.map((stat) => (
          <div className="stats-card__item" key={stat.label}>
            <span className="stats-card__icon" aria-hidden="true">
              {stat.icon}
            </span>
            <span className="stats-card__value">{stat.value}</span>
            <span className="stats-card__label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
