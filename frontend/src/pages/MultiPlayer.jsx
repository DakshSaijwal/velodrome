import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useSocketEvent, useSocketEmit } from '../hooks/useSocketEvents'
import { useGame } from '../hooks/useGame'
import StatsBar         from '../components/StatsBar'
import TextDisplay      from '../components/TextDisplay'
import TypingInput      from '../components/TypingInput'
import CountdownOverlay from '../components/CountdownOverlay'
import ResultsCard      from '../components/ResultsCard'
import RaceTrack        from '../components/RaceTrack'

const PHASE = {
  HOME:     'home',     // Choose host or join
  LOBBY:    'lobby',    // Waiting room
  RACING:   'racing',   // Active game
  FINISHED: 'finished', // Results
}

const WORD_LIMITS = [15, 30, 50, 100]

export default function MultiPlayer() {
  const navigate  = useNavigate()
  const { socket } = useSocket()
  const emit      = useSocketEmit()

  const [lobbyPhase, setLobbyPhase] = useState(PHASE.HOME)
  const [isHost,     setIsHost]     = useState(false)
  const [roomCode,   setRoomCode]   = useState('')
  const [joinInput,  setJoinInput]  = useState('')
  const [joinError,  setJoinError]  = useState('')
  const [players,    setPlayers]    = useState([])
  const [oppProgress, setOppProgress] = useState({})
  const [strict,     setStrict]     = useState(false)
  const [wordLimit,  setWordLimit]  = useState(30)

  // No time limit in multiplayer (that's solo-only) — the race ends when the
  // shared, word-count-sized passage is fully typed. limitType: 'words' just
  // disables useGame's internal countdown-finish; the passage itself, once
  // applied from the server, is what actually bounds the race.
  const {
    passage, typed, phase, countdown,
    elapsedSeconds, wpm, accuracy, progress, charMap,
    startCountdown, handleInput, reset, applyPassage,
  } = useGame({ strict, limitType: 'words', limitValue: wordLimit })

  // ── Connect socket on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (socket && !socket.connected) socket.connect()
    return () => { if (socket?.connected) socket.disconnect() }
  }, [socket])

  // ── Socket events ─────────────────────────────────────────────────────────
  useSocketEvent('room:created', ({ code }) => {
    setRoomCode(code)
    setLobbyPhase(PHASE.LOBBY)
  })

  useSocketEvent('room:joined', ({ code, players: p }) => {
    setRoomCode(code)
    setPlayers(p)
    setLobbyPhase(PHASE.LOBBY)
  })

  useSocketEvent('room:error', ({ message }) => {
    setJoinError(message)
  })

  useSocketEvent('room:players', (p) => {
    setPlayers(p)
  })

  useSocketEvent('race:start', (payload) => {
    if (payload && typeof payload.strict === 'boolean') setStrict(payload.strict)
    if (payload?.passage) applyPassage(payload.passage)
    setLobbyPhase(PHASE.RACING)
    startCountdown()
  })

  useSocketEvent('race:update', ({ playerId, progress: p, wpm: w }) => {
    setOppProgress(prev => ({ ...prev, [playerId]: { progress: p, wpm: w } }))
  })

  useSocketEvent('race:finished', ({ winner }) => {
    setLobbyPhase(PHASE.FINISHED)
  })

  // ── Emit progress updates while racing ───────────────────────────────────
  // The server broadcasts to everyone *except* the sender. Our own car is
  // computed at render time from live `progress`/`wpm`, so it always moves.
  useEffect(() => {
    if (phase === 'racing') {
      emit('race:progress', { progress, wpm })
    }
  }, [progress, wpm, phase, emit])

  // Build the racer list fresh on every render: your live car + opponents.
  const racers = players.map(p => {
    const you = p.id === socket?.id
    const opp = oppProgress[p.id]
    return {
      id: p.id,
      name: you ? 'you' : p.name,
      progress: you ? progress : (opp?.progress ?? 0),
      wpm: you ? wpm : (opp?.wpm ?? 0),
      isYou: you,
    }
  })

  // ── Handlers ──────────────────────────────────────────────────────────────
  function hostRoom() {
    setIsHost(true)
    emit('room:create', { playerName: 'Player' })
  }

  function joinRoom() {
    setJoinError('')
    if (joinInput.length < 4) return
    emit('room:join', { code: joinInput.toUpperCase(), playerName: 'Guest' })
  }

  function startRace() {
    emit('race:start', { code: roomCode, strict, wordLimit })
  }

  function handlePlayAgain() {
    reset()
    setLobbyPhase(PHASE.HOME)
    setRoomCode('')
    setPlayers([])
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col max-w-3xl mx-auto w-full px-4 py-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink pb-4">
        <h1 className="text-lg font-display text-ink">
          VELO<span className="text-signal">DROME</span>
        </h1>
        <span className="text-xs font-mono text-faded tracking-widest">
          MULTIPLAYER {roomCode && `— ${roomCode}`}
        </span>
      </div>

      {/* ── Home: choose host or join ── */}
      {lobbyPhase === PHASE.HOME && (
        <div className="flex flex-col items-center gap-5 py-10">
          <h2 className="text-2xl font-display text-ink">Multiplayer</h2>
          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={hostRoom}
              className="flex-1 btn btn-primary !rounded-none py-3 
                         text-sm hover:opacity-90 transition-all"
            >
              Host Room
            </button>
            <button
              onClick={() => setIsHost(false)}
              className="flex-1 btn !rounded-none py-3 
                         text-sm font-mono hover:border-gray-500 transition-all"
            >
              Join Room
            </button>
          </div>

          {!isHost && (
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <input
                value={joinInput}
                onChange={e => setJoinInput(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="ENTER CODE"
                className="w-full bg-card border border-line rounded-xl 
                           text-ink font-mono text-xl text-center py-3 tracking-[6px]
                           focus:outline-none focus:border-ink uppercase"
                onKeyDown={e => e.key === 'Enter' && joinRoom()}
              />
              {joinError && (
                <p className="text-signal text-xs font-mono text-center">{joinError}</p>
              )}
              <button
                onClick={joinRoom}
                disabled={joinInput.length < 4}
                className="w-full btn btn-primary !rounded-none py-3 
                           text-sm disabled:opacity-30 hover:opacity-90 transition-all"
              >
                Join →
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="font-mono text-xs text-faded uppercase tracking-widest mr-1">words</span>
            {WORD_LIMITS.map(v => (
              <button
                key={v}
                onClick={() => setWordLimit(v)}
                className={`font-mono text-xs border-2 px-3 py-1.5 transition-colors
                  ${wordLimit === v ? 'border-ink bg-ink text-paper' : 'border-line text-faded hover:border-ink'}`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStrict(s => !s)}
            title="Can't pass a word until it's typed correctly"
            className={`font-mono text-xs border-2 px-3 py-1.5 transition-colors
              ${strict ? 'border-signal bg-signal text-paper' : 'border-line text-faded hover:border-ink'}`}
          >
            strict mode {strict ? 'on' : 'off'}
          </button>

          <button
            onClick={() => navigate('/')}
            className="text-xs font-mono text-faded hover:text-faded transition-colors"
          >
            ← back to home
          </button>
        </div>
      )}

      {/* ── Lobby ── */}
      {lobbyPhase === PHASE.LOBBY && (
        <div className="flex flex-col items-center gap-5 py-6">
          <div className="bg-card border-2 border-ink shadow-flat p-8 w-full max-w-sm text-center">
            <p className="text-xs font-mono tracking-[3px] uppercase text-faded mb-2">
              Room Code
            </p>
            <p className="text-5xl font-display font-mono text-signal tracking-[10px]">
              {roomCode}
            </p>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-faded mt-3">
              {wordLimit} words {strict ? '· strict' : ''}
            </p>
            <div className="mt-6 space-y-2">
              {players.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-signal' : 'bg-line'}`} />
                  <span className={p.id === socket?.id ? 'text-pine' : 'text-faded'}>
                    {p.name} {p.id === socket?.id ? '(you)' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {isHost && (
            <button
              onClick={startRace}
              disabled={players.length < 2}
              className="w-full max-w-sm btn btn-primary !rounded-none py-3 
                         text-sm disabled:opacity-30 hover:opacity-90 transition-all"
            >
              {players.length < 2 ? 'Waiting for players…' : 'Start Race →'}
            </button>
          )}
          {!isHost && (
            <p className="text-xs font-mono text-faded">Waiting for host to start…</p>
          )}
        </div>
      )}

      {/* ── Racing ── */}
      {(lobbyPhase === PHASE.RACING) && (
        <>
          <StatsBar wpm={wpm} accuracy={accuracy} timeLeft={elapsedSeconds} progress={progress} />

          {phase !== 'finished' && (
            <div className="relative bg-card border-2 border-ink shadow-flat p-7 min-h-[140px]">
              <CountdownOverlay visible={phase === 'countdown'} count={countdown} />
              <TextDisplay charMap={charMap} />
            </div>
          )}

          {phase !== 'finished' && (
            <TypingInput
              value={typed}
              onChange={handleInput}
              disabled={phase !== 'racing'}
              autoFocus={phase === 'racing'}
            />
          )}

          <RaceTrack racers={racers} />
        </>
      )}

      {/* ── Finished ── */}
      {lobbyPhase === PHASE.FINISHED && (
        <ResultsCard
          wpm={wpm}
          accuracy={accuracy}
          duration={elapsedSeconds}
          wpmHistory={[]}
          troubleKeys={{}}
          isPB={false}
          chars={typed.length}
          onPlayAgain={handlePlayAgain}
          onHome={() => navigate('/')}
        />
      )}
    </main>
  )
}
