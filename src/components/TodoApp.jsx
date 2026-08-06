import { useEffect, useMemo } from "react";
import useTodos from "../hooks/useTodos.js";
import useProgress from "../hooks/useProgress.js";
import useDailyMission from "../hooks/useDailyMission.js";
import useTimer from "../hooks/useTimer.js";
import useStreak from "../hooks/useStreak.js";
import useAchievements from "../hooks/useAchievements.js";

import Dashboard from "./Dashboard.jsx";
import DailyMission from "./DailyMission.jsx";
import FocusTimer from "./FocusTimer.jsx";
import MasteryCard from "./MasteryCard.jsx";
import StreakCard from "./StreakCard.jsx";
import AchievementCard from "./AchievementCard.jsx";
import TodoForm from "./TodoForm.jsx";
import TodoList from "./TodoList.jsx";
import TodoFilter from "./TodoFilter.jsx";

export default function TodoApp() {
  // TEMPORARY auth diagnostics — proof that TodoApp mounts after a
  // successful authentication state transition.
  console.debug("[TodoApp] MOUNTED (rendered because state=authenticated)");

  const todos = useTodos();
  const progress = useProgress();
  const timer = useTimer();
  const streak = useStreak(progress.profile, progress.registerDayCompleted);
  const dailyMission = useDailyMission();
  const achievements = useAchievements(
    progress.profile,
    progress.unlockedAchievements,
  );

  // Persist any newly unlocked achievements.
  useEffect(() => {
    if (achievements.newlyUnlocked.length > 0) {
      progress.unlockAchievements(achievements.newlyUnlocked);
    }
  }, [achievements.newlyUnlocked]);

  const filterCounts = useMemo(() => {
    const all = todos.todos.length;
    const completed = todos.todos.filter((todo) => todo.completed).length;
    return { all, active: all - completed, completed };
  }, [todos.todos]);

  function handleToggleTodo(id) {
    const todo = todos.todos.find((item) => item.id === id);
    if (!todo) return;

    if (!todo.completed) {
      progress.registerTaskCompleted(todo.xpReward ?? 0);
      progress.registerDayCompleted();
      dailyMission.recordProgress("tasks", 1);
    } else {
      progress.registerTaskUncompleted(todo.xpReward ?? 0);
    }

    todos.toggleTodo(id);
  }

  function handleAddTodo(title, priority, category) {
    return todos.addTodo(title, priority, category);
  }

  function handleEditTodo(id, title, priority, category) {
    return todos.editTodo(id, title, priority, category);
  }

  function handleTimerComplete() {
    const session = timer.complete();
    if (!session) {
      return;
    }
    const result = progress.addFocusSession({
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationMinutes: session.durationMinutes,
    });
    if (result) {
      dailyMission.recordProgress("focus", result.session.durationMinutes);
      dailyMission.recordProgress("xp", result.xpGained);
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">⚔️ Quest Log</h1>
        <p className="app__subtitle">Your RPG productivity dashboard</p>
      </header>

      <main className="app__layout">
        <div className="app__dashboard">
          <Dashboard
            profile={progress.profile}
            levelInfo={progress.levelInfo}
            rankInfo={progress.rankInfo}
            streak={{
              currentStreak: streak.currentStreak,
              bestStreak: streak.bestStreak,
              showStreakWarning: streak.showStreakWarning,
              isNewRecord: streak.isNewRecord,
            }}
            missionState={dailyMission.missionState}
          />
          <DailyMission missionState={dailyMission.missionState} />
        </div>

        <div className="app__content">
          <TodoForm onAdd={handleAddTodo} />

          <FocusTimer
            status={timer.status}
            secondsLeft={timer.secondsLeft}
            totalSeconds={timer.totalSeconds}
            onStart={timer.start}
            onPause={timer.pause}
            onResume={timer.resume}
            onReset={timer.reset}
            onComplete={handleTimerComplete}
          />
        </div>
      </main>

      <section className="app__trackers">
        <MasteryCard totalFocusMinutes={progress.profile.totalFocusMinutes} />
        <StreakCard
          currentStreak={streak.currentStreak}
          bestStreak={streak.bestStreak}
          showStreakWarning={streak.showStreakWarning}
          isStreakBroken={streak.isStreakBroken}
        />
      </section>

      <section className="app__todos" aria-label="Your quests">
        <TodoFilter
          filter={todos.filter}
          onChange={todos.setFilter}
          counts={filterCounts}
          category={todos.category}
          onCategoryChange={todos.setCategory}
        />
        <TodoList
          todos={todos.visibleTodos}
          onToggle={handleToggleTodo}
          onEdit={handleEditTodo}
          onDelete={todos.deleteTodo}
        />
      </section>

      <section className="app__achievements">
        <AchievementCard achievements={achievements.achievements} />
      </section>
    </div>
  );
}
