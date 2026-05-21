import { getCached, setCache } from '../utils/cache';
import { summarizeArticle, filterRelevant } from './deepseek';
import type { KnowledgeArticle, ReadingArticle } from '../types';

const TTL = 86_400_000; // 24 hours

const RSS_SOURCES: { url: string; name: string }[] = [
  { url: 'https://www.investopedia.com/rss/articles.aspx', name: 'Investopedia' },
  { url: 'https://www.morningstar.com/rss/articles', name: 'Morningstar' },
  { url: 'https://www.etf.com/rss', name: 'ETF.com' },
  { url: 'https://awealthofcommonsense.com/feed', name: 'A Wealth of Common Sense' },
];

async function fetchRSSInternal(url: string): Promise<string> {
  const proxyUrl = `/api/rss-proxy?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  return res.text();
}

function parseRSSItems(xml: string): { title: string; description: string; pubDate: string; link: string }[] {
  const items: { title: string; description: string; pubDate: string; link: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || content.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const description = content.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)?.[1] || content.match(/<description>(.*?)<\/description>/)?.[1] || '';
    const pubDate = content.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    const link = content.match(/<link>(.*?)<\/link>/)?.[1] || '';
    if (title) items.push({ title: stripHtml(title), description: stripHtml(description), pubDate, link });
  }
  return items;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export async function fetchKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  const cached = getCached<KnowledgeArticle[]>('knowledge_articles');
  if (cached) return cached;

  const concepts = [
    { concept: 'Index Fund', investopediaSearch: 'index fund basics' },
    { concept: 'ETF', investopediaSearch: 'etf basics' },
    { concept: 'Expense Ratio', investopediaSearch: 'expense ratio' },
    { concept: 'Dollar Cost Averaging', investopediaSearch: 'dollar cost averaging' },
    { concept: 'Compound Interest', investopediaSearch: 'compound interest' },
    { concept: 'Drawdown', investopediaSearch: 'drawdown investing' },
    { concept: 'Rebalancing', investopediaSearch: 'portfolio rebalancing' },
    { concept: 'Dividend Reinvestment', investopediaSearch: 'dividend reinvestment drip' },
  ];

  // Use Investopedia RSS as primary source, fall back to mock data
  try {
    const xml = await fetchRSSInternal('https://www.investopedia.com/rss/articles.aspx');
    const items = parseRSSItems(xml);
    const articles: KnowledgeArticle[] = items.slice(0, 12).map((item) => ({
      title: item.title,
      source: 'Investopedia',
      publishedAt: item.pubDate || new Date().toISOString(),
      url: item.link,
      readTime: `${Math.max(3, Math.ceil(item.description.length / 1200))} min read`,
      summary: '',
      concept: concepts[Math.floor(Math.random() * concepts.length)].concept,
    }));
    setCache('knowledge_articles', articles, TTL);
    return articles;
  } catch {
    // Fallback mock data
    const articles: KnowledgeArticle[] = concepts.map((c) => ({
      title: `Understanding ${c.concept} for Beginner Investors`,
      source: 'Investopedia',
      publishedAt: new Date().toISOString(),
      url: `https://www.investopedia.com/search?q=${encodeURIComponent(c.investopediaSearch)}`,
      readTime: '5 min read',
      summary: `Learn about ${c.concept.toLowerCase()} and how it affects your long-term investment strategy.`,
      concept: c.concept,
    }));
    setCache('knowledge_articles', articles, TTL);
    return articles;
  }
}

export async function fetchCuratedReading(): Promise<ReadingArticle[]> {
  const cached = getCached<ReadingArticle[]>('curated_reading');
  if (cached) return cached;

  const allItems: ReadingArticle[] = [];

  for (const source of RSS_SOURCES) {
    try {
      const xml = await fetchRSSInternal(source.url);
      const items = parseRSSItems(xml);
      for (const item of items.slice(0, 8)) {
        // Filter for relevance using keyword matching (DeepSeek as optional enhancement)
        const text = (item.title + ' ' + item.description).toLowerCase();
        const relevant = ['index fund', 'etf', 's&p', 'sp500', 'passive invest', 'dca', 'dollar cost', 'long-term', 'portfolio', 'voo', 'spy', 'ivv'].some((k) => text.includes(k));
        if (relevant) {
          allItems.push({
            title: item.title,
            source: source.name,
            date: item.pubDate || new Date().toISOString(),
            url: item.link,
            summary: item.description.slice(0, 200),
            sourceLogo: source.name,
          });
        }
      }
    } catch {
      // Skip unavailable sources
    }
  }

  const sorted = allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  setCache('curated_reading', sorted, TTL);
  return sorted;
}
