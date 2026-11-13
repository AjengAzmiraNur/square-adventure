/**
 * Visualisasi susunan kotak (SVG). Dipakai untuk persegi n × n maupun persegi panjang.
 * variant: 'block' | 'tile' | 'plant' | 'chair' | 'lamp'
 * highlightFrom: kotak dengan baris/kolom >= highlightFrom diberi warna aksen
 *                (menunjukkan tambahan kotak dari persegi sebelumnya).
 */
const VARIANT_FILL = {
  block: '#60A5FA',
  tile: '#A78BFA',
  plant: '#34d399',
  chair: '#f59e0b',
  lamp: '#FACC15',
}

export default function SquareGrid({
  rows,
  cols = rows,
  cell = 22,
  gap = 4,
  variant = 'block',
  highlightFrom = null,
  highlightColor = '#FACC15',
  maxSize = null,
  animate = false,
  label,
  className = '',
}) {
  let c = cell
  let g = gap
  if (maxSize) {
    const longest = Math.max(rows, cols)
    c = Math.min(cell, (maxSize - gap * (longest - 1)) / longest)
    g = Math.max(1, Math.min(gap, c / 6))
  }
  const width = cols * c + (cols - 1) * g
  const height = rows * c + (rows - 1) * g
  const fill = VARIANT_FILL[variant] || VARIANT_FILL.block
  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const isNew = highlightFrom != null && (r >= highlightFrom || k >= highlightFrom)
      const x = k * (c + g)
      const y = r * (c + g)
      const color = isNew ? highlightColor : fill
      const key = `${r}-${k}`
      const style = animate ? { animation: `pop 0.3s ease-out ${(r * cols + k) * 0.015}s both` } : undefined
      if (variant === 'plant') {
        cells.push(
          <g key={key} style={style}>
            <rect x={x} y={y} width={c} height={c} rx={c * 0.25} fill="#065f46" opacity="0.15" />
            <circle cx={x + c / 2} cy={y + c / 2} r={c * 0.36} fill={color} />
          </g>,
        )
      } else if (variant === 'lamp') {
        cells.push(<circle key={key} style={style} cx={x + c / 2} cy={y + c / 2} r={c * 0.42} fill={color} stroke="#fff7" strokeWidth={c * 0.08} />)
      } else if (variant === 'chair') {
        cells.push(
          <g key={key} style={style}>
            <rect x={x + c * 0.1} y={y} width={c * 0.8} height={c * 0.45} rx={c * 0.12} fill={color} />
            <rect x={x + c * 0.1} y={y + c * 0.5} width={c * 0.8} height={c * 0.3} rx={c * 0.1} fill={color} opacity="0.8" />
          </g>,
        )
      } else {
        cells.push(
          <rect key={key} style={style} x={x} y={y} width={c} height={c} rx={Math.min(5, c * 0.2)} fill={color} stroke="#1e3a8a" strokeOpacity="0.25" />,
        )
      }
    }
  }
  return (
    <svg
      viewBox={`-2 -2 ${width + 4} ${height + 4}`}
      width={width + 4}
      height={height + 4}
      className={`max-w-full ${className}`}
      role="img"
      aria-label={label || `Susunan ${rows} baris × ${cols} kolom, ${rows * cols} kotak`}
    >
      {cells}
    </svg>
  )
}

/** Deretan susunan persegi 1×1, 2×2, ... dengan label. */
export function GridSeries({ ns = [1, 2, 3], cell = 16, dark = false, showLabels = true }) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-5">
      {ns.map((n, i) => (
        <figure key={n} className="flex flex-col items-center gap-2">
          <SquareGrid rows={n} cell={cell} gap={3} />
          {showLabels && (
            <figcaption className={`text-center text-sm font-bold ${dark ? 'text-white/80' : 'text-slate-600'}`}>
              Susunan ke-{i + 1}
              <br />
              <span className={dark ? 'text-sun' : 'text-royal'}>
                {n} × {n} = {n * n}
              </span>
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}
