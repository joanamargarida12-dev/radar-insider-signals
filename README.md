# Radar — Insider Signals

Real-time SEC Form 4 insider trading signals dashboard.

## Stack
- **Next.js 14** — frontend + API routes
- **Neon** — free PostgreSQL database
- **Prisma** — database ORM
- **Recharts** — charts
- **Vercel** — free hosting + cron jobs

## Setup (10 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Create free Neon database
1. Go to [neon.tech](https://neon.tech) → create free account
2. Create a new project called `radar`
3. Copy the **Connection string** (DATABASE_URL)

### 3. Set environment variables
```bash
cp .env.example .env.local
# Fill in your DATABASE_URL from Neon
# Generate CRON_SECRET: openssl rand -base64 32
```

### 4. Push database schema
```bash
npx prisma generate
npx prisma db push
```

### 5. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
gh repo create radar-insider --public --push
```

### 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → Import project from GitHub
2. Add environment variables:
   - `DATABASE_URL` — from Neon
   - `DIRECT_URL` — same as DATABASE_URL
   - `CRON_SECRET` — your random string
3. Deploy

### 3. Trigger first data load
After deploy, visit:
```
https://your-app.vercel.app/api/refresh
```
With header: `Authorization: Bearer YOUR_CRON_SECRET`

Or wait 4 hours for the cron to run automatically.

## How it works

1. **Cron job** runs every 4 hours → `/api/refresh`
2. Fetches latest Form 4 filings from SEC EDGAR (free, no key)
3. Parses XML → extracts ticker, insider, shares, price
4. Saves to Neon PostgreSQL
5. Fetches price changes from Yahoo Finance (1d, 4d, 10d after trade)
6. Computes signal: Spike / Watching / No move
7. Dashboard shows live data via `/api/filings`

## Signal logic
- **Spike detected** — stock moved +5% or more within 10 days of an insider BUY
- **Watching** — insider bought within last 4 days, not enough data yet
- **No move** — price was flat after the trade

## Data source
All data is public domain from [SEC EDGAR](https://www.sec.gov/cgi-bin/browse-edgar).
No API key required. Rate limited to ~8 requests/second per SEC policy.
