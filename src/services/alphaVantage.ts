import { getCached, setCache } from '../utils/cache';
import type { Sp500Quote, DailyData } from '../types';

const LIVE_TTL = 15_000;
const HIST_TTL = 86_400_000;

async function fetchMarketData(fn: string, symbol = 'SPY', extra = ''): Promise<any> {
  const params = new URLSearchParams({ fn, symbol });
  if (extra) params.set('extra', extra);
  const res = await fetch(`/api/market-data?${params}`);
  if (!res.ok) throw new Error(`Market data proxy returned ${res.status}`);
  return res.json();
}

export async function fetchQuote(): Promise<Sp500Quote> {
  const cached = getCached<Sp500Quote>('sp500_quote');
  if (cached) return cached;

  const json = await fetchMarketData('GLOBAL_QUOTE');
  const gq = json['Global Quote'];
  if (!gq || !gq['05. price']) {
    throw new Error('Invalid quote response');
  }
  const quote: Sp500Quote = {
    price: parseFloat(gq['05. price']),
    change: parseFloat(gq['09. change']),
    changePercent: parseFloat(gq['10. change percent'].replace('%', '')),
    open: parseFloat(gq['02. open']),
    volume: parseInt(gq['06. volume'], 10),
    high: parseFloat(gq['03. high']),
    low: parseFloat(gq['04. low']),
    previousClose: parseFloat(gq['08. previous close']),
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

const VALID_RANGES = {
  price: { min: 2000, max: 10000 },
  high52Week: { min: 3000, max: 8000 },
  low52Week: { min: 2000, max: 7000 },
  peRatio: { min: 15, max: 40 },
  dividendYield: { min: 0.5, max: 3 },
};

function validate(value: number, range: { min: number; max: number }, label: string): number | null {
  if (value < range.min || value > range.max) {
    console.warn(`[DataCheck] ${label} = ${value} is outside valid range [${range.min}–${range.max}], using fallback`);
    return null;
  }
  return value;
}

export async function fetchOverview(): Promise<Sp500Overview> {
  const FALLBACK: Sp500Overview = {
    high52Week: 5878,
    low52Week: 4835,
    peRatio: 24.8,
    dividendYield: 1.32,
    marketCap: '48.2T',
    dataSource: 'Fallback (realistic estimates)',
  };

  const cached = getCached<Sp500Overview>('sp500_overview');
  if (cached) return cached;

  try {
    const json = await fetchMarketData('OVERVIEW');
    if (json.Note || !json.Symbol) {
      console.warn('[DataCheck] Alpha Vantage OVERVIEW returned note or empty, using fallback');
      setCache('sp500_overview', FALLBACK, 86_400_000);
      return FALLBACK;
    }

    const rawHigh = parseFloat(json['52WeekHigh']);
    const rawLow = parseFloat(json['52WeekLow']);
    const rawPE = parseFloat(json.PERatio);
    const rawDiv = parseFloat(json.DividendYield);
    const rawMcap = json.MarketCapitalization;

    const high52Week = validate(rawHigh, VALID_RANGES.high52Week, '52W High') ?? FALLBACK.high52Week;
    const low52Week = validate(rawLow, VALID_RANGES.low52Week, '52W Low') ?? FALLBACK.low52Week;
    const peRatio = validate(rawPE, VALID_RANGES.peRatio, 'P/E Ratio') ?? FALLBACK.peRatio;
    const dividendYield = validate(rawDiv, VALID_RANGES.dividendYield, 'Div Yield') ?? FALLBACK.dividendYield;
    let marketCap = FALLBACK.marketCap;
    if (rawMcap) {
      const mcapNum = parseInt(rawMcap, 10);
      if (mcapNum > 1_000_000_000) {
        marketCap = (mcapNum / 1_000_000_000_000).toFixed(1) + 'T';
      }
    }

    const overview: Sp500Overview = {
      high52Week,
      low52Week,
      peRatio,
      dividendYield,
      marketCap,
      dataSource: 'Alpha Vantage (SPY ETF)',
    };

    setCache('sp500_overview', overview, 86_400_000);
    return overview;
  } catch {
    setCache('sp500_overview', FALLBACK, 86_400_000);
    return FALLBACK;
  }
}

export async function fetchUsdCnyRate(): Promise<number> {
  const FALLBACK = 7.25;
  const cached = getCached<number>('usd_cny_rate');
  if (cached) return cached;

  try {
    const json = await fetchMarketData('FX_DAILY', 'USD', '&from_currency=USD&to_currency=CNY');
    const series = json['Time Series FX (Daily)'];
    if (series) {
      const latest = Object.values(series)[0] as Record<string, string>;
      const rate = parseFloat(latest['4. close']);
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

  const json = await fetchMarketData('TIME_SERIES_DAILY', 'SPY', '&outputsize=compact');
  const series = json['Time Series (Daily)'];
  if (!series) {
    throw new Error('Invalid daily response');
  }
  const data: DailyData[] = Object.entries(series)
    .slice(0, 5)
    .map(([date, vals]: [string, unknown]) => ({
      date,
      close: parseFloat((vals as Record<string, string>)['4. close']),
    }))
    .reverse();
  setCache('sp500_daily', data, HIST_TTL);
  return data;
}

export type HistoryRange = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y';

export async function fetchHistory(range: HistoryRange): Promise<DailyData[]> {
  const cacheKey = `sp500_history_${range}`;
  const cached = getCached<DailyData[]>(cacheKey);
  if (cached) return cached;

  let fn: string;
  let extra = '&outputsize=compact';
  let cutoff: Date;

  const now = new Date();
  switch (range) {
    case '1M':
      fn = 'TIME_SERIES_DAILY';
      cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case '3M':
      fn = 'TIME_SERIES_DAILY';
      cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case '6M':
      fn = 'TIME_SERIES_DAILY';
      cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
    case '1Y':
      fn = 'TIME_SERIES_WEEKLY';
      cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case '3Y':
      fn = 'TIME_SERIES_MONTHLY';
      cutoff = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
      break;
    case '5Y':
      fn = 'TIME_SERIES_MONTHLY';
      cutoff = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
      break;
  }

  const json = await fetchMarketData(fn, 'SPY', extra);
  const seriesKey = fn === 'TIME_SERIES_DAILY'
    ? 'Time Series (Daily)'
    : fn === 'TIME_SERIES_WEEKLY'
      ? 'Weekly Time Series'
      : 'Monthly Time Series';
  const series = json[seriesKey];

  if (!series) {
    throw new Error(`Invalid ${fn} response`);
  }

  const data: DailyData[] = Object.entries(series)
    .filter(([date]) => new Date(date) >= cutoff)
    .map(([date, vals]: [string, unknown]) => ({
      date,
      close: parseFloat((vals as Record<string, string>)['4. close']),
    }))
    .reverse();

  setCache(cacheKey, data, HIST_TTL);
  return data;
}
