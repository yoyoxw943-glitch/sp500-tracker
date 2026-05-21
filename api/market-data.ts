import type { VercelRequest, VercelResponse } from '@vercel/node';

const BASE = 'https://www.alphavantage.co/query';
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';

// Free tier: 5 req/min, use 10s gap for responsiveness
let lastCall = 0;
const MIN_GAP = 10_000;

function throttle() {
  const now = Date.now();
  const wait = Math.max(0, MIN_GAP - (now - lastCall));
  lastCall = now + wait;
  return new Promise(r => setTimeout(r, wait));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const fn = req.query.fn as string;
  const symbol = (req.query.symbol as string) || 'SPY';
  const extra = (req.query.extra as string) || '';

  if (!fn) {
    return res.status(400).json({ error: 'Missing fn param' });
  }

  try {
    await throttle();
    const upstream = `${BASE}?function=${fn}&symbol=${symbol}&apikey=${API_KEY}${extra}`;
    const upstreamRes = await fetch(upstream);
    const data = await upstreamRes.json();
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: 'Upstream fetch failed' });
  }
}
