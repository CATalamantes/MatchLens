# MatchLens Frontend Audit

**Originally audited:** `frontend` @ `34ed319` — 2026-07-27
**Refreshed post-merge:** `frontend` @ `bd28b6d` — 2026-07-27
**Scope:** read-only. No code was changed in either pass. Backend was read only, never modified.

Sections tagged **`refreshed post-merge 2026-07-27`** were re-verified against `bd28b6d`. Untagged sections are unchanged from the original pass and were deliberately left alone: the profile-orphan, Discover follow-button, Matches mock-data, design-token-bypass, and invented-metrics findings are unaffected by the merge (confirmed — `git diff 34ed319 HEAD` touches none of `Home.jsx`, `Profile.jsx`, `Matches.jsx`, `Discover.jsx`, `TeamDetail.jsx`, `PlayerDetail.jsx`, `Leaderboard.jsx`, or `tailwind.config.js`).

---

## 0. Blocking findings — both RESOLVED

*refreshed post-merge 2026-07-27*

`frontend` is now at `bd28b6d`. Both `git log main..frontend` and `git log frontend..main` are **empty** — the branch is identical to `main`. Both P0 blockers from the original pass are gone.

### 0.1 Missing `services/` imports — ✅ **PASS**

`src/services/` now exists with `AuthAPI.jsx` and `UsersAPI.jsx`, plus `config/api.js`.

Verified by resolving **every import in the client against the filesystem**:

```
relative + bare import specifiers scanned:  78
UNRESOLVED relative imports:                 0
bare specifiers used:  react, react-dom, react-router-dom
NOT in package.json:                      none
```

Same check on the server: **0 unresolved** relative imports; every bare specifier (`bcrypt`, `cors`, `dotenv`, `express`, `express-session`, `passport`, `passport-github2`, `pg`) is declared in `Code/package.json`. The only undeclared ones are Node builtins (`fs`, `path`, `url`).

The six previously-dangling imports all resolve now:

| Import | In | Resolves to |
| --- | --- | --- |
| `../services/UsersAPI` | `Login.jsx`, `Signup.jsx` | ✅ `src/services/UsersAPI.jsx` |
| `../services/AuthAPI` | `RequireAuth.jsx`, `Sidebar/index.jsx` | ✅ `src/services/AuthAPI.jsx` |
| `../config/api` | `Login.jsx`, `Signup.jsx`, `AuthAPI.jsx` | ✅ `src/config/api.js` |

> **Honest limit on this claim.** This is static resolution, not a real build. I still could **not** run `vite build` — the Node toolchain is *still* absent from this environment (see §2.1). Every import resolving and every dependency being declared is strong evidence the build succeeds, but it does not catch syntax errors, JSX errors, or Tailwind/PostCSS config failures. **If you want "builds: confirmed" rather than "builds: no static blocker found", run `npm install && npm run build` yourself** — one command, and it closes the last gap.

### 0.2 Auth files absent — ✅ **PASS**

All seven files named in the brief are present and coherent:

| File | Status |
| --- | --- |
| `services/AuthAPI.jsx` | ✅ new — `getSession()`, `logout()`, both `credentials: 'include'` |
| `services/UsersAPI.jsx` | ✅ new — `login()`, `createUser()`, `getAllUsers()` |
| `pages/Login.jsx` | ✅ rewritten (+38 lines) |
| `pages/Signup.jsx` | ✅ new (136 lines) |
| `components/RequireAuth.jsx` | ✅ new — route guard, revalidates server session |
| `utilities/validateSignup.js` | ✅ new |
| `utilities/validateLogin.js` | ✅ retained (comment corrected — it no longer claims "auto-login") |
| `config/api.js` | ✅ new — `API_URL` + `AUTH_ORIGIN` |
| `components/GitHubMark.jsx` | ✅ new (OAuth button icon) |

`App.jsx` now wraps the whole shell in `<RequireAuth>` and passes `title` props to both auth pages. **The brief's "preserve Eric's auth" instruction is now actionable on this branch** — the files are here to preserve.

Three original findings were fixed by the merge, not by us:

- **`navigate('/home')` → gone.** `Login.jsx` now does `navigate(destination, { replace: true })` where `destination = location.state?.from?.pathname ?? '/'`, so sign-in resumes the page `RequireAuth` intercepted. The blank-page-on-login bug is fixed.
- **Dead Google/Apple OAuth buttons → gone.** Replaced by one real `<a href={AUTH_URL}/github>`. (Google was deliberately dropped — it needed app verification.)
- **`<a href="#">Sign Up` → real `<Link to='/signup'>`.**

---

## 1. Inventory

### 1.1 Routes

*refreshed post-merge 2026-07-27*

From [App.jsx](../Code/client/src/App.jsx). Everything except `/login` and `/signup` now sits behind `<RequireAuth>`. **No catch-all / 404 route still — unchanged.**

