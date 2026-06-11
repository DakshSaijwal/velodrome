const STYLE = {
  correct: 'text-pine',
  wrong: 'text-signal bg-signal/10 underline decoration-signal decoration-2',
  cursor: 'border-l-2 border-ink animate-pulse text-faded',
  pending: 'text-faded',
}

// Each word is rendered as a single inline-block so the browser
// wraps whole words to the next line, never mid-word. Spaces are
// their own inline-blocks so the cursor can sit on them and a
// mistyped space still gets highlighted.
export default function TextDisplay({ charMap }) {
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

  return (
    <div className="font-mono text-[21px] leading-[2.1] select-none">
      {tokens.map((tok, t) =>
        tok.type === 'word' ? (
          <span key={t} className="inline-block">
            {tok.chars.map(({ char, status, idx }) => (
              <span key={idx} className={STYLE[status]}>{char}</span>
            ))}
          </span>
        ) : (
          <span key={t} className={`inline-block w-[0.6em] ${STYLE[tok.status]}`}>
            {'\u00A0'}
          </span>
        )
      )}
    </div>
  )
}
