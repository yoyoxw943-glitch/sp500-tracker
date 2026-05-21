import { getCached, setCache } from '../utils/cache';
import type { NewsArticle } from '../types';

const TTL = 900_000; // 15 minutes

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Macro: ['economy', 'gdp', 'inflation', 'jobs', 'unemployment', 'macro'],
  Earnings: ['earnings', 'revenue', 'profit', 'quarterly', 'report'],
  Tech: ['tech', 'apple', 'microsoft', 'google', 'amazon', 'nvidia', 'ai', 'software'],
  Fed: ['fed', 'federal reserve', 'interest rate', 'powell', 'fomc', 'monetary'],
  ETF: ['etf', 'voo', 'spy', 'ivv', 'index fund', 'exchange traded'],
  Index: ['s&p', 'sp500', 'sp 500', 'dow', 'nasdaq', 'index', 'market'],
};

function classifyArticle(title: string, description: string): NewsArticle['category'] {
  const text = (title + ' ' + (description || '')).toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) return cat as NewsArticle['category'];
  }
  return 'Macro';
}

// ── NewsAPI via server-side proxy (works on Vercel, blocked locally in China) ──
async function fetchNewsFromAPI(): Promise<NewsArticle[]> {
  const res = await fetch('/api/news?q=S%26P+500+market&pageSize=50');
  if (!res.ok) throw new Error(`News proxy returned ${res.status}`);
  const json = await res.json();
  if (json.status === 'error') throw new Error(json.message || 'News API error');
  return (json.articles || []).map((a: { title: string; source: { name: string }; publishedAt: string; url: string; description?: string }) => ({
    title: a.title,
    source: a.source.name || 'Unknown',
    publishedAt: a.publishedAt,
    url: a.url,
    category: classifyArticle(a.title, a.description || ''),
    description: a.description,
  }));
}

// ── RSS fallback via proxy (works when NewsAPI is unreachable) ──
async function fetchNewsFromRSS(): Promise<NewsArticle[]> {
  const RSS_SOURCES = [
    { url: 'https://www.investopedia.com/rss/articles.aspx', name: 'Investopedia' },
    { url: 'https://www.morningstar.com/rss/articles', name: 'Morningstar' },
    { url: 'https://www.etf.com/rss', name: 'ETF.com' },
  ];

  const all: NewsArticle[] = [];

  for (const src of RSS_SOURCES) {
    try {
      const proxyUrl = `/api/rss-proxy?url=${encodeURIComponent(src.url)}`;
      const rssRes = await fetch(proxyUrl);
      if (!rssRes.ok) continue;
      const xml = await rssRes.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const content = match[1];
        const title = content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || content.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const description = content.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)?.[1] || content.match(/<description>(.*?)<\/description>/)?.[1] || '';
        const pubDate = content.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
        const link = content.match(/<link>(.*?)<\/link>/)?.[1] || '#';
        const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
        const cleanDesc = description.replace(/<[^>]*>/g, '').trim();
        if (cleanTitle) {
          all.push({
            title: cleanTitle,
            source: src.name,
            publishedAt: pubDate,
            url: link,
            category: classifyArticle(cleanTitle, cleanDesc),
            description: cleanDesc,
          });
        }
      }
    } catch { /* skip unavailable source */ }
  }

  return all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

// ── Mock data (last resort) ──
function getMockNews(): NewsArticle[] {
  return [
    { title: 'Markets Await Fed Decision on Rates', source: 'Reuters', publishedAt: new Date().toISOString(), url: '#', category: 'Fed', description: 'Investors await the Federal Reserve decision on interest rates amid mixed economic signals.' },
    { title: 'S&P 500 Hits New Record on Tech Rally', source: 'Bloomberg', publishedAt: new Date().toISOString(), url: '#', category: 'Index', description: 'The S&P 500 reached a new all-time high driven by strong tech sector performance.' },
    { title: 'Nvidia Earnings Beat Expectations', source: 'CNBC', publishedAt: new Date().toISOString(), url: '#', category: 'Earnings', description: 'Nvidia reported quarterly earnings significantly above analyst estimates.' },
    { title: 'ETF Flows Hit Monthly Record as Investors Pile Into Passive Funds', source: 'Morningstar', publishedAt: new Date().toISOString(), url: '#', category: 'ETF', description: 'Passive investing continues to gain share as ETF inflows reach new highs.' },
    { title: 'AI Boom Drives Tech Sector to New Heights', source: 'Financial Times', publishedAt: new Date().toISOString(), url: '#', category: 'Tech', description: 'Artificial intelligence investments continue to reshape the technology landscape.' },
  ];
}

export async function fetchNews(): Promise<NewsArticle[]> {
  const cached = getCached<NewsArticle[]>('sp500_news');
  if (cached) return cached;

  // Try NewsAPI proxy first (works on Vercel, blocked in China for local dev)
  try {
    const articles = await fetchNewsFromAPI();
    if (articles.length > 0) {
      setCache('sp500_news', articles, TTL);
      return articles;
    }
  } catch { /* fall through */ }

  // Try RSS feeds as fallback (works everywhere via proxy)
  try {
    const rssArticles = await fetchNewsFromRSS();
    if (rssArticles.length > 0) {
      setCache('sp500_news', rssArticles, TTL);
      return rssArticles;
    }
  } catch { /* fall through */ }

  // Last resort: mock data
  const mock = getMockNews();
  setCache('sp500_news', mock, TTL);
  return mock;
}
