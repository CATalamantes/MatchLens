# MatchLens Frontend — Current State

**Scope:** read-only assessment of the `frontend` branch. Backend read via GET only; no mutating endpoints were called against the hosted database.

The two P0 blockers are cleared: the `services/` layer and auth files are present, and the app builds and runs. What remains is one router gap plus a large body of feature, data-wiring, honesty, and design-conformance work.

---

## 0. Build & run status

**Builds clean.** `npm run build` from `Code/` succeeds with 0 errors, 0 warnings (`vite v4.5.14`, 71 modules, ~5s). No syntax, JSX, or Tailwind/PostCSS failures.

**Runs.** `npm start` → `cd server && node server` → `server listening on port 3000`. `PGHOST` points at hosted Postgres and is reachable; every DB-backed GET returns real rows.

**Gotcha for the team:** `Code/node_modules` can exist but be incomplete (missing `cors` and 17 others), causing `ERR_MODULE_NOT_FOUND` on start. Run `npm install` before `npm start`. The missing packages *are* declared in `package.json`; they just weren't unpacked.

**Imports resolve.** All 78 relative + bare specifiers in the client resolve; only bare imports are `react`, `react-dom`, `react-router-dom`, all declared. Server: 0 unresolved; every bare specifier declared except Node builtins.

**Toolchain:** `node v22.22.2`, `npm 10.9.7`.

---

## 1. Inventory

### 1.1 Routes

From `App.jsx`. Everything except `/login` and `/signup` sits behind `<RequireAuth>`. **Catch-all `404` route added — fixed 2026-07-28, see §5 P0.1.**

| Path | Component | Reachable through UI? | How |
| --- | --- | --- | --- |
| `/login` | `Login` | ✅ | `RequireAuth` redirects anonymous visitors here; Sidebar "Sign Out"; Signup links here |
| `/signup` | `Signup` | ✅ | `<Link to='/signup'>` on Login |
| `/` | `Home` | ✅ | Sidebar → "Dashboard" |
| `/matches` | `Matches` | ✅ | Sidebar → "Live Football" |
| `/matches/:matchId` | `MatchDetail` | ✅ | `MatchCard` wraps `<Link>` — Home ticker + Matches grid |
| `/discover` | `Discover` | ✅ | Sidebar → "Highlights" (label/destination mismatch, §1.2) |
| `/teams/:teamId` | `TeamDetail` | ✅ **fixed 2026-07-28** | `StandingsTable`'s team `<Link>` on Home, **plus Discover's `TeamCard` now wraps its crest/name in a `<Link to='/teams/:id'>`** |
| `/players/:playerId` | `PlayerDetail` | ✅ | `PlayerCard` `<Link>` — Home top scorers, TeamDetail squad |
| `/leaderboard` | `Leaderboard` | ✅ | Sidebar → "Standings", plus Home's "ENTER LEADERBOARD" button |
| `/profile` | `Profile` | ✅ **fixed 2026-07-28** | Sidebar now has an avatar/username `<NavLink to='/profile'>`, directly above "Sign Out" |
| — | `NotFound` (`*`) | ✅ **added 2026-07-28** | Catch-all route; renders for any unmatched path instead of a blank white page |

**Fixed 2026-07-28:** the Sidebar's `mt-auto` block — previously just the "Sign Out" button — now also contains a `<NavLink to="/profile">` showing the session user's avatar (`user.profile_image_url`, read from the `matchlens_user` localStorage hint `RequireAuth` already sets) and username, directly above "Sign Out".

### 1.2 Sidebar label ↔ destination mismatches

