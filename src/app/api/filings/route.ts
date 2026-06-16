// src/app/api/filings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeSignal } from '@/lib/signals'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ticker = searchParams.get('ticker') || undefined
  const type = searchParams.get('type') || undefined
  const minValue = searchParams.get('minValue') ? parseFloat(searchParams.get('minValue')!) : undefined

  try {
    const filings = await prisma.filing.findMany({
      where: {
        ...(ticker ? { ticker } : {}),
        ...(type === 'BUY' ? { transCode: 'P' } : type === 'SELL' ? { transCode: 'S' } : {}),
        ...(minValue ? { totalValue: { gte: minValue } } : {}),
      },
      orderBy: { filedAt: 'desc' },
      take: 100,
    })

    const enriched = filings.map(f => ({
      ...f,
      signal: computeSignal(f.transCode, f.filedAt, f.price1d, f.price4d, f.price10d),
    }))

    // Aggregate metrics
    const buys = filings.filter(f => f.transCode === 'P')
    const sells = filings.filter(f => f.transCode === 'S')
    const spikes = enriched.filter(f => f.signal.status === 'spike')
    const totalVolume = filings.reduce((s, f) => s + f.totalValue, 0)

    return NextResponse.json({
      filings: enriched,
      metrics: {
        totalBuys: buys.length,
        totalSells: sells.length,
        totalVolume,
        spikesDetected: spikes.length,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
