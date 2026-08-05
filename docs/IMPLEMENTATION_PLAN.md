# Quest Log — Multi-User Backend Implementation Plan

> Phase 0 deliverable: architecture proposal. No code changes to the
> existing frontend are made until this plan is approved.
>
> The existing RPG systems (todos, XP/leveling, dashboard, daily
> missions, focus timer, streaks, achievements, localStorage) are
> preserved unchanged. This plan adds a backend and migrates persistence.

---

## 1. Recommended Technology Stack

### Backend — Node.js + Express (JavaScript throughout the stack)

| Layer                   | Choice                                       | Why                                                                                                                       |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Runtime                 | Node.js 20+ LTS                              | Same language as the frontend; large ecosystem; type-checking via JSDoc or TS optional                                    |
| Framework               | Express 5                                    | Minimal, battle-tested, huge middleware ecosystem                                                                         |
| Database                | PostgreSQL 16                                | Proper relational modeling (users/tasks/friends/teams/achievements), constraints, transactions, JSONB for flexible fields |
| ORM                     | Prisma 5                                     | Type-safe schema, migrations, seed scripts, relational queries with `include`                                             |
| Auth                    | Google OAuth 2.0 + httpOnly session cookies  | Low-friction Gmail login, no password storage, battle-tested flow                                                         |
| Validation              | Zod                                          | Runtime validation of all API inputs (shared concern)                                                                     |
| Real-time (later phase) | Socket.IO                                    | Collaborative team updates, friend notifications, live presence                                                           |
| Testing                 | Vitest + Supertest                           | Fast unit + integration tests                                                                                             |
| Hosting                 | Railway / Render / Fly.io (Postgres managed) | Simple deploys, managed DB, HTTPS, env secrets                                                                            |

### Frontend — keep React + Vite, add:

| Library                 | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `react-router-dom`      | Pages: Dashboard, Profile, Friends, Teams, Auth             |
| `@tanstack/react-query` | Server-state fetching, caching, optimistic updates, retries |
| `axios`                 | HTTP client with interceptors (attach session, handle 401)  |
| `zustand` (or Context)  | Thin client auth/session store                              |

### Project layout (frontend/backend separated)

```
git-test/
├── backend/                     # NEW — Express API
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── migrations/          # Versioned SQL migrations
│   ├── src/
│   │   ├── index.js             # Entry point
│   │   ├── app.js               # Express app (middleware wiring)
│   │   ├── config.js            # Env config
│   │   ├── middlewares/         # auth, errorHandler, rateLimiter, validate
│   │   ├── routes/              # routers per resource
│   │   ├── controllers/         # HTTP layer (parse/respond)
│   │   ├── services/            # business logic (game math, friends, teams)
│   │   ├── repositories/        # data access (Prisma queries)
│   │   ├── utils/               # jwt, oauth, csv, etc.
│   │   └── seed.js              # seed achievements, ranks, mission templates
│   ├── .env.example
│   └── package.json
├── src/                         # EXISTING frontend (modified in phases)
│   ├── api/                     # NEW — server client + query hooks
│   ├── components/              # EXISTING + new pages/components
│   ├── hooks/                   # EXISTING (persistence swapped behind repo)
│   ├── utils/storage.js         # becomes offline cache + sync queue
│   └── ...
└── docs/IMPLEMENTATION_PLAN.md
```

---

## 2. Database Structure (PostgreSQL, normalized)

> Naming: snake_case; all tables have `created_at`/`updated_at` timestamps.
> Soft deletes (`deleted_at`) where destructive actions exist.

### Core identity

**`users`** — auth identity
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| google_sub | TEXT UNIQUE | Google OAuth subject identifier |
| email | CITEXT UNIQUE NOT NULL | verified by Google |
| email_verified | BOOLEAN | from Google id_token |
| username | TEXT UNIQUE | user-chosen display name |
| avatar_url | TEXT | Google picture / custom upload URL |
| last_login_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ NULL | soft delete |
| created_at / updated_at | TIMESTAMPTZ | |

**`sessions`** — login sessions (revocable)
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users ON DELETE CASCADE | |
| token_hash | TEXT UNIQUE | SHA-256 of session token (never store raw) |
| expires_at | TIMESTAMPTZ | |
| user_agent / ip | TEXT | audit |
| revoked_at | TIMESTAMPTZ NULL | logout / revoke |

### Game data (1:1 with user)

