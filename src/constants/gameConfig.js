/**
 * Static game definitions shared across hooks and components.
 * Kept separate from logic and UI so they can be tuned in one place.
 */

/** Task priority options with display labels and colors. */
export const PRIORITIES = {
  low: { label: "Low", color: "#38bdf8" },
  medium: { label: "Medium", color: "#a78bfa" },
  high: { label: "High", color: "#fb923c" },
  critical: { label: "Critical", color: "#f87171" },
};

/** Task category options with display labels. */
export const CATEGORIES = {
  coding: "Coding",
  study: "Study",
  exercise: "Exercise",
  personal: "Personal",
  learning: "Learning",
};

/** Daily mission templates. Progress types:
 *  - "tasks"    counts completed tasks
 *  - "xp"       counts earned XP
 *  - "focus"    counts focused minutes
 */
export const DAILY_MISSIONS = [
  {
    id: "mission-tasks-5",
    type: "tasks",
    label: "Complete 5 tasks",
    target: 5,
  },
  { id: "mission-xp-100", type: "xp", label: "Earn 100 XP", target: 100 },
  {
    id: "mission-focus-60",
    type: "focus",
    label: "Focus for 60 minutes",
    target: 60,
  },
];

/** Achievement definitions, evaluated against lifetime stats. */
export const ACHIEVEMENTS = [
  {
    id: "first-task",
    title: "First Task",
    description: "Complete your first task",
    icon: "⚔️",
    check: (stats) => stats.totalCompletedTasks >= 1,
  },
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Complete 10 tasks",
    icon: "🛡️",
    check: (stats) => stats.totalCompletedTasks >= 10,
  },
  {
    id: "focused-10h",
    title: "Focused",
    description: "Reach 10 hours focus time",
    icon: "⏳",
    check: (stats) => stats.totalFocusMinutes >= 10 * 60,
  },
  {
    id: "master-500h",
    title: "Master",
    description: "Reach 500 focus hours",
    icon: "👑",
    check: (stats) => stats.totalFocusMinutes >= 500 * 60,
  },
];

/** Default focus session length in minutes. */
export const DEFAULT_FOCUS_MINUTES = 25;
