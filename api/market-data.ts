import type { VercelRequest, VercelResponse } from '@vercel/node';

const BASE = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const fn = req.query.fn as string;
  const symbol = (req.query.symbol as string) || 'SPY';
  const from = req.query.from as string;
  const to = req.query.to as string;

  let upstream: string;

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
        return res.status(200).json({ ...profile, metrics: metrics.metric || {} });
      }
      case 'candle':
        upstream = `${BASE}/stock/candle?symbol=${symbol}&resolution=${req.query.resolution || 'D'}&from=${from}&to=${to}&token=${API_KEY}`;
        break;
      case 'fx':
        upstream = `${BASE}/forex/rates?token=${API_KEY}`;
        break;
      default:
        return res.status(400).json({ error: 'Missing or invalid fn param' });
    }

    const upstreamRes = await fetch(upstream);
    const status = upstreamRes.status === 429 ? 429 : 200;
    const data = await upstreamRes.text();
    return res.status(status).setHeader('Content-Type', 'application/json').send(data);
  } catch {
    return res.status(502).json({ error: 'Upstream fetch failed' });
  }
}
