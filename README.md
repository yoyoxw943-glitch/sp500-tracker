# S&P 500 Tracker

A responsive educational web app for tracking the S&P 500 and learning about long-term index fund investing.

## Features

- **Live Price** — Real-time S&P 500 data, 5-day chart, Fear & Greed gauge, key metrics
- **Historical Returns** — Annual returns bar chart (from 1928), bear market timeline, summary stats
- **Market News** — Latest S&P 500 news with category filters
- **Investment Calculator** — Compound interest calculator with real-time sliders and AI scenario tool
- **Learning Hub** — Beginner roadmap, knowledge base, curated reading list, AI Q&A chat
- **My Portfolio** — Investment log, goal tracker, portfolio growth chart

## Tech Stack

React 19 + TypeScript + Tailwind CSS + Recharts + React Router

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get API keys

| Service | URL | Cost |
|---------|-----|------|
| Alpha Vantage | [alphavantage.co](https://alphavantage.co) | Free (email signup, 5 req/min) |
| DeepSeek | [platform.deepseek.com](https://platform.deepseek.com) | Pay-per-token (very cheap) |
| NewsAPI | [newsapi.org](https://newsapi.org) | Free tier (100 req/day) |

### 3. Create .env file

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```
VITE_ALPHA_VANTAGE_API_KEY=your_key_here
VITE_DEEPSEEK_API_KEY=your_key_here
VITE_NEWS_API_KEY=your_key_here
```

### 4. Run locally

```bash
npm run dev
```

The app opens at `http://localhost:5173`.

For the RSS proxy function (used by the Learn tab), run:

```bash
npx vercel dev
```

### 5. Build for production

```bash
npm run build
```

## Deployment (International + China)

This project uses a split-origin deployment:

- **Vercel** — serves visitors outside mainland China (with serverless API functions)
- **Alibaba Cloud OSS** — serves static assets to visitors inside mainland China

### 1. Push to GitHub

Create a GitHub repo and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/sp500-tracker.git
git push -u origin main
```

### 2. Set up Vercel

```bash
npx vercel login
npx vercel link          # creates .vercel/ project link
npx vercel env pull      # pulls down the project ID + org ID
```

Add the three `VITE_*` env vars in your **Vercel project dashboard** (Settings → Environment Variables). Vercel builds from source to include the API serverless function, so it needs these at build time.

Then add these **GitHub Secrets** in your repo (Settings → Secrets and variables → Actions):

| Secret | Source |
|--------|--------|
| `VERCEL_TOKEN` | From [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | From `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` → `projectId` |
| `VITE_ALPHA_VANTAGE_API_KEY` | Your Alpha Vantage key (also needed for Alibaba Cloud build) |
| `VITE_DEEPSEEK_API_KEY` | Your DeepSeek key |
| `VITE_NEWS_API_KEY` | Your NewsAPI key |

### 3. Set up Alibaba Cloud OSS

1. Create an OSS bucket in Shanghai region
2. Enable static website hosting on the bucket
3. Configure CDN if desired

Then add these **GitHub Secrets**:

| Secret | Example |
|--------|---------|
| `OSS_ACCESS_KEY_ID` | Your RAM user access key |
| `OSS_ACCESS_KEY_SECRET` | Your RAM user secret |
| `OSS_REGION` | `oss-cn-shanghai` |
| `OSS_ENDPOINT` | `oss-cn-shanghai.aliyuncs.com` |
| `OSS_BUCKET` | `sp500-tracker` |

### 4. Geo-routing DNS

Use Alibaba Cloud DNS or DNSPod to route traffic by geography:

- **China mainland** → Alibaba Cloud OSS (or CDN CNAME)
- **Default** → Vercel (CNAME to `cname.vercel-dns.com`)

### CI/CD

Every push to `main` triggers `.github/workflows/deploy.yml` which:
1. Builds the project with API keys
2. Deploys to **Vercel** (production, with serverless functions)
3. Deploys to **Alibaba Cloud OSS** (static assets only)

Pull requests get a Vercel preview deployment automatically.

## Project Structure

```
src/
  components/     — Reusable UI components (Layout, skeletons, error states)
  pages/          — 6 tab pages (Live, History, News, Calculator, Learn, Portfolio)
  hooks/          — Custom hooks (theme, localStorage, countdown)
  services/       — All API calls with caching (Alpha Vantage, DeepSeek, NewsAPI, RSS)
  utils/          — Helpers (cache, formatters, calculations, historical data)
  types/          — TypeScript interfaces
api/
  rss-proxy.ts    — Vercel serverless function for RSS CORS proxy
```

## Disclaimer

This app is for educational and informational purposes only. It does not constitute financial advice. Past performance does not guarantee future results.
