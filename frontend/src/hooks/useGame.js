import { useState, useEffect, useRef, useCallback } from 'react'
import { generatePassage, calcWpm, calcAccuracy, buildCharMap } from '../utils/gameUtils'
import { recordRace, getGhost } from '../utils/profile'

// Core game state machine: idle -> countdown -> racing -> finished.
// Also records a keystroke timeline so a personal best can be
// replayed later as a "ghost" opponent.
//
// `mode` is the word-list flavor: 'words' | 'punctuation' | 'numbers'.
// `limitType` is the pacing rule, a separate axis from `mode`:
//   'time'  -> race ends when `limitValue` seconds elapse (or passage finishes early)
//   'words' -> no timer; race ends only once the (exactly `limitValue`-word) passage
//              is fully typed. `timeLeft` is unused; `elapsedSeconds` counts up instead.
export function useGame({
  mode = 'words',
  enableGhost = true,
  strict = false,
  limitType = 'time',
  limitValue = 60,
} = {}) {
  const [passage, setPassage] = useState('')
  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState('idle')
  const [countdown, setCountdown] = useState(3)
  const [timeLeft, setTimeLeft] = useState(limitType === 'time' ? limitValue : 0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [wpmHistory, setWpmHistory] = useState([])
  const [ghostProgress, setGhostProgress] = useState(null)
  const [ghostWpm, setGhostWpm] = useState(0)

  const startRef = useRef(null)
  const timerRef = useRef(null)
  const cdRef = useRef(null)
  const errorsRef = useRef(0)
  const keylogRef = useRef([])          // [{t, len}] keystroke timeline
  const troubleRef = useRef({})         // {char: errorCount}
  const ghostRef = useRef(null)
  const finishedRef = useRef(false)

  const charMap = buildCharMap(passage, typed)

  // Progress counts characters that are correct *at their position*, not how
  // much has been typed. Measuring raw length let a multiplayer player mash
  // random keys and drive their car to the finish line. A typo doesn't stall
  // the car at the mistake — it just doesn't count until it's corrected.
  const correctChars = typed.split('').filter((ch, i) => ch === passage[i]).length
  const progress = passage.length ? Math.round((correctChars / passage.length) * 100) : 0

  const clearTimers = () => {
    clearInterval(timerRef.current)
    clearInterval(cdRef.current)
  }

  // In word-limit mode the passage IS the limit (exactly `limitValue` words).
  // In time-limit mode we generate a generous buffer so fast typists don't run
  // out of text before the clock does (3 words/sec covers well past 150+ wpm).
  const wordCountFor = useCallback(
    () => (limitType === 'words' ? limitValue : Math.max(30, Math.ceil(limitValue * 3))),
    [limitType, limitValue]
  )

  const reset = useCallback(() => {
    clearTimers()
    setPassage(generatePassage(wordCountFor(), mode))
    setTyped('')
    setPhase('idle')
    setCountdown(3)
    setTimeLeft(limitType === 'time' ? limitValue : 0)
    setElapsedSeconds(0)
    setWpm(0)
    setAccuracy(100)
    setWpmHistory([])
    setGhostProgress(null)
    setGhostWpm(0)
    startRef.current = null
    errorsRef.current = 0
    keylogRef.current = []
    troubleRef.current = {}
    finishedRef.current = false
    ghostRef.current = enableGhost ? getGhost() : null
  }, [mode, enableGhost, limitType, limitValue, wordCountFor])

  // Multiplayer needs everyone racing the SAME text. This swaps in a
  // server-provided passage without touching phase/countdown timers,
  // so it's safe to call right before startCountdown().
  const applyPassage = useCallback((text) => {
    setPassage(text)
    setTyped('')
    setTimeLeft(limitType === 'time' ? limitValue : 0)
    setElapsedSeconds(0)
    setWpm(0)
    setAccuracy(100)
    setWpmHistory([])
    setGhostProgress(null)
    setGhostWpm(0)
    errorsRef.current = 0
    keylogRef.current = []
    troubleRef.current = {}
    finishedRef.current = false
    ghostRef.current = enableGhost ? getGhost() : null
  }, [enableGhost, limitType, limitValue])

  const finishGame = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    clearTimers()

    const fallback = limitType === 'time' ? limitValue : 0
    const elapsed = startRef.current ? (Date.now() - startRef.current) / 1000 : fallback

    setTyped(t => {
      const correct = t.split('').filter((ch, i) => ch === passage[i]).length
      const finalWpm = calcWpm(correct, elapsed)
      const finalAcc = calcAccuracy(t.length, errorsRef.current)
      setWpm(finalWpm)
      setAccuracy(finalAcc)

      recordRace({
        wpm: finalWpm,
        accuracy: finalAcc,
        mode,
        duration: Math.round(elapsed),
        keylog: keylogRef.current,
        troubleKeys: troubleRef.current,
      })
      return t
    })

    setPhase('finished')
  }, [passage, mode, limitType, limitValue])

  const beginRace = useCallback(() => {
    startRef.current = Date.now()
    setPhase('racing')

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      setElapsedSeconds(Math.floor(elapsed))

      let timedOut = false
      if (limitType === 'time') {
        const remaining = Math.max(0, limitValue - Math.floor(elapsed))
        setTimeLeft(remaining)
        timedOut = remaining <= 0
      }

      // Sample wpm twice a second for the results chart
      setTyped(t => {
        const correct = t.split('').filter((ch, i) => ch === passage[i]).length
        const liveWpm = calcWpm(correct, elapsed)
        setWpm(liveWpm)
        setWpmHistory(h => [...h, { t: elapsed, wpm: liveWpm }])
        return t
      })

      // Advance the ghost along its recorded timeline
      const ghost = ghostRef.current
      if (ghost?.keylog?.length) {
        const ms = elapsed * 1000
        let idx = ghost.keylog.findIndex(k => k.t > ms)
        if (idx === -1) idx = ghost.keylog.length
        const len = idx > 0 ? ghost.keylog[idx - 1].len : 0
        setGhostProgress(Math.min(100, Math.round((len / passage.length) * 100)))
        setGhostWpm(calcWpm(len, elapsed))
      }

      if (timedOut) finishGame()
    }, 500)
  }, [passage, finishGame, limitType, limitValue])

  const startCountdown = useCallback(() => {
    setPhase('countdown')
    let n = 3
    setCountdown(n)
    cdRef.current = setInterval(() => {
      n -= 1
      if (n <= 0) {
        clearInterval(cdRef.current)
        beginRace()
      } else {
        setCountdown(n)
      }
    }, 1000)
  }, [beginRace])

  const handleInput = useCallback((value) => {
    if (phase !== 'racing') return
    if (value.length > passage.length) return

    // Strict mode: the space that ends a word is rejected until every
    // character of the current word is typed correctly.
    if (strict && value.length > typed.length) {
      const i = value.length - 1
      if (passage[i] === ' ' && value[i] === ' ') {
        const start = passage.lastIndexOf(' ', i - 1) + 1
        if (value.slice(start, i) !== passage.slice(start, i)) return
      }
    }

    // New keystroke — log it and track errors per expected character
    if (value.length > typed.length) {
      const i = value.length - 1
      if (value[i] !== passage[i]) {
        errorsRef.current += 1
        const expected = passage[i] === ' ' ? 'space' : passage[i]
        troubleRef.current[expected] = (troubleRef.current[expected] ?? 0) + 1
      }
      keylogRef.current.push({ t: Date.now() - startRef.current, len: value.length })
    }

    setTyped(value)
    setAccuracy(calcAccuracy(value.length, errorsRef.current))

    // Strict mode can't be more than the current word wrong, so requiring an
    // exact match is safe there — and it's what stops a player mashing the
    // final word (which has no trailing space to block them) to cross the
    // line. Without strict, an early typo could strand you hundreds of
    // backspaces from the end, so length alone still ends the run.
    const complete = strict ? value === passage : value.length >= passage.length
    if (complete) finishGame()
  }, [phase, typed, passage, strict, finishGame])

  useEffect(() => {
    reset()
    return clearTimers
  }, [reset])

  return {
    passage, typed, phase, countdown, timeLeft, elapsedSeconds,
    wpm, accuracy, progress, correctChars, charMap, wpmHistory,
    ghost: ghostRef.current ? { progress: ghostProgress ?? 0, wpm: ghostWpm, bestWpm: ghostRef.current.wpm } : null,
    troubleKeys: troubleRef.current,
    startCountdown, handleInput, reset, applyPassage,
  }
}
