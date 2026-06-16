import type { Filing } from './Dashboard'

function fmtVal(v: number) {
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K'
  return '$' + v.toLocaleString()
}

function fmtShares(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(0) + 'K' : n.toLocaleString()
}

function ImpactCell({ val }: { val: number | null }) {
  if (val === null) return <span style={{ color: '#3a3a50', fontFamily: 'monospace', fontSize: 11 }}>—</span>
  const pos = val > 0
  const color = pos ? 'var(--green)' : val < 0 ? 'var(--red)' : 'var(--muted)'
  return <span style={{ color, fontFamily: 'monospace', fontSize: 11, fontWeight: 500 }}>{pos ? '▲' : '▼'} {Math.abs(val).toFixed(1)}%</span>
}

function StatusCell({ filing }: { filing: Filing }) {
  const { signal } = filing
  if (signal.status === 'watching') {
    return (
      <div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 500, fontFamily: 'monospace', background: 'rgba(74,158,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(74,158,255,0.25)' }}>◉ Watching</span>
      </div>
    )
  }
  if (signal.status === 'spike') {
    const pos = (signal.peakPct ?? 0) > 0
    return (
      <div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 500, fontFamily: 'monospace', background: 'rgba(255,176,32,0.12)', color: 'var(--amber)', border: '1px solid rgba(255,176,32,0.3)' }}>⚡ Spike detected</span>
        {signal.peakPct !== null && (
          <div style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 500, marginTop: 3, color: pos ? 'var(--green)' : 'var(--red)' }}>
            {pos ? '▲' : '▼'} {Math.abs(signal.peakPct).toFixed(1)}% peak
          </div>
        )}
      </div>
    )
  }
  return (
    <div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, fontSize: 11, fontFamily: 'monospace', background: 'rgba(255,255,255,0.04)', color: 'var(--muted)', border: '1px solid var(--border)' }}>◌ No move</span>
      {signal.peakPct !== null && (
        <div style={{ fontSize: 11, fontFamily: 'monospace', marginTop: 3, color: (signal.peakPct ?? 0) > 0 ? 'var(--green)' : 'var(--muted)' }}>
          {(signal.peakPct ?? 0) > 0 ? '▲' : '▼'} {Math.abs(signal.peakPct ?? 0).toFixed(1)}%
        </div>
      )}
    </div>
  )
}

const th: React.CSSProperties = {
  fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  padding: '10px 14px', textAlign: 'left',
  borderBottom: '1px solid var(--border)', fontWeight: 500, whiteSpace: 'nowrap',
}

const td: React.CSSProperties = {
  padding: '12px 14px', borderBottom: '1px solid var(--border)',
  verticalAlign: 'middle', whiteSpace: 'nowrap',
}

export default function FilingsTable({ filings, loading }: { filings: Filing[]; loading: boolean }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>Recent transactions</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{loading ? 'Loading...' : `${filings.length} filings`}</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Ticker','Insider','Type','Shares','Value','Date · Time (BST)','Price impact','Status'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filings.map(f => {
              const bst = new Date(f.filedAt).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })
              const isBuy = f.transCode === 'P'
              return (
                <tr key={f.id} style={{ transition: 'background .1s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={td}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 500, fontSize: 13 }}>{f.ticker}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{f.company}</div>
                  </td>
                  <td style={td}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{f.insiderName}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{f.insiderTitle}</div>
                  </td>
                  <td style={td}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 9px', borderRadius: 5,
                      fontSize: 11, fontWeight: 500, fontFamily: 'monospace',
                      background: isBuy ? 'rgba(0,208,132,0.12)' : 'rgba(255,71,87,0.12)',
                      color: isBuy ? 'var(--green)' : 'var(--red)',
                      border: `1px solid ${isBuy ? 'rgba(0,208,132,0.25)' : 'rgba(255,71,87,0.25)'}`,
                    }}>
                      {isBuy ? '▲ BUY' : '▼ SELL'}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{fmtShares(f.shares)}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1, fontFamily: 'monospace' }}>@ ${f.pricePerShare.toFixed(2)}</div>
                  </td>
                  <td style={td}>
                    <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{fmtVal(f.totalValue)}</div>
                  </td>
                  <td style={td}>
                    <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{bst}</div>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {[{ label: '1D', val: f.price1d }, { label: '4D', val: f.price4d }, { label: '10D', val: f.price10d }].map((item, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'monospace', letterSpacing: '0.06em' }}>{item.label}</div>
                          <div style={{ marginTop: 2 }}><ImpactCell val={item.val} /></div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={td}><StatusCell filing={f} /></td>
                </tr>
              )
            })}
            {!loading && filings.length === 0 && (
              <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>No filings found for the selected filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
