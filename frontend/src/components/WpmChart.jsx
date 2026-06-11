import { useEffect, useRef } from 'react'

// Hand-rolled canvas line chart of wpm over the race. No chart lib needed.
export default function WpmChart({ history }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || history.length < 2) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    const pad = { l: 34, r: 8, t: 10, b: 20 }
    const maxWpm = Math.max(...history.map(p => p.wpm), 40)
    const maxT = history[history.length - 1].t

    const px = t => pad.l + (t / maxT) * (W - pad.l - pad.r)
    const py = w => H - pad.b - (w / maxWpm) * (H - pad.t - pad.b)

    // gridlines
    ctx.strokeStyle = '#d8d0bf'
    ctx.fillStyle = '#8a8275'
    ctx.font = '10px "IBM Plex Mono", monospace'
    ctx.lineWidth = 1
    for (let g = 0; g <= 4; g++) {
      const w = Math.round((maxWpm / 4) * g)
      ctx.beginPath()
      ctx.moveTo(pad.l, py(w))
      ctx.lineTo(W - pad.r, py(w))
      ctx.stroke()
      ctx.fillText(String(w), 4, py(w) + 3)
    }

    // wpm line
    ctx.strokeStyle = '#1f5e3d'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    history.forEach((p, i) => {
      i === 0 ? ctx.moveTo(px(p.t), py(p.wpm)) : ctx.lineTo(px(p.t), py(p.wpm))
    })
    ctx.stroke()

    // final dot
    const last = history[history.length - 1]
    ctx.fillStyle = '#e2541b'
    ctx.beginPath()
    ctx.arc(px(last.t), py(last.wpm), 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#8a8275'
    ctx.fillText('0s', pad.l, H - 6)
    ctx.fillText(`${Math.round(maxT)}s`, W - pad.r - 22, H - 6)
  }, [history])

  return <canvas ref={ref} className="w-full" style={{ height: '160px' }} />
}
