import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PORT = 3000;
const BASE = 'https://finnhub.io/api/v1';
const API_KEY = loadEnvKey();

function loadEnvKey() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const [key, ...rest] = line.split('=');
      if (key.trim() === 'FINNHUB_API_KEY') {
        return rest.join('=').trim();
      }
    }
  } catch {}
  return '';
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (!url.pathname.startsWith('/api/market-data')) {
    res.writeHead(404);
    return res.end('Not found');
  }

  const fn = url.searchParams.get('fn');
  const symbol = url.searchParams.get('symbol') || 'SPY';
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let upstream;

  try {
    switch (fn) {
      case 'quote':
        upstream = `${BASE}/quote?symbol=${symbol}&token=${API_KEY}`;
        break;
      case 'overview': {
        const [profileRes, metricsRes] = await Promise.all([
          fetch(`${BASE}/stock/profile2?symbol=${symbol}&token=${API_KEY}`),
          fetch(`${BASE}/stock/metric?symbol=${symbol}&metric=all&token=${API_KEY}`),
        ]);
        const profile = await profileRes.json();
        const metrics = await metricsRes.json().catch(() => ({}));
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({ ...profile, metrics: metrics.metric || {} }));
        return;
      }
      case 'candle': {
        // Yahoo Finance for historical data (free, no key)
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
        upstream = `${BASE}/forex/rates?token=${API_KEY}`;
        break;
      default:
        res.writeHead(400);
        return res.end('Missing or invalid fn param');
    }

    const upstreamRes = await fetch(upstream);
    const data = await upstreamRes.text();
    res.setHeader('Content-Type', 'application/json');
    // Finnhub returns 429 on rate limit
    res.writeHead(upstreamRes.status === 429 ? 429 : 200);
    res.end(data);
  } catch (err) {
    res.writeHead(502);
    res.end(JSON.stringify({ error: 'Upstream fetch failed' }));
  }
});

server.listen(PORT, () => {
  console.log(`Market data proxy (Finnhub) running on http://localhost:${PORT}`);
});
