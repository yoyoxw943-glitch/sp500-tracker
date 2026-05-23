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
      case 'quote': {
        // Fetch quote + daily candle (for volume) in parallel
        const [quoteRes, candleRes] = await Promise.all([
          fetch(`${BASE}/quote?symbol=${symbol}&token=${API_KEY}`),
          fetch(`${BASE}/stock/candle?symbol=${symbol}&resolution=D&count=1&token=${API_KEY}`),
        ]);
        const quoteData = await quoteRes.json();
        const candleData = await candleRes.json().catch(() => ({}));
        const volume = candleData.v?.[0] ?? 0;
        return res.status(200).json({ ...quoteData, volume });
      }
      case 'overview': {
        const [profileRes, metricsRes] = await Promise.all([
          fetch(`${BASE}/stock/profile2?symbol=${symbol}&token=${API_KEY}`),
          fetch(`${BASE}/stock/metric?symbol=${symbol}&metric=all&token=${API_KEY}`),
        ]);
        const profile = await profileRes.json();
        const metrics = await metricsRes.json().catch(() => ({}));
        return res.status(200).json({ ...profile, metrics: metrics.metric || {} });
      }
      case 'candle': {
        // Yahoo Finance for historical data (free, no key)
        const range = (req.query.range as string) || '5d';
        const interval = (req.query.resolution as string) || '1d';
        const yRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`);
        const yData = await yRes.text();
        return res.status(yRes.status === 429 ? 429 : 200).setHeader('Content-Type', 'application/json').send(yData);
      }
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
