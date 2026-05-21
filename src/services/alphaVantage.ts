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

function toTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
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

  const to = new Date();
  const from = new Date(to.getTime() - 7 * 86400000); // 7 days back
  const json = await fetchMarketData('candle', {
    symbol: 'SPY',
    resolution: 'D',
    from: String(toTimestamp(from)),
    to: String(toTimestamp(to)),
  });

  if (json.s !== 'ok' || !json.t) {
    throw new Error('Invalid candle response');
  }

  const data: DailyData[] = json.t
    .slice(-5)
    .map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      close: json.c?.[json.t.length - 5 + i] ?? 0,
    }));
  setCache('sp500_daily', data, HIST_TTL);
  return data;
}

export type HistoryRange = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y';

export async function fetchHistory(range: HistoryRange): Promise<DailyData[]> {
  const cacheKey = `sp500_history_${range}`;
  const cached = getCached<DailyData[]>(cacheKey);
  if (cached) return cached;

  const to = new Date();
  const from = new Date();
  let resolution: string;

  switch (range) {
    case '1M':
      from.setMonth(from.getMonth() - 1);
      resolution = 'D';
      break;
    case '3M':
      from.setMonth(from.getMonth() - 3);
      resolution = 'D';
      break;
    case '6M':
      from.setMonth(from.getMonth() - 6);
      resolution = 'D';
      break;
    case '1Y':
      from.setFullYear(from.getFullYear() - 1);
      resolution = 'W';
      break;
    case '3Y':
      from.setFullYear(from.getFullYear() - 3);
      resolution = 'W';
      break;
    case '5Y':
      from.setFullYear(from.getFullYear() - 5);
      resolution = 'M';
      break;
  }

  const json = await fetchMarketData('candle', {
    symbol: 'SPY',
    resolution,
    from: String(toTimestamp(from)),
    to: String(toTimestamp(to)),
  });

  if (json.s !== 'ok' || !json.t) {
    throw new Error('Invalid candle response');
  }

  const data: DailyData[] = json.t.map((ts: number, i: number) => ({
    date: new Date(ts * 1000).toISOString().split('T')[0],
    close: json.c?.[i] ?? 0,
  }));
  setCache(cacheKey, data, HIST_TTL);
  return data;
}
