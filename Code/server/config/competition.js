// The single competition this app is built around. Everything that talks to
// API-Football reads these two values, so pointing the app at a different
// tournament is a one-line change here plus clearing server/.cache.
//
// Season is pinned to 2022 (Qatar) because free plans only reach 2022-2024 —
// asking for the 2026 World Cup returns an empty response with
// "Free plans do not have access to this season". Upgrading the plan is the
// only thing standing between this and SEASON = 2026.
export const LEAGUE_ID = 1; // FIFA World Cup
export const SEASON = 2022;

// Round names as API-Football spells them, from GET /fixtures/rounds.
// The knockout rounds are ordered, which is what the bracket is built from.
export const GROUP_ROUNDS = [
  "Group Stage - 1",
  "Group Stage - 2",
  "Group Stage - 3",
];

export const KNOCKOUT_ROUNDS = [
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
];
