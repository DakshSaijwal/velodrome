# Velodrome

A typing race game with live multiplayer, ghost replays, and per-key analytics.

**Live demo:** https://velodrome-mu.vercel.app/

## Features

- **Ghost racer** — your personal best run is recorded as a keystroke timeline and replayed as a translucent opponent in future races. Beat it and the new run becomes the ghost.
- **Live multiplayer** — host a 4-letter room code, friends join, races sync in real time over WebSockets (Socket.io rooms).
- **Per-key analytics** — every mistyped character is tracked against the *expected* key, surfacing your "nemesis keys" across your last 20 races.
- **Speed-over-time chart** — WPM is sampled twice a second during a race and rendered as a hand-rolled Canvas line chart on the results screen (no chart library).
- **Three difficulty modes** — plain words, +punctuation/capitalisation, +numbers.
- **Local-first stats** — race history, personal bests and ghost data persist in localStorage; the app is fully playable offline. Global leaderboard syncs to the backend when available.
- **Honest runs** — paste and drag-drop are blocked in the input; losing tab focus mid-race is flagged.

## Tech

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Canvas API |
| Realtime | Socket.io (rooms, progress broadcast, winner detection) |
| Backend | Node.js, Express |
| Storage | localStorage (profile/ghosts) + MongoDB or in-memory (leaderboard) |

## Architecture notes

- `useGame` is a single state-machine hook (`idle → countdown → racing → finished`) that owns all timing, scoring and the keystroke log. Both solo and multiplayer pages consume it; multiplayer adds a thin Socket.io layer on top.
- Ghost replay works by binary-searching the recorded `{t, len}` keystroke timeline against elapsed time each tick — no second game simulation needed.
- WPM uses the standard definition (1 word = 5 correct characters).
- The backend keeps multiplayer rooms in memory (`Map<code, room>`); the leaderboard degrades gracefully from MongoDB → in-memory when no `MONGODB_URI` is set.

## Run locally

```bash
# backend (terminal 1)
cd backend && cp .env.example .env && npm install && npm run dev

# frontend (terminal 2)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173.

## Deploy

Backend → Render (root dir `backend`, set `CLIENT_URL`).
Frontend → Vercel (root dir `frontend`, set `VITE_SERVER_URL`).
