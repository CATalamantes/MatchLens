// Placeholder fixture for the Sidebar's "Followed Teams" list, pending
// the real followed_teams data (the shape here matches the real DB
// table's columns — followed_team_id/user_id/followed_at are omitted
// since the Sidebar only needs to display, not manage, follows).
export const followedTeams = [
  { api_team_id: '1', team_name: 'Liverpool' },
  { api_team_id: '2', team_name: 'Arsenal' },
  { api_team_id: '3', team_name: 'Man City' },
]
