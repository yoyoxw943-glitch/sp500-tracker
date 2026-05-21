import { getCached, setCache } from '../utils/cache';
import type { NewsArticle } from '../types';

const API_KEY = import.meta.env.VITE_NEWS_API_KEY || '';
const BASE = 'https://newsapi.org/v2';
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

export async function fetchNews(): Promise<NewsArticle[]> {
  const cached = getCached<NewsArticle[]>('sp500_news');
  if (cached) return cached;

  if (!API_KEY || API_KEY === 'your_news_api_key_here') {
    // Return mock data when no key
    const mockArticles: NewsArticle[] = [
      { title: 'Markets Await Fed Decision on Rates', source: 'Reuters', publishedAt: new Date().toISOString(), url: '#', category: 'Fed', description: 'Investors await the Federal Reserve decision on interest rates.' },
      { title: 'S&P 500 Hits New Record on Tech Rally', source: 'Bloomberg', publishedAt: new Date().toISOString(), url: '#', category: 'Index', description: 'The S&P 500 reached a new all-time high.' },
      { title: 'Nvidia Earnings Beat Expectations', source: 'CNBC', publishedAt: new Date().toISOString(), url: '#', category: 'Earnings', description: 'Nvidia reported quarterly earnings above analyst estimates.' },
    ];
    setCache('sp500_news', mockArticles, TTL);
    return mockArticles;
  }

  try {
    const res = await fetch(`${BASE}/everything?q=S%26P+500+market&sortBy=publishedAt&pageSize=50&language=en&apiKey=${API_KEY}`);
    const json = await res.json();
    if (json.status === 'error') throw new Error(json.message);
    const articles: NewsArticle[] = (json.articles || []).map((a: { title: string; source: { name: string }; publishedAt: string; url: string; description?: string }) => ({
      title: a.title,
      source: a.source.name || 'Unknown',
      publishedAt: a.publishedAt,
      url: a.url,
      category: classifyArticle(a.title, a.description || ''),
      description: a.description,
    }));
    setCache('sp500_news', articles, TTL);
    return articles;
  } catch {
    const cached = getCached<NewsArticle[]>('sp500_news');
    return cached || [];
  }
}
