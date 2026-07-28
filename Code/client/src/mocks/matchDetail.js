// Placeholder fixture for the Match Detail page, pending the real
// GET [VITE_API_URL]/matches/:id endpoint. One representative match —
// getMockMatchDetail overlays the requested :matchId onto it so the
// page still reflects the route param while the content stays static.

const baseMatch = {
  home: 'Argentina',
  away: 'France',
  home_score: 2,
  away_score: 1,
  status: 'LIVE',
  minute: 74,
  competition: 'FIFA World Cup 2026 • Round of 16',
  venue: 'MetLife Stadium',
  probability: { home: 64, draw: 21, away: 15 },
  events: [
    { minute: 34, type: 'goal', description: 'Goal! Lionel Messi scores for Argentina (Assist: Enzo Fernández)' },
    { minute: 47, type: 'yellow_card', description: 'Yellow Card - Aurélien Tchouaméni (France) for a late challenge' },
    { minute: 56, type: 'goal', description: 'Goal! Kylian Mbappé equalizes for France (Assist: Antoine Griezmann)' },
    { minute: 67, type: 'goal', description: "Goal! Julián Álvarez doubles Argentina's lead" },
  ],
  stats: [
    { label: 'Shots', homeValue: 14, awayValue: 9 },
    { label: 'Shots on Target', homeValue: 7, awayValue: 4 },
    { label: 'Pass Accuracy', homeValue: 87, awayValue: 81 },
    { label: 'Fouls', homeValue: 11, awayValue: 13 },
  ],
  possession: { home: 58, away: 42 },
  lineups: {
    home: {
      formation: '4-3-3 (Scaloni attacking shape)',
      players: [
        { name: 'E. Martínez', x: 3.8, y: 44 },
        { name: 'Molina', x: 18.5, y: 14 },
        { name: 'Otamendi', x: 15.6, y: 34 },
        { name: 'Romero', x: 15.6, y: 54 },
        { name: 'Acuña', x: 18.5, y: 74 },
        { name: 'E. Fernández', x: 34.7, y: 44 },
        { name: 'Messi', x: 40.6, y: 24 },
        { name: 'Mac Allister', x: 40.6, y: 64 },
        { name: 'Garnacho', x: 64.1, y: 14 },
        { name: 'J. Álvarez', x: 67.1, y: 44 },
        { name: 'Á. Correa', x: 64.1, y: 74 },
      ],
    },
    away: {
      formation: '4-2-3-1 (Deschamps defensive transition)',
      players: [
        { name: 'Maignan', x: 89.1, y: 44 },
        { name: 'Koundé', x: 74.4, y: 11.5 },
        { name: 'Upamecano', x: 77.4, y: 31.5 },
        { name: 'Saliba', x: 77.4, y: 56.5 },
        { name: 'T. Hernández', x: 74.4, y: 76.5 },
        { name: 'Tchouaméni', x: 58.2, y: 29 },
        { name: 'Camavinga', x: 58.2, y: 59 },
        { name: 'Dembélé', x: 46.5, y: 44 },
        { name: 'Mbappé', x: 45, y: 14 },
        { name: 'Griezmann', x: 45, y: 74 },
        { name: 'Thuram', x: 28.8, y: 44 },
      ],
    },
  },
}

export function getMockMatchDetail(matchId) {
  return { ...baseMatch, id: matchId }
}
