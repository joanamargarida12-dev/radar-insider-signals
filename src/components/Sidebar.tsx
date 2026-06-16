'use client'

interface Filters { ticker: string; type: string; minValue: string }
interface Props { filters: Filters; setFilters: (f: Filters) => void }

const TICKERS = ['NVDA','AAPL','TSLA','META','AMD','COIN','JPM','PLTR','MSFT','GOOGL','AMZN','RIVN']

export default function Sidebar({ filters, setFilters }: Props) {
  const set = (k: keyof Filters, v: string) => setFilters({ ...filters, [k]: v })

  return (
    <aside style={{ width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⬡</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>Radar</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>Insider Signals</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '14px 10px', flex: 1 }}>
        {[
          { icon: '◈', label: 'Live feed', active: true, badge: null },
          { icon: '⚡', label: 'Spikes', active: false, badge: null },
          { icon: '◉', label: 'Watchlist', active: false, badge: null },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 6,
            fontSize: 13, color: item.active ? 'var(--accent)' : 'var(--muted)',
            background: item.active ? 'rgba(124,107,255,0.12)' : 'transparent',
            border: item.active ? '1px solid rgba(124,107,255,0.2)' : '1px solid transparent',
            cursor: 'pointer', marginBottom: 2,
          }}>
            <span style={{ width: 16, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}

        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 10px 6px' }}>Analyse</div>
        {[
          { icon: '▦', label: 'By ticker' },
          { icon: '▤', label: 'By insider' },
          { icon: '▣', label: 'Cluster buys' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 6,
            fontSize: 13, color: 'var(--muted)',
            cursor: 'pointer', marginBottom: 2,
          }}>
            <span style={{ width: 16, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      {/* Filters */}
      <div style={{ padding: '14px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Filters</div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>Ticker</div>
          <select
            value={filters.ticker}
            onChange={e => set('ticker', e.target.value)}
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', padding: '7px 10px', borderRadius: 6, fontSize: 12, outline: 'none', appearance: 'none' }}
          >
            <option value="">All tickers</option>
            {TICKERS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>Transaction type</div>
          <select
            value={filters.type}
            onChange={e => set('type', e.target.value)}
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', padding: '7px 10px', borderRadius: 6, fontSize: 12, outline: 'none', appearance: 'none' }}
          >
            <option value="">Buy &amp; Sell</option>
            <option value="BUY">Buy only</option>
            <option value="SELL">Sell only</option>
          </select>
        </div>

        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>Min value (USD)</div>
          <input
            type="number"
            placeholder="e.g. 100000"
            value={filters.minValue}
            onChange={e => set('minValue', e.target.value)}
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', padding: '7px 10px', borderRadius: 6, fontSize: 12, outline: 'none' }}
          />
        </div>
      </div>

      {/* Status */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono, monospace)' }}>SEC EDGAR live</span>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>
    </aside>
  )
}