**`profiles`** — RPG progression
| column | type | notes |
|---|---|---|
| user_id | UUID PK/FK → users | 1:1 |
| level | INT | derived from XP, cached |
| xp | BIGINT | |
| rank | TEXT | Beginner…Legendary, derived from focus minutes |
| current_streak | INT | |
| best_streak | INT | |
| last_completed_day | DATE NULL | for streak logic |
| total_completed_tasks | INT | lifetime |
| total_focus_minutes | INT | lifetime |
| updated_at | TIMESTAMPTZ | |

**`streak_history`** — day-by-day streak record
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| day | DATE | unique per (user_id, day) |
| completed_at | TIMESTAMPTZ | |

### Tasks

**`todos`** — personal tasks
| column | type | notes |
|---|---|---|
| id | UUID PK | stable across devices |
| user_id | UUID FK → users | owner |
| title | TEXT | indexed |
| completed | BOOLEAN | |
| priority | ENUM('low','medium','high','critical') | |
| category | ENUM('coding','study','exercise','personal','learning') | |
| xp_reward | INT | snapshot at creation |
| created_at / updated_at / completed_at | TIMESTAMPTZ | |

### Focus

**`focus_sessions`** — completed focus sessions
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| started_at / ended_at | TIMESTAMPTZ | |
| duration_minutes | INT | |
| source | ENUM('solo','team') | team sessions reference team task below |

### Achievements

**`achievements`** — static definitions (seeded, not user-owned)
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| code | TEXT UNIQUE | e.g. `first-task` |
| title / description / icon | TEXT | |

**`user_achievements`** — unlock records (composite PK)
| column | type | notes |
|---|---|---|
| user_id | UUID FK | |
| achievement_id | UUID FK | |
| unlocked_at | TIMESTAMPTZ | |
| PK (user_id, achievement_id) | | |

### Daily missions

**`daily_mission_templates`** — static seeded templates
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| code | TEXT UNIQUE | `mission-tasks-5` etc. |
| type | ENUM('tasks','xp','focus') | |
| label | TEXT | |
| target | INT | |

**`daily_mission_progress`** — per-user, per-day progress
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| template_id | UUID FK | |
| day | DATE | unique (user_id, template_id, day) |
| progress | INT | |
| completed | BOOLEAN | |

### Friends

**`friend_requests`**
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| sender_id | UUID FK → users | |
| receiver_id | UUID FK → users | |
| status | ENUM('pending','accepted','rejected','cancelled') | |
| created_at | TIMESTAMPTZ | |
| responded_at | TIMESTAMPTZ NULL | |
| UQ (sender_id, receiver_id) | | prevents duplicate requests |

**`friendships`** — symmetric edges (both directions stored for simple queries)
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| friend_id | UUID FK | |
| created_at | TIMESTAMPTZ | |
| UQ (user_id, friend_id) | | |

### Teams & collaborative productivity

**`teams`**
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT | |
| description | TEXT | |
| avatar_url | TEXT NULL | |
| created_by | UUID FK → users | |
| created_at | TIMESTAMPTZ | |

**`team_members`** (composite PK)
| column | type | notes |
|---|---|---|
| team_id | UUID FK | |
| user_id | UUID FK | |
| role | ENUM('owner','admin','member') | |
| joined_at | TIMESTAMPTZ | |
| PK (team_id, user_id) | | |

**`team_tasks`** — shared quests
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK | |
| title | TEXT | |
| description | TEXT | |
| status | ENUM('open','in_progress','completed') | |
| created_by | UUID FK → users | |
| assigned_to | UUID FK → users NULL | single assignee (or null = all members) |
| completed_by | UUID FK → users NULL | |
| created_at / updated_at / completed_at | TIMESTAMPTZ | |

**`team_task_contributions`** — per-member contribution to a task
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| team_task_id | UUID FK → team_tasks | |
| user_id | UUID FK → users | |
| focus_minutes | INT | contributed focus time |
| task_completed | BOOLEAN | set when user marks task complete |
| UQ (team_task_id, user_id) | | one contribution row per member |

**`team_focus_sessions`** — focus sessions attributed to a team task
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| team_task_id | UUID FK | |
| user_id | UUID FK | |
| started_at / ended_at | TIMESTAMPTZ | |
| duration_minutes | INT | |

### Relationship diagram (core)

