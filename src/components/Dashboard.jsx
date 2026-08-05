import PlayerCard from "./PlayerCard.jsx";
import RankDisplay from "./RankDisplay.jsx";
import StatsCard from "./StatsCard.jsx";
import DailyProgressCard from "./DailyProgressCard.jsx";

/**
 * RPG-style productivity dashboard grid. Composes the player,
 * mastery, stats, and daily-progress cards into a responsive layout.
 */
export default function Dashboard({
  profile,
  levelInfo,
  rankInfo,
  streak,
  missionState,
}) {
  return (
    <section className="dashboard" aria-label="RPG productivity dashboard">
      <PlayerCard
        profile={profile}
        levelInfo={levelInfo}
        rankInfo={rankInfo}
        streak={streak}
      />
      <div className="dashboard__grid">
        <RankDisplay
          rankInfo={rankInfo}
          totalFocusMinutes={profile?.totalFocusMinutes ?? 0}
        />
        <DailyProgressCard missionState={missionState} />
      </div>
      <StatsCard profile={profile} />
    </section>
  );
}
