// Single source of truth for the backend's base URL. Works in dev (proxied
// to localhost:3001 by Vite) and in production (Vercel frontend, Render
// backend — different origins, so absolute URLs are required; CORS on the
// backend already allow-lists the Vercel domains).
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://velodrome.onrender.com')
