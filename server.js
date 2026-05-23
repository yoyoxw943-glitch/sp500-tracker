import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PORT = 3000;
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

function loadEnvKeys() {
  const keys = { finnhub: '', news: '' };
  try {
    const envPath = resolve(process.cwd(), '.env');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const [key, ...rest] = line.split('=');
      const name = key.trim();
      const val = rest.join('=').trim();
      if (name === 'FINNHUB_API_KEY') keys.finnhub = val;
      if (name === 'VITE_NEWS_API_KEY') keys.news = val;
    }
  } catch {}
  return keys;
}

const KEYS = loadEnvKeys();

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // ── RSS proxy ──────────────────────────────────────────────────
  if (path === '/api/rss-proxy') {
    const feedUrl = url.searchParams.get('url');
    if (!feedUrl) {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: 'Missing url param' }));
    }
    const allowed = ['investopedia.com', 'morningstar.com', 'etf.com', 'awealthofcommonsense.com'];
    try {
      const hostname = new URL(feedUrl).hostname;
      if (!allowed.some((d) => hostname.endsWith(d))) {
        res.writeHead(403);
        return res.end(JSON.stringify({ error: 'Domain not allowed' }));
      }
      const rssRes = await fetch(feedUrl, {
        headers: { 'User-Agent': 'S&P500-Tracker/1.0 (RSS Reader)' },
      });
      const text = await rssRes.text();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.writeHead(200);
      res.end(text);
    } catch {
      res.writeHead(502);
      res.end(JSON.stringify({ error: 'Failed to fetch RSS feed' }));
    }
    return;
  }

  // ── NewsAPI proxy ──────────────────────────────────────────────
  if (path === '/api/news') {
    if (!KEYS.news) {
      res.writeHead(500);
      return res.end(JSON.stringify({ error: 'News API key not configured' }));
    }
    const q = url.searchParams.get('q') || 'S&P 500 market';
    const pageSize = url.searchParams.get('pageSize') || '50';
    const from = url.searchParams.get('from');
    let newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=${pageSize}&language=en&apiKey=${KEYS.news}`;
    if (from) newsUrl += `&from=${encodeURIComponent(from)}`;
    try {
      const newsRes = await fetch(newsUrl);
      const data = await newsRes.text();
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(data);
    } catch {
      res.writeHead(502);
      res.end(JSON.stringify({ error: 'Upstream fetch failed' }));
    }
    return;
  }

  // ── Market data proxy ──────────────────────────────────────────
  if (!path.startsWith('/api/market-data')) {
    res.writeHead(404);
    return res.end('Not found');
  }

  const fn = url.searchParams.get('fn');
  const symbol = url.searchParams.get('symbol') || 'SPY';

  let upstream;

  try {
    switch (fn) {
      case 'quote': {
        // Fetch quote + daily candle (for volume) in parallel
        const [quoteRes, candleRes] = await Promise.all([
          fetch(`${FINNHUB_BASE}/quote?symbol=${symbol}&token=${KEYS.finnhub}`),
          fetch(`${FINNHUB_BASE}/stock/candle?symbol=${symbol}&resolution=D&count=1&token=${KEYS.finnhub}`),
        ]);
        const quoteData = await quoteRes.json();
        const candleData = await candleRes.json().catch(() => ({}));
        const volume = candleData.v?.[0] ?? 0;
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({ ...quoteData, volume }));
        return;
      }
      case 'overview': {
        const [profileRes, metricsRes] = await Promise.all([
          fetch(`${FINNHUB_BASE}/stock/profile2?symbol=${symbol}&token=${KEYS.finnhub}`),
          fetch(`${FINNHUB_BASE}/stock/metric?symbol=${symbol}&metric=all&token=${KEYS.finnhub}`),
        ]);
        const profile = await profileRes.json();
        const metrics = await metricsRes.json().catch(() => ({}));
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({ ...profile, metrics: metrics.metric || {} }));
        return;
      }
      case 'candle': {
        const range = url.searchParams.get('range') || '5d';
        const interval = url.searchParams.get('resolution') || '1d';
        const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
        const yRes = await fetch(yUrl);
        const yData = await yRes.text();
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(yRes.status === 429 ? 429 : 200);
        res.end(yData);
        return;
      }
      case 'fx':
        upstream = `${FINNHUB_BASE}/forex/rates?token=${KEYS.finnhub}`;
        break;
      default:
        res.writeHead(400);
        return res.end('Missing or invalid fn param');
    }

    const upstreamRes = await fetch(upstream);
    const data = await upstreamRes.text();
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(upstreamRes.status === 429 ? 429 : 200);
    res.end(data);
  } catch {
    res.writeHead(502);
    res.end(JSON.stringify({ error: 'Upstream fetch failed' }));
  }
});

server.listen(PORT, () => {
  console.log(`Market data proxy running on http://localhost:${PORT}`);
});
