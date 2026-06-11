import { useNavigate } from 'react-router-dom'
import { getSummary } from '../utils/profile'

// Personal stats: race history sparkline, trouble keys, aggregates.
export default function Stats() {
  const navigate = useNavigate()
  const s = getSummary()

  return (
    <main className="min-h-screen max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
      <header className="flex items-end justify-between border-b-2 border-ink pb-3">
        <h1 className="font-display text-2xl">My garage</h1>
        <button onClick={() => navigate('/')} className="btn">← home</button>
      </header>

      {!s ? (
        <div className="bg-card border-2 border-ink shadow-flat p-10 text-center">
          <p className="font-display text-xl mb-2">No races yet</p>
          <p className="font-mono text-xs text-faded mb-6">run a time trial and your stats will live here</p>
          <button onClick={() => navigate('/solo')} className="btn btn-accent">First race →</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 border-2 border-ink bg-card shadow-flat divide-x-2 divide-ink">
            {[
              { label: 'races', value: s.races },
              { label: 'best wpm', value: s.best, hot: true },
              { label: 'avg wpm', value: s.avg },
              { label: 'avg acc', value: `${s.avgAcc}%` },
            ].map(({ label, value, hot }) => (
              <div key={label} className="px-4 py-4 text-center">
                <p className={`font-display text-3xl ${hot ? 'text-signal' : 'text-ink'}`}>{value}</p>
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-faded mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border-2 border-ink shadow-flatSm p-4">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-faded mb-3">last {s.recent.length} races</p>
            <div className="flex items-end gap-1 h-24">
              {s.recent.map((r, i) => (
                <div
                  key={i}
                  title={`${r.wpm} wpm · ${r.accuracy}%`}
                  className={`flex-1 ${r.wpm === s.best ? 'bg-signal' : 'bg-pine'}`}
                  style={{ height: `${Math.max(8, (r.wpm / s.best) * 100)}%` }}
                />
              ))}
            </div>
          </div>

          {s.troubleKeys.length > 0 && (
            <div className="bg-card border-2 border-ink shadow-flatSm p-4">
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-faded mb-3">
                your nemesis keys (last 20 races)
              </p>
              <div className="flex gap-2 flex-wrap">
                {s.troubleKeys.map(([key, count]) => (
                  <span key={key} className="font-mono text-sm border-2 border-ink px-3 py-1 bg-paper">
                    <b className="text-signal">{key}</b> <span className="text-faded">×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  )
}
