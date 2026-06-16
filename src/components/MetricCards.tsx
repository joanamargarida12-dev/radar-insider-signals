import type { Metrics } from './Dashboard'

function fmtVolume(v: number) {
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K'
  return '$' + v.toLocaleString()
}

export default function MetricCards({ metrics }: { metrics: Metrics }) {
  const cards = [
    { label: 'Total buys', value: metrics.totalBuys.toString(), color: 'var(--green)', accent: '#00d084', sub: 'last 30 days' },
    { label: 'Total sells', value: metrics.totalSells.toString(), color: 'var(--red)', accent: '#ff4757', sub: 'last 30 days' },
    { label: 'Total volume', value: fmtVolume(metrics.totalVolume), color: 'var(--accent)', accent: '#7c6bff', sub: 'across all filings' },
    { label: 'Spikes detected', value: metrics.spikesDetected.toString(), color: 'var(--amber)', accent: '#ffb020', sub: '+5% within 10 days' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '16px 18px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.accent }} />
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{c.label}</div>
          <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', letterSpacing: '-0.02em', color: c.color }}>{c.value}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