```
users 1──1 profiles
users 1──N sessions
users 1──N todos
users 1──N focus_sessions
users 1──N streak_history
users N──M achievements   (via user_achievements)
users 1──N daily_mission_progress
users 1──N friend_requests (as sender/receiver)
users N──M friendships
users N──M teams          (via team_members)
teams 1──N team_tasks
team_tasks 1──N team_task_contributions
team_tasks 1──N team_focus_sessions
```

---

## 3. Authentication Flow (Google OAuth 2.0)

### Flow

```
Browser                          Backend                          Google
  │  GET /api/v1/auth/google        │                               │
  │────────────────────────────────>│  generate state (PKCE)        │
  │ 302 → accounts.google.com ...   │<──────────────────────────────│
  │<────────────────────────────────│                               │
  │  → consent page                  │                              │
  │<───────────────────────────────────────────────────────────────>│
  │  callback?code=...&state=...     │                               │
  │────────────────────────────────>│  verify state                 │
  │                                 │  exchange code for tokens     │
  │                                 │──────────────────────────────>│
  │                                 │  verify id_token signature,   │
  │                                 │  iss, aud, exp, email_verified│
  │                                 │<──────────────────────────────│
  │                                 │  find-or-create user          │
  │                                 │  create profile on first login│
  │                                 │  create session row           │
  │  Set-Cookie: session=<opaque>   │                               │
  │<────────────────────────────────│                               │
  │  /auth/callback → redirect /app │                               │
```

1. **Initiate:** frontend links to `/api/v1/auth/google`. Backend generates a random `state` (with PKCE `code_verifier`), stores it briefly, redirects to Google.
2. **Callback:** Google redirects to `/api/v1/auth/google/callback?code&state`. Backend:
   - verifies `state` matches (CSRF protection)
   - exchanges `code` for tokens
   - verifies the **id_token**: signature (Google JWKS), `iss`, `aud`, `exp`, and `email_verified === true`
3. **Find-or-create user** by `google_sub`. On first login, create `profiles` row with defaults (level 1, xp 0, rank "Beginner"). `username` defaults to a sanitized email prefix; `avatar_url` defaults to Google picture.
4. **Session:** create a `sessions` row storing only a SHA-256 hash of the token. Set an **httpOnly, Secure, SameSite=Lax** cookie (`quest_session`).
5. **Frontend:** on app boot, `GET /api/v1/auth/me` restores the user. On 401, show a login screen.
6. **Logout:** `POST /api/v1/auth/logout` revokes the session row (server-side revocation) and clears the cookie.

### Session middleware

- Every protected route runs `requireAuth`: verify cookie → hash → lookup session (not expired, not revoked) → load user → attach `req.user`.
- Session expiry: 30 days, sliding renewal on activity.
- **No JWT in localStorage** — the opaque token lives only in the httpOnly cookie (XSS-safe).

---

## 4. API Architecture

REST over `https://api.example.com/api/v1/...`, versioned, JSON only.

### Layers

```
Route (path+zod schema)
  → Controller (parse request, call service, map HTTP status)
  → Service (business logic — game math, friendship rules, team rules)
  → Repository (Prisma queries — single place touching the DB)
```

### Convention

- `GET` list/read, `POST` create, `PATCH` partial update, `DELETE` remove
- Responses: `{ data: ... }` on success, `{ error: { code, message, details? } }` on failure
- Pagination: `?limit=&cursor=` (cursor-based)
- All input validated with Zod; invalid → 400 with field details
- Rate limits: auth endpoints 100/hr, friend requests 30/hr, general 300/min per IP
- `helmet` + CORS allowlist (frontend origin only) + `express.json()` size limit

### Endpoint map

**Auth**
| Method | Path | Description |
|---|---|---|
| GET | `/auth/google` | start OAuth |
| GET | `/auth/google/callback` | OAuth callback |
| POST | `/auth/logout` | revoke session |
| GET | `/auth/me` | current user + profile |

**Sync / migration**
| Method | Path | Description |
|---|---|---|
| POST | `/sync/migrate` | push localStorage bundle on first login |
| GET | `/sync/export` | full user data export (device change backup) |
| GET | `/sync/changes?since=` | incremental changes since timestamp |
| POST | `/sync/push` | batch upsert of local changes (offline queue flush) |

**Profile**
| Method | Path | Description |
|---|---|---|
| GET | `/profile` | own full profile + stats |
| PATCH | `/profile` | update username / avatar / info |
| GET | `/profile/:userId` | **public** stats for friends (level, xp, rank, streak, focus hours, achievements only — never email) |

