# MatchLens - Frontend Context

CodePath WEB103 final project.

## Stack
- Frontend: Vite + React + React Router + Tailwind, in `Code/client/`
- Backend: Node + Express + PostgreSQL, in `Code/server/`
- External football data API, proxied server-side
- Deployed on Render
- Confirm actual paths before assuming them.

## Figma
- File key: BluwoVP5R22gIc3ryGxNck
- Design system node: 1:67426

## Design system (dark theme)
- Page bg: #1c1c1c
- Cards: #222327
- Borders: #313131
- Accent: #46ff6f
- Font: Montserrat
- Layout: three-column shell (left nav, main, right widgets)
- Desktop only

## Hard rules
- Frontend only. Never edit anything under `Code/server/` or any backend file. You may READ backend code to learn data shapes, nothing else.
- No invented data. If the API doesn't provide a value, render an honest loading / empty / error / in-progress state, never fabricated content.
- Match the Figma design system exactly. Pull real frames via the Figma MCP when styling; don't guess tokens.
- Preserve Eric's shipped auth (AuthAPI.jsx, UsersAPI.jsx, validation utilities, session flow). Restyle and restructure presentation only; do not rewrite auth logic.
- The public user API returns `points`, not `total_points`. The World Cup has passed; past data is expected and correct.
- Work on the `frontend` branch. Small, scoped commits. Don't merge into main.
- if something is easier and faster to implement on the human side as opposed to claude computations and functions, let me know so i do it myself.

## Assets
`Code/client/src/assets/` holds only files actually imported by components (`ball.png`, `ball-frame.svg`). Pull fresh reference material from Figma (see file key above) rather than dumping export sheets here — add files only when a page imports them.
