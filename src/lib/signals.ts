// src/lib/signals.ts

export type SignalStatus = 'spike' | 'watching' | 'none'

export interface SignalResult {
  status: SignalStatus
  peakPct: number | null
  label: string
}

export function computeSignal(
  transCode: string,
  filedAt: Date,
  price1d: number | null,
  price4d: number | null,
  price10d: number | null,
): SignalResult {
  const now = new Date()
  const daysSinceFiling = (now.getTime() - new Date(filedAt).getTime()) / 86400000

  // Only buys generate signals
  if (transCode !== 'P') {
    return { status: 'none', peakPct: null, label: 'No signal' }
  }

  // Still within the 4-day window — not enough data yet
  if (daysSinceFiling < 4 && price4d === null) {
    return { status: 'watching', peakPct: price1d, label: 'Watching' }
  }

  // Check for spike: any day exceeded 5%
  const peak = Math.max(
    price1d ?? -Infinity,
    price4d ?? -Infinity,
    price10d ?? -Infinity,
  )

  if (peak >= 5) {
    return { status: 'spike', peakPct: parseFloat(peak.toFixed(1)), label: 'Spike detected' }
  }

  return { status: 'none', peakPct: peak === -Infinity ? null : parseFloat(peak.toFixed(1)), label: 'No move' }
}

export function signalScore(
  transCode: string,
  totalValue: number,
  insiderTitle: string,
): number {
  if (transCode !== 'P') return 10

  let score = 30

  // Value score
  if (totalValue > 1_000_000) score += 40
  else if (totalValue > 500_000) score += 30
  else if (totalValue > 100_000) score += 20
  else if (totalValue > 50_000) score += 10

  // Role bonus
  const title = insiderTitle.toLowerCase()
  if (title.includes('ceo') || title.includes('chief executive')) score += 20
  else if (title.includes('cfo') || title.includes('chief financial')) score += 15
  else if (title.includes('cto') || title.includes('president')) score += 12
  else if (title.includes('director')) score += 8

  return Math.min(score, 100)
}