**Friends**
| Method | Path | Description |
|---|---|---|
| GET | `/users/search?q=` | search by username (friends + strangers, minimal info) |
| GET | `/friends` | friends list with public stats |
| GET | `/friends/requests` | incoming + outgoing |
| POST | `/friends/requests` | send request `{ receiverId }` |
| POST | `/friends/requests/:id/accept` | accept |
| POST | `/friends/requests/:id/reject` | reject |
| DELETE | `/friends/:userId` | remove friend |

**Teams**
| Method | Path | Description |
|---|---|---|
| GET | `/teams` | my teams (with member counts) |
| POST | `/teams` | create team |
| GET | `/teams/:id` | team detail + members + tasks + stats |
| PATCH | `/teams/:id` | rename / description |
| POST | `/teams/:id/members` | invite friend |
| DELETE | `/teams/:id/members/:userId` | leave / remove |
| POST | `/teams/:id/tasks` | create team quest (assign member) |
| PATCH | `/teams/:id/tasks/:taskId` | update / assign / complete |
| POST | `/teams/:id/tasks/:taskId/focus` | report team focus session (source='team') |
| GET | `/teams/:id/stats` | total team focus hours, completed tasks, contribution per member |

---

## 5. Migration from localStorage to Database

### Strategy: explicit export + idempotent server upsert

1. **First login detection**
   - App stores `gamify.migratedAt` in localStorage after a successful migration.
   - On first login after update, if `gamify.migratedAt` is absent **and** any localStorage data exists → show a migration prompt ("Import your local progress?").
2. **Client bundle**
   - `src/utils/storage.js` gains a `collectLocalData()` that reads all five keys (`todos`, `gamify.user`, `gamify.dailyMissions`, `gamify.focusSessions`, `gamify.achievements`) and returns one normalized bundle. The existing validation/normalization functions are reused unchanged.
3. **Server upsert** — `POST /sync/migrate` (auth required)
   - Server checks whether the user already has any server data:
     - **Empty account** → import everything. Todos/focus sessions/achievements are upserted by their existing stable string ids (mapped to UUIDs server-side once) so re-syncs are idempotent. Profile fields merge: keep higher XP, max streaks, etc. `streak_history` rebuilt from `last_completed_day`.
     - **Non-empty account** → return `{ conflict: true }` with a summary. Frontend asks the user to choose **Merge** (server keeps latest per `updatedAt`) or **Overwrite/Replace** (explicit confirmation, old data archived to a backup table) or **Keep server** (skip import).
4. **After success:** set `gamify.migratedAt`, clear local sync queue, re-fetch from server.

### Ongoing persistence model (post-migration)

```
Frontend hooks (unchanged)
      │ setState
      ▼
Repository layer (NEW abstraction)
      ├── read: server first (React Query), localStorage as offline cache
      └── write: optimistic → localStorage → sync queue → server
```

- Hooks like `useTodos`/`useProgress` keep their **same public API** — components do not change.
- Persistence calls swap from direct `saveTodos(...)` to a repository that writes through:
  1. update React state (optimistic)
  2. write to localStorage (offline cache)
  3. enqueue in a pending-op queue (IndexedDB `sync-outbox`)
  4. flush to server when online; retry with backoff on failure
- `SyncOutbox` table: `{ id, endpoint, payload, createdAt }` — flushed in order on reconnect/online event.
- Service worker change: API requests bypass the cache-first strategy; only same-origin app-shell assets are cached (network-first for `/api/`).

### Conflict resolution rules (incremental sync)

- **Todos:** last-write-wins by `updatedAt`; server stores both, returns merged list.
- **Profile counters:** additive fields (`total_focus_minutes`, `total_completed_tasks`, `xp` gained) merge by **sum of deltas**; we record deltas in the sync payload, not absolute values, where feasible. Simpler v1: server is authoritative after migration; conflicts resolved by `updatedAt`.
- **Focus sessions:** append-only, dedupe by `id`.
- **Achievements:** union of unlocked ids.
- **Streak:** computed server-side from `streak_history`; client pushes `registerDayCompleted` events.

---

## 6. Security Considerations

