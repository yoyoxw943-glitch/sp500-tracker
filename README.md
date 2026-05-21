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

**Note:** Alpha Vantage is called server-side through a proxy — the key never reaches the browser.

### 3. Create .env file

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```
ALPHA_VANTAGE_API_KEY=your_key_here
VITE_DEEPSEEK_API_KEY=your_key_here
VITE_NEWS_API_KEY=your_key_here
```

### 4. Run locally

```bash
npm run dev
```

Starts both the Vite dev server and the API proxy (`server.js` on port 3000). The Vite proxy forwards `/api` requests to it. The app opens at `http://localhost:5173`.

### 5. Build for production

```bash
npm run build
```

## Deployment (International + China)

This project deploys to **Vercel** via GitHub Actions.

### 1. Push to GitHub

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

Add these env vars in your **Vercel project dashboard** (Settings → Environment Variables):
- `ALPHA_VANTAGE_API_KEY` — needed by the `api/market-data.ts` serverless function
- `VITE_DEEPSEEK_API_KEY` — needed at build time (client bundle)
- `VITE_NEWS_API_KEY` — needed at build time (client bundle)

Then add these **GitHub Secrets** in your repo (Settings → Secrets and variables → Actions):

| Secret | Source |
|--------|--------|
| `VERCEL_TOKEN` | From [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | From `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` → `projectId` |
| `VITE_DEEPSEEK_API_KEY` | Your DeepSeek key |
| `VITE_NEWS_API_KEY` | Your NewsAPI key |

### CI/CD

Every push to `main` triggers `.github/workflows/deploy.yml` which builds the project and deploys to Vercel (production, with serverless functions). Pull requests get a preview deployment automatically.

## Project Structure

```
src/
  components/     — Reusable UI components (Layout, skeletons, error states)
  pages/          — 6 tab pages (Live, History, News, Calculator, Learn, Portfolio)
  hooks/          — Custom hooks (theme, localStorage, countdown)
  services/       — All API calls with caching (Yahoo Finance, DeepSeek, NewsAPI, RSS)
  utils/          — Helpers (cache, formatters, calculations, historical data)
  types/          — TypeScript interfaces
api/
  rss-proxy.ts    — Vercel serverless function for RSS CORS proxy
```

## Disclaimer

This app is for educational and informational purposes only. It does not constitute financial advice. Past performance does not guarantee future results.
