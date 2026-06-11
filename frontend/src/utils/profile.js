// Local profile: race history, personal bests, ghost replays.
// Everything lives in localStorage so the app works fully offline.

const KEY = 'velodrome.profile.v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? { races: [], ghost: null }
  } catch {
    return { races: [], ghost: null }
  }
}

function save(profile) {
  localStorage.setItem(KEY, JSON.stringify(profile))
}

export function recordRace({ wpm, accuracy, mode, duration, keylog, troubleKeys }) {
  const profile = load()

  profile.races.push({
    wpm,
    accuracy,
    mode,
    duration,
    troubleKeys,
    at: Date.now(),
  })
  if (profile.races.length > 200) profile.races.shift()

  // A new personal best replaces the ghost recording
  const best = profile.ghost?.wpm ?? 0
  if (wpm > best && keylog?.length) {
    profile.ghost = { wpm, keylog, at: Date.now() }
  }

  save(profile)
  return profile
}

export function getProfile() {
  return load()
}

export function getGhost() {
  return load().ghost
}

export function getSummary() {
  const { races } = load()
  if (!races.length) return null

  const best = Math.max(...races.map(r => r.wpm))
  const avg = Math.round(races.reduce((s, r) => s + r.wpm, 0) / races.length)
  const avgAcc = Math.round(races.reduce((s, r) => s + r.accuracy, 0) / races.length)

  // Aggregate trouble keys across the last 20 races
  const keyErrors = {}
  races.slice(-20).forEach(r => {
    Object.entries(r.troubleKeys ?? {}).forEach(([k, n]) => {
      keyErrors[k] = (keyErrors[k] ?? 0) + n
    })
  })
  const troubleKeys = Object.entries(keyErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return { races: races.length, best, avg, avgAcc, troubleKeys, recent: races.slice(-30) }
}
