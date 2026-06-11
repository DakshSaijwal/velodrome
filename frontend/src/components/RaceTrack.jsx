import { useEffect, useRef } from 'react'

// Canvas race lanes. Racers: { id, name, progress, wpm, isYou, isGhost }
const LANE_COLORS = ['#1f5e3d', '#e2541b', '#c9a227', '#191613']

export default function RaceTrack({ racers }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
    }
    resize()

    const W = canvas.offsetWidth
    const laneH = 52
    const trackX = 90
    const trackW = W - trackX - 24

    ctx.clearRect(0, 0, W, canvas.offsetHeight)

    racers.forEach((r, i) => {
      const midY = i * laneH + laneH / 2
      const color = r.isGhost ? '#8a8275' : LANE_COLORS[i % LANE_COLORS.length]

      // name
      ctx.fillStyle = r.isYou ? '#e2541b' : '#8a8275'
      ctx.font = '600 12px "IBM Plex Mono", monospace'
      ctx.textBaseline = 'middle'
      ctx.fillText(r.name.slice(0, 9), 4, midY)

      // dashed track
      ctx.strokeStyle = '#d8d0bf'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 6])
      ctx.beginPath()
      ctx.moveTo(trackX, midY)
      ctx.lineTo(trackX + trackW, midY)
      ctx.stroke()
      ctx.setLineDash([])

      // checkered finish
      for (let s = 0; s < 4; s++) {
        ctx.fillStyle = s % 2 ? '#191613' : '#f6f1e7'
        ctx.fillRect(trackX + trackW, midY - 10 + s * 5, 5, 5)
        ctx.fillStyle = s % 2 ? '#f6f1e7' : '#191613'
        ctx.fillRect(trackX + trackW + 5, midY - 10 + s * 5, 5, 5)
      }

      // car: simple wedge, ghost is hollow
      const x = trackX + (trackW - 34) * (r.progress / 100)
      ctx.beginPath()
      ctx.moveTo(x, midY - 8)
      ctx.lineTo(x + 26, midY - 8)
      ctx.lineTo(x + 34, midY)
      ctx.lineTo(x + 26, midY + 8)
      ctx.lineTo(x, midY + 8)
      ctx.closePath()
      if (r.isGhost) {
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.setLineDash([3, 3])
        ctx.stroke()
        ctx.setLineDash([])
      } else {
        ctx.fillStyle = color
        ctx.fill()
      }

      // wpm tag
      ctx.fillStyle = '#191613'
      ctx.font = '600 10px "IBM Plex Mono", monospace'
      ctx.fillText(`${r.wpm}`, x + 8, midY - 16)
    })
  }, [racers])

  return (
    <div className="bg-card border-2 border-ink shadow-flatSm p-4">
      <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-faded mb-2">live race</p>
      <canvas ref={canvasRef} className="w-full" style={{ height: `${racers.length * 52}px` }} />
    </div>
  )
}
