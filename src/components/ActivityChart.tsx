'use client'
import { useState, useMemo } from 'react'
import type { Filing } from './Dashboard'

export default function ActivityChart({ filings }: { filings: Filing[] }) {
  const [open, setOpen] = useState(false)
  const [ChartLib, setChartLib] = useState<any>(null)

  const loadChart = async () => {
    if (!ChartLib) {
      const mod = await import('recharts')
      setChartLib(mod)
    }
    setOpen(o => !o)
  }

  const chartData = useMemo(() => {
    const map: Record<string, { date: string; buys: number; sells: number }> = {}
    filings.forEach(f => {
      const d = new Date(f.filedAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', timeZone: 'Europe/London' })
      if (!map[d]) map[d] = { date: d, buys: 0, sells: 0 }
      if (f.transCode === 'P') map[d].buys++
      else if (f.transCode === 'S') map[d].sells++
    })
    return Object.values(map).slice(-14)
  }, [filings])

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
      <div
        onClick={loadChart}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', borderBottom: open ? '1px solid var(--border)' : 'none' }}
      >
        <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--muted)' }}>{open ? '▾' : '▸'}</span>
          Buy vs sell activity — last 30 days
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 18, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>⌄</span>
      </div>
      {open && ChartLib && (
        <div style={{ padding: '16px 18px', height: 220 }}>
          <ChartLib.ResponsiveContainer width="100%" height="100%">
            <ChartLib.LineChart data={chartData}>
              <ChartLib.XAxis dataKey="date" tick={{ fill: '#6b6b80', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <ChartLib.YAxis tick={{ fill: '#6b6b80', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <ChartLib.Tooltip contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12 }} labelStyle={{ color: '#6b6b80' }} />
              <ChartLib.Line type="monotone" dataKey="buys" stroke="#00d084" strokeWidth={2} dot={{ fill: '#00d084', r: 3 }} name="Buys" />
              <ChartLib.Line type="monotone" dataKey="sells" stroke="#ff4757" strokeWidth={2} strokeDasharray="4 3" dot={{ fill: '#ff4757', r: 3 }} name="Sells" />
              <ChartLib.Legend wrapperStyle={{ fontSize: 11, color: '#6b6b80', fontFamily: 'monospace' }} />
            </ChartLib.LineChart>
          </ChartLib.ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
