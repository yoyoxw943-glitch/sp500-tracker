import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PORT = 3000;
const BASE = 'https://www.alphavantage.co/query';
const API_KEY = loadEnvKey();

function loadEnvKey() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const [key, ...rest] = line.split('=');
      if (key.trim() === 'ALPHA_VANTAGE_API_KEY') {
        return rest.join('=').trim();
      }
    }
  } catch {}
  return 'demo';
}

// Free tier: 5 req/min, use 10s gap for responsiveness
let lastCall = 0;
const MIN_GAP = 10_000;

function throttle() {
  const now = Date.now();
  const wait = Math.max(0, MIN_GAP - (now - lastCall));
  lastCall = now + wait;
  return new Promise(r => setTimeout(r, wait));
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
  const extra = url.searchParams.get('extra') || '';

  if (!fn) {
    res.writeHead(400);
    return res.end('Missing fn param');
  }

  try {
    await throttle();
    const upstream = `${BASE}?function=${fn}&symbol=${symbol}&apikey=${API_KEY}${extra}`;
    const upstreamRes = await fetch(upstream);
    const data = await upstreamRes.text();
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(upstreamRes.status);
    res.end(data);
  } catch (err) {
    res.writeHead(502);
    res.end(JSON.stringify({ error: 'Upstream fetch failed' }));
  }
});

server.listen(PORT, () => {
  console.log(`Market data proxy running on http://localhost:${PORT}`);
});
