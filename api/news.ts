import type { VercelRequest, VercelResponse } from '@vercel/node';

const BASE = 'https://newsapi.org/v2';
const API_KEY = process.env.NEWS_API_KEY || process.env.VITE_NEWS_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'News API key not configured on server' });
  }

  const q = (req.query.q as string) || 'S&P 500 market';
  const pageSize = (req.query.pageSize as string) || '50';
  const from = req.query.from as string | undefined;

  let url = `${BASE}/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=${pageSize}&language=en&apiKey=${API_KEY}`;
  if (from) {
    url += `&from=${encodeURIComponent(from)}`;
  }

  try {
    const upstreamRes = await fetch(url);
    const data = await upstreamRes.text();
    return res.status(200).setHeader('Content-Type', 'application/json').send(data);
  } catch {
    return res.status(502).json({ error: 'Upstream fetch failed' });
  }
}
