import 'dotenv/config'
import express    from 'express'
import { createServer } from 'http'
import { Server }  from 'socket.io'
import cors        from 'cors'
import mongoose    from 'mongoose'

import leaderboardRouter from './routes/leaderboard.js'
import { registerSocketHandlers } from './socket/gameSocket.js'

const PORT       = process.env.PORT       || 3001
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// ── Express ──────────────────────────────────────────────────────────────────
const app    = express()
const server = createServer(app)

app.use(cors({ origin: CLIENT_URL }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/leaderboard', leaderboardRouter)

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] },
})

registerSocketHandlers(io)

// ── MongoDB (optional) ────────────────────────────────────────────────────────
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err))
}

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
