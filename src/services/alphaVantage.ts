import { getCached, setCache } from '../utils/cache';
import type { Sp500Quote, DailyData } from '../types';

const LIVE_TTL = 15_000;
const HIST_TTL = 86_400_000;

async function fetchMarketData(fn: string, extra: Record<string, string> = {}): Promise<any> {
  const params = new URLSearchParams({ fn, ...extra });
  const res = await fetch(`/api/market-data?${params}`);
  if (!res.ok) throw new Error(`Market data proxy returned ${res.status}`);
  return res.json();
}

function parseYahooCandle(json: any): DailyData[] | null {
  const result = json.chart?.result?.[0];
  if (!result?.timestamp) return null;
  return result.timestamp.map((ts: number, i: number) => ({
    date: new Date(ts * 1000).toISOString().split('T')[0],
    close: result.indicators?.quote?.[0]?.close?.[i] ?? 0,
  })).filter((d: DailyData) => d.close > 0);
}

function generateMockCandle(days: number, intervalDays: number, basePrice: number): DailyData[] {
  const data: DailyData[] = [];
  const now = new Date();
  let price = basePrice;
  for (let i = days; i >= 0; i -= intervalDays) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    price = price * (1 + (Math.random() - 0.48) * 0.02);
    data.push({ date: d.toISOString().split('T')[0], close: Math.round(price * 100) / 100 });
  }
  return data;
}

export async function fetchQuote(): Promise<Sp500Quote> {
  const cached = getCached<Sp500Quote>('sp500_quote');
  if (cached) return cached;

  const json = await fetchMarketData('quote', { symbol: 'SPY' });
  if (json.error || json.c == null) {
    throw new Error('Invalid quote response');
  }
  const quote: Sp500Quote = {
    price: json.c,
    change: json.c - json.pc,
    changePercent: ((json.c - json.pc) / json.pc) * 100,
    open: json.o,
    volume: 0,
    high: json.h,
    low: json.l,
    previousClose: json.pc,
    lastUpdated: new Date().toISOString(),
  };
  setCache('sp500_quote', quote, LIVE_TTL);
  return quote;
}

export interface Sp500Overview {
  high52Week: number;
  low52Week: number;
  peRatio: number;
  dividendYield: number;
  marketCap: string;
  dataSource: string;
}

const FALLBACK_OVERVIEW: Sp500Overview = {
  high52Week: 5878,
  low52Week: 4835,
  peRatio: 24.8,
  dividendYield: 1.32,
  marketCap: '48.2T',
  dataSource: 'Fallback (realistic estimates)',
};

export async function fetchOverview(): Promise<Sp500Overview> {
  const cached = getCached<Sp500Overview>('sp500_overview');
  if (cached) return cached;

  try {
    const json = await fetchMarketData('overview', { symbol: 'SPY' });
    const m = json.metrics || {};
    if (!json.name && !m['52WeekHigh']) throw new Error('No data');

    let marketCap = FALLBACK_OVERVIEW.marketCap;
    if (json.marketCapitalization) {
      // Finnhub returns market cap in million USD
      const mcapB = json.marketCapitalization / 1000;
      marketCap = mcapB >= 1 ? mcapB.toFixed(1) + 'T' : (json.marketCapitalization / 1000).toFixed(0) + 'B';
    }

    const overview: Sp500Overview = {
      high52Week: m['52WeekHigh'] ?? FALLBACK_OVERVIEW.high52Week,
      low52Week: m['52WeekLow'] ?? FALLBACK_OVERVIEW.low52Week,
      peRatio: m.peBasicExclExtraTTM ?? FALLBACK_OVERVIEW.peRatio,
      dividendYield: m.dividendYieldIndicatedAnnual ?? FALLBACK_OVERVIEW.dividendYield,
      marketCap,
      dataSource: 'Finnhub (SPY ETF)',
    };
    setCache('sp500_overview', overview, HIST_TTL);
    return overview;
  } catch {
    setCache('sp500_overview', FALLBACK_OVERVIEW, HIST_TTL);
    return FALLBACK_OVERVIEW;
  }
}

export async function fetchUsdCnyRate(): Promise<number> {
  const FALLBACK = 7.25;
  const cached = getCached<number>('usd_cny_rate');
  if (cached) return cached;

  try {
    const json = await fetchMarketData('fx');
    if (json.quote && json.quote.CNY) {
      const rate = json.quote.CNY;
      if (rate > 0) {
        setCache('usd_cny_rate', rate, 3_600_000);
        return rate;
      }
    }
  } catch { /* fall through */ }
  setCache('usd_cny_rate', FALLBACK, 3_600_000);
  return FALLBACK;
}

export async function fetchDaily(): Promise<DailyData[]> {
  const cached = getCached<DailyData[]>('sp500_daily');
  if (cached) return cached;

  try {
    const json = await fetchMarketData('candle', { symbol: 'SPY', range: '5d', resolution: '1d' });
    const parsed = parseYahooCandle(json);
    if (parsed && parsed.length > 0) {
      const data = parsed.slice(-5);
      setCache('sp500_daily', data, HIST_TTL);
      return data;
    }
  } catch { /* fall through to mock */ }

  // Fallback: mock 5-day data (local dev behind firewall)
  const quote = getCached<Sp500Quote>('sp500_quote');
  const data = generateMockCandle(5, 1, quote?.price ?? 740);
  setCache('sp500_daily', data, 300_000); // 5 min cache for mock
  return data;
}

export type HistoryRange = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y';

const HISTORY_CONFIG: Record<HistoryRange, { yRange: string; resolution: string }> = {
  '1M':  { yRange: '1mo', resolution: '1d' },
  '3M':  { yRange: '3mo', resolution: '1d' },
  '6M':  { yRange: '6mo', resolution: '1d' },
  '1Y':  { yRange: '1y',  resolution: '1wk' },
  '3Y':  { yRange: '3y',  resolution: '1wk' },
  '5Y':  { yRange: '5y',  resolution: '1mo' },
};

const MOCK_DAYS: Record<HistoryRange, number> = {
  '1M': 22, '3M': 66, '6M': 130, '1Y': 52, '3Y': 156, '5Y': 60,
};

export async function fetchHistory(range: HistoryRange): Promise<DailyData[]> {
  const cacheKey = `sp500_history_${range}`;
  const cached = getCached<DailyData[]>(cacheKey);
  if (cached) return cached;

  try {
    const config = HISTORY_CONFIG[range];
    const json = await fetchMarketData('candle', {
      symbol: 'SPY',
      range: config.yRange,
      resolution: config.resolution,
    });
    const parsed = parseYahooCandle(json);
    if (parsed && parsed.length > 0) {
      setCache(cacheKey, parsed, HIST_TTL);
      return parsed;
    }
  } catch { /* fall through to mock */ }

  // Fallback: mock data for local dev behind firewall
  const quote = getCached<Sp500Quote>('sp500_quote');
  const data = generateMockCandle(MOCK_DAYS[range], 1, quote?.price ?? 740);
  setCache(cacheKey, data, 300_000);
  return data;
}
