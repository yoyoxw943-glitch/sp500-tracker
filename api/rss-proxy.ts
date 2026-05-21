import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.query.url as string;

  if (!url) {
    return res.status(400).json({ error: 'Missing url query parameter' });
  }

  // Only allow known RSS domains
  const allowed = [
    'investopedia.com',
    'morningstar.com',
    'etf.com',
    'awealthofcommonsense.com',
  ];

  const hostname = new URL(url).hostname;
  if (!allowed.some((d) => hostname.endsWith(d))) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'S&P500-Tracker/1.0 (RSS Reader)' },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Upstream returned ${response.status}` });
    }

    const text = await response.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Cache for 1 hour on Vercel's edge
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(text);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to fetch RSS feed' });
  }
}
