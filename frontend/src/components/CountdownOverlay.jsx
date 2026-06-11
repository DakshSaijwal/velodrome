export default function CountdownOverlay({ count, visible }) {
  if (!visible) return null
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper/85 pointer-events-none">
      <span key={count} className="font-display text-8xl text-ink" style={{ animation: 'pop 0.4s ease' }}>
        {count === 0 ? 'GO' : count}
      </span>
      <style>{`@keyframes pop { from { transform: scale(1.6); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
    </div>
  )
}
