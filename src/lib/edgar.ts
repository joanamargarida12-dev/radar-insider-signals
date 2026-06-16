// src/lib/edgar.ts
// Fetches Form 4 filings from SEC EDGAR public API (no key required)

const HEADERS = {
  'User-Agent': 'radar-insider-signals contact@radarinsider.app',
  'Accept': 'application/json, text/xml',
}

export interface ParsedFiling {
  accessionNo: string
  ticker: string
  company: string
  insiderName: string
  insiderTitle: string
  transCode: string
  shares: number
  pricePerShare: number
  totalValue: number
  filedAt: Date
  periodOfReport: Date
}

// Fetch latest Form 4 atom feed from EDGAR
export async function fetchLatestForm4Links(count = 40): Promise<string[]> {
  const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&dateb=&owner=include&count=${count}&output=atom`
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`EDGAR feed failed: ${res.status}`)
  const xml = await res.text()

  const links: string[] = []
  const re = /<filing-href>(.*?)<\/filing-href>/g
  let m
  while ((m = re.exec(xml)) !== null) links.push(m[1].trim())
  return links
}

// Given an index page URL, find the Form 4 XML document URL
async function resolveXmlUrl(indexUrl: string): Promise<string | null> {
  try {
    const res = await fetch(indexUrl, { headers: HEADERS })
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(/href="([^"]*\.xml)"/i)
    if (!m) return null
    const path = m[1]
    if (path.startsWith('http')) return path
    return 'https://www.sec.gov' + (path.startsWith('/') ? path : '/' + path)
  } catch { return null }
}

// Parse a Form 4 XML document into structured filings
export async function parseForm4Xml(xmlUrl: string, indexUrl: string): Promise<ParsedFiling[]> {
  try {
    const res = await fetch(xmlUrl, { headers: HEADERS })
    if (!res.ok) return []
    const xml = await res.text()

    const get = (tag: string) => {
      const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`))
      return m ? m[1].trim() : ''
    }

    const ticker = get('issuerTradingSymbol')
    const company = get('issuerName')
    const insiderName = get('rptOwnerName')
    const isOfficer = xml.includes('<isOfficer>1</isOfficer>')
    const isDirector = xml.includes('<isDirector>1</isDirector>')
    const titleMatch = xml.match(/<officerTitle>([^<]*)<\/officerTitle>/)
    const insiderTitle = titleMatch ? titleMatch[1].trim() : isDirector ? 'Director' : isOfficer ? 'Officer' : '10% Owner'

    // Extract accession number from URL
    const accMatch = indexUrl.match(/(\d{18}|\d{10}-\d{2}-\d{6})/)
    const accessionNo = accMatch ? accMatch[1] : xmlUrl

    const filedMatch = xml.match(/<periodOfReport>([^<]+)<\/periodOfReport>/)
    const periodOfReport = filedMatch ? new Date(filedMatch[1]) : new Date()
    const filedAt = new Date()

    if (!ticker || !insiderName) return []

    // Extract non-derivative transactions
    const txRe = /<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/g
    const results: ParsedFiling[] = []
    let txMatch

    while ((txMatch = txRe.exec(xml)) !== null) {
      const block = txMatch[1]
      const codeM = block.match(/<transactionCode>([^<]+)<\/transactionCode>/)
      const sharesM = block.match(/<transactionShares>\s*<value>([^<]+)<\/value>/)
      const priceM = block.match(/<transactionPricePerShare>\s*<value>([^<]+)<\/value>/)
      const dateM = block.match(/<transactionDate>\s*<value>([^<]+)<\/value>/)

      const transCode = codeM ? codeM[1].trim() : ''
      if (!['P', 'S', 'A'].includes(transCode)) continue

      const shares = sharesM ? parseFloat(sharesM[1]) : 0
      const pricePerShare = priceM ? parseFloat(priceM[1]) : 0
      const txDate = dateM ? new Date(dateM[1]) : periodOfReport

      if (!shares) continue

      results.push({
        accessionNo: accessionNo + '_' + transCode + '_' + shares,
        ticker: ticker.toUpperCase(),
        company,
        insiderName,
        insiderTitle,
        transCode,
        shares,
        pricePerShare,
        totalValue: shares * pricePerShare,
        filedAt: txDate,
        periodOfReport: txDate,
      })
    }

    return results
  } catch { return [] }
}

// Main function: fetch + parse latest filings
export async function fetchLatestFilings(count = 40): Promise<ParsedFiling[]> {
  const links = await fetchLatestForm4Links(count)
  const results: ParsedFiling[] = []

  // Process in parallel batches of 5 (respect EDGAR rate limits)
  for (let i = 0; i < links.length; i += 5) {
    const batch = links.slice(i, i + 5)
    const batchResults = await Promise.all(
      batch.map(async (link) => {
        const xmlUrl = await resolveXmlUrl(link)
        if (!xmlUrl) return []
        return parseForm4Xml(xmlUrl, link)
      })
    )
    results.push(...batchResults.flat())
    if (i + 5 < links.length) await new Promise(r => setTimeout(r, 200))
  }

  return results.filter(f => f.ticker && f.insiderName)
}

// Fetch price impact using Yahoo Finance (free, no key)
export async function fetchPriceChange(ticker: string, fromDate: Date, days: number): Promise<number | null> {
  try {
    const from = Math.floor(fromDate.getTime() / 1000)
    const to = Math.floor(fromDate.getTime() / 1000 + days * 86400 * 1.5)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${from}&period2=${to}&interval=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const closes: number[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close
    if (!closes || closes.length < 2) return null
    const start = closes[0]
    const end = closes[Math.min(days, closes.length - 1)]
    if (!start || !end) return null
    return parseFloat((((end - start) / start) * 100).toFixed(2))
  } catch { return null }
}
