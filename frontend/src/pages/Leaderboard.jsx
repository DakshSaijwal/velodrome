import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SERVER_URL } from '../utils/apiBase'

export default function Leaderboard() {
  const navigate = useNavigate()
  const [scores, setScores] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'error'

  useEffect(() => {
    let cancelled = false
    fetch(`${SERVER_URL}/api/leaderboard`)
      .then(r => {
        if (!r.ok) throw new Error('bad response')
        return r.json()
      })
      .then(data => {
        if (cancelled) return
        setScores(Array.isArray(data) ? data : [])
        setStatus('ok')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })
    return () => { cancelled = true }
  }, [])

  return (
    <main className="min-h-screen max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
      <header className="flex items-end justify-between border-b-2 border-ink pb-3">
        <h1 className="font-display text-2xl">Podium</h1>
        <button onClick={() => navigate('/')} className="btn">← home</button>
      </header>

      {status === 'loading' && (
        <p className="font-mono text-xs text-faded text-center py-10">loading…</p>
      )}

      {status === 'error' && (
        <p className="font-mono text-xs text-faded text-center py-10">
          couldn't reach the leaderboard — the server may be waking up, try again in a moment
        </p>
      )}

      {status === 'ok' && scores.length === 0 && (
        <p className="font-mono text-xs text-faded text-center py-10">
          no scores yet — finish a multiplayer race to claim the top spot
        </p>
      )}

      {status === 'ok' && scores.length > 0 && (
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
                <tr key={s._id ?? i} className="border-b border-line last:border-0 font-mono text-sm">
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
