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

const TIME_LIMITS = [15, 30, 60]
const WORD_LIMITS = [15, 30, 50, 100]

export default function SinglePlayer() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('words')
  const [strict, setStrict] = useState(false)
  const [limitType, setLimitType] = useState('time')   // 'time' | 'words'
  const [timeLimit, setTimeLimit] = useState(60)
  const [wordLimit, setWordLimit] = useState(30)
  const prevBest = useRef(getGhost()?.wpm ?? 0)

  const limitValue = limitType === 'time' ? timeLimit : wordLimit

  const {
    typed, phase, countdown, timeLeft, elapsedSeconds,
    wpm, accuracy, progress, charMap, wpmHistory,
    ghost, troubleKeys,
    startCountdown, handleInput, reset,
  } = useGame({ mode, strict, limitType, limitValue })

  // Tab restarts a fresh run — but only once a race is underway or done.
  // On the idle settings screen, Tab is left alone so it still moves focus
  // between the mode/limit buttons like a normal browser would.
  useEffect(() => {
    if (phase === 'idle') return
    function onKeyDown(e) {
      if (e.key !== 'Tab') return
      e.preventDefault()
      prevBest.current = Math.max(prevBest.current, wpm)
      reset()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, reset, wpm])

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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
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
            <button
              onClick={() => setStrict(s => !s)}
              title="Can't pass a word until it's typed correctly"
              className={`font-mono text-xs border-2 px-3 py-1.5 ml-auto transition-colors
                ${strict ? 'border-signal bg-signal text-paper' : 'border-line text-faded hover:border-ink'}`}
            >
              strict {strict ? 'on' : 'off'}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-faded uppercase tracking-widest mr-2">limit</span>
            <button
              onClick={() => setLimitType('time')}
              className={`font-mono text-xs border-2 px-3 py-1.5 transition-colors
                ${limitType === 'time' ? 'border-ink bg-ink text-paper' : 'border-line text-faded hover:border-ink'}`}
            >
              time
            </button>
            <button
              onClick={() => setLimitType('words')}
              className={`font-mono text-xs border-2 px-3 py-1.5 transition-colors
                ${limitType === 'words' ? 'border-ink bg-ink text-paper' : 'border-line text-faded hover:border-ink'}`}
            >
              words
            </button>

            <span className="w-px h-4 bg-line mx-1" />

            {(limitType === 'time' ? TIME_LIMITS : WORD_LIMITS).map(v => (
              <button
                key={v}
                onClick={() => limitType === 'time' ? setTimeLimit(v) : setWordLimit(v)}
                className={`font-mono text-xs border-2 px-3 py-1.5 transition-colors
                  ${limitValue === v ? 'border-signal bg-signal text-paper' : 'border-line text-faded hover:border-ink'}`}
              >
                {v}{limitType === 'time' ? 's' : ''}
              </button>
            ))}

            <span className="font-mono text-[10px] text-faded ml-auto">tab ↹ restarts mid-race</span>
          </div>
        </div>
      )}

      <StatsBar wpm={wpm} accuracy={accuracy} timeLeft={limitType === 'time' ? timeLeft : elapsedSeconds} progress={progress} />

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
          duration={elapsedSeconds}
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
