// src/app/api/refresh/route.ts
// Called by Vercel Cron every 4 hours
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchLatestFilings, fetchPriceChange } from '@/lib/edgar'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Protect with a secret so only Vercel Cron can call this
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Fetch latest Form 4s from SEC EDGAR
    const filings = await fetchLatestFilings(40)
    let inserted = 0

    for (const f of filings) {
      try {
        await prisma.filing.upsert({
          where: { accessionNo: f.accessionNo },
          create: {
            accessionNo: f.accessionNo,
            ticker: f.ticker,
            company: f.company,
            insiderName: f.insiderName,
            insiderTitle: f.insiderTitle,
            transCode: f.transCode,
            shares: f.shares,
            pricePerShare: f.pricePerShare,
            totalValue: f.totalValue,
            filedAt: f.filedAt,
            periodOfReport: f.periodOfReport,
          },
          update: {},
        })
        inserted++
      } catch { /* skip duplicates */ }
    }

    // 2. Update price impact for filings that need it
    const needsPriceUpdate = await prisma.filing.findMany({
      where: {
        transCode: 'P', // only buys matter for signals
        OR: [
          { price1d: null },
          { price4d: null },
          { price10d: null },
        ],
        filedAt: {
          gte: new Date(Date.now() - 15 * 86400000), // within 15 days
        },
      },
      take: 20,
    })

    for (const filing of needsPriceUpdate) {
      const daysSince = (Date.now() - new Date(filing.filedAt).getTime()) / 86400000
      const updates: Record<string, number | Date> = { priceFetched: new Date() }

      if (daysSince >= 1 && filing.price1d === null) {
        const p = await fetchPriceChange(filing.ticker, filing.filedAt, 1)
        if (p !== null) updates.price1d = p
      }
      if (daysSince >= 4 && filing.price4d === null) {
        const p = await fetchPriceChange(filing.ticker, filing.filedAt, 4)
        if (p !== null) updates.price4d = p
      }
      if (daysSince >= 10 && filing.price10d === null) {
        const p = await fetchPriceChange(filing.ticker, filing.filedAt, 10)
        if (p !== null) updates.price10d = p
      }

      if (Object.keys(updates).length > 1) {
        await prisma.filing.update({ where: { id: filing.id }, data: updates })
      }
    }

    return NextResponse.json({ ok: true, inserted, priceUpdates: needsPriceUpdate.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
