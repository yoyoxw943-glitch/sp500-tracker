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

## Deploy to Vercel

1. Push to a GitHub repo
2. Import the project into [Vercel](https://vercel.com)
3. Add the three environment variables in Vercel project settings
4. Deploy — the `vercel.json` configures the RSS proxy function automatically

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
