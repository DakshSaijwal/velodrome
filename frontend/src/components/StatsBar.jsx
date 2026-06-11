export default function StatsBar({ wpm, accuracy, timeLeft, progress }) {
  const cells = [
    { label: 'wpm', value: wpm, hot: true },
    { label: 'accuracy', value: `${accuracy}%` },
    { label: 'time', value: `${timeLeft}s` },
    { label: 'progress', value: `${progress}%` },
  ]
  return (
    <div className="grid grid-cols-4 border-2 border-ink bg-card shadow-flatSm divide-x-2 divide-ink">
      {cells.map(({ label, value, hot }) => (
        <div key={label} className="px-4 py-3">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-faded">{label}</p>
          <p className={`text-2xl font-display ${hot ? 'text-signal' : 'text-ink'}`}>{value}</p>
        </div>
      ))}
    </div>
  )
}
