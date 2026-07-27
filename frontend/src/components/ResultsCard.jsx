import WpmChart from './WpmChart'

export default function ResultsCard({
  wpm, accuracy, duration, chars, wpmHistory, troubleKeys, isPB, onPlayAgain, onHome,
  playAgainLabel = 'Race again →',
  playAgainDisabled = false,
  homeLabel = 'Pit lane (home)',
  hint = '',
}) {
  const trouble = Object.entries(troubleKeys ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-4xl">Race over.</h2>
        {isPB && <span className="stamp text-signal border-signal rotate-2">new personal best</span>}
      </div>

      <div className="grid grid-cols-4 border-2 border-ink bg-card shadow-flat divide-x-2 divide-ink">
        {[
          { label: 'wpm', value: wpm, hot: true },
          { label: 'accuracy', value: `${accuracy}%` },
          { label: 'duration', value: `${duration}s` },
          { label: 'chars', value: chars },
        ].map(({ label, value, hot }) => (
          <div key={label} className="px-4 py-4 text-center">
            <p className={`font-display text-3xl ${hot ? 'text-signal' : 'text-ink'}`}>{value}</p>
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-faded mt-1">{label}</p>
          </div>
        ))}
      </div>

      {wpmHistory?.length > 1 && (
        <div className="bg-card border-2 border-ink shadow-flatSm p-4">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-faded mb-2">speed over time</p>
          <WpmChart history={wpmHistory} />
        </div>
      )}

      {trouble.length > 0 && (
        <div className="bg-card border-2 border-ink shadow-flatSm p-4">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-faded mb-3">keys that slowed you down</p>
          <div className="flex gap-2 flex-wrap">
            {trouble.map(([key, count]) => (
              <span key={key} className="font-mono text-sm border-2 border-ink px-3 py-1 bg-paper">
                <b className="text-signal">{key}</b> <span className="text-faded">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            disabled={playAgainDisabled}
            className="btn btn-primary flex-1 disabled:opacity-30"
          >
            {playAgainLabel}
          </button>
          <button onClick={onHome} className="btn flex-1">{homeLabel}</button>
        </div>
        {hint && (
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-faded text-center">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}
