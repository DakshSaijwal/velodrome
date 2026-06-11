import { Router } from 'express'
import { getLeaderboard, submitScore } from '../controllers/leaderboardController.js'

const router = Router()

router.get('/',  getLeaderboard) // GET  /api/leaderboard
router.post('/', submitScore)    // POST /api/leaderboard

export default router
