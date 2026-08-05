# Gamified Productivity System Rules

## Project Vision

Transform this Todo List application into a gamified productivity tracker inspired by RPG progression systems.

The app should feel like a personal leveling system where completing tasks, maintaining habits, and tracking focus time contribute to character progression.

The goal is not just task management, but building consistency and rewarding long-term growth.

---

# Core Concepts

## User Profile System

Create a user progression system containing:

- Level
- Experience points (XP)
- Current streak
- Longest streak
- Total completed tasks
- Total focus hours
- Rank/title

Example ranks:

- Beginner
- Apprentice
- Disciplined
- Elite
- Master
- Grandmaster
- Legendary

Ranks should unlock based on measurable achievements.

Example:
0 hours Beginner
50 hours Apprentice
100 hours Disciplined
250 hours Elite
500 hours Master
1000 hours Legendary

---

# Daily Mission System

Add a daily mission system.

Daily missions reset automatically at 00:00.

Examples:

- Complete 5 tasks
- Focus for 60 minutes
- Finish important tasks
- Maintain streak
- Add task

Daily mission progress should show:

Daily Mission

██████░░░░ 60%

3/5 tasks completed

---

# Streak System

Track consistency.

Rules:

- Completing daily missions maintains the streak.
- Missing a day breaks the streak.
- Show current streak and best streak.

Example:

🔥 Current Streak: 12 Days
🏆 Best Streak: 45 Days

Add motivational feedback:

- New streak record
- Streak warning
- Streak lost notification

---

# Focus Timer System

Add a productivity timer similar to Pomodoro.

Features:

- Start focus session
- Pause timer
- Stop session
- Record completed sessions

Each completed focus session adds:

- XP
- Total focus hours
- Progress toward mastery

Example:

Focus Time

Today:
2h 35m

Total:
126h 20m

Mastery Progress:
███████░░░ 25%

---

# Mastery Progress System

Create a lifetime progress tracker.

Example:

Mastery Level

126 / 500 Hours

████████░░░░░░

374 hours remaining

The goal is reaching milestones.

Achievements:
First Hour
10 Hour Warrior
100 Hour Veteran
500 Hour Master
1000 Hour Legend

---

# Task System Improvements

Tasks should support:

## Priority

- Low
- Medium
- High
- Critical

## Categories

Examples:

- Coding
- Study
- Exercise
- Personal
- Learning

## XP Rewards

Tasks give rewards:

Example:
Small task:
+10 XP

Medium task:
+25 XP

Hard task:
+50 XP

---

# User Interface Goals

The design should feel like an RPG dashboard.

Include:

## Dashboard

Show:

- Current level
- XP bar
- Daily missions
- Streak
- Focus hours
- Achievements

Example:
PLAYER STATUS

Level 12
████████░░ 80%

🔥 15 Day Streak

⚔ Today's Missions

[✓] Complete assignment
[ ] Study 2 hours
[ ] Exercise

---

# Visual Design

Avoid a plain Todo List appearance.

Use:

- Dark modern UI
- Cards
- Progress bars
- Achievement badges
- Smooth animations
- Clear hierarchy

Inspiration:

- RPG character menu
- Game achievement systems
- Fitness tracking apps

---

# Data Persistence

Store:

- Tasks
- XP
- Level
- Streak data
- Focus sessions
- Achievements

Use localStorage initially.

Structure data clearly.

Example:
user:
{
level,
xp,
streak,
totalFocusMinutes,
achievements
}

---

# Development Rules

Build features incrementally.

Order:

1. Improve dashboard design
2. Add XP and leveling
3. Add task rewards
4. Add daily missions
5. Add streak system
6. Add focus timer
7. Add achievements
8. Add animations and polish

Do not rebuild everything at once.

Maintain existing functionality.