| Path | Component | Reachable through UI? | How |
| --- | --- | --- | --- |
| `/login` | `Login` | ✅ **now reachable** | `RequireAuth` redirects anonymous visitors here; Sidebar "Sign Out" navigates here; `Signup` links here. Was URL-only pre-merge. |
| `/signup` | `Signup` | ✅ **new route** | Real `<Link to='/signup'>` on the Login page. |
| `/` | `Home` | ✅ | Sidebar → "Dashboard" |
| `/matches` | `Matches` | ✅ | Sidebar → "Live Football" |
| `/matches/:matchId` | `MatchDetail` | ✅ | `MatchCard` wraps a `<Link to={/matches/${id}}>` — used on Home ticker + Matches grid |
| `/discover` | `Discover` | ✅ | Sidebar → "Highlights" (label/destination mismatch, see §1.2) |
| `/teams/:teamId` | `TeamDetail` | ⚠️ one path only | Only from `StandingsTable`'s team `<Link>` on Home. Discover's `TeamCard` — the actual team browser — does **not** link to team detail. |
| `/players/:playerId` | `PlayerDetail` | ✅ | `PlayerCard` `<Link>` — Home top scorers, TeamDetail squad |
| `/leaderboard` | `Leaderboard` | ✅ | Sidebar → "Standings", plus Home's "ENTER LEADERBOARD" button |
| `/profile` | `Profile` | ❌ **ORPHAN — URL only** | No nav link, no avatar menu, no button anywhere in the app. 406 lines of Profile Customization (#12) work is unreachable without typing the URL. **Re-verified post-merge: still orphaned.** The merge added a "Sign Out" button to the Sidebar but no profile entry. |

The `navigate('/home')` bug is **fixed** — see §0.2.

**New post-merge:** the Sidebar gained a "Sign Out" button ([Sidebar:132](../Code/client/src/components/Sidebar/index.jsx#L132)) calling `AuthAPI.logout()` then `navigate('/login')`. It sits at `mt-auto` — the exact spot a profile/avatar entry would go, which makes the still-missing `/profile` link more conspicuous, not less.

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

**Eric's auth files — all present post-merge** *(refreshed 2026-07-27)*: `pages/Login.jsx`, `pages/Signup.jsx`, `services/AuthAPI.jsx`, `services/UsersAPI.jsx`, `components/RequireAuth.jsx`, `components/GitHubMark.jsx`, `utilities/validateLogin.js`, `utilities/validateSignup.js`, `config/api.js`, `css/Login.css`, plus the `.login-page` block now in `index.css`.

**Restyle-safe vs logic:** presentation lives in `css/Login.css`, the `.login-page` block in `index.css`, and the JSX markup of `Login.jsx`/`Signup.jsx`. Do **not** touch `AuthAPI.jsx`, `UsersAPI.jsx`, `RequireAuth.jsx`, the two `validate*.js` files, the `handleSignIn`/`handleSignUp` handlers, or `config/api.js` — `AUTH_ORIGIN`'s dev/prod split and `credentials: 'include'` are load-bearing for the OAuth cookie.

**Placeholders owned by others:** `CommentThread.jsx` (#7), `VideoPlayer.jsx` (#8), `hooks/useTeamSearch.js` (#6).

### 1.4 Static assets

```
Code/client/  →  no public/, no assets/, no images/
                 zero .svg .png .jpg .webp .ico .gif files
```

**There are no static assets in the client at all.** What that costs:

| Missing | Current stand-in | Where it shows |
| --- | --- | --- |
| App logo | `<div className="size-7 rounded-full bg-primary" />` — a lime-green circle | [Sidebar:61](../Code/client/src/components/Sidebar/index.jsx#L61) |
| Favicon | none — `index.html` has no `<link rel="icon">`, browser shows default | [index.html](../Code/client/index.html) |
| Team crests | `bg-white/10` grey blocks (17 instances) | Sidebar, MatchCard, TeamCard, StandingsTable ×2, TeamDetail ×3, MatchDetail, Home ×2, Profile |
| Player photos | `bg-white/10` block, `h-[130px]` | `PlayerCard`, `PlayerDetail` avatar |
| User avatars | `bg-white/10` circle | `CommentThread`, MatchDetail fan chat, Profile |
| Nav / UI icons | 5 hand-inlined SVGs (`DashboardIcon`, `LiveIcon`, `StandingsIcon`, `HighlightsIcon`, `SearchIcon`), duplicated per-file | Sidebar, Matches, Discover each define their own `SearchIcon` |
| Video thumbnails | black block + `▶` glyph | `VideoPlayer` |

The two crest colours that *aren't* grey are worse: [MatchDetail.jsx:58,66](../Code/client/src/pages/MatchDetail.jsx#L58-L66) uses a **red circle** (`bg-dash-live`) for the home team and a **blue circle** (`bg-dash-away`) for the away team, so the hero reads as a live-indicator dot rather than a crest slot.

---

## 2. Backend data shapes

### 2.1 Could the backend be started? Still no — env is fixed, toolchain is not.

*refreshed post-merge 2026-07-27*

The env-var blocker is genuinely resolved. The toolchain blocker is not, and it's the one that matters:

| Requirement | Original pass | Now |
| --- | --- | --- |
| `Code/server/.env` | ❌ absent | ✅ **present** — all 11 keys set (`PGDATABASE`, `PGHOST`, `PGPASSWORD`, `PGPORT`, `PGUSER`, `PGSSL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, `SERVER_URL`, `CLIENT_URL`) |
| `Code/client/.env` | ❌ absent | ✅ **present** — `VITE_API_URL`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET` |
| Server deps declared | ✅ | ✅ all present in `Code/package.json` |
| `node` / `npm` on PATH | ❌ | ❌ **still absent** |
| `Code/node_modules` | ❌ | ❌ **still absent** |
| `psql` / `pg_isready` | ❌ | ❌ absent |
| Anything listening on :3000 / :5173 / :5432 | ❌ | ❌ nothing |

Searched `~/.nvm`, `~/.volta`, `~/.asdf`, `~/.fnm`, `~/n`, `/usr/local`, `/opt`, `/opt/homebrew`, `/Applications` — no `node` binary anywhere on this machine's reachable paths.

> **I could not start the backend, and therefore could not capture a single live response.** No endpoint was hit. Nothing below is a real HTTP capture. I'm stating this rather than presenting source-derived shapes as if they came off the wire.
>
> `PGHOST` is also **not** localhost — it points at hosted Postgres, so even with Node installed, a live DB capture depends on that host accepting connections from here.
>
> **To get real captures, run this yourself** (two terminals, from `Code/`):
> ```
> npm install
> npm run dev                       # or: npm start
> curl -s localhost:3000/api/matches | head -c 400
> curl -s localhost:3000/api/teams
> curl -s localhost:3000/api/players?sort=goals
> curl -s localhost:3000/api/users/1
> curl -s localhost:3000/api/follows/user/1
> ```
> Paste the output back and I'll replace the remaining INFERRED shapes with verified ones.

Labels below are therefore unchanged in meaning:

- **EXACT** — the endpoint returns a hardcoded literal from the controller source via `res.json(...)`. Transcribed verbatim. Certain *because the data is in the source*, not because it was captured.
- **INFERRED** — Postgres-backed. Shape derived from the `SELECT` list + [schema.sql](../Code/server/db/schema.sql).

**What I could upgrade without running anything:** the three football endpoints were re-diffed against the audited commit and are **byte-identical** (`git diff 34ed319 HEAD` on `matchesController.js`, `teamsController.js`, `playersController.js` — all empty), so their EXACT samples still hold verbatim. The user-facing Postgres shape *did* change (§2.3, §2.5), and its column list is now explicit in source, so I've upgraded its key list to **EXACT (keys)** while leaving value formats INFERRED.

### 2.2 Endpoints the frontend actually calls

Only 8 of 21 available endpoints are wired up.

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
| POST | `api.cloudinary.com/v1_1/{cloud}/image/upload` | [Profile.jsx:102](../Code/client/src/pages/Profile.jsx#L102) | **External**, browser→Cloudinary direct |

**New post-merge — the `/auth/*` family** *(refreshed 2026-07-27)*. Not behind the `/api` Vite proxy; these go to `AUTH_ORIGIN` with `credentials: 'include'` so the session cookie lands on the API origin.

| Method | Path | Called from | Purpose |
| --- | --- | --- | --- |
| GET | `/auth/login/success` | `AuthAPI.getSession()` ← `RequireAuth` | Returns `{ success, user }` or 401. **The guard's source of truth.** |
| GET | `/auth/logout` | `AuthAPI.logout()` ← Sidebar | Destroys session, clears `connect.sid` |
| GET | `/auth/github` | `<a>` on Login + Signup | Starts OAuth (`read:user`, `user:email`) |
| GET | `/auth/github/callback` | GitHub redirect | Redirects to `${CLIENT_URL}/` or `/login?error=<code>` |
| POST | `/api/users/login` | `UsersAPI.login()` | Now **bcrypt-verified** (was plaintext comparison) |
| POST | `/api/users` | `UsersAPI.createUser()` | Signup; bcrypt hash, server-side uniqueness |

`POST /api/users/login` and `POST /api/users` were listed as "available but unused" in the original pass — **both are now wired.**

**Still available but unused:** `GET /api/matches/:id`, `GET /api/teams/:id`, `GET /api/players/:id`, `GET /api/users`, all of `/api/comments` (3), `/api/predictions` (2), `/api/notifications` (2), `/api/videos` (2).

That list matters: **`GET /api/matches/:id`, `/api/teams/:id`, and `/api/players/:id` all exist and all three detail pages ignore them in favour of mocks.**

### 2.3 The crest / image-URL finding — mostly unchanged, one real improvement

*refreshed post-merge 2026-07-27*

**The football half of this finding is unchanged and re-verified. The user half is fixed.**

| Endpoint | Image URL? | Change |
| --- | --- | --- |
| `GET /api/matches` | 🚩 **NONE** | unchanged — controller byte-identical |
| `GET /api/teams` | 🚩 **NONE** | unchanged — controller byte-identical |
| `GET /api/players` | 🚩 **NONE** | unchanged — controller byte-identical |
| `GET /api/follows/user/:id` | 🚩 **NONE** | unchanged — `SELECT *`, table has no crest column |
| `GET /api/users/:id` | ✅ **`profile_image_url`** | **FIXED** — now returned |
| `GET /api/users` | ✅ **`profile_image_url`** | **FIXED** |
| `POST /api/users`, `PATCH /api/users/:id`, `POST /api/users/login` | ✅ **`profile_image_url`** | **FIXED** |
| `GET /auth/login/success` | ✅ **`profile_image_url`** | **NEW** — GitHub `avatar_url` for OAuth users |

The fix is a single shared constant in [usersController.js:8](../Code/server/controllers/usersController.js#L8):

```js
// Columns safe to hand back to the client — never password_hash
const PUBLIC_COLUMNS = `user_id AS id, username, email, profile_image_url, total_points AS points`;
```

…used by `getAllUsers`, `getUserById`, `login`, `createUser`, **and** `updateUser`'s `RETURNING`. `server.js`'s `deserializeUser` selects the same column, so the session user carries an avatar too.

**So: is "no endpoint returns crests" still true? Yes for football, no for users.** Precisely:

- **User avatars now have a real source end-to-end.** This is the one image the UI can render truthfully today.
- **Team crests, player photos, and match team badges still have no source at all** — and cannot until the football API is integrated.

Root cause on the football side is untouched: [matchesController.js:3](../Code/server/controllers/matchesController.js#L3), `teamsController.js:2`, and `playersController.js:2` all **still** carry `// TODO: replace the dummy data with real fetches to the football API`, and I re-grepped all three for `crest|logo|badge|image|photo|flag|thumbnail` — **zero matches.** Hand-written arrays, backend-owned, not Shalom's scope.

Consequence for the 17 `bg-white/10` placeholders (§1.4): the ones standing in for **user avatars** (Profile header, `CommentThread`, MatchDetail fan chat) are now unblocked and can render real images. The ones standing in for **crests and player photos** must stay honest placeholders.

### 2.4 Samples

#### `GET /api/matches` — **EXACT** ([matchesController.js](../Code/server/controllers/matchesController.js))

Supports `?date=YYYY-MM-DD` (exact string equality filter).

```json
[
  { "id": 101, "home": "MCI", "away": "LIV", "home_score": 2, "away_score": 1,
    "status": "LIVE", "minute": 72, "date": "2026-07-23", "venue": "Etihad Stadium" },
  { "id": 102, "home": "RMA", "away": "FCB", "home_score": 0, "away_score": 0,
    "status": "HT", "minute": 45, "date": "2026-07-23", "venue": "Santiago Bernabéu" },
  { "id": 104, "home": "NOR", "away": "ENG", "home_score": null, "away_score": null,
    "status": "UPCOMING", "minute": null, "date": "2026-07-24", "venue": "Ullevaal Stadion" }
]
```

4 rows total. `status` ∈ `LIVE | HT | UPCOMING`. **No `FT`** — which breaks the Matches page (§3.3). `date` is a bare `YYYY-MM-DD` string, no kickoff time. No `probability` object.

#### `GET /api/teams` — **EXACT**

```json
[
  { "id": 1, "name": "Liverpool", "league": "Premier League", "played": 24,
    "wins": 17, "draws": 3, "losses": 4, "goals_scored": 55, "points": 54 }
]
```

3 rows, all **Premier League clubs** — not World Cup national teams. No `goals_conceded` (TeamDetail displays it), no `group`, no `region`, no `crest`.

#### `GET /api/players` — **EXACT**

```json
[
  { "id": 9, "name": "Erling Haaland", "team": "Manchester City", "position": "ST", "goals": 21, "assists": 5 }
]
```

3 rows. Supports `?search=` and `?sort=goals`. Six keys — nothing resembling PlayerDetail's ~30 fields.

#### `GET /api/users/:id` — **EXACT (keys)** / INFERRED (value formats) — *refreshed 2026-07-27*

`SELECT user_id AS id, username, email, profile_image_url, total_points AS points FROM users WHERE user_id = $1`

```json
{
  "id": 1,
  "username": "someuser",
  "email": "user@example.com",
  "profile_image_url": "https://avatars.githubusercontent.com/u/…",   // or null
  "points": 0
}
```

**Five keys now, not four** — `profile_image_url` was added by the merge. Nullable: `NULL` for a password-signup user who hasn't uploaded, populated for GitHub OAuth users. Still confirms the brief: the points key is **`points`**, aliased from `total_points`. 404s with `{"error":"User not found"}`. `password_hash` is never exposed.

#### `PATCH /api/users/:id` — **EXACT (keys)** / INFERRED (value formats) — *refreshed 2026-07-27*

Accepts `{ username?, profile_image_url?, total_points? }`, `COALESCE`s each, and now returns `PUBLIC_COLUMNS` — **including `profile_image_url`.** This is what fixes §2.5.

#### `GET /auth/login/success` — **EXACT (keys)** — *new post-merge*

```json
{ "success": true,
  "user": { "id": 1, "username": "someuser", "email": "user@example.com",
            "profile_image_url": "https://…", "points": 0 } }
```

401 `{ "success": false, "message": "not authenticated" }` when there's no session. Same five-key user shape as `/api/users/:id` (from `deserializeUser`). **This is the correct source for "the logged-in user"** — see §5 P1.

#### `GET /api/follows/user/:userId` — **INFERRED** (`SELECT *`, so schema is authoritative)

```json
[
  { "followed_team_id": 1, "user_id": 1, "api_team_id": "1",
    "team_name": "Liverpool", "followed_at": "2026-07-27T12:00:00.000Z" }
]
```

`api_team_id` is `VARCHAR(50)` → **arrives as a string**. `POST /api/follows` takes `{ user_id, api_team_id, team_name }` and returns the same row shape (201). `DELETE /api/follows/:id` returns `{ "message": "Team unfollowed successfully" }` — note: **200 even when nothing was deleted** (no rowCount check).

### 2.5 The avatar round-trip — ✅ **backend side FIXED**, frontend not yet using it

*refreshed post-merge 2026-07-27*

Original finding: Profile uploaded to Cloudinary and `PATCH`ed `profile_image_url`, the write succeeded, but **no read path returned it**, so the avatar vanished on reload. The fix I described as "one word added to two `SELECT` lists" **has been made** — `PUBLIC_COLUMNS` (§2.3) now includes the column in every read and write path.

**But the frontend hasn't caught up.** [Profile.jsx:109-112](../Code/client/src/pages/Profile.jsx#L109-L112) still carries the workaround comment and its now-obsolete premise:

```js
// getUserById/updateUser never return profile_image_url (see plan
// notes) — use the URL Cloudinary gave us directly instead of
// trying to re-fetch it from the API.
setAvatarUrl(uploadData.secure_url)
```

`Profile.jsx` was **not touched** by the merge (confirmed by diff), so `avatarUrl` still initialises to `null` and is only ever set from a fresh upload. Net effect: **the avatar still disappears on reload — but now that's purely a frontend gap, and it's a one-line fix.** Initialise from the fetched user instead of `null`:

- read `user.profile_image_url` in the existing `useEffect` that already fetches `/api/users/:id`
- delete the stale comment

That moves from P3 "flag the limitation in the UI" to P1 "consume the data that now exists". It's in-scope frontend work on Shalom's own #12 page, and it's the cheapest real-data win left in the codebase.

---

## 3. Gap analysis

### 3.1 Dead interactions — no handler, no destination

| Element | File | Notes |
| --- | --- | --- |
| "PLACE WAGER" button | [MatchDetail.jsx:193](../Code/client/src/pages/MatchDetail.jsx#L193) | `<button>`, no `onClick`. Prominent primary CTA. |
| "Submit Prediction" button | [Leaderboard.jsx:100](../Code/client/src/pages/Leaderboard.jsx#L100) | No `onClick`. `POST /api/predictions` **exists and is unused.** |
| "+ Follow Player" button | [PlayerDetail.jsx:55](../Code/client/src/pages/PlayerDetail.jsx#L55) | No `onClick`, no state — cannot even toggle visually. No player-follow endpoint exists. |
| "Connect"/"Disconnect" ×3 | [Profile.jsx:373](../Code/client/src/pages/Profile.jsx#L373) | No handlers. No OAuth-app concept in the schema. |
| "Deactivate Account" | [Profile.jsx:392](../Code/client/src/pages/Profile.jsx#L392) | No handler. No endpoint. |
| "Delete Account Permanently" | [Profile.jsx:398](../Code/client/src/pages/Profile.jsx#L398) | No handler. No endpoint. Destructive-looking and inert. |
| Sidebar "Quick Search" input | [Sidebar:69](../Code/client/src/components/Sidebar/index.jsx#L69) | Uncontrolled, no state, no `onChange`. Types but does nothing. |
| Notification toggles ×5 | [Profile.jsx:337](../Code/client/src/pages/Profile.jsx#L337) | Local state only, never persisted. `notifications` table exists. |
| Privacy toggles ×3 | [Profile.jsx:356](../Code/client/src/pages/Profile.jsx#L356) | Local state only, never persisted. No column for them. |
| "Top Up Balance" | [Profile.jsx:240](../Code/client/src/pages/Profile.jsx#L240) | Styled as a button, is a `<span>` — not focusable, not keyboard-reachable. |
| "SEE ALL" ×2 | [Home.jsx:141](../Code/client/src/pages/Home.jsx#L141), [Discover.jsx:119](../Code/client/src/pages/Discover.jsx#L119) | `<p>` tags styled as links. |
| "VIEW FULL SCHEDULE →" | [TeamDetail.jsx:103](../Code/client/src/pages/TeamDetail.jsx#L103) | `<p>` tag. |
| Ticker filter tabs ×4 | [Home.jsx:135-139](../Code/client/src/pages/Home.jsx#L135-L139) | "Latest Match / Coming Match / Pre-season / Live Games" are plain `<p>`s — one is styled active, none filter. |
| "Filter match details…" | [Matches.jsx:65](../Code/client/src/pages/Matches.jsx#L65) | A `<p>` inside a box styled to look like a search input. Not an `<input>`. |
| Trending tags ×5 | [Discover.jsx:83](../Code/client/src/pages/Discover.jsx#L83) | `<span>`s, not clickable. |
| Footer links ×16 | [Discover.jsx:140](../Code/client/src/pages/Discover.jsx#L140) | All `<p>` tags. |
| Login legal links ×3 | [Login.jsx:120](../Code/client/src/pages/Login.jsx#L120) | `<span>`s. **Still dead post-merge, and now duplicated** in [Signup.jsx:118](../Code/client/src/pages/Signup.jsx#L118) → 6 instances. |
| "Forgot Password?" | [Login.jsx:87](../Code/client/src/pages/Login.jsx#L87) | ⚠️ **still** `<a href="#">` with `preventDefault()`. No reset flow exists server-side. |
| ~~"Sign Up" `<a href="#">`~~ | — | ✅ **FIXED post-merge** — real `<Link to='/signup'>`, and `/signup` exists. |
| ~~Google / Apple OAuth buttons~~ | — | ✅ **FIXED post-merge** — replaced by one working GitHub `<a href={AUTH_URL}/github>`. |
| "Send message…" chat input | [MatchDetail.jsx:188](../Code/client/src/pages/MatchDetail.jsx#L188) | `<p>`, not an input. |
| "Add a comment…" | [CommentThread.jsx:26](../Code/client/src/components/CommentThread.jsx#L26) | `<p>`. `POST /api/comments` exists and is unused. |
| `TeamCard` body | [TeamCard.jsx](../Code/client/src/components/TeamCard.jsx) | Whole card is a `<div>` — crest and name are not a link to `/teams/:id`. Only the Follow button works. |

Pattern worth naming: **~45 of these are `<p>`/`<span>` elements styled to look interactive.** Beyond being dead, they're inaccessible — no focus ring, no keyboard access, no button/link semantics for screen readers. Cheap to fix as a batch.

### 3.2 Orphan routes

- **`/profile` — the significant one.** Zero UI paths in. All of #12 (avatar upload, bio editing, settings) and the real follow/unfollow UI is behind a URL only you know. A grader who doesn't type `/profile` sees none of it.
- **`/login`** — unreachable here, but that's expected: the guard (`RequireAuth`) that would redirect to it lives on `main`.
- **`/teams/:teamId`** — technically reachable, but only via the Home standings table, i.e. only for the 3 Premier League clubs the API returns. Discover's 8 national teams (the intended entry point) don't link anywhere.
- **No catch-all route** — every typo, plus `navigate('/home')`, renders a blank white page with no error.

### 3.3 Mock and hardcoded data

8 files in `src/mocks/` (`teams`, `matches`, `matchDetail`, `teamDetail`, `playerDetail`, `leaderboard`, `followedTeams`, `dashboardMocks`), plus arrays inlined directly in pages.

| Surface | Source | Real endpoint available? |
| --- | --- | --- |
| **Matches page — entire grid** | `mocks/matches.js` (9 fixtures) | ✅ `GET /api/matches` — **not called at all** |
| **MatchDetail — everything** | `mocks/matchDetail.js` | ⚠️ `GET /api/matches/:id` exists but returns only 9 keys; events/lineups/stats/possession have no source |
| **TeamDetail — everything** | `mocks/teamDetail.js` | ⚠️ `GET /api/teams/:id` exists; form/fixtures/roster/crest have no source |
| **PlayerDetail — everything** | `mocks/playerDetail.js` | ⚠️ `GET /api/players/:id` exists (6 keys vs ~30 needed) |
| **Discover — all 8 teams** | `mocks/teams.js` | ❌ no national-teams endpoint |
| **Leaderboard — top 10** | `mocks/leaderboard.js` | ⚠️ `GET /api/users` returns ranked users, but has no `location`/`title`/`topTeam`/`trend` |
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

**Unsourced literals rendered as fact** — these read as real data to a viewer and are the sharpest "no invented data" violations:

| Text | File |
| --- | --- |
| "MATCHDAY 24" | [Home.jsx:184](../Code/client/src/pages/Home.jsx#L184) |
| "Your predictions are paying off. Top 5% this week." | [Home.jsx:244](../Code/client/src/pages/Home.jsx#L244) |
| "1,247 online" | [MatchDetail.jsx:172](../Code/client/src/pages/MatchDetail.jsx#L172) |
| "High confidence: Argentina likely to advance…" | [Matches.jsx:115](../Code/client/src/pages/Matches.jsx#L115) |
| "{team} has a 22% projected model chance of winning…" | [TeamDetail.jsx:145](../Code/client/src/pages/TeamDetail.jsx#L145) |
| "#47", "8,230 pts", "Top Earning Team: Arsenal" | [Leaderboard.jsx:49-60](../Code/client/src/pages/Leaderboard.jsx#L49-L60) — sits next to *real* points on Home, so the two disagree |
| "📍 London, UK", "Joined March 2024" | [Profile.jsx:226-227](../Code/client/src/pages/Profile.jsx#L226-L227) — `created_at` exists in DB but isn't returned |
| Default bio ("Tactical obsession…") | [Profile.jsx:13](../Code/client/src/pages/Profile.jsx#L13) — presented as the user's own words |
| "✨ AI Tactical Analysis" paragraph | [PlayerDetail.jsx:162](../Code/client/src/pages/PlayerDetail.jsx#L162) — no AI is involved anywhere |
| "MatchLens Score 94.2", "€95.0M market value" | PlayerDetail — invented metrics with no source |
| "v2.4.0-Stable ● Systems Operational" | [Login.jsx:130](../Code/client/src/pages/Login.jsx#L130) — fake status indicator. **Still present, now duplicated** in [Signup.jsx:128](../Code/client/src/pages/Signup.jsx#L128). |
| "© 2024" (Login **and now Signup**) vs "© 2026" (Discover) | inconsistent |

**Status-value mismatch (functional bug).** `Matches.jsx` filters on `status === 'FT'` for its Results tab, and `mocks/matches.js` supplies `FT` rows. The **real** API never emits `FT` — only `LIVE | HT | UPCOMING`. So the moment Matches is switched from mock to real data, the Results tab renders empty and `HT` matches vanish from all three tabs. Same trap on Home: it looks for `status === 'UPCOMING'` and `'LIVE'` (both exist ✅) but nothing handles `HT`.

`DEMO_USER_ID = 1` is hardcoded in [Home.jsx:16](../Code/client/src/pages/Home.jsx#L16) and [Profile.jsx:6](../Code/client/src/pages/Profile.jsx#L6). Correct given no session on this branch — but `main` has real auth, so this is the seam to reconcile on merge.

### 3.4 Missing loading / empty / error states

Every fetch on this branch swallows errors into `console.error` and renders nothing.

**`Home.jsx` — 4 fetches, 0 states.** [Home.jsx:57-77](../Code/client/src/pages/Home.jsx#L57-L77):

- No `loading` flag. Initial state is `[]`/`null`, so first paint shows a dashboard with empty sections and no spinner.
- **No `res.ok` check on any of the four.** A 404/409 body (`{"error": "..."}`) is parsed as JSON and pushed into state. `setMatches({error})` then makes `matches.find(...)` throw `TypeError: matches.find is not a function` → white screen, no error boundary.
- `.catch(console.error)` — user sees nothing at all on network failure.
- No empty state for the standings table, ticker, or top scorers.
- `StandingsTable` does `[...teams].sort(...)` — crashes if `teams` isn't an array (same 409 path).

**`Profile.jsx` — partial.** Genuinely has: `uploading` flag, `uploadError`, `followError`, and an empty state for followed teams ("Not following any teams yet."). Missing: no loading state for the two initial fetches (username renders the literal string `'Loading…'` forever on failure — [Profile.jsx:184](../Code/client/src/pages/Profile.jsx#L184) — indistinguishable from a slow network), and again **no `res.ok` check** on either GET.

**Pages with no fetches at all** (Matches, MatchDetail, TeamDetail, PlayerDetail, Discover, Leaderboard) trivially have no states — but their mock getters are also unguarded: `getMockMatchDetail(matchId)` ignores whether `matchId` is valid and always returns Argentina–France, so `/matches/99999` renders a confident fake match instead of a 404.

**`Login.jsx` is the one good citizen** — `loading` disables the submit button and swaps the label, `error` renders inline, validation runs client-side first. Eric's work; leave the logic alone.

### 3.5 Placeholder visuals that don't match the design

- Lime-green circle (`bg-primary`) standing in for the **app logo** — [Sidebar:61](../Code/client/src/components/Sidebar/index.jsx#L61). Exactly the case named in the brief.
- 17 × `bg-white/10` grey blocks where crests, photos, and avatars belong (§1.4).
- Red + blue circles as MatchDetail hero crests — reads as status dots.
- Emoji standing in for iconography throughout: 🏆 🔥 ⚽ ⚡ 💬 📊 📋 📍 👥 🏟 ✨ ✅ ❌ 🇪🇸 🇧🇷 🇳🇴 🇲🇦 🟨 🟥 🏅 ▲ ▼ ★ ▶ ●. Emoji render differently per-OS and are not in the design system.
- Flag emoji hardcoded **inside mock data strings** (`'Spain 🇪🇸'`) — will need stripping when real data lands.
- `PitchDot` coordinates are hand-tuned percentages in mock data; the pitch itself is two divs (centre line + circle), not a real pitch graphic.

### 3.6 Design drift

**Tokens are defined correctly.** I pulled design-system node `1:67426` via the Figma MCP and compared it against [tailwind.config.js](../Code/client/tailwind.config.js): **all 24 colours and all 11 type-scale steps match the Figma values exactly.** Montserrat is correctly declared as `font-sans` and preloaded with weights 400–800 in `index.html`. The foundation (#14) is sound.

**The pages then almost entirely bypass it.**

*Typography — the scale is defined and unused:*

| | Count |
| --- | --- |
| Arbitrary `text-[Npx]` classes | **228** |
| Design-system scale classes | **8** (`text-h1` ×3, `text-caption` ×3, `text-overline` ×1, `text-body-lg` ×1) |

228 vs 8. The most-used sizes are `text-[13px]` (58×), `text-[12px]` (43×), `text-[11px]` (43×) — **none of which exist in the design system**, whose body sizes are 15/14/12/10/8px. So the app's dominant body text (13px, 11px) is off-scale.

Also `font-extrabold` (800) appears **18 times**. The design system specifies at most Bold/700 (H1). Weight 800 is not a design-system weight — it's preloaded in `index.html`, which is what let it drift in.

*Colour — an invented parallel palette:*

Design-system tokens used across the whole app: **`bg-surface`, `bg-card`, `bg-primary-light`, `accent-*`, `ui-separator`, `ui-input`, `ui-light-gray`, `text-tertiary`, `text-muted`, `text-disabled` → ZERO usages.**

Instead every one of the 18 source files uses the `dash-*` block, which `tailwind.config.js` itself labels `// Dashboard dark-theme tokens (not in the official design system swatches)`:

| Invented | Value | Design-system status |
| --- | --- | --- |
| `dashboard` | `#1C1C1C` | ✅ = Background/Dark — legitimate, just aliased under a non-DS name |
| `dash-card` | `#222327` | 🚩 no DS equivalent (DS Card is `#EDEDED`) |
| `dash` | `#313131` | 🚩 no DS equivalent (DS Separator is `#D9D9D9`) |
| `dash-sidebar` | `#141414` | 🚩 no DS equivalent |
| `dash-input` | `#2E3034` | 🚩 DS Input is `#484848` |
| `dash-neutral` | `#3A3C42` | 🚩 no DS equivalent |
| `dash-live` | `#EF4444` | 🚩 DS Red is `#FFE2E2` |
| `dash-away` | `#218AF3` | 🚩 DS Blue Solid is `#399FFD` — near-miss duplicate |
| `dash-mlx` | `#4FFF62` | 🚩 **near-duplicate of Primary `#46FF6F`** |
| `dash-gold` | `#FFD700` | 🚩 DS Yellow is `#FFFEE2` |

To be fair to the current design: a dark theme is **not itself** drift — Background/Dark `#1C1C1C` and Black `#000000` are both real design-system tokens. The drift is that the greys layered on top (card, sidebar, separator, input) and the semantic accents were invented rather than derived, and two of them are near-duplicates of real tokens at slightly different values.

The sharpest symptom: **`dash-mlx` (#4FFF62) vs `primary` (#46FF6F).** Leaderboard and Profile use `dash-mlx` for their primary green; every other page uses `primary`. Two greens 1.5% apart, split across pages — it reads as a rendering inconsistency rather than a choice.

*Three-column shell:* the shell is really **two** columns (sidebar + `<Outlet/>`), with each page independently re-implementing its own right rail — `w-[280px]` on Home/Matches/TeamDetail, `w-[300px]` on MatchDetail, `w-[320px]` on Leaderboard, `w-[420px]` on Profile. Five different widths for the same structural element, and Discover has no rail at all. Not a shared layout primitive.

*Responsiveness:* `Sidebar` is a fixed `w-[220px]` with no mobile collapse; every right rail is a fixed-width `shrink-0`; `TeamCard` is a hard `w-[213px]` inside a responsive grid. Below ~1100px the layout overflows horizontally.

*Login **and now Signup** are a separate visual universe* — *refreshed post-merge 2026-07-27*, and this got **worse, not better**:

- [Login.css](../Code/client/src/css/Login.css) still sets **`font-family: 'Playfair Display', serif`** on `.login-brand-name`. Still **never loaded** — `index.html` fetches only Montserrat, so it falls back to a generic serif.
- The merge added a `.login-page` block to [index.css:24-41](../Code/client/src/index.css#L24-L41) declaring **`font-family: 'Inter', system-ui, …`** — also **not loaded**, so both auth pages now render in `system-ui` with one serif accent. Two unloaded fonts on one page.
- That block also introduces **7 more off-palette hexes** (`#101209`, `#2b2f22`, `#e8eae2`, `#9aa08d`, `#a9c283`, `#8ba565`, `#e5484d`) as CSS custom properties, on top of Login.css's 9. **Zero** overlap with the design system.
- `Signup.jsx` reuses `Login.css` wholesale, so the drift now covers **two** routes.

Credit where due: the new block is *deliberately* scoped to `.login-page` rather than `:root` specifically so this legacy palette can't leak into the Tailwind theme, and it explains why (`index.css` was replaced during the dashboard rebuild, leaving Login.css referencing undefined vars). It carries its own acknowledgement:

```
TODO: restyle Login/Signup with the Tailwind design tokens and delete both
this block and css/Login.css.
```

So P4 #22 below is no longer a unilateral call on someone else's file — **it's a documented, sanctioned piece of debt with an owner-written TODO asking for exactly that work.** Scope is now two pages plus deleting the `index.css` block.

> Scope note: I compared against design-system node `1:67426` (colours + typography only — it defines no spacing, radius, or component specs, and `get_variable_defs` returns nothing, so these are static swatches, not bound Figma variables). The file's `screens` page (`0:1`) does contain real screen frames — e.g. `Dashboard Body` (`1:3632`) — which I did **not** pull. So the "Design match?" column below reflects **token and typography conformance only**, not per-frame layout fidelity. Frame-by-frame comparison is still outstanding and should precede any restyling pass.

---

## 4. Status table

*rows for Shell, Sidebar, Profile, Login, Signup refreshed post-merge 2026-07-27; all others unchanged and re-verified untouched by the merge*

Reachable: ✅ nav/button · ⚠️ partial · ❌ URL only
States: L=loading, E=empty, Er=error

| Page / feature | Owner | Reachable? | Data source | States (L/E/Er) | Design match? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| **Shell** (`App`, `main`, `index.css`) | Shalom #14 | — | — | — | ⚠️ tokens correct, no 404 route | ✅ **Build blocker resolved** — 78/78 imports resolve (§0.1). `RequireAuth` now guards the shell. **Still no catch-all route.** `index.css` gained the legacy `.login-page` palette (§3.6). |
| **Sidebar** | Shalom #14 | ✅ | mock `followedTeams` | ❌/❌/❌ | ⚠️ 2-col not 3-col | Logo = lime circle. Search input dead. 2 label/destination mismatches. Not responsive. **New:** working "Sign Out" at `mt-auto` — but still **no `/profile` link**. |
| **Home** `/` | Shalom #14 + shared | ✅ Dashboard | **Real ×4** + 2 mock blocks | ❌/❌/❌ | ⚠️ all `dash-*`, 12 arbitrary sizes | No `res.ok` → 409 body crashes `.find()`. Bracket + stats fully mocked. "MATCHDAY 24", "Top 5%" invented. |
| **Matches** `/matches` | **Shalom #3** | ✅ Live Football | **100% mock** | ❌/❌/❌ | ⚠️ | **No calendar/date picker at all** — `?date=` is supported server-side and unused. `GET /api/matches` never called. `FT` filter matches no real status. Fake search input. |
| **MatchDetail** `/matches/:id` | shared #1 | ✅ via MatchCard | **100% mock** | ❌/❌/❌ | ⚠️ | Ignores existing `GET /api/matches/:id`. Any id → same fake match. Red/blue circle crests. "PLACE WAGER" dead. "1,247 online" invented. |
| **Discover** `/discover` | **Shalom #9** | ✅ Highlights | **100% mock** (8 teams) | ❌/❌/❌ | ⚠️ | Follow toggles are **local state only — never POSTed**, unlike Profile which does it properly. Cards don't link to team detail. `useTeamSearch` is a pass-through stub (#6). 16 dead footer links. |
| **TeamDetail** `/teams/:id` | shared #1 | ⚠️ Home standings only | **100% mock** | ❌/❌/❌ | ⚠️ | Follow button = local state, no API. Ignores `GET /api/teams/:id`. Needs `goals_conceded`, which the API lacks. "22% projected" invented. |
| **PlayerDetail** `/players/:id` | shared #1 | ✅ via PlayerCard | **100% mock** | ❌/❌/❌ | ⚠️ | Widest data gap: API gives 6 keys, page renders ~30. "MatchLens Score", "€95.0M", "AI Tactical Analysis" all invented. Follow button fully inert. |
| **Leaderboard** `/leaderboard` | #10 Gildardo | ✅ Standings + Home CTA | **100% mock** | ❌/❌/❌ | 🚩 uses `dash-mlx` not `primary` | `GET /api/users` returns ranked users and is unused. "#47 / 8,230 pts" contradicts Home's real points. "Submit Prediction" dead though endpoint exists. |
| **Profile** `/profile` | **Shalom #12 + #9** | ❌ **ORPHAN** (re-verified) | **Real** (user, follows) + mock picker/tx | ⚠️/✅/✅ | 🚩 `dash-mlx`, 24 `dash-*` | Best real-data page in the app and **you still can't navigate to it.** File untouched by merge. Avatar still resets on reload — but the API now returns `profile_image_url`, so it's a **one-line frontend fix** (§2.5). Team picker mocked. 11 dead controls. |
| **Login** `/login` | **Eric — preserve** | ✅ **now reachable** | Real (`UsersAPI.login`, bcrypt) | ✅/—/✅ | 🚩 **worst drift, now worse** | ✅ Build blocker + `/home` bug + dead OAuth buttons all fixed. Real GitHub OAuth. Best state handling in the codebase. 🚩 Two unloaded fonts (Playfair + Inter), 16 off-palette hexes, owner TODO to restyle. "Forgot Password?" still dead. |
| **Signup** `/signup` | **Eric — preserve** | ✅ **new** | Real (`UsersAPI.createUser`) | ✅/—/✅ | 🚩 same drift as Login | New post-merge. Client validation mirrors server bounds. Shares `Login.css`, so it **doubles** the auth-page drift and duplicates the dead legal links + fake "v2.4.0 ● Systems Operational" footer. |
| **Auth plumbing** (`AuthAPI`, `UsersAPI`, `RequireAuth`, `config/api`, `validate*`) | **Eric — do not rewrite** | — | Real (`/auth/*`, `/api/users/*`) | ✅/—/✅ | n/a (no UI) | Session-revalidating guard with optimistic first paint; `credentials: 'include'`; bcrypt; `AUTH_ORIGIN` dev/prod split. **Logic is load-bearing — restyle presentation only.** |
| **Static assets** | Shalom #14 | — | — | — | 🚩 | **Still zero assets.** No logo, favicon, crests, photos, or icon set. Only addition is the inline `GitHubMark` SVG. |

---

## 5. Prioritized fix list

Ordered by user-visible impact. **Nothing below has been done** — this pass changed no code.

### P0 — ✅ CLEARED by the merge

*refreshed post-merge 2026-07-27*

1. ~~**Restore the `services/` layer, or merge `main` into `frontend`.**~~ ✅ **Done** — merged; 78/78 imports resolve (§0.1).
2. ~~**Fix `navigate('/home')`.**~~ ✅ **Done** — now `navigate(destination)` honouring `RequireAuth`'s `from` state (§0.2).
3. **Add a catch-all `404` route.** ⚠️ **Still open** — the one P0 item the merge didn't address. Any typo still renders blank white. Cheap, and the only structural gap left in the router.

*Remaining pre-flight, one command, yours to run:* `npm install && npm run build` from `Code/` to convert §0.1's "no static blocker found" into a confirmed green build.

### P1 — unreachable or crashing

*items 4a and 5 refreshed post-merge 2026-07-27*

4. **Give `/profile` a nav entry.** An avatar/username block at the bottom of the Sidebar linking to `/profile` matches the design-system pattern and unhides all of #12. Highest visible return of anything on this list. **Post-merge this got easier and more obvious:** the Sidebar now has a `mt-auto` "Sign Out" button — put the avatar/username block directly above it, and `GET /auth/login/success` already supplies `username` + `profile_image_url` to render it with real data.

4a. **Consume `profile_image_url` on Profile** *(new, post-merge)*. The backend now returns it on every user read (§2.3), but `Profile.jsx` still initialises `avatarUrl` to `null`, so uploads still vanish on reload. Read it from the user fetch that's already there and delete the stale comment at [Profile.jsx:109-112](../Code/client/src/pages/Profile.jsx#L109-L112). One line, real data, on Shalom's own page — the cheapest genuine win left.

4b. **Replace `DEMO_USER_ID = 1` with the session user** *(newly unblocked)*. Hardcoded in [Home.jsx:16](../Code/client/src/pages/Home.jsx#L16) and [Profile.jsx:6](../Code/client/src/pages/Profile.jsx#L6), both commented "No login/session exists yet". **A session now exists.** `AuthAPI.getSession()` returns the real user, and `RequireAuth` has already guaranteed one by the time either page renders. Until this changes, every signed-in user sees user 1's points and follows — a correctness bug now, not just a placeholder.
5. **Add `res.ok` guards to all 6 GETs** in `Home.jsx` and `Profile.jsx`. Today a 409 puts `{error: "..."}` into array state and `.find()`/`.sort()` throws a white screen. Guard, then set an error state.
6. **Add loading + error + empty states to `Home`.** Four fetches, zero states. Per the no-invented-data rule these must be honest skeletons/messages, not filler.
7. **Add an error boundary** around the routed shell so one bad response degrades one panel instead of the page.

### P2 — real data that's sitting unused

8. **Point `Matches.jsx` at `GET /api/matches`.** Fully built page reading from mocks while the endpoint exists. Handle `HT` and drop the `FT` assumption, or the Results tab silently empties (§3.3).
9. **Build the actual fixture calendar (#3).** There is no date picker anywhere — the headline feature of the issue. Backend already supports `?date=YYYY-MM-DD`.
10. **Wire Discover's follow buttons to `POST/DELETE /api/follows` (#9).** Currently local-state-only, so follows vanish on reload — while Profile does the same job correctly. Reuse Profile's handlers.
11. **Feed the Sidebar's followed-teams list from `GET /api/follows/user/:id`** instead of `mocks/followedTeams.js`, so following a team visibly changes the nav.
12. **Link `TeamCard` → `/teams/:teamId`**, making team detail reachable from the team browser.
13. **Use `GET /api/matches/:id`, `/api/teams/:id`, `/api/players/:id`** for the fields they do cover on the three detail pages, with honest in-progress states for the rest. Also 404 on unknown ids rather than always rendering Argentina–France.

### P3 — honesty of the UI

14. **Remove or explicitly label every invented value** in §3.3 — "MATCHDAY 24", "1,247 online", "Top 5% this week", "22% projected", "MatchLens Score 94.2", "€95.0M", "AI Tactical Analysis", "#47 / 8,230 pts", "📍 London, UK", "v2.4.0-Stable ● Systems Operational". These are the clearest breaches of the no-invented-data rule; the Leaderboard ones directly contradict real points shown on Home.
15. **Convert the ~45 fake-interactive `<p>`/`<span>` elements** to real `<button>`/`<Link>`, or restyle them so they don't read as controls. Also an accessibility fix (focus, keyboard, semantics).
16. **Decide per dead control: wire, disable, or delete.** "Submit Prediction" and the comment inputs have live endpoints (`POST /api/predictions`, `POST /api/comments`) and are worth wiring. "Deactivate/Delete Account" and "Connect" have no backing at all and should not look live.
17. ~~**Surface the avatar-persistence limitation.**~~ ✅ **Superseded post-merge** — the backend `SELECT` fix has been made, so there's no limitation left to apologise for. This became **P1 #4a**: just consume the field (§2.5).

### P4 — design conformance

*Do the frame-by-frame Figma comparison first (§3.6 scope note) — the `screens` page has real frames I haven't pulled. Don't restyle against the swatch board alone.*

18. **Collapse `dash-mlx` (#4FFF62) into `primary` (#46FF6F).** Two greens 1.5% apart split across pages; the single most visible inconsistency.
19. **Replace the 228 arbitrary `text-[Npx]`** with the 11 defined scale steps, and drop `font-extrabold` (800 isn't a design-system weight). Note the real decision hiding here: the app's dominant 13px/11px body text is *off-scale* — moving to 14px/12px changes density on every page, so agree the mapping before mass-editing.
20. **Reconcile the `dash-*` greys with design-system tokens.** Keep the dark theme (`#1C1C1C` and `#000000` are legitimate tokens) but derive card/sidebar/separator/input from the palette instead of inventing them — or get the dark ramp added to the Figma design system so it's official.
21. **Extract the right rail into one shell primitive.** Five widths (280/300/320/420) for one structural element; Discover has none.
22. **Restyle `Login.css` + `Signup` to Montserrat + design tokens, and delete the `.login-page` block in `index.css`.** *Refreshed post-merge:* scope is now **two** pages, and the work is explicitly requested by an owner-written `TODO` in [index.css](../Code/client/src/index.css#L38) — so this is sanctioned debt, not a unilateral call on someone else's file. Both pages currently reference **two fonts that are never loaded** (Playfair Display, Inter) and 16 off-palette hexes. Presentation only — do not touch `handleSignIn`/`handleSignUp`, the validators, or `config/api.js`. While there: the duplicated dead legal links and the fake "v2.4.0-Stable ● Systems Operational" footer now exist on both pages (§3.1, §3.3).
23. **Add the missing assets:** logo (replacing the lime circle), favicon, and a single shared icon set — the three `SearchIcon` copies should be one component. Crests/photos are **blocked** until the football API is integrated server-side (§2.3); until then keep honest placeholders, not coloured circles.
24. **Make the shell responsive** — sidebar collapse, fluid rails, drop `TeamCard`'s fixed `w-[213px]`. Below ~1100px the layout overflows today.
