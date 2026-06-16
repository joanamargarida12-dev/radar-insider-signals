'use client'
import { useEffect, useState, useCallback } from 'react'
import Sidebar from './Sidebar'
import MetricCards from './MetricCards'
import ActivityChart from './ActivityChart'
import FilingsTable from './FilingsTable'

export interface Filing {
  id: string
  ticker: string
  company: string
  insiderName: string
  insiderTitle: string
  transCode: string
  shares: number
  pricePerShare: number
  totalValue: number
  filedAt: string
  price1d: number | null
  price4d: number | null
  price10d: number | null
  signal: {
    status: 'spike' | 'watching' | 'none'
    peakPct: number | null
    label: string
  }
}

export interface Metrics {
  totalBuys: number
  totalSells: number
  totalVolume: number
  spikesDetected: number
}

export default function Dashboard() {
  const [filings, setFilings] = useState<Filing[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ totalBuys: 0, totalSells: 0, totalVolume: 0, spikesDetected: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ ticker: '', type: '', minValue: '' })
  const [ukTime, setUkTime] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.ticker) params.set('ticker', filters.ticker)
    if (filters.type) params.set('type', filters.type)
    if (filters.minValue) params.set('minValue', filters.minValue)
    try {
      const res = await fetch(`/api/filings?${params}`)
      const data = await res.json()
      setFilings(data.filings || [])
      setMetrics(data.metrics || {})
      setLastUpdated(new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London' }))
    } catch {
      // fallback to demo data if DB not connected
      setFilings(DEMO_DATA)
      setMetrics({ totalBuys: 9, totalSells: 5, totalVolume: 84200000, spikesDetected: 6 })
    }
    setLoading(false)
  }, [filters])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const tick = () => {
      const t = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/London' })
      const tz = Intl.DateTimeFormat('en-GB', { timeZoneName: 'short', timeZone: 'Europe/London' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || 'GMT'
      setUkTime(`${t} ${tz === 'GMT+1' ? 'BST' : 'GMT'}`)
    }
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>
      <Sidebar filters={filters} setFilters={setFilters} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ padding: '14px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Live insider feed</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-mono, monospace)' }}>
              Form 4 · SEC EDGAR · {lastUpdated ? `Updated ${lastUpdated}` : 'Loading...'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', padding: '6px 12px', borderRadius: 6, fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--muted)' }}>
              🇬🇧 <span style={{ color: 'var(--text)' }}>{ukTime}</span>
            </div>
            <button
              onClick={fetchData}
              style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--muted)', padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <MetricCards metrics={metrics} />
          <ActivityChart filings={filings} />
          <FilingsTable filings={filings} loading={loading} />
        </div>
      </main>
    </div>
  )
}

// Demo data shown when DB is not connected yet
const DEMO_DATA: Filing[] = [
  { id:'1', ticker:'NVDA', company:'NVIDIA Corp', insiderName:'Jensen Huang', insiderTitle:'CEO', transCode:'P', shares:50000, pricePerShare:131.50, totalValue:6575000, filedAt:'2026-06-12T14:32:00Z', price1d:2.1, price4d:7.8, price10d:12.3, signal:{ status:'spike', peakPct:7.8, label:'Spike detected' }},
  { id:'2', ticker:'AMD', company:'Advanced Micro Devices', insiderName:'Lisa Su', insiderTitle:'CEO', transCode:'P', shares:60000, pricePerShare:149.30, totalValue:8958000, filedAt:'2026-06-12T09:15:00Z', price1d:1.2, price4d:6.1, price10d:null, signal:{ status:'spike', peakPct:6.1, label:'Spike detected' }},
  { id:'3', ticker:'COIN', company:'Coinbase Global', insiderName:'Brian Armstrong', insiderTitle:'CEO', transCode:'P', shares:20000, pricePerShare:262.10, totalValue:5242000, filedAt:'2026-06-11T11:04:00Z', price1d:3.4, price4d:null, price10d:null, signal:{ status:'watching', peakPct:3.4, label:'Watching' }},
  { id:'4', ticker:'TSLA', company:'Tesla Inc', insiderName:'Elon Musk', insiderTitle:'CEO', transCode:'P', shares:200000, pricePerShare:262.80, totalValue:52560000, filedAt:'2026-06-10T15:48:00Z', price1d:-0.8, price4d:5.3, price10d:9.1, signal:{ status:'spike', peakPct:5.3, label:'Spike detected' }},
  { id:'5', ticker:'META', company:'Meta Platforms', insiderName:'Mark Zuckerberg', insiderTitle:'CEO', transCode:'S', shares:100000, pricePerShare:590.10, totalValue:59010000, filedAt:'2026-06-09T10:22:00Z', price1d:-1.2, price4d:-3.4, price10d:-2.1, signal:{ status:'none', peakPct:-3.4, label:'No move' }},
  { id:'6', ticker:'JPM', company:'JPMorgan Chase', insiderName:'Jamie Dimon', insiderTitle:'CEO', transCode:'P', shares:30000, pricePerShare:268.40, totalValue:8052000, filedAt:'2026-06-08T12:00:00Z', price1d:0.4, price4d:2.1, price10d:4.8, signal:{ status:'none', peakPct:4.8, label:'No move' }},
  { id:'7', ticker:'AAPL', company:'Apple Inc', insiderName:'Timothy Cook', insiderTitle:'CEO', transCode:'P', shares:80000, pricePerShare:211.30, totalValue:16904000, filedAt:'2026-06-07T09:45:00Z', price1d:1.8, price4d:3.2, price10d:6.7, signal:{ status:'spike', peakPct:6.7, label:'Spike detected' }},
  { id:'8', ticker:'PLTR', company:'Palantir Technologies', insiderName:'Alex Karp', insiderTitle:'CEO', transCode:'S', shares:500000, pricePerShare:38.50, totalValue:19250000, filedAt:'2026-06-06T13:30:00Z', price1d:-2.1, price4d:-5.8, price10d:-4.2, signal:{ status:'none', peakPct:-5.8, label:'No move' }},
  { id:'9', ticker:'RIVN', company:'Rivian Automotive', insiderName:'RJ Scaringe', insiderTitle:'CEO', transCode:'P', shares:150000, pricePerShare:11.40, totalValue:1710000, filedAt:'2026-06-04T10:10:00Z', price1d:4.2, price4d:8.9, price10d:15.6, signal:{ status:'spike', peakPct:8.9, label:'Spike detected' }},
  { id:'10', ticker:'AMZN', company:'Amazon.com Inc', insiderName:'Andrew Jassy', insiderTitle:'CEO', transCode:'P', shares:35000, pricePerShare:215.60, totalValue:7546000, filedAt:'2026-06-01T09:30:00Z', price1d:2.3, price4d:4.1, price10d:7.2, signal:{ status:'spike', peakPct:7.2, label:'Spike detected' }},
]
