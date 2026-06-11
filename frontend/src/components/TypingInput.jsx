import { useEffect, useRef } from 'react'

export default function TypingInput({ value, onChange, disabled, autoFocus }) {
  const ref = useRef(null)

  useEffect(() => {
    if (autoFocus && !disabled) ref.current?.focus()
  }, [autoFocus, disabled])

  return (
    <div
      className="flex items-center gap-3 bg-card border-2 border-ink px-5 py-3 shadow-flatSm
                 cursor-text focus-within:shadow-flat transition-shadow"
      onClick={() => ref.current?.focus()}
    >
      <span className="font-mono text-faded select-none">»</span>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onPaste={e => e.preventDefault()}
        onDrop={e => e.preventDefault()}
        disabled={disabled}
        autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        className="flex-1 bg-transparent outline-none font-mono text-base text-ink
                   placeholder:text-line disabled:cursor-not-allowed"
        placeholder={disabled ? 'hold tight…' : 'type here'}
      />
      {disabled && <span className="stamp text-faded border-line">locked</span>}
    </div>
  )
}
