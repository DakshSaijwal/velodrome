import { useNavigate } from 'react-router-dom'
import { getSummary } from '../utils/profile'

export default function Home() {
  const navigate = useNavigate()
  const summary = getSummary()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 px-4">
      <header className="text-center">
        <p className="stamp mb-4">est. 2026 · typing club</p>
        <h1 className="font-display text-7xl tracking-tight leading-none">
          VELO<span className="text-signal">DROME</span>
        </h1>
        <p className="font-mono text-sm text-faded mt-3">how fast are your hands, really?</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-5 w-full max-w-xl">
        <button
          onClick={() => navigate('/solo')}
          className="bg-card border-2 border-ink shadow-flat p-6 text-left
                     hover:-translate-y-1 transition-transform"
        >
          <p className="font-display text-2xl mb-1">Time trial</p>
          <p className="font-mono text-xs text-faded">60s solo. race your own ghost.</p>
        </button>
        <button
          onClick={() => navigate('/multi')}
          className="bg-pine text-paper border-2 border-ink shadow-flat p-6 text-left
                     hover:-translate-y-1 transition-transform"
        >
          <p className="font-display text-2xl mb-1">Grand prix</p>
          <p className="font-mono text-xs opacity-70">live multiplayer rooms. up to 4.</p>
        </button>
      </div>

      {summary && (
        <div className="flex gap-6 font-mono text-xs text-faded">
          <span>races <b className="text-ink">{summary.races}</b></span>
          <span>best <b className="text-signal">{summary.best} wpm</b></span>
          <span>avg <b className="text-ink">{summary.avg} wpm</b></span>
        </div>
      )}

      <nav className="flex gap-3">
        <button onClick={() => navigate('/stats')} className="btn">My stats</button>
        <button onClick={() => navigate('/leaderboard')} className="btn">Leaderboard</button>
      </nav>
    </main>
  )
}
