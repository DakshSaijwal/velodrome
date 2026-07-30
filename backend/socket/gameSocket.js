import { generateRoomCode, generatePassage } from '../utils/gameUtils.js'

// rooms: Map<code, { players: [{id, name}], hostId: string, passage: string,
//                    started: bool, winner: string|null }>
const rooms = new Map()

function generateUniqueRoomCode() {
  let code
  do {
    code = generateRoomCode()
  } while (rooms.has(code))
  return code
}

// Clients decide who may start/restart a race from this flag, so it always
// travels with the player list.
function playersPayload(room) {
  return room.players.map(p => ({ ...p, isHost: p.id === room.hostId }))
}

// Shared by explicit "leave" and by disconnect.
function removeFromRoom(io, socket) {
  const code = socket.data.roomCode
  if (!code) return

  const room = rooms.get(code)
  if (!room) return

  room.players = room.players.filter(p => p.id !== socket.id)
  socket.leave(code)
  socket.data.roomCode = null

  if (room.players.length === 0) {
    rooms.delete(code)
    console.log(`🗑️  Room ${code} deleted (empty)`)
    return
  }

  // Without promoting a new host the room would be stranded — nobody
  // left could start the next race.
  if (room.hostId === socket.id) {
    room.hostId = room.players[0].id
    console.log(`👑 Host of room ${code} → ${room.hostId}`)
  }
  io.to(code).emit('room:players', playersPayload(room))
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`)

    // ── Create room ───────────────────────────────────────────────────────
    socket.on('room:create', ({ playerName }) => {
      const code = generateUniqueRoomCode()
      const room = {
        players: [{ id: socket.id, name: playerName || 'Player 1' }],
        hostId: socket.id,
        passage: generatePassage(60),
        started: false,
        winner: null,
      }
      rooms.set(code, room)
      socket.join(code)
      socket.data.roomCode = code
      socket.emit('room:created', { code, players: playersPayload(room) })
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

      socket.emit('room:joined', { code, players: playersPayload(room) })
      io.to(code).emit('room:players', playersPayload(room))
      console.log(`👤 ${playerName} joined room ${code}`)
    })

    // ── Start race ────────────────────────────────────────────────────────
    socket.on('race:start', ({ code, wordLimit }) => {
      const room = rooms.get(code)
      if (!room) return
      if (socket.id !== room.hostId) return

      // Everyone in the room races the same text, sized to the host's
      // chosen word count (falls back to the room's initial passage length).
      const words = Number(wordLimit) > 0 ? Number(wordLimit) : 60
      room.passage = generatePassage(words)
      room.started = true
      room.winner = null   // otherwise a rematch could never declare a winner
      // strict isn't the host's to choose in multiplayer — without it a
      // player can mash keys and still advance, so the server dictates it.
      io.to(code).emit('race:start', { passage: room.passage, strict: true })
      console.log(`🏁 Race started in room ${code} (${words} words)`)
    })

    // ── Rematch ───────────────────────────────────────────────────────────
    // Returns the room to the lobby rather than starting immediately, so the
    // host can change the word count / strict mode and new players can join.
    socket.on('race:again', ({ code }) => {
      const room = rooms.get(code)
      if (!room) return
      if (socket.id !== room.hostId) return

      room.started = false
      room.winner = null
      io.to(code).emit('room:rematch', { players: playersPayload(room) })
      console.log(`🔄 Rematch in room ${code}`)
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
        // `started` guards against a late packet from the previous race
        // declaring a winner while the room sits in the rematch lobby.
        if (room && room.started && !room.winner) {
          room.winner = socket.id
          io.to(code).emit('race:finished', { winner: socket.id })
        }
      }
    })

    // ── Leave room (back to the menu, socket stays connected) ─────────────
    socket.on('room:leave', () => {
      removeFromRoom(io, socket)
    })

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      removeFromRoom(io, socket)
      console.log(`❌ Disconnected: ${socket.id}`)
    })
  })
}
