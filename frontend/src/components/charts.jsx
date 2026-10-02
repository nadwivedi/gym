import { useEffect, useRef, useState } from 'react'

const M = { top: 22, right: 10, bottom: 24, left: 44 }
const PLOT_H = 170
const H = M.top + PLOT_H + M.bottom

function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

// Round axis steps: 0 / 5,000 / 10,000 rather than 0 / 4,731 / 9,462.
function niceTicks(min, max, wholeNumbers) {
  if (max <= 0 && min >= 0) return [0, 1]
  const rough = (max - Math.min(min, 0)) / 4
  const pow = 10 ** Math.floor(Math.log10(rough))
  let step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= rough) * pow
  if (wholeNumbers) step = Math.max(1, Math.ceil(step))
  const ticks = []
  for (let v = Math.floor(Math.min(min, 0) / step) * step; v < max + step; v += step) ticks.push(Math.round(v * 100) / 100)
  return ticks
}

function Axes({ width, ticks, y, labels, x, format, dim }) {
  return (
    <>
      {ticks.map((t) => (
        <g key={t}>
          <line className={t === 0 ? 'chart-base' : 'chart-grid'} x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
          <text className="chart-tick" x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end">
            {format(t)}
          </text>
        </g>
      ))}
      {labels.map((label, i) => (
        <text key={label} className={`chart-tick ${dim?.(i) ? 'dim' : ''}`} x={x(i)} y={H - 7} textAnchor="middle">
          {label}
        </text>
      ))}
    </>
  )
}

function Tip({ at, width, value, label }) {
  if (!at) return null
  return (
    <div className="chart-tip" style={{ left: Math.min(Math.max(at.x, 56), width - 56), top: at.y - 8 }}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

// One column per item; tap a column to select it.
// data: [{ label, name, value, note }] where value null = no data yet (a month that has not come).
export function ColumnChart({ data, selected, onSelect, format, formatFull, title }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)
  const values = data.map((d) => d.value ?? 0)
  const ticks = niceTicks(Math.min(...values), Math.max(...values))
  const [lo, hi] = [ticks[0], ticks.at(-1)]
  const band = (width - M.left - M.right) / data.length
  const barW = Math.max(4, Math.min(24, band - 6))
  const x = (i) => M.left + band * (i + 0.5)
  const y = (v) => M.top + PLOT_H * (1 - (v - lo) / (hi - lo))
  const short = band < 24

  const bar = (i, v) => {
    const [x0, base, tip] = [x(i) - barW / 2, y(0), y(v)]
    const r = Math.min(4, Math.abs(tip - base), barW / 2) * (v < 0 ? -1 : 1)
    // Rounded at the data end, square on the baseline.
    return `M${x0},${base} V${tip + r} Q${x0},${tip} ${x0 + Math.abs(r)},${tip} H${x0 + barW - Math.abs(r)} Q${x0 + barW},${tip} ${x0 + barW},${tip + r} V${base} Z`
  }

  return (
    <div className="chart" ref={ref}>
      {width > 0 && (
        <svg width={width} height={H} role="group" aria-label={title}>
          <Axes width={width} ticks={ticks} y={y} x={x} format={format} labels={data.map((d) => (short ? d.label[0] : d.label))} dim={(i) => data[i].value == null} />
          {data.map((d, i) =>
            d.value ? <path key={d.label} d={bar(i, d.value)} className={`chart-bar ${i === selected ? 'on' : ''} ${i === hover ? 'hover' : ''}`} /> : null,
          )}
          {selected != null && data[selected].value != null && (
            <text
              className="chart-value"
              x={Math.min(Math.max(x(selected), M.left + 22), width - M.right - 22)}
              y={Math.min(y(Math.max(data[selected].value, 0)), y(0)) - 6}
              textAnchor="middle"
            >
              {format(data[selected].value)}
            </text>
          )}
          {data.map((d, i) => (
            <rect
              key={d.label}
              className="chart-hit"
              x={M.left + band * i}
              y={M.top}
              width={band}
              height={PLOT_H + M.bottom}
              role="button"
              tabIndex={0}
              aria-pressed={i === selected}
              aria-label={`${d.name}: ${d.value == null ? 'no data yet' : formatFull(d.value)}`}
              onClick={() => onSelect(i)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(i))}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            />
          ))}
        </svg>
      )}
      {hover != null && hover !== selected && data[hover].value != null && (
        <Tip
          at={{ x: x(hover), y: Math.min(y(Math.max(data[hover].value, 0)), y(0)) }}
          width={width}
          value={formatFull(data[hover].value)}
          label={`${data[hover].name}${data[hover].note ? ` · ${data[hover].note}` : ''}`}
        />
      )}
    </div>
  )
}

// One line with a soft fill. data: [{ label, name, value }] where value null = not reached yet.
export function TrendChart({ data, format, title, unit }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)
  const points = data.map((d, i) => ({ ...d, i })).filter((d) => d.value != null)
  const ticks = niceTicks(0, Math.max(0, ...points.map((d) => d.value)), true)
  const hi = ticks.at(-1)
  const band = (width - M.left - M.right) / data.length
  const x = (i) => M.left + band * (i + 0.5)
  const y = (v) => M.top + PLOT_H * (1 - v / hi)
  const last = points.at(-1)
  const line = points.map((d, n) => `${n ? 'L' : 'M'}${x(d.i)},${y(d.value)}`).join(' ')
  const shown = hover != null ? data[hover] : null

  // The pointer only has to be nearest to a month, never exactly on the line.
  const track = (e) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left
    const nearest = points.reduce((best, d) => (Math.abs(x(d.i) - px) < Math.abs(x(best.i) - px) ? d : best), points[0])
    setHover(nearest.i)
  }

  return (
    <div className="chart" ref={ref}>
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label={title}>
          <Axes width={width} ticks={ticks} y={y} x={x} format={format} labels={data.map((d) => (band < 24 ? d.label[0] : d.label))} dim={(i) => data[i].value == null} />
          {points.length > 1 && (
            <>
              <path className="chart-area" d={`${line} L${x(last.i)},${y(0)} L${x(points[0].i)},${y(0)} Z`} />
              <path className="chart-line" d={line} />
            </>
          )}
          {shown && <line className="chart-cross" x1={x(hover)} x2={x(hover)} y1={M.top} y2={y(0)} />}
          {last && (
            <>
              <circle className="chart-dot" cx={x(last.i)} cy={y(last.value)} r="5" />
              {!shown && (
                <text className="chart-value" x={Math.min(x(last.i), width - M.right - 14)} y={y(last.value) - 10} textAnchor="middle">
                  {format(last.value)}
                </text>
              )}
            </>
          )}
          {shown && <circle className="chart-dot" cx={x(hover)} cy={y(shown.value)} r="5" />}
          {points.length > 0 && (
            <rect className="chart-hit" x={M.left} y={M.top} width={width - M.left - M.right} height={PLOT_H} onPointerMove={track} onPointerDown={track} onPointerLeave={() => setHover(null)} />
          )}
        </svg>
      )}
      {shown && <Tip at={{ x: x(hover), y: y(shown.value) }} width={width} value={`${format(shown.value)} ${unit}`} label={shown.name} />}
    </div>
  )
}

// Share bars. rows: [{ label, value }]
export function ShareBars({ rows, format }) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <div className="share">
      {rows.map((r) => (
        <div className="share-row" key={r.label}>
          <span>{r.label}</span>
          <div className="share-track">
            <div className="share-fill" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <b>{format(r.value)}</b>
        </div>
      ))}
    </div>
  )
}