[Sidebar/index.jsx:4-9](../Code/client/src/components/Sidebar/index.jsx#L4-L9):

| Label | Goes to | What's actually there |
| --- | --- | --- |
| "Standings" | `/leaderboard` | Fan leaderboard (ranked **users** by points). Real **team** standings live on Home. |
| "Highlights" | `/discover` | Team directory + search. Real video highlights live in MatchDetail's "Highlights" tab. |

### 1.3 Pages → components, with ownership

Shalom's issues: **#3** Fixture Calendar, **#9** Follow a Team, **#12** Profile Customization, **#14** Frontend Setup.

| Page | Renders | Owner |
| --- | --- | --- |
| `Home.jsx` | `MatchCard`, `PlayerCard`, `StandingsTable`, `StatBar`, local `TimeUnit`/`BracketMatch` | shell/#14 + shared |
| `Matches.jsx` | `MatchCard`, `ProbabilityBar`, `StatBar` | **#3 Fixture Calendar** |
| `MatchDetail.jsx` | `ProbabilityBar`, `StatBar`, `VideoPlayer`, `CommentThread`, local `PitchDot` | shared (#1) |
| `Discover.jsx` | `TeamCard`, `useTeamSearch` | **#9 Follow a Team** (search itself = #6, rijulpoudel) |
| `TeamDetail.jsx` | `PlayerCard` | shared (#1) |
| `PlayerDetail.jsx` | local `StarRating` only | shared (#1) |
| `Leaderboard.jsx` | `StandingsTable` (variant=`leaderboard`) | #10, GildardoOrea (points) |
| `Profile.jsx` | local `ToggleSwitch` only | **#12 Profile Customization** + **#9** (followed-teams block) |
| `Login.jsx` | `GitHubMark` (own CSS) | **Eric — auth, do not rewrite** |
| `Signup.jsx` | `GitHubMark` (own CSS) | **Eric — auth, do not rewrite** |

**Shell / layout only (#14):** `main.jsx`, `App.jsx`, `index.css`, `index.html`, `tailwind.config.js`, `vite.config.js`, `components/Sidebar/index.jsx`.

**Eric's auth files (all present):** `pages/Login.jsx`, `pages/Signup.jsx`, `services/AuthAPI.jsx`, `services/UsersAPI.jsx`, `components/RequireAuth.jsx`, `components/GitHubMark.jsx`, `utilities/validateLogin.js`, `utilities/validateSignup.js`, `config/api.js`, `css/Login.css`, plus the `.login-page` block in `index.css`.

**Restyle-safe vs logic:** presentation lives in `css/Login.css`, the `.login-page` block in `index.css`, and the JSX markup of `Login.jsx`/`Signup.jsx`. Do **not** touch `AuthAPI.jsx`, `UsersAPI.jsx`, `RequireAuth.jsx`, the two `validate*.js` files, the `handleSignIn`/`handleSignUp` handlers, or `config/api.js`. `AUTH_ORIGIN`'s dev/prod split and `credentials: 'include'` are load-bearing for the OAuth cookie.

**Placeholders owned by others:** `CommentThread.jsx` (#7), `VideoPlayer.jsx` (#8), `hooks/useTeamSearch.js` (#6).

### 1.4 Static assets — fixed 2026-07-28

```
Code/client/public/         →  favicon.png
Code/client/src/assets/     →  ball.png, Frame.svg (auth watermark), plus
                                Figma-exported logo/gradient/bracket source
                                files (svg + pdf) not yet wired into pages
```

**Real app logo + favicon are in.** `<img src={ballMark} .../>` replaces the lime-green circle in both [Sidebar](../Code/client/src/components/Sidebar/index.jsx#L115) and [AuthLayout](../Code/client/src/components/AuthLayout.jsx#L28-L69), and `index.html` now links `/favicon.png`.

**Crests, player photos, and user avatars no longer render as blank grey blocks.** Two shared components (`components/Avatar.jsx`, `components/Crest.jsx`, backed by `utilities/monogram.js`) render a deterministic initials badge — same name always gets the same colour/letters, drawn from a 6-swatch palette built entirely from existing design-system + dashboard tokens (`primary`, `dash-away`, `dash-gold`, `accent-pink`, `accent-blue`, neutral) — instead of `bg-white/10`. This is **not** a real crest/photo (no endpoint provides one — see §2.2, unchanged), but it replaces an honest-but-mute placeholder with an honest-and-legible one, and retires the two colour placeholders that read as something else entirely:

| Was | Now |
| --- | --- |
| `bg-white/10` grey block (17 instances) | `<Crest>` / `<Avatar>` initials badge — MatchCard, TeamCard, StandingsTable ×2, TeamDetail, MatchDetail, Home ×2, PlayerCard, PlayerDetail, CommentThread, Sidebar (profile link + followed teams), Profile header |
| Red circle (`bg-dash-live`) / blue circle (`bg-dash-away`) as MatchDetail hero crests — read as a live-status dot | `<Crest compact>` per team, same component used everywhere else |

**Still open:** no endpoint anywhere returns a crest/photo/badge URL (§2.2 unchanged), so `Crest`/`Avatar` will keep rendering initials until the football API is integrated server-side — that's backend scope, not frontend's to close. Nav/UI icons are still 5 hand-inlined SVGs with `SearchIcon` duplicated 3× (Sidebar, Matches, Discover) rather than one shared component — unchanged, still open (§6 P4). Video thumbnails (`VideoPlayer`, black block + `▶`) are unchanged — that component belongs to a different teammate (#8), out of scope here.

---

## 2. Backend data shapes

### 2.1 Endpoints the frontend actually calls

Only 8 of 21 available endpoints are wired. GET shapes below are live HTTP captures; mutating shapes (`POST`/`PATCH`/`DELETE`, and `POST /api/users/login`) are derived from the controller `RETURNING`/`SELECT` clauses rather than executed, since calling them would create or alter rows in the shared hosted database.

| Method | Path | Called from | Purpose |
| --- | --- | --- | --- |
| GET | `/api/matches` | [Home.jsx:58](../Code/client/src/pages/Home.jsx#L58) | Match ticker, hero countdown, live widget |
| GET | `/api/teams` | [Home.jsx:63](../Code/client/src/pages/Home.jsx#L63) | Standings table |
| GET | `/api/players?sort=goals` | [Home.jsx:68](../Code/client/src/pages/Home.jsx#L68) | Top scorers (`.slice(0,3)`) |
| GET | `/api/users/:id` | [Home.jsx:73](../Code/client/src/pages/Home.jsx#L73), [Profile.jsx:73](../Code/client/src/pages/Profile.jsx#L73) | Username + points |
| PATCH | `/api/users/:id` | [Profile.jsx:114](../Code/client/src/pages/Profile.jsx#L114) | Persist `profile_image_url` |
| GET | `/api/follows/user/:userId` | [Profile.jsx:78](../Code/client/src/pages/Profile.jsx#L78) | Followed-teams list |
| POST | `/api/follows` | [Profile.jsx:135](../Code/client/src/pages/Profile.jsx#L135) | Follow a team (#9) |
| DELETE | `/api/follows/:id` | [Profile.jsx:152](../Code/client/src/pages/Profile.jsx#L152) | Unfollow |
| POST | `api.cloudinary.com/.../image/upload` | [Profile.jsx:102](../Code/client/src/pages/Profile.jsx#L102) | **External**, browser→Cloudinary direct |

**Auth family** (`/auth/*`). Not behind the `/api` Vite proxy; these go to `AUTH_ORIGIN` with `credentials: 'include'` so the session cookie lands on the API origin.

| Method | Path | Called from | Purpose |
| --- | --- | --- | --- |
| GET | `/auth/login/success` | `AuthAPI.getSession()` ← `RequireAuth` | Returns `{ success, user }` or 401. **The guard's source of truth.** |
| GET | `/auth/logout` | `AuthAPI.logout()` ← Sidebar | Destroys session, clears `connect.sid` |
| GET | `/auth/github` | `<a>` on Login + Signup | Starts OAuth (`read:user`, `user:email`) |
| GET | `/auth/github/callback` | GitHub redirect | Redirects to `${CLIENT_URL}/` or `/login?error=<code>` |
| POST | `/api/users/login` | `UsersAPI.login()` | bcrypt-verified. Shape source-derived — not executed (mutating). |
| POST | `/api/users` | `UsersAPI.createUser()` | Signup; bcrypt hash, server-side uniqueness. Shape source-derived — not executed (mutating). |

**Available but unused:** `GET /api/matches/:id`, `GET /api/teams/:id`, `GET /api/players/:id`, `GET /api/users`, all of `/api/comments` (3), `/api/predictions` (2), `/api/notifications` (2), `/api/videos` (2).

That matters: **`GET /api/matches/:id`, `/api/teams/:id`, and `/api/players/:id` all exist, and all three detail pages ignore them in favour of mocks.**

### 2.2 Image / crest availability

The only image field anywhere in the API is `profile_image_url`.

| Endpoint | Image URL? |
| --- | --- |
| `GET /api/matches` | 🚩 **NONE** |
| `GET /api/teams` | 🚩 **NONE** |
| `GET /api/players` | 🚩 **NONE** |
| `GET /api/follows/user/:id` | 🚩 **NONE** (`SELECT *`, table has no crest column) |
| `GET /api/users/:id`, `GET /api/users` | ✅ `profile_image_url` (`null` for seeded users) |
| `POST /api/users`, `PATCH /api/users/:id`, `POST /api/users/login` | ✅ `profile_image_url` (source-derived — not executed, mutating) |
| `GET /auth/login/success` | ✅ `profile_image_url` (GitHub `avatar_url` for OAuth users) |

`profile_image_url` comes from a single shared constant in [usersController.js:8](../Code/server/controllers/usersController.js#L8):

```js
const PUBLIC_COLUMNS = `user_id AS id, username, email, profile_image_url, total_points AS points`;
```

…used by `getAllUsers`, `getUserById`, `login`, `createUser`, and `updateUser`'s `RETURNING`. `server.js`'s `deserializeUser` selects the same column, so the session user carries an avatar too.

**Split by surface:**
- **User avatars have a real source end-to-end** — the one image the UI can render truthfully today.
- **Team crests, player photos, and match badges have no source at all** and cannot until the football API is integrated. [matchesController.js:3](../Code/server/controllers/matchesController.js#L3), `teamsController.js:2`, `playersController.js:2` all carry `// TODO: replace the dummy data with real fetches to the football API`; grepping all three for `crest|logo|badge|image|photo|flag|thumbnail` returns zero matches. Hand-written arrays, backend-owned, not Shalom's scope.

Consequence for the 17 `bg-white/10` placeholders (§1.4): user-avatar stand-ins (Profile header, `CommentThread`, MatchDetail fan chat) can render real images now; crest and player-photo stand-ins must stay honest placeholders.

### 2.3 Sample responses

#### `GET /api/matches`
Supports `?date=YYYY-MM-DD` (exact string equality filter).
```json
[
  {"id":101,"home":"MCI","away":"LIV","home_score":2,"away_score":1,"status":"LIVE","minute":72,"date":"2026-07-23","venue":"Etihad Stadium"},
  {"id":102,"home":"RMA","away":"FCB","home_score":0,"away_score":0,"status":"HT","minute":45,"date":"2026-07-23","venue":"Santiago Bernabéu"},
  {"id":103,"home":"PSG","away":"BAY","home_score":3,"away_score":2,"status":"LIVE","minute":88,"date":"2026-07-23","venue":"Parc des Princes"},
  {"id":104,"home":"NOR","away":"ENG","home_score":null,"away_score":null,"status":"UPCOMING","minute":null,"date":"2026-07-24","venue":"Ullevaal Stadion"}
]
```
`status` ∈ `LIVE | HT | UPCOMING`. **No `FT`** — which breaks the Matches page (§3.3). `date` is a bare `YYYY-MM-DD` string, no kickoff time. No `probability` object.

#### `GET /api/teams`
```json
[
  {"id":1,"name":"Liverpool","league":"Premier League","played":24,"wins":17,"draws":3,"losses":4,"goals_scored":55,"points":54},
  {"id":2,"name":"Arsenal","league":"Premier League","played":24,"wins":16,"draws":4,"losses":4,"goals_scored":48,"points":52},
  {"id":3,"name":"Man City","league":"Premier League","played":23,"wins":15,"draws":6,"losses":2,"goals_scored":56,"points":51}
]
```
3 rows, all **Premier League clubs** — not World Cup national teams. No `goals_conceded` (TeamDetail displays it), no `group`, no `region`, no `crest`.

#### `GET /api/players?sort=goals`
```json
[
  {"id":9,"name":"Erling Haaland","team":"Manchester City","position":"ST","goals":21,"assists":5},
  {"id":11,"name":"Mohamed Salah","team":"Liverpool FC","position":"RW","goals":18,"assists":9},
  {"id":7,"name":"Bukayo Saka","team":"Arsenal","position":"RW","goals":12,"assists":11}
]
```
3 rows. Supports `?search=` and `?sort=goals`. Six keys — nothing resembling PlayerDetail's ~30 fields.

#### `GET /api/users/:id`
`SELECT user_id AS id, username, email, profile_image_url, total_points AS points FROM users WHERE user_id = $1`
```json
{"id":1,"username":"carla_t","email":"demo@matchlens.com","profile_image_url":null,"points":24580}
```
Points key is **`points`**, aliased from `total_points`. `GET /api/users/99999` → `404 {"error":"User not found"}`. `GET /api/users` returns three seeded rows (`carla_t`/`jordan_m`/`sam_fc`), all `profile_image_url: null`. `password_hash` is never exposed.

#### `PATCH /api/users/:id`
*Shape source-derived, not executed — calling it would alter a real hosted row.* Accepts `{ username?, profile_image_url?, total_points? }`, `COALESCE`s each, returns `PUBLIC_COLUMNS` including `profile_image_url` (confirmed against the `RETURNING` clause in `usersController.js:191`). This is what makes the avatar round-trip fixable (§2.4).

#### `GET /auth/login/success`
Unauthenticated:
```json
{"success":false,"message":"not authenticated"}
```
`401`. Authenticated shape (same query as `/api/users/:id` via `deserializeUser`): `{ "success": true, "user": { id, username, email, profile_image_url, points } }`. **This is the correct source for "the logged-in user"** — see §5 P1.

#### `GET /api/follows/user/:userId`
```json
[{"followed_team_id":7,"user_id":1,"api_team_id":"5","team_name":"England","followed_at":"2026-07-27T09:11:59.737Z"}]
```
`api_team_id` arrives as a string (`VARCHAR(50)`); `followed_at` is an ISO timestamp string. `POST /api/follows` and `DELETE /api/follows/:id` were not executed (mutating); their shapes are source-derived.

### 2.4 Avatar round-trip — backend fixed, frontend not using it

Backend now returns `profile_image_url` on every read and write path (§2.2). But [Profile.jsx:109-112](../Code/client/src/pages/Profile.jsx#L109-L112) still carries the obsolete workaround:

```js
// getUserById/updateUser never return profile_image_url (see plan
// notes) — use the URL Cloudinary gave us directly instead of
// trying to re-fetch it from the API.
setAvatarUrl(uploadData.secure_url)
```

`avatarUrl` initialises to `null` and is only ever set from a fresh upload, so **the avatar still disappears on reload.** That's now purely a frontend gap and a one-line fix: read `user.profile_image_url` in the existing `useEffect` that already fetches `/api/users/:id`, and delete the stale comment. In-scope on Shalom's own #12 page; cheapest real-data win in the codebase.

---

## 3. Gap analysis

### 3.1 Dead interactions — no handler, no destination

| Element | File | Notes |
| --- | --- | --- |
| "PLACE WAGER" button | [MatchDetail.jsx:193](../Code/client/src/pages/MatchDetail.jsx#L193) | `<button>`, no `onClick`. Prominent primary CTA. |
| "Submit Prediction" button | [Leaderboard.jsx:100](../Code/client/src/pages/Leaderboard.jsx#L100) | No `onClick`. `POST /api/predictions` **exists and is unused.** |
| "+ Follow Player" button | [PlayerDetail.jsx:55](../Code/client/src/pages/PlayerDetail.jsx#L55) | No `onClick`, no state. No player-follow endpoint exists. |
| "Connect"/"Disconnect" ×3 | [Profile.jsx:373](../Code/client/src/pages/Profile.jsx#L373) | No handlers. No OAuth-app concept in schema. |
| "Deactivate Account" | [Profile.jsx:392](../Code/client/src/pages/Profile.jsx#L392) | No handler. No endpoint. |
| "Delete Account Permanently" | [Profile.jsx:398](../Code/client/src/pages/Profile.jsx#L398) | No handler. No endpoint. Destructive-looking and inert. |
| Sidebar "Quick Search" input | [Sidebar:69](../Code/client/src/components/Sidebar/index.jsx#L69) | Uncontrolled, no `onChange`. Types but does nothing. |
| Notification toggles ×5 | [Profile.jsx:337](../Code/client/src/pages/Profile.jsx#L337) | Local state only, never persisted. `notifications` table exists. |
| Privacy toggles ×3 | [Profile.jsx:356](../Code/client/src/pages/Profile.jsx#L356) | Local state only, never persisted. No column for them. |
| "Top Up Balance" | [Profile.jsx:240](../Code/client/src/pages/Profile.jsx#L240) | Styled as a button, is a `<span>` — not focusable/keyboard-reachable. |
| "SEE ALL" ×2 | [Home.jsx:141](../Code/client/src/pages/Home.jsx#L141), [Discover.jsx:119](../Code/client/src/pages/Discover.jsx#L119) | `<p>` tags styled as links. |
| "VIEW FULL SCHEDULE →" | [TeamDetail.jsx:103](../Code/client/src/pages/TeamDetail.jsx#L103) | `<p>` tag. |
| Ticker filter tabs ×4 | [Home.jsx:135-139](../Code/client/src/pages/Home.jsx#L135-L139) | Plain `<p>`s — one styled active, none filter. |
| "Filter match details…" | [Matches.jsx:65](../Code/client/src/pages/Matches.jsx#L65) | A `<p>` styled to look like a search input. |
| Trending tags ×5 | [Discover.jsx:83](../Code/client/src/pages/Discover.jsx#L83) | `<span>`s, not clickable. |
| Footer links ×16 | [Discover.jsx:140](../Code/client/src/pages/Discover.jsx#L140) | All `<p>` tags. |
| Login/Signup legal links ×6 | [Login.jsx:120](../Code/client/src/pages/Login.jsx#L120), [Signup.jsx:118](../Code/client/src/pages/Signup.jsx#L118) | `<span>`s, dead, duplicated across both pages. |
| "Forgot Password?" | [Login.jsx:87](../Code/client/src/pages/Login.jsx#L87) | `<a href="#">` with `preventDefault()`. No reset flow server-side. |
| "Send message…" chat input | [MatchDetail.jsx:188](../Code/client/src/pages/MatchDetail.jsx#L188) | `<p>`, not an input. |
| "Add a comment…" | [CommentThread.jsx:26](../Code/client/src/components/CommentThread.jsx#L26) | `<p>`. `POST /api/comments` exists and is unused. |
| `TeamCard` body | [TeamCard.jsx](../Code/client/src/components/TeamCard.jsx) | Whole card is a `<div>` — crest/name not a link to `/teams/:id`. Only the Follow button works. |

Pattern: **~45 of these are `<p>`/`<span>` elements styled to look interactive.** Beyond being dead, they're inaccessible — no focus ring, no keyboard access, no button/link semantics. Cheap to fix as a batch.

### 3.2 Orphan / unreachable routes

**All fixed 2026-07-28 — no orphan routes remain.**

- ~~`/profile` — the significant one.~~ Sidebar now has an avatar/username `<NavLink to="/profile">` in the `mt-auto` block above "Sign Out" ([Sidebar/index.jsx](../Code/client/src/components/Sidebar/index.jsx)).
- ~~`/teams/:teamId` — reachable only via the Home standings table~~. `TeamCard` ([TeamCard.jsx](../Code/client/src/components/TeamCard.jsx)) now wraps its crest/name in a `<Link to='/teams/:id'>`, so Discover's 8 national teams link through too.
- ~~No catch-all route~~ — added `<Route path="*" element={<NotFound />} />` in [App.jsx](../Code/client/src/App.jsx) and a new `pages/NotFound.jsx`. Typos now render an honest 404 with a link back to the dashboard instead of a blank white page.

### 3.3 Mock and hardcoded data

8 files in `src/mocks/` (`teams`, `matches`, `matchDetail`, `teamDetail`, `playerDetail`, `leaderboard`, `followedTeams`, `dashboardMocks`), plus arrays inlined in pages.

| Surface | Source | Real endpoint available? |
| --- | --- | --- |
| **Matches page — entire grid** | `mocks/matches.js` (9 fixtures) | ✅ `GET /api/matches` — **not called at all** |
| **MatchDetail — everything** | `mocks/matchDetail.js` | ⚠️ `GET /api/matches/:id` exists (9 keys); events/lineups/stats/possession unsourced |
| **TeamDetail — everything** | `mocks/teamDetail.js` | ⚠️ `GET /api/teams/:id` exists; form/fixtures/roster/crest unsourced |
| **PlayerDetail — everything** | `mocks/playerDetail.js` | ⚠️ `GET /api/players/:id` exists (6 keys vs ~30 needed) |
| **Discover — all 8 teams** | `mocks/teams.js` | ❌ no national-teams endpoint |
| **Leaderboard — top 10** | `mocks/leaderboard.js` | ⚠️ `GET /api/users` returns ranked users, but no `location`/`title`/`topTeam`/`trend` |
| **Sidebar followed teams** | `mocks/followedTeams.js` | ✅ `GET /api/follows/user/:id` — Profile calls it, Sidebar doesn't |
| Knockout bracket | `mocks/dashboardMocks.js` | ❌ none |
| Home live-match statistics | `mocks/dashboardMocks.js` | ❌ none |
| Matches `liveStats` | inline [Matches.jsx:15](../Code/client/src/pages/Matches.jsx#L15) | ❌ none |
| MatchDetail fan chat | inline `mockChatMessages` | ✅ `GET /api/comments/match/:id` unused |
| CommentThread comments | inline `mockComments` | ✅ same |
| Leaderboard "Recent Top Earners" | inline | ❌ none |
| Leaderboard prediction history | inline | ✅ `GET /api/predictions/user/:id` unused |
| Profile transactions + trend | inline [Profile.jsx:17-22](../Code/client/src/pages/Profile.jsx#L17-L22) | ❌ no transactions table |
| Profile connected apps | inline | ❌ none |

**Unsourced literals rendered as fact** — the sharpest "no invented data" breaches:

| Text | File |
| --- | --- |
| "MATCHDAY 24" | [Home.jsx:184](../Code/client/src/pages/Home.jsx#L184) |
| "Your predictions are paying off. Top 5% this week." | [Home.jsx:244](../Code/client/src/pages/Home.jsx#L244) |
| "1,247 online" | [MatchDetail.jsx:172](../Code/client/src/pages/MatchDetail.jsx#L172) |
| "High confidence: Argentina likely to advance…" | [Matches.jsx:115](../Code/client/src/pages/Matches.jsx#L115) |
| "{team} has a 22% projected model chance of winning…" | [TeamDetail.jsx:145](../Code/client/src/pages/TeamDetail.jsx#L145) |
| "#47", "8,230 pts", "Top Earning Team: Arsenal" | [Leaderboard.jsx:49-60](../Code/client/src/pages/Leaderboard.jsx#L49-L60) — contradicts real points shown on Home |
| "📍 London, UK", "Joined March 2024" | [Profile.jsx:226-227](../Code/client/src/pages/Profile.jsx#L226-L227) — `created_at` exists in DB but isn't returned |
| Default bio ("Tactical obsession…") | [Profile.jsx:13](../Code/client/src/pages/Profile.jsx#L13) — presented as the user's own words |
| "✨ AI Tactical Analysis" paragraph | [PlayerDetail.jsx:162](../Code/client/src/pages/PlayerDetail.jsx#L162) — no AI is involved anywhere |
| "MatchLens Score 94.2", "€95.0M market value" | PlayerDetail — invented metrics, no source |
| "v2.4.0-Stable ● Systems Operational" | [Login.jsx:130](../Code/client/src/pages/Login.jsx#L130), [Signup.jsx:128](../Code/client/src/pages/Signup.jsx#L128) — fake status, duplicated |
| "© 2024" (Login + Signup) vs "© 2026" (Discover) | inconsistent |

**Status-value mismatch (functional bug).** `Matches.jsx` filters on `status === 'FT'` for its Results tab, and `mocks/matches.js` supplies `FT` rows. The real API never emits `FT` — only `LIVE | HT | UPCOMING`. Switch Matches to real data and the Results tab renders empty, and `HT` matches vanish from all three tabs. Same trap on Home: it handles `UPCOMING` and `LIVE` but nothing handles `HT`.

`DEMO_USER_ID = 1` is hardcoded in [Home.jsx:16](../Code/client/src/pages/Home.jsx#L16) and [Profile.jsx:6](../Code/client/src/pages/Profile.jsx#L6). A session now exists (`RequireAuth` guarantees one), so this is a correctness bug: every signed-in user currently sees user 1's points and follows.

### 3.4 Missing loading / empty / error states

Every fetch swallows errors into `console.error` and renders nothing.

**`Home.jsx` — 4 fetches, 0 states** ([Home.jsx:57-77](../Code/client/src/pages/Home.jsx#L57-L77)):
- No `loading` flag. Initial state `[]`/`null`, so first paint shows empty sections, no spinner.
- **No `res.ok` check on any of the four.** A 404/409 body (`{"error": "..."}`) is parsed as JSON and pushed into state; `setMatches({error})` then makes `matches.find(...)` throw → white screen, no error boundary.
- `.catch(console.error)` — user sees nothing on network failure.
- No empty state for standings, ticker, or top scorers.
- `StandingsTable` does `[...teams].sort(...)` — crashes if `teams` isn't an array.

**`Profile.jsx` — partial.** Has `uploading`, `uploadError`, `followError`, and an empty state for followed teams. Missing: no loading state for the two initial fetches (username renders the literal `'Loading…'` forever on failure — [Profile.jsx:184](../Code/client/src/pages/Profile.jsx#L184)), and no `res.ok` check on either GET.

**Pages with no fetches** (Matches, MatchDetail, TeamDetail, PlayerDetail, Discover, Leaderboard) have no states — but their mock getters are unguarded: `getMockMatchDetail(matchId)` ignores validity and always returns Argentina–France, so `/matches/99999` renders a confident fake match instead of a 404.

**`Login.jsx` is the one good citizen** — `loading` disables submit and swaps the label, `error` renders inline, client-side validation runs first. Eric's work; leave the logic alone.

### 3.5 Placeholder visuals

**Fixed 2026-07-28:**
- ~~Lime-green circle (`bg-primary`) as the app logo~~ — real logo asset (`assets/ball.png`) in Sidebar + AuthLayout, plus a favicon.
- ~~17 × `bg-white/10` grey blocks where crests/photos/avatars belong~~ — `Crest`/`Avatar` initials badges (§1.4). Still not real images (none exist server-side), but no longer blank.
- ~~Red + blue circles as MatchDetail hero crests~~ — now `<Crest compact>`, consistent with every other crest slot.
- ~~`PitchDot` hand-tuned pitch coordinates~~ — the Lineup tab (and the whole hand-drawn pitch graphic) was removed along with the rest of MatchDetail's fabricated tab content (§5, commit `41eb39b`); it now shows an honest "isn't available from the API yet" state instead of fake formations.

**Still open (unchanged, out of scope for this pass):**
- Emoji throughout in place of iconography: 🏆 🔥 ⚽ ⚡ 💬 📊 📋 📍 👥 🏟 ✨ ✅ ❌ 🇪🇸 🇧🇷 🇳🇴 🇲🇦 🟨 🟥 🏅 ▲ ▼ ★ ▶ ●. Renders differently per-OS; not in the design system.
- Flag emoji hardcoded inside mock strings (`'Spain 🇪🇸'`) — must be stripped when real data lands.

### 3.6 Design drift

**Tokens are defined correctly.** Design-system node `1:67426` matches [tailwind.config.js](../Code/client/tailwind.config.js) exactly: all 24 colours and all 11 type-scale steps. Montserrat is declared as `font-sans` and preloaded 400–800 in `index.html`. The foundation (#14) is sound. **The pages then almost entirely bypass it.**

*Typography — scale defined, unused:*

| | Count |
| --- | --- |
| Arbitrary `text-[Npx]` classes | **228** |
| Design-system scale classes | **8** |

Most-used sizes: `text-[13px]` (58×), `text-[12px]` (43×), `text-[11px]` (43×) — none exist in the design system, whose body sizes are 15/14/12/10/8px. The app's dominant body text (13px, 11px) is off-scale. `font-extrabold` (800) appears 18× though the system specifies at most Bold/700; it's preloaded in `index.html`, which let it drift in.

*Colour — was an invented parallel palette, now one near-duplicate closed.* Design-system tokens `bg-surface`, `bg-card`, `bg-primary-light`, `accent-*`, `ui-separator`, `ui-input`, `ui-light-gray`, `text-tertiary`, `text-muted`, `text-disabled` still have **zero usages** — unchanged, still open. Every source file uses the `dash-*` block, which `tailwind.config.js` labels `// Dashboard dark-theme tokens (not in the official design system swatches)`:

| Invented | Value | DS status |
| --- | --- | --- |
| `dashboard` | `#1C1C1C` | ✅ = Background/Dark, just aliased |
| `dash-card` | `#222327` | 🚩 no DS equivalent (DS Card `#EDEDED`) |
| `dash` | `#313131` | 🚩 no DS equivalent (DS Separator `#D9D9D9`) |
| `dash-sidebar` | `#141414` | 🚩 no DS equivalent |
| `dash-input` | `#2E3034` | 🚩 DS Input is `#484848` |
| `dash-neutral` | `#3A3C42` | 🚩 no DS equivalent |
| `dash-live` | `#EF4444` | 🚩 DS Red is `#FFE2E2` |
| `dash-away` | `#218AF3` | 🚩 DS Blue Solid is `#399FFD` |
| ~~`dash-mlx`~~ | ~~`#4FFF62`~~ | ✅ **removed 2026-07-28** — was a near-duplicate of Primary `#46FF6F`, collapsed into it |
| `dash-gold` | `#FFD700` | 🚩 DS Yellow is `#FFFEE2` |

**Fixed 2026-07-28:** `dash-mlx` — the "single most visible inconsistency" flagged below — is gone. All 15 usages across `Leaderboard.jsx`, `Profile.jsx`, and `StandingsTable.jsx` (border/bg/text variants, including the `/10` and `/40` opacity forms) now read `primary`, and the dead token definition was deleted from `tailwind.config.js`. Verified: `grep -rn "dash-mlx" Code/client Code/server` returns zero matches, and `npm run build` is still clean after the change.

**Still open, unchanged:** the remaining `dash-*` greys (`dash-card`, `dash`, `dash-sidebar`, `dash-input`, `dash-neutral`, `dash-live`, `dash-away`, `dash-gold`) have no 1:1 design-system equivalent. A dark theme is not itself drift — `#1C1C1C` and `#000000` are real tokens — but these greys were invented rather than derived. Reconciling them (or getting a dark ramp added to the Figma design system) is a design decision, not a mechanical rename like `dash-mlx` was, and is left for a follow-up pass (§6 P4).

*Typography arbitrary-sizing — still open, unchanged in scope.* `text-[Npx]` count is now **271** across 24 files (up from 228 — the new `AuthLayout`/`AuthFields`/`NotFound`/`Crest`/`Skeleton` components added their own, following the existing app-wide convention rather than inventing a new one). Not touched this pass: the audit's own scope note below still applies — this needs a deliberate 13px/11px → 14px/12px mapping decision plus a frame-by-frame Figma check, not a blind find/replace that could silently change density on every page.

*Three-column shell is really two* (sidebar + `<Outlet/>`), with each page re-implementing its own right rail: `w-[280px]` on Home/Matches/TeamDetail/PlayerDetail, `w-[300px]` MatchDetail, `w-[320px]` Leaderboard, `w-[420px]` Profile. Five widths for one structural element; **Discover still has no rail** — checked against the Figma file's `screens` page (`0:1`, file key `BluwoVP5R22gIc3ryGxNck`) via the Figma MCP this pass, and no frame named "Discover" (or similar) was found among the ~250 top-level nodes scanned, only an incidental text layer reading "Discover the World Cup" elsewhere. Absent a reference frame, adding a right rail here would mean inventing content to fill it — exactly what this pass was told not to do — so it stays a single-column page with its existing full-width footer. Both the rail-width unification and Discover's shell are unchanged, still open (§6 P4).

*Responsiveness:* `Sidebar` is fixed `w-[220px]` with no mobile collapse; every right rail is a fixed-width `shrink-0`; `TeamCard` is a hard `w-[213px]` inside a responsive grid. Below ~1100px the layout overflows horizontally. Unchanged, still open.

*Login + Signup restyled — fixed 2026-07-28:*
- `css/Login.css` (229 lines, 9 off-palette hexes, an unloaded `Playfair Display`) — **deleted.**
- The `.login-page` block in `index.css` (7 more off-palette hexes, an unloaded `Inter`) — **deleted.**
- Both pages now render through a shared `components/AuthLayout.jsx` + `components/AuthFields.jsx`, using only design-token classes (`bg-dashboard`, `border-dash`, `text-primary`, `text-secondary`, …) and inheriting Montserrat from the global `body` rule in `index.css` — the same font stack as every other page, no separate visual universe. Two-column layout (form + branding panel) preserved per Figma's `Login`/`Sign Up`/`desktop-auth-*` frames, confirmed present in the file's `screens` page.
- Auth **logic** untouched: `handleSignIn`/`handleSignUp`, `UsersAPI`, `validateLogin.js`/`validateSignup.js`, `config/api.js`, and the OAuth `AUTH_ORIGIN` dev/prod split are byte-identical apart from import paths. Verified by diff review, not by rewriting.
- Per the user directive for this pass, **Login/Signup deliberately keep the two-column `AuthLayout` and were not forced into the sidebar/three-column shell** — that shell is for the authenticated app only.
- Remaining, not addressed this pass: "Forgot Password?" is now a styled `<p>` (previously a dead `<a href="#">`) — no longer semantically a broken link, but still visually reads as one with no affordance; the duplicated dead legal links (`Terms of Service · Privacy Policy · Help Center`) and the fabricated "v2.4.0-Stable · Systems Operational" status line are still present on both pages, carried over unchanged into `AuthLayout`'s shared footer. These match real Figma frame content (the "Version Status" / "Legal Links" layers exist in the `Welcome Screen`/`Login`/`Sign Up` frames) but are still fabricated status text with no backing system — flagged, not removed, since removing content that *is* in the Figma reference would be a design call beyond "restyle, don't rebuild."

> **Scope note (unchanged from prior audit):** token/typography comparison is against design-system node `1:67426` (colours + typography only). Full frame-by-frame layout fidelity for the 8 authenticated app pages is still outstanding — this pass fixed the mechanical/safe items (dead token, deleted legacy CSS, real assets) and left the frame-dependent decisions (rail widths, type-scale remapping, `dash-*` grey reconciliation, Discover's layout) for a dedicated design pass.

---

## 4. Status table — updated 2026-07-28 (final consistency + QA pass)

Reachable: ✅ nav/button · ⚠️ partial · ❌ URL only · States: L=loading, E=empty, Er=error

| Page / feature | Owner | Reachable? | Data source | States (L/E/Er) | Design match? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| **Shell** (`App`, `main`, `index.css`) | Shalom #14 | — | — | — | ✅ tokens + Montserrat consistent app-wide | Builds clean (0 errors/warnings). `RequireAuth` guards the shell. Catch-all `404` route in place (`pages/NotFound.jsx`). Legacy `.login-page` palette **deleted** from `index.css` this pass — no more off-palette CSS anywhere in the client. |
| **Sidebar** | Shalom #14 | ✅ | Real `GET /api/follows/user/:id` (wired since prior session) | ✅/✅/✅ | ✅ real logo, tokens consistent | Logo is now the real `ball.png` asset (was a lime circle). Followed-teams list has loading skeletons + error state (was silent `console.error`). `/profile` avatar/username link present above "Sign Out". Search input still uncontrolled/dead (unchanged, not in this pass's scope). 2 label/destination mismatches ("Standings"→`/leaderboard`, "Highlights"→`/discover`) unchanged. Not responsive below ~1100px (unchanged). |
| **Home** `/` | Shalom #14 + shared | ✅ Dashboard | **Real ×4** (matches, teams, players, session user) + 2 mock blocks (bracket, live-match stats — no backing endpoint exists) | ✅/✅/✅ | ⚠️ tokens/logo/crests fixed; arbitrary px sizes + mock bracket unchanged | `res.ok` guards on all fetches (was: 409 body could crash `.find()`). Skeleton loaders + empty states on hero/ticker/standings/scorers/live-widget. Crest/Avatar replace grey blocks. Knockout bracket, live-match "Match Statistics", "MATCHDAY 24", and "Top 5% this week" remain unsourced mock content — **not touched this pass** (no named exception covers Home; fixing would mean either wiring a non-existent endpoint or removing UI, both out of scope for a tokens/shell/import pass). |
| **Matches** `/matches` | **Shalom #3** | ✅ Live Football | **Real** `GET /api/matches` incl. `?date=` filter | ✅/✅/✅ | ✅ | Fixture calendar wired (prior session): real date picker, live search-by-team/venue, tab filter handles `LIVE`/`HT`/`UPCOMING` and an honest empty `Results` state instead of a broken `FT` filter. Right-rail "Live Analytics Feed" and "Model Verdict" panels are explicit, honestly-labeled in-progress states — **sanctioned per this pass's scope**, not a gap. |
| **MatchDetail** `/matches/:id` | shared #1 | ✅ via MatchCard | **Real** `GET /api/matches/:id` | ✅/✅ (404)/✅ | ✅ | Wired to the real endpoint (prior session): honest "Match not found" for unknown ids (was: always Argentina–France), loading/error states. Overview/Lineup/Stats tabs, Fan Chat, and win-probability bar are explicit in-progress/removed states — **sanctioned per this pass's scope** (the API returns none of that data). "PLACE WAGER" is a disabled, honestly-labeled control, not a dead CTA. Hero crests now `<Crest>` (was red/blue status-look circles). Dead `ProbabilityBar.jsx` component (no longer imported anywhere) **removed this pass**. |
| **Discover** `/discover` | **Shalom #9** | ✅ Highlights | **Real** follow state (`GET/POST/DELETE /api/follows`) over a mock 8-team directory (no national-teams endpoint exists) | ✅/❌/✅ | ⚠️ single-column, no Figma frame found for this page | Follow toggles now hit the real API (was local-state-only). `TeamCard` links to `/teams/:id`. Checked this pass: no "Discover"-named frame found in the Figma file's `screens` page, so the missing right rail is left as-is rather than inventing one. `useTeamSearch` still a stub (#6). 16 dead footer `<p>` links unchanged. |
| **TeamDetail** `/teams/:id` | shared #1 | ✅ Home standings + Discover `TeamCard` | **100% mock** (`getMockTeamDetail` ignores `:teamId`) | ❌/❌/❌ | ⚠️ Crest/tokens fixed; content unchanged | Not wired to `GET /api/teams/:id` this pass — real endpoint lacks `goals_conceded`, form, fixtures, roster, or crest, so full wiring would still leave most of the page mocked; deferred as a data-wiring task, not today's tokens/shell scope. "22% projected model chance" invented text unchanged. |
| **PlayerDetail** `/players/:id` | shared #1 | ✅ via PlayerCard | **100% mock** (`getMockPlayerDetail`) | ❌/❌/❌ | ⚠️ Avatar/tokens fixed; content unchanged | Same reasoning as TeamDetail — API gives 6 keys, page needs ~30; not wired this pass. "MatchLens Score", "€95.0M", "AI Tactical Analysis" invented text unchanged. Follow button still inert. |
| **Leaderboard** `/leaderboard` | #10 Gildardo | ✅ Standings + Home CTA | **100% mock** | ❌/❌/❌ | ✅ `dash-mlx` collapsed into `primary` this pass | Token drift fixed (§3.6) — 9 occurrences of `dash-mlx` now read `primary`, matching every other page. Data still 100% mock ("#47", "8,230 pts", "Recent Top Earners", prediction history) — unchanged, not in this pass's scope; still contradicts Home's real points. "Submit Prediction" still dead though `POST /api/predictions` exists. |
| **Profile** `/profile` | **Shalom #12 + #9** | ✅ via Sidebar avatar/username link | **Real** (user, follows) + mock picker/transactions | ✅/✅/✅ | ✅ `dash-mlx` collapsed into `primary` this pass | Avatar round-trip fixed (prior session: reads `profile_image_url` from the user fetch, survives reload). Loading skeletons + error states added for both fetches (was: literal `'Loading…'` forever on failure). Token drift fixed this pass (5 `dash-mlx` occurrences incl. the notification `ToggleSwitch`). Team picker + transactions remain mocked (unchanged, no backing table). 11 dead controls unchanged. |
| **Login** `/login` | **Eric owns logic — preserve** | ✅ | Real (`UsersAPI.login`, bcrypt), real GitHub OAuth | ✅/—/✅ | ✅ **restyled this pass** | Now renders through `AuthLayout` + `AuthFields` — Montserrat, design tokens, two-column layout matching the Figma `Login`/`desktop-auth-sign-in` frames. `css/Login.css` and the `.login-page` CSS block **deleted**. Auth logic (`handleSignIn`, `UsersAPI`, `validateLogin.js`, `config/api.js`) untouched — verified by diff, not rewritten. "Forgot Password?" is no longer a dead `<a href="#">` but still a static styled `<p>` with no reset flow (unchanged functionally). Fabricated "v2.4.0-Stable" footer text unchanged (present in the Figma reference frame itself). |
| **Signup** `/signup` | **Eric owns logic — preserve** | ✅ | Real (`UsersAPI.createUser`) | ✅/—/✅ | ✅ **restyled this pass** | Same `AuthLayout`/`AuthFields` treatment as Login — no more separate visual universe. Client validation (username 3–50, password 8–72) untouched. Duplicated dead legal links + fake "v2.4.0" footer unchanged (shared with Login via `AuthLayout`, same Figma-sourced caveat). |
| **Auth plumbing** (`AuthAPI`, `UsersAPI`, `RequireAuth`, `config/api`, `validate*`) | **Eric — do not rewrite** | — | Real (`/auth/*`, `/api/users/*`) | ✅/—/✅ | n/a | Untouched this pass. Session-revalidating guard with optimistic first paint; `credentials: 'include'`; bcrypt; `AUTH_ORIGIN` dev/prod split. |
| **Static assets** | Shalom #14 | — | — | — | ✅ **fixed this pass** | Real logo (`ball.png`) + favicon in place. `Crest`/`Avatar` components give every crest/photo/user-avatar slot a deterministic initials badge instead of a blank grey block (§1.4, §3.5). Still open: `SearchIcon` duplicated 3× instead of one shared component; team crests/player photos are still initials, not real images (blocked on a football API the backend hasn't integrated). |

---

## 5. Prioritized fix list

Ordered by user-visible impact.

### P0 — structural
1. ~~**Add a catch-all `404` route.**~~ **DONE 2026-07-28.** `pages/NotFound.jsx` + `<Route path="*">` in `App.jsx`.

### P1 — unreachable or crashing
2. ~~**Give `/profile` a nav entry.**~~ **DONE 2026-07-28.** Sidebar's `mt-auto` block now renders a `<NavLink to="/profile">` with the session user's avatar + username (read from the `matchlens_user` localStorage hint `RequireAuth` sets), directly above "Sign Out".
3. ~~**Consume `profile_image_url` on Profile.**~~ **DONE** (prior session). `Profile.jsx`'s user fetch now sets `avatarUrl` from `data.profile_image_url`; the stale re-fetch workaround comment is gone. Avatar survives reload.
4. ~~**Replace `DEMO_USER_ID = 1` with the session user.**~~ **DONE** (prior session, commit `4e48aa1`). `grep -rn DEMO_USER_ID Code/client/src` returns no matches. Both `Home.jsx` and `Profile.jsx` derive the user from `useSessionUser()`.
5. ~~**Add `res.ok` guards to all 6 GETs** in `Home.jsx` and `Profile.jsx`.~~ **DONE.** Both files throw on non-`ok` responses and route into an error state instead of pushing `{error}` into array/object state.
6. ~~**Add loading + error + empty states to `Home`.**~~ **DONE.** Skeleton loaders on hero/ticker/standings/scorers/live-widget, plus empty-state copy per section.
7. **Add an error boundary** around the routed shell so one bad response degrades one panel, not the page. **Still open** — not addressed this pass (no per-page fetch currently throws uncaught after the P1.5 guards, so the blast radius is smaller than originally scoped, but a boundary is still not in place).

### P2 — real data sitting unused
8. ~~**Point `Matches.jsx` at `GET /api/matches`.**~~ **DONE** (prior session, commit `6a49379`). Handles `HT`/`LIVE`/`UPCOMING`; `Results` (`FT`) renders an honest empty state instead of a broken filter.
9. ~~**Build the actual fixture calendar (#3).**~~ **DONE** (prior session, same commit). Real `<input type="date">` wired to `?date=YYYY-MM-DD`, plus working team/venue search.
10. ~~**Wire Discover's follow buttons to `POST/DELETE /api/follows` (#9).**~~ **DONE** (prior session, commit `4257773`).
11. ~~**Feed the Sidebar's followed-teams list from `GET /api/follows/user/:id`.**~~ **DONE** (prior session) — now with loading skeletons and an error state added this pass.
12. ~~**Link `TeamCard` → `/teams/:teamId`**~~ **DONE 2026-07-28.** Crest/name now wrapped in a `<Link>`; the Follow button stays a sibling so it isn't nested inside the anchor.
13. **Use `GET /api/matches/:id`, `/api/teams/:id`, `/api/players/:id`.** **Partially done.** MatchDetail wired (prior session, commit `41eb39b`) with honest in-progress states for the fields the endpoint doesn't cover — this is also the sanctioned pattern named explicitly in this pass's scope. TeamDetail and PlayerDetail remain **100% mock, not wired** — their endpoints cover so little of what the pages render (no crest/form/fixtures/roster for teams; 6 of ~30 fields for players) that wiring them now would still leave the pages mostly mocked, so this is deferred as a real data-modeling/feature task rather than done piecemeal under a "no new features" pass.

### P3 — honesty of the UI
14. **Remove or explicitly label every invented value** in §3.3. **Partially done.** MatchDetail's and Matches' unsourced panels (events, lineups, stats, fan chat, "1,247 online", win-probability) are gone or converted to explicit "isn't available yet" states — the exact set named in this pass's scope. Home's knockout bracket/live-match-stats/"MATCHDAY 24"/"Top 5%", and all of Leaderboard/TeamDetail/PlayerDetail's invented values, are **unchanged** — out of this pass's scope (tokens/shell/imports, not a full honesty sweep of every remaining page).
15. **Convert the ~45 fake-interactive `<p>`/`<span>` elements** to real `<button>`/`<Link>`, or restyle so they don't read as controls. **Still open, unchanged** — not addressed this pass.
16. **Decide per dead control: wire, disable, or delete.** **Still open, unchanged**, except "PLACE WAGER" (now honestly disabled, part of the sanctioned MatchDetail rework) and "Submit Prediction" on Leaderboard (still dead, untouched).

### P4 — design conformance
*Do the frame-by-frame Figma comparison first (§3.6 scope note) for the still-open items below — the `screens` page has real frames not yet fully pulled. Don't restyle against the swatch board alone.*
17. ~~**Collapse `dash-mlx` (#4FFF62) into `primary` (#46FF6F).**~~ **DONE 2026-07-28.** All 15 usages across Leaderboard/Profile/StandingsTable now read `primary`; the token itself removed from `tailwind.config.js`. This was the one P4 item safe to do mechanically, without a Figma frame-by-frame pass, since it collapsed a literal near-duplicate of an *existing* real token rather than making a new design call.
18. **Replace the 271 arbitrary `text-[Npx]`** with the 11 defined scale steps; drop `font-extrabold`. **Still open** — count grew from 228 to 271 as new components (`AuthLayout`, `AuthFields`, `NotFound`, `Crest`, `Skeleton`) followed the existing app-wide convention. Needs the 13px/11px → 14px/12px density decision first; not attempted this pass.
19. **Reconcile the `dash-*` greys with design-system tokens.** **Still open, unchanged.**
20. **Extract the right rail into one shell primitive.** **Still open, unchanged** — five widths remain (280/300/320/420px); Discover confirmed to have no matching Figma frame this pass (§3.6), so it's staying single-column rather than growing an invented rail.
21. ~~**Restyle `Login.css` + `Signup` to Montserrat + design tokens, delete the `.login-page` block in `index.css`.**~~ **DONE 2026-07-28.** Both files deleted; `AuthLayout`/`AuthFields` replace them with token-only classes. `handleSignIn`/`handleSignUp`, the validators, and `config/api.js` untouched. The duplicated dead legal links and "v2.4.0" footer were **not** removed — they mirror real layers in the Figma `Login`/`Sign Up` frames (`Legal Links`, `Version Status`), so deleting them would be a content call beyond "restyle, don't rebuild."
22. **Add the missing assets.** **Mostly done.** Real logo (`ball.png`) + favicon in place, replacing the lime circle. `Crest`/`Avatar` components close the 17 grey-block placeholders with deterministic initials badges. **Still open:** one shared icon set — `SearchIcon` is still hand-duplicated 3× (Sidebar, Matches, Discover) instead of one component. Real crests/photos remain **blocked** on the football API integration (backend scope).
23. **Make the shell responsive** — sidebar collapse, fluid rails, drop `TeamCard`'s fixed `w-[213px]`. **Still open, unchanged.** Below ~1100px the layout overflows today.

### P5 — dead code found during this pass
24. ~~**Remove `components/ProbabilityBar.jsx`.**~~ **DONE 2026-07-28.** Zero importers anywhere in the client after MatchDetail's win-probability bar was dropped (commit `41eb39b`); confirmed via repo-wide grep before deletion.
25. ~~**Remove unused `import React from 'react'` in `GitHubMark.jsx`.**~~ **DONE 2026-07-28.** Presentation-only file (an inline SVG icon), consistent with the same cleanup already applied to `Login.jsx`/`Signup.jsx` in this pass. No auth logic touched.

---

## 6. Final QA checklist — 2026-07-28

Scope of this pass: enforce design tokens/Montserrat/shell, fix Figma drift without building out API-less panels, sweep dead imports/routes/token drift, keep the build clean. No new data wiring, no new fabricated content.

### How each row was verified

Three evidence tiers, stated per row — no row claims a tier it doesn't have:

- **Build** — `npm run build` from `Code/` (`vite build`). Ran 4× across this session (baseline, after `dash-mlx` cleanup, after the `Leaderboard.jsx` encoding revert, final). Every run: `76 modules transformed`, 0 errors, 0 warnings, ~1.6–2.2s. This proves every import resolves and every file is syntactically/JSX-valid — it does not prove a page *looks* right.
- **Static/code review** — full source read of the page and everything it imports, tracing prop flow, conditional branches, and which fetch calls hit which documented endpoint (§2 of this doc). This is how every data-source and honesty claim below was checked.
- **Live browser** — attempted, not achieved. See note below. **No page in this app was visually rendered or clicked in a browser this session.** Every "Pass" below rests on Build + Static review only, unless a row says otherwise.

**Browser-verification attempt and why it stopped:** `chromium-cli` isn't installed in this environment. I installed `playwright-core`/`playwright` (npm, ~1s from cache) and tried to drive a headless Chromium already cached on this machine from a prior session; it crashed on launch (`FATAL:gin\v8_initializer.cc:655] Error loading V8 startup snapshot file` — the cached install is missing `v8_context_snapshot.bin`, 112 files present where a complete install needs more). I then tried to force a fresh official download via `npx playwright install chromium`, which first required removing the broken cache — `rm -rf` hit a locked file and stopped. Checking running processes at that point (`tasklist`) showed 14 `chrome.exe` processes with real-browser-sized memory footprints (up to 342MB) in the same desktop session, which reads as the user's own open Chrome windows rather than orphaned test processes. Deleting files or killing processes in that space without being certain which is which was too risky to continue, so I stopped rather than gamble with someone's live browser session. This is a **tooling gap in this specific environment**, not a statement about whether the app renders correctly — I have no evidence either way beyond static review.

**Auth-gated pages, independent of the browser issue:** every route except `/login` and `/signup` sits behind `RequireAuth`, which trusts only a live server session (`GET /auth/login/success`). Getting a real one requires either completing GitHub OAuth (no test GitHub account available to me) or a username/password signup — which the task explicitly forbids doing against the shared hosted Postgres. So Home, Matches, MatchDetail, Discover, TeamDetail, PlayerDetail, Leaderboard, and Profile could not have been click-verified this session **even with working browser tooling**. Their rows below are Build + Static review only, and are marked that way regardless of the Chromium issue.

### Per-page results

| Page / area | Result | Evidence | Notes |
| --- | --- | --- | --- |
| **Build** (`npm run build`) | ✅ Pass | Build | 0 errors, 0 warnings, 76 modules, all 4 runs this session. Output confirmed gitignored (`Code/.gitignore:28 server/public`), no build artifacts staged. |
| **Dead imports / dead files** | ✅ Pass | Build + static sweep | Repo-wide grep for references to deleted `mocks/matches.js`, `mocks/matchDetail.js`, `mocks/followedTeams.js`, `css/Login.css` — zero hits. `components/ProbabilityBar.jsx` found with zero importers and removed. Unused `import React` removed from `GitHubMark.jsx`. A successful Vite build is itself proof every remaining import resolves. |
| **Dead routes** | ✅ Pass | Static review | `App.jsx` routes read end-to-end: 8 authenticated routes under `RequireAuth`+`Sidebar`, `/login`+`/signup` outside it, `path="*"` catch-all to `NotFound`. Matches every `<Link>`/`<NavLink>` target found across the codebase (Sidebar nav, MatchCard, PlayerCard, TeamCard/StandingsTable → `/teams/:id`, Profile nav link). No orphaned or dangling route found. |
| **Design tokens / Montserrat — global** | ✅ Pass | Static review | `index.css` applies `font-sans` (→ Montserrat) and `bg-dashboard` on `body` globally — one font stack, one background token, for every page including auth. No off-palette hex remains in any `.jsx`/`.css` under `src/` (`grep -n "#[0-9a-fA-F]\{6\}" src` now only matches raw SVG asset files, not app code). `dash-mlx` near-duplicate token removed (§3.6, §5 P4.17). |
| **Three-column shell — authenticated pages** | ⚠️ Pass with known gaps | Static review | All 8 authenticated routes render through `Sidebar` (nav + `<Outlet/>`); 7 of 8 additionally render their own right rail. Known, pre-existing, **not fixed this pass**: rail width is inconsistent (280/300/320/420px across pages) and Discover has no rail at all — checked against the Figma file's `screens` page this pass and no "Discover"-named frame was found, so a rail wasn't invented for it. See §3.6/§5 P4.20 for why this was left open rather than force-unified without a design reference. |
| **Login / Signup — two-column AuthLayout, not the app shell** | ✅ Pass | Static review | Confirmed `AuthLayout.jsx` does not import `Sidebar` or `Outlet`; it renders its own `flex min-h-screen` two-column layout, matching the user's explicit instruction not to force the three-column shell here. `App.jsx` places both routes outside the `RequireAuth`/`Sidebar` route tree. |
| **Login** `/login` | ⚠️ Pass (not verified live — reason: no working browser in this environment) | Build + static review | Restyled onto `AuthLayout`/`AuthFields` (design tokens, Montserrat, no more `css/Login.css`). Auth logic (`handleSignIn`, `UsersAPI.login`, `validateLogin.js`) diffed line-by-line against the pre-restyle version — unchanged apart from import paths. Not rendered in a browser this session. |
| **Signup** `/signup` | ⚠️ Pass (not verified live — same reason) | Build + static review | Same treatment as Login. `validateSignup.js`, `UsersAPI.createUser`, `config/api.js` unchanged. **Did not submit the form or create an account** — per the task's explicit instruction not to write signup rows to the shared Postgres. |
| **Unauthenticated → protected route redirect** | ⚠️ Pass by code inspection only (not exercised live) | Static review | `RequireAuth.jsx` read in full: with no `matchlens_user` localStorage hint it starts in `'checking'` state (renders `null`), calls `AuthAPI.getSession()`, and on a falsy/401 response renders `<Navigate to="/login" replace state={{ from: location }} />`. I confirmed the *logic* is correct and unchanged from the audited version, and confirmed via `curl` that `GET /auth/login/success` on a fresh local server returns `401` unauthenticated — but I did not drive a browser through the redirect to see it happen. |
| **404 / unknown path** | ⚠️ Pass by code inspection only (not exercised live) | Static review | `App.jsx`'s `path="*"` route renders `pages/NotFound.jsx`, which is a static component (no data dependency, cannot fail at runtime) linking back to `/`. Logically exhaustive — every non-matching path falls through to it — but not clicked in a browser. |
| **Dev/prod server boot** | ✅ Pass | Process check | `npm run dev` (Code/) started both the Express API (port 3000, log line `server listening on port 3000`) and the Vite dev server (port 5174) with no startup errors. `curl` confirmed `200` from the Vite root and `401` from `/auth/login/success` (correct unauthenticated shape). Both processes stopped cleanly after the check via targeted `taskkill` on the exact PIDs bound to those two ports — nothing else on the machine was touched. |
| **Home** `/` | ⚠️ Pass, not live-verified (auth-gated) | Build + static review | Real data (`matches`/`teams`/`players`/session user), `res.ok` guards, loading skeletons, empty states all present in source. Knockout bracket + live-match stats + "MATCHDAY 24"/"Top 5%" confirmed still mock — **unchanged, out of this pass's scope**, documented in §4/§5 rather than silently left off this checklist. |
| **Matches** `/matches` | ⚠️ Pass, not live-verified (auth-gated) | Build + static review | Real `GET /api/matches` incl. `?date=` filter, tab logic correctly maps `LIVE`/`HT`/`UPCOMING`/`FT`(empty). "Live Analytics Feed"/"Model Verdict" panels confirmed to be the explicit honest in-progress copy named in this pass's scope, not fabricated content. |
| **MatchDetail** `/matches/:id` | ⚠️ Pass, not live-verified (auth-gated) | Build + static review | Real `GET /api/matches/:id`, 404/loading/error branches all present and read correctly. Overview/Lineup/Stats/Fan Chat confirmed to render the sanctioned `InProgress` honest state; "PLACE WAGER" confirmed `disabled` with an honest label, not a dead enabled button. |
| **Discover** `/discover` | ⚠️ Pass, not live-verified (auth-gated) | Build + static review | Follow toggle confirmed wired to real `POST`/`DELETE /api/follows` (not local-state-only). `TeamCard` confirmed to `<Link>` to `/teams/:id`. Team directory itself remains mock (no national-teams endpoint exists) — unchanged, documented. |
| **TeamDetail** `/teams/:id` | ⚠️ Pass (token/asset fixes only), not live-verified | Build + static review | Crest/token updates applied and confirmed by reading the diff; page content confirmed still 100% mock (`getMockTeamDetail` ignores the route param) — **not touched this pass**, deliberately, per §5 P2.13 reasoning. |
| **PlayerDetail** `/players/:id` | ⚠️ Pass (token/asset fixes only), not live-verified | Build + static review | Same treatment as TeamDetail. Avatar swapped in; mock content (`MatchLens Score`, `AI Tactical Analysis`, market value) confirmed unchanged. |
| **Leaderboard** `/leaderboard` | ⚠️ Pass (token fix only), not live-verified | Build + static review | All 9 `dash-mlx` occurrences confirmed replaced with `primary` by re-reading the full file post-edit; confirmed zero remaining `dash-mlx` repo-wide. Data content confirmed still 100% mock — unchanged, documented. |
| **Profile** `/profile` | ⚠️ Pass, not live-verified (auth-gated) | Build + static review | Avatar round-trip, loading/error states, and the `dash-mlx`→`primary` fix all confirmed by reading the current file. Team picker/transactions confirmed still mock — unchanged, documented. |
| **Sidebar** (all authenticated pages) | ⚠️ Pass, not live-verified (auth-gated) | Build + static review | Real logo asset, real `GET /api/follows/user/:id` with loading/error states, `/profile` nav link all confirmed present in source. Search input confirmed still uncontrolled/dead — unchanged, not in this pass's scope. |

### What would need to happen for the ⚠️ rows to become unqualified passes

1. A working headless-browser toolchain in this environment (or the user driving it themselves in a real browser) — for Login/Signup rendering, the unauthenticated-redirect, and the 404 page, all of which need no login.
2. A real authenticated session — either the user logging in with GitHub OAuth themselves, or explicit permission to create one throwaway account in the shared Postgres — for every page behind `RequireAuth`.

Neither happened this session; nothing above should be read as "visually confirmed correct," only "built cleanly and reads correctly in source."
