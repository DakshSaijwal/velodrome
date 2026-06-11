import Score from '../models/Score.js'

// In-memory fallback when MongoDB is not configured
const memoryScores = []

export async function getLeaderboard(req, res) {
  try {
    if (!Score.db?.readyState) {
      // MongoDB not connected — return in-memory scores
      const sorted = [...memoryScores].sort((a, b) => b.wpm - a.wpm).slice(0, 20)
      return res.json(sorted)
    }
    const scores = await Score.find().sort({ wpm: -1 }).limit(20).lean()
    res.json(scores)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
}

export async function submitScore(req, res) {
  const { playerName, wpm, accuracy, mode } = req.body

  if (!playerName || wpm == null || accuracy == null) {
    return res.status(400).json({ error: 'playerName, wpm, and accuracy are required' })
  }

  try {
    if (!Score.db?.readyState) {
      // In-memory store
      const entry = { playerName, wpm, accuracy, mode: mode || 'solo', createdAt: new Date() }
      memoryScores.push(entry)
      return res.status(201).json(entry)
    }
    const score = await Score.create({ playerName, wpm, accuracy, mode })
    res.status(201).json(score)
  } catch (err) {
    res.status(500).json({ error: 'Failed to save score' })
  }
}
