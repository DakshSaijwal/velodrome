import { generateRoomCode, generatePassage } from '../utils/gameUtils.js'

// rooms: Map<code, { players: [{id, name}], passage: string, started: bool }>
const rooms = new Map()

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`)

    // ── Create room ───────────────────────────────────────────────────────
    socket.on('room:create', ({ playerName }) => {
      const code = generateRoomCode()
      rooms.set(code, {
        players: [{ id: socket.id, name: playerName || 'Player 1' }],
        passage: generatePassage(60),
        started: false,
      })
      socket.join(code)
      socket.data.roomCode = code
      socket.emit('room:created', { code })
      console.log(`🏠 Room created: ${code}`)
    })

    // ── Join room ─────────────────────────────────────────────────────────
    socket.on('room:join', ({ code, playerName }) => {
      const room = rooms.get(code)
      if (!room) {
        socket.emit('room:error', { message: 'Room not found' })
        return
      }
      if (room.started) {
        socket.emit('room:error', { message: 'Race already in progress' })
        return
      }
      if (room.players.length >= 4) {
        socket.emit('room:error', { message: 'Room is full' })
        return
      }

      room.players.push({ id: socket.id, name: playerName || `Player ${room.players.length + 1}` })
      socket.join(code)
      socket.data.roomCode = code

      socket.emit('room:joined', { code, players: room.players })
      io.to(code).emit('room:players', room.players)
      console.log(`👤 ${playerName} joined room ${code}`)
    })

    // ── Start race ────────────────────────────────────────────────────────
    socket.on('race:start', ({ code, strict }) => {
      const room = rooms.get(code)
      if (!room) return

      room.started = true
      io.to(code).emit('race:start', { passage: room.passage, strict: !!strict })
      console.log(`🏁 Race started in room ${code}`)
    })

    // ── Player progress update ────────────────────────────────────────────
    socket.on('race:progress', ({ progress, wpm }) => {
      const code = socket.data.roomCode
      if (!code) return

      // Broadcast to everyone else in the room
      socket.to(code).emit('race:update', {
        playerId: socket.id,
        progress,
        wpm,
      })

      // Check if player finished
      if (progress >= 100) {
        const room = rooms.get(code)
        if (room && !room.winner) {
          room.winner = socket.id
          io.to(code).emit('race:finished', { winner: socket.id })
        }
      }
    })

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const code = socket.data.roomCode
      if (!code) return

      const room = rooms.get(code)
      if (!room) return

      room.players = room.players.filter(p => p.id !== socket.id)
      if (room.players.length === 0) {
        rooms.delete(code)
        console.log(`🗑️  Room ${code} deleted (empty)`)
      } else {
        io.to(code).emit('room:players', room.players)
      }
      console.log(`❌ Disconnected: ${socket.id}`)
    })
  })
}
