// Every api_team_id / api_match_id below is a REAL API-Football id from the
// 2022 World Cup, so seeded rows actually line up with what the app fetches.
// (They used to be placeholders like "101", which matched no real fixture, so
// every seeded comment and follow was invisible in the UI.)
//
//   Teams    — Argentina 26, France 2, Croatia 3, Morocco 31, Brazil 6,
//              England 10, Portugal 27, Netherlands 1118
//   Fixtures — Final          979139  Argentina 3-3 France (4-2 pens)
//              Semi-final     978279  Argentina 3-0 Croatia
//              Semi-final     978488  France 2-0 Morocco
//              Quarter-final  977794  Netherlands 2-2 Argentina

// `password` is the plaintext demo credential you log in with — resetDatabase.js
// bcrypt-hashes it before insert, so nothing plaintext ever reaches the table.
export const demoUsers = [
    {
        username: "carla_t",
        email: "demo@matchlens.com",
        password: "password123",
        profile_image_url: null,
        total_points: 24580,
    },
    {
        username: "jordan_m",
        email: "fan@matchlens.com",
        password: "letmein",
        profile_image_url: null,
        total_points: 18740,
    },
    {
        username: "sam_fc",
        email: "scout@matchlens.com",
        password: "scout2024",
        profile_image_url: null,
        total_points: 15220,
    },
];

// api_team_id values are real API-Football team IDs from the World Cup
// (league 1, season 2022) — must match what GET /api/teams/:id resolves,
// not arbitrary placeholders.
export const demoFollowedTeams = [
    { user_id: 1, api_team_id: "26", team_name: "Argentina" },
    { user_id: 1, api_team_id: "6", team_name: "Brazil" },
    { user_id: 2, api_team_id: "2", team_name: "France" },
    { user_id: 3, api_team_id: "31", team_name: "Morocco" },
];

export const demoComments = [
    {
        user_id: 1,
        api_match_id: "979139",
        content: "Messi finally gets his World Cup. What a final.",
    },
    {
        user_id: 2,
        api_match_id: "979139",
        content: "Mbappé with a hat-trick in a final and still ends up losing.",
    },
    {
        user_id: 3,
        api_match_id: "978488",
        content: "Morocco did the whole continent proud this tournament.",
    },
];

// These predictions start as pending so settling can be tested after running
// `npm run reset`. Settling match 979139, Argentina 3-3 France, gives:
//
// User 1 predicted 3-3 and follows Argentina: 100 x 2 = 200 points
// User 2 predicted 1-2 and receives 0 points
// User 3's prediction for match 978488 remains pending until that match is settled
export const demoPredictions = [
    {
        user_id: 1,
        api_match_id: "979139",
        predicted_home_score: 3,
        predicted_away_score: 3,
        points_awarded: 0,
    },
    {
        user_id: 2,
        api_match_id: "979139",
        predicted_home_score: 1,
        predicted_away_score: 2,
        points_awarded: 0,
    },
    {
        user_id: 3,
        api_match_id: "978488",
        predicted_home_score: 2,
        predicted_away_score: 0,
        points_awarded: 0,
    },
];

export const demoNotifications = [
    {
        user_id: 1,
        api_team_id: "26",
        api_match_id: null,
        notification_type: "match_alert",
        message: "Argentina kick off the final in 1 hour!",
    },
    {
        user_id: 2,
        api_team_id: "6",
        api_match_id: null,
        notification_type: "transfer_news",
        message: "France name their squad for the next window.",
    },
];

export const demoVideoLinks = [
    {
        user_id: 1,
        api_match_id: "979139",
        title: "Final Highlights - Argentina vs France",
        video_url: "https://youtube.com/watch?v=example1",
        provider: "youtube",
    },
    {
        user_id: 3,
        api_match_id: "978488",
        title: "Best Saves - France vs Morocco",
        video_url: "https://youtube.com/watch?v=example2",
        provider: "youtube",
    },
];
