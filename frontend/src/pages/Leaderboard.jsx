import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DEMO = [
  { playerName: 'mach_ten', wpm: 142, accuracy: 98, createdAt: '2026-06-01' },
  { playerName: 'keysmith', wpm: 128, accuracy: 96, createdAt: '2026-05-30' },
  { playerName: 'wpm_wanderer', wpm: 115, accuracy: 94, createdAt: '2026-05-28' },
  { playerName: 'slow_lorist', wpm: 108, accuracy: 99, createdAt: '2026-05-27' },
  { playerName: 'qwerty_quinn', wpm: 95, accuracy: 92, createdAt: '2026-05-25' },
]

export default function Leaderboard() {
  const navigate = useNavigate()
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(setScores)
      .catch(() => setScores(DEMO))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
      <header className="flex items-end justify-between border-b-2 border-ink pb-3">
        <h1 className="font-display text-2xl">Podium</h1>
        <button onClick={() => navigate('/')} className="btn">← home</button>
      </header>

      {loading ? (
        <p className="font-mono text-xs text-faded text-center py-10">loading…</p>
      ) : (
        <div className="bg-card border-2 border-ink shadow-flat">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-ink font-mono text-[10px] tracking-[0.25em] uppercase text-faded">
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">racer</th>
                <th className="text-right px-4 py-3">wpm</th>
                <th className="text-right px-4 py-3">acc</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <tr key={i} className="border-b border-line last:border-0 font-mono text-sm">
                  <td className="px-4 py-3 text-faded">{i + 1}</td>
                  <td className={`px-4 py-3 ${i === 0 ? 'font-semibold' : ''}`}>
                    {i === 0 && <span className="stamp text-gold border-gold mr-2 text-[9px]">champ</span>}
                    {s.playerName}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${i === 0 ? 'text-gold' : 'text-pine'}`}>{s.wpm}</td>
                  <td className="px-4 py-3 text-right text-faded">{s.accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
