import { useRef, useLayoutEffect, useState } from 'react'

const STYLE = {
  correct: 'text-pine',
  wrong: 'text-signal bg-signal/10 underline decoration-signal decoration-2',
  cursor: 'border-l-2 border-ink animate-pulse text-faded',
  pending: 'text-faded',
}

const LINES_VISIBLE = 3

// Each word is rendered as a single inline-block so the browser
// wraps whole words to the next line, never mid-word. Spaces are
// their own inline-blocks so the cursor can sit on them and a
// mistyped space still gets highlighted.
//
// The passage can be far longer than the screen (a 60s run generates
// ~180 words), so instead of letting the block grow — which pushes the
// input off-screen and makes the page jump on every keystroke — we clamp
// it to a fixed window of a few lines and scroll the content up so the
// active line stays in view.
export default function TextDisplay({ charMap }) {
  const innerRef = useRef(null)
  const cursorRef = useRef(null)
  const [offset, setOffset] = useState(0)
  const [lineHeight, setLineHeight] = useState(44)

  const tokens = []
  let word = []

  charMap.forEach((entry, i) => {
    if (entry.char === ' ') {
      if (word.length) tokens.push({ type: 'word', chars: word })
      tokens.push({ type: 'space', ...entry, idx: i })
      word = []
    } else {
      word.push({ ...entry, idx: i })
    }
  })
  if (word.length) tokens.push({ type: 'word', chars: word })

  // After every render, scroll so the cursor's line sits on the second
  // visible row — one line of already-typed context stays above it. The
  // stride is the real rendered line-height (font-size × leading), not the
  // glyph box, and offsetTop is relative to the inner block because it's
  // positioned, so the two always agree.
  useLayoutEffect(() => {
    const inner = innerRef.current
    const cur = cursorRef.current
    if (!inner) return
    const lineH = parseFloat(getComputedStyle(inner).lineHeight) || 44
    setLineHeight(lineH)
    if (cur) setOffset(Math.max(0, cur.offsetTop - lineH))
  }, [charMap])

  return (
    <div className="overflow-hidden" style={{ height: lineHeight * LINES_VISIBLE }}>
      <div
        ref={innerRef}
        className="relative font-mono text-[21px] leading-[2.1] select-none transition-transform duration-100"
        style={{ transform: `translateY(-${offset}px)` }}
      >
        {tokens.map((tok, t) =>
          tok.type === 'word' ? (
            <span key={t} className="inline-block">
              {tok.chars.map(({ char, status, idx }) => (
                <span
                  key={idx}
                  ref={status === 'cursor' ? cursorRef : null}
                  className={STYLE[status]}
                >
                  {char}
                </span>
              ))}
            </span>
          ) : (
            <span
              key={t}
              ref={tok.status === 'cursor' ? cursorRef : null}
              className={`inline-block w-[0.6em] ${STYLE[tok.status]}`}
            >
              {' '}
            </span>
          )
        )}
      </div>
    </div>
  )
}
