import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useSocketEvent, useSocketEmit } from '../hooks/useSocketEvents'
import { useGame } from '../hooks/useGame'
import { loadPlayerName, savePlayerName } from '../utils/profile'
import { SERVER_URL } from '../utils/apiBase'
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
  const [intent,     setIntent]     = useState(null)   // null | 'host' | 'join'
  const [roomCode,   setRoomCode]   = useState('')
  const [joinInput,  setJoinInput]  = useState('')
  const [joinError,  setJoinError]  = useState('')
  const [players,    setPlayers]    = useState([])
  const [oppProgress, setOppProgress] = useState({})
  const [strict,     setStrict]     = useState(false)
  const [wordLimit,  setWordLimit]  = useState(30)
  const [playerName, setPlayerName] = useState(() => loadPlayerName())
  const submittedRef = useRef(false)   // guards against double-posting a score

  function handleNameChange(v) {
    const name = v.slice(0, 20)
    setPlayerName(name)
    savePlayerName(name)
  }

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
  useSocketEvent('room:created', ({ code, players: p }) => {
    setRoomCode(code)
    setPlayers(p ?? [])
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
    submittedRef.current = false
    setOppProgress({})        // otherwise cars start where the last race ended
    setLobbyPhase(PHASE.RACING)
    startCountdown()
  })

  useSocketEvent('race:update', ({ playerId, progress: p, wpm: w }) => {
    setOppProgress(prev => ({ ...prev, [playerId]: { progress: p, wpm: w } }))
  })

  useSocketEvent('race:finished', ({ winner }) => {
    setLobbyPhase(PHASE.FINISHED)
  })

  // Host called a rematch — back to the lobby with the same room/players,
  // where the host can retune the options before starting again.
  useSocketEvent('room:rematch', ({ players: p }) => {
    if (p) setPlayers(p)
    setOppProgress({})
    reset()
    setLobbyPhase(PHASE.LOBBY)
  })

  // ── Submit to the global leaderboard ──────────────────────────────────────
  // Fires once THIS client's own typing is done (useGame's phase, not the
  // lobby phase) so a slower player isn't scored before they've finished —
  // the lobby can flip to FINISHED for everyone as soon as the winner does.
  useEffect(() => {
    if (phase !== 'finished' || submittedRef.current) return
    const name = playerName.trim()
    if (!name) return

    submittedRef.current = true
    fetch(`${SERVER_URL}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: name, wpm, accuracy, mode: 'multi' }),
    }).catch(() => {
      // Leaderboard is a nice-to-have — a failed post shouldn't break the race
    })
  }, [phase, playerName, wpm, accuracy])

  // ── Emit progress updates while racing ───────────────────────────────────
  // The server broadcasts to everyone *except* the sender. Our own car is
  // computed at render time from live `progress`/`wpm`, so it always moves.
  //
  // Two things this has to get right:
  //  · 'finished' must emit as well as 'racing'. finishGame() flips the phase
  //    in the same React batch as the last keystroke, so there is no render
  //    where progress is 100 and phase is still 'racing' — gating on 'racing'
  //    alone means the 100% update is never sent, the server never declares a
  //    winner, and the race hangs forever.
  //  · we send an unrounded percentage. `progress` is rounded to whole
  //    percent, and on a 100-word passage 1% is ~5 characters, so opponents'
  //    cars would visibly hop every second instead of gliding.
  const livePercent = passage.length ? (typed.length / passage.length) * 100 : 0
  useEffect(() => {
    if (lobbyPhase !== PHASE.RACING) return
    if (phase !== 'racing' && phase !== 'finished') return
    emit('race:progress', { progress: livePercent, wpm })
  }, [livePercent, wpm, phase, lobbyPhase, emit])

  // Host is tracked server-side (and reassigned if the host leaves), so derive
  // it from the player list rather than from who happened to click "Host".
  const isHost = players.some(p => p.id === socket?.id && p.isHost)

  // Build the racer list fresh on every render: your live car + opponents.
  const racers = players.map(p => {
    const you = p.id === socket?.id
    const opp = oppProgress[p.id]
    return {
      id: p.id,
      name: you ? 'you' : p.name,
      // Same unrounded value we broadcast, so your car glides like theirs.
      progress: you ? livePercent : (opp?.progress ?? 0),
      wpm: you ? wpm : (opp?.wpm ?? 0),
      isYou: you,
    }
  })

  // ── Handlers ──────────────────────────────────────────────────────────────
  function hostRoom() {
    if (!playerName.trim()) return
    emit('room:create', { playerName: playerName.trim() })
  }

  function joinRoom() {
    setJoinError('')
    if (joinInput.length < 4 || !playerName.trim()) return
    emit('room:join', { code: joinInput.toUpperCase(), playerName: playerName.trim() })
  }

  function startRace() {
    emit('race:start', { code: roomCode, strict, wordLimit })
  }

  // Rematch with the same people — the server puts everyone back in the lobby.
  function raceAgain() {
    emit('race:again', { code: roomCode })
  }

  // Leave the room entirely and go back to the host/join menu.
  function leaveRoom() {
    emit('room:leave')
    reset()
    setOppProgress({})
    setLobbyPhase(PHASE.HOME)
    setRoomCode('')
    setPlayers([])
    setIntent(null)
    setJoinError('')
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

          <div className="flex flex-col gap-2 w-full max-w-xs">
            <label className="font-mono text-xs text-faded uppercase tracking-widest text-center">
              your name
            </label>
            <input
              value={playerName}
              onChange={e => handleNameChange(e.target.value)}
              maxLength={20}
              autoFocus
              placeholder="racer name"
              className="w-full bg-card border border-line rounded-xl
                         text-ink font-mono text-base text-center py-2.5
                         focus:outline-none focus:border-ink"
            />
            <p className="font-mono text-[10px] text-faded text-center">
              shown to other racers + the global leaderboard
            </p>
          </div>

          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={() => { setIntent('host'); setJoinError('') }}
              disabled={!playerName.trim()}
              className={`flex-1 btn !rounded-none py-3 text-sm transition-all disabled:opacity-30
                ${intent === 'host' ? 'btn-primary' : 'font-mono hover:border-gray-500'}`}
            >
              Host Room
            </button>
            <button
              onClick={() => { setIntent('join'); setJoinError('') }}
              disabled={!playerName.trim()}
              className={`flex-1 btn !rounded-none py-3 text-sm transition-all disabled:opacity-30
                ${intent === 'join' ? 'btn-primary' : 'font-mono hover:border-gray-500'}`}
            >
              Join Room
            </button>
          </div>

          {/* Host setup — race options only matter to the host */}
          {intent === 'host' && (
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
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
                onClick={hostRoom}
                className="w-full btn btn-primary !rounded-none py-3 text-sm hover:opacity-90 transition-all"
              >
                Create Room →
              </button>
            </div>
          )}

          {/* Join setup — code entry only */}
          {intent === 'join' && (
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
                disabled={joinInput.length < 4 || !playerName.trim()}
                className="w-full btn btn-primary !rounded-none py-3 
                           text-sm disabled:opacity-30 hover:opacity-90 transition-all"
              >
                Join →
              </button>
            </div>
          )}

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
          onPlayAgain={isHost ? raceAgain : undefined}
          playAgainLabel={isHost ? 'Race again →' : 'Waiting for host…'}
          playAgainDisabled={!isHost}
          onHome={leaveRoom}
          homeLabel="Leave room"
          hint={`room ${roomCode} · ${players.length} racer${players.length === 1 ? '' : 's'}`}
        />
      )}
    </main>
  )
}
