import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGame'
import { getGhost } from '../utils/profile'
import StatsBar from '../components/StatsBar'
import TextDisplay from '../components/TextDisplay'
import TypingInput from '../components/TypingInput'
import CountdownOverlay from '../components/CountdownOverlay'
import ResultsCard from '../components/ResultsCard'
import RaceTrack from '../components/RaceTrack'

const MODES = [
  { id: 'words', label: 'words' },
  { id: 'punctuation', label: '+punctuation' },
  { id: 'numbers', label: '+numbers' },
]

export default function SinglePlayer() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('words')
  const prevBest = useRef(getGhost()?.wpm ?? 0)

  const {
    typed, phase, countdown, timeLeft,
    wpm, accuracy, progress, charMap, wpmHistory,
    ghost, troubleKeys,
    startCountdown, handleInput, reset,
  } = useGame({ mode })

  // Warn if the tab loses focus mid-race — keeps runs honest
  const [blurred, setBlurred] = useState(false)
  useEffect(() => {
    const onBlur = () => phase === 'racing' && setBlurred(true)
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [phase])

  const racers = [
    { id: 'you', name: 'you', progress, wpm, isYou: true },
    ...(ghost ? [{ id: 'ghost', name: `ghost ${ghost.bestWpm}`, progress: ghost.progress, wpm: ghost.wpm, isGhost: true }] : []),
  ]

  return (
    <main className="min-h-screen max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-5">
      <header className="flex items-end justify-between border-b-2 border-ink pb-3">
        <h1 className="font-display text-2xl">VELO<span className="text-signal">DROME</span></h1>
        <span className="stamp">time trial</span>
      </header>

      {phase === 'idle' && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-faded uppercase tracking-widest mr-2">mode</span>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`font-mono text-xs border-2 px-3 py-1.5 transition-colors
                ${mode === m.id ? 'border-ink bg-ink text-paper' : 'border-line text-faded hover:border-ink'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      <StatsBar wpm={wpm} accuracy={accuracy} timeLeft={timeLeft} progress={progress} />

      {phase !== 'finished' && (
        <>
          <div className="relative bg-card border-2 border-ink shadow-flat p-7 min-h-[150px]">
            <CountdownOverlay visible={phase === 'countdown'} count={countdown} />
            <TextDisplay charMap={charMap} />
          </div>

          <TypingInput
            value={typed}
            onChange={handleInput}
            disabled={phase !== 'racing'}
            autoFocus={phase === 'racing'}
          />

          {blurred && phase === 'racing' && (
            <p className="font-mono text-xs text-signal">⚠ tab lost focus — your run continued without you</p>
          )}

          {phase !== 'idle' && <RaceTrack racers={racers} />}

          {phase === 'idle' && (
            <>
              {ghost && (
                <p className="font-mono text-xs text-faded">
                  your ghost is waiting — beat <b className="text-signal">{ghost.bestWpm} wpm</b> to replace it
                </p>
              )}
              <button onClick={startCountdown} className="btn btn-accent w-full py-3.5">
                Start engine →
              </button>
            </>
          )}
        </>
      )}

      {phase === 'finished' && (
        <ResultsCard
          wpm={wpm}
          accuracy={accuracy}
          duration={60 - timeLeft}
          chars={typed.length}
          wpmHistory={wpmHistory}
          troubleKeys={troubleKeys}
          isPB={wpm > prevBest.current}
          onPlayAgain={() => { prevBest.current = Math.max(prevBest.current, wpm); reset() }}
          onHome={() => navigate('/')}
        />
      )}
    </main>
  )
}