| Concern       | Mitigation                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Session theft | httpOnly + Secure + SameSite=Lax cookie; opaque random token; server-side revocation; sliding expiry; token stored hashed        |
| CSRF          | SameSite=Lax + Origin/Referer check on state-changing requests + OAuth `state` param                                             |
| XSS           | No tokens in localStorage; React escaping; CSP header; sanitized username/avatar input                                           |
| OAuth abuse   | PKCE code verifier, strict `state` validation, id_token verification (iss/aud/exp/email_verified), HTTPS-only redirect URIs      |
| Data leaks    | Public profile endpoint whitelists fields (never email, google_sub, IP); friend-only stats gated; Zod response DTOs              |
| Injection     | Prisma parameterized queries only; no raw SQL                                                                                    |
| Rate limiting | express-rate-limit on auth, friend requests, search                                                                              |
| Secrets       | `.env` only in backend, never in frontend; rotating session/oauth secrets; env example committed with placeholders               |
| Abuse         | Avatar URL allowlist (https + known provider domains); username uniqueness + regex validation; per-user write quotas             |
| Privacy       | Friend search shows only username + avatar; email never displayed to other users; account deletion wipes all user data (cascade) |
| Audit         | `last_login_at`, session IP/UA logs, `updated_at` on all rows, immutable append-only focus_sessions + streak_history             |
| Transport     | HTTPS enforced everywhere; HSTS header                                                                                           |

---

## 7. Implementation Order (phases)

Each phase is independently shippable; the app remains functional at every step.

### Phase 0 — Backend scaffold + auth + database ✔

- [x] Create `backend/` (Express + Prisma + PostgreSQL) with `.env.example`
- [x] Prisma schema for all tables above; first migration; seed `achievements`, `daily_mission_templates`, ranks
- [x] Google OAuth flow (start/callback/me/logout), session cookie middleware
- [x] Error handling, Zod validation, rate limiting, helmet, CORS
- [x] `GET /auth/me` + login screen on frontend (no other UI changes)
- **Exit criteria:** user logs in with Google, profile row created, session persists across refresh, logout revokes.

### Phase 1 — Cloud save (migration + sync)

- [ ] `POST /sync/migrate` with merge/overwrite conflict handling
- [ ] Frontend `src/api/` client + React Query provider
- [ ] Repository abstraction: hooks read server → write-through local + outbox
- [ ] Offline sync queue (IndexedDB outbox) + reconnect flush
- [ ] `POST /sync/push` incremental sync + conflict rules
- **Exit criteria:** fresh login on another device restores progress; localStorage import works once; offline edits flush on reconnect.

### Phase 2 — Profile customization

- [ ] Profile page (`/profile`): edit username, avatar, stats
- [ ] Public profile endpoint with whitelisted fields
- [ ] Update Dashboard to read from server profile
- **Exit criteria:** user can change username/avatar; stats view accurate.

### Phase 3 — Friend system

- [ ] User search, friend requests (send/accept/reject), friends list
- [ ] Friend profiles showing public game stats only
- **Exit criteria:** two accounts can become friends and view each other's public stats.

### Phase 4 — Teams / collaborative productivity

- [ ] Teams CRUD, member invites (friend-only initial)
- [ ] Team quests: create, assign, complete together
- [ ] Team focus sessions → contribution per member, team stats (`total_focus_hours`, `completed_team_tasks`, per-member breakdown)
- [ ] (Optional stretch) Socket.IO live updates
- **Exit criteria:** team quest "Build Portfolio Website" tracks 5h + 3h = 8h total with per-member contribution.

### Phase 5 — Hardening & polish

- [ ] Integration tests (auth, sync, friends, teams)
- [ ] Rate-limit tuning, audit logs, backup/restore
- [ ] README deployment guide, `.env.example` docs
- [ ] PWA offline → online sync polish

---

## What does NOT change

- All existing RPG systems (XP/level/rank/streak/achievements/missions/focus timer)
- `gameMath.js`, `date.js`, `gameConfig.js` pure logic
- Hook public APIs consumed by components
- Visual design / styles
- The `utils/storage.js` validation + normalization helpers (they become the import/migration source + offline cache)

## Open questions before Phase 0 coding

1. Hosting preference for Postgres/backend (Railway, Render, Fly.io, local Docker)?
   Frontend:
   Vercel

Backend:
Render or Railway

Database:
Supabase PostgreSQL 2. Should avatars allow custom uploads or Google-picture-only initially?
Google-picture-only initially 3. Team invites restricted to friends first, or search-anyone?
Team invites restricted to friends first
