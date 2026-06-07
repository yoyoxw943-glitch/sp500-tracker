import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchQuote, fetchDaily, fetchOverview, fetchVix } from '../services/alphaVantage';
import type { Sp500Overview, VixData } from '../services/alphaVantage';
import { useCountdown } from '../hooks/useCountdown';
import { formatCurrency, formatPercent, formatLargeNumber } from '../utils/formatters';
import type { Sp500Quote, DailyData } from '../types';
import { ChartSkeleton, LineSkeleton } from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';

export default function LivePage() {
  const [quote, setQuote] = useState<Sp500Quote | null>(null);
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [overview, setOverview] = useState<Sp500Overview | null>(null);
  const [vix, setVix] = useState<VixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [q, d, ov] = await Promise.all([fetchQuote(), fetchDaily(), fetchOverview()]);
      setQuote(q);
      setDaily(d);
      setOverview(ov);
      setLoading(false);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetchVix()
      .then(setVix)
      .catch(() => {});
  }, []);

  const { remaining } = useCountdown(30, fetchData);

  if (loading) return <div className="space-y-5"><LineSkeleton lines={2} /><ChartSkeleton /><LineSkeleton lines={4} /></div>;
  if (error && !quote) return <ErrorState message={error} onRetry={fetchData} />;

  const changeColor = quote && quote.change >= 0 ? 'value-up' : 'value-down';
  const metrics = quote ? [
    { label: 'Open', value: formatCurrency(quote.open) },
    { label: 'Prev Close', value: formatCurrency(quote.previousClose) },
    { label: 'Day High', value: formatCurrency(quote.high) },
    { label: 'Day Low', value: formatCurrency(quote.low) },
    { label: 'Volume', value: formatLargeNumber(quote.volume), wide: true },
  ] : [];

  const now = new Date();
  const timeStr = quote?.lastUpdated
    ? new Date(quote.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="section-heading">S&P 500 Live</h2>
        <p className="text-min text-slate-500 mt-1">
          Updated {timeStr} · Refresh in {remaining}s
        </p>
      </div>

      {/* Price Card */}
      <div className="card">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-min text-slate-500 mb-1.5">Current Price</p>
            <p className="stat-mega tabular-nums tracking-tight">{quote ? formatCurrency(quote.price) : '--'}</p>
          </div>
          <div className="text-right">
            <p className={`text-[1.75rem] font-bold tabular-nums ${changeColor}`}>
              {quote ? (quote.change >= 0 ? '+' : '') + quote.change.toFixed(2) : '--'}
            </p>
            <p className={`text-xl font-semibold mt-0.5 ${changeColor}`}>
              {quote ? formatPercent(quote.changePercent) : '--'}
            </p>
          </div>
        </div>
      </div>

      {/* 5-day Chart */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-3 text-[#0369A1] dark:text-[#F8FAFC]">5-Day Trend</h3>
        <div aria-label={`S&P 500 5-day price chart. Current price: ${quote?.price ?? 'N/A'}`}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={daily}>
              <XAxis dataKey="date" tick={{ fontSize: 14, fill: '#64748B' }} stroke="#BAE6FD" tickFormatter={(d) => d.slice(5)} interval={0} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 14, fill: '#64748B' }} stroke="#BAE6FD" width={55} />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '12px', fontSize: '15px', color: '#0F172A' }} formatter={(v) => [formatCurrency(Number(v)), 'Close']} />
              <Line type="monotone" dataKey="close" stroke="#0EA5E9" strokeWidth={2.5} dot={{ r: 4, fill: '#0EA5E9' }} activeDot={{ r: 6, fill: '#0369A1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className={`card ${(m as any).wide ? 'col-span-2' : ''}`}>
            <p className="text-min text-slate-500 mb-1">{m.label}</p>
            <p className={`${(m as any).wide ? 'stat-large' : 'data-label'} tabular-nums`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Market Stats */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-[#0369A1] dark:text-[#F8FAFC]">Market Stats</h3>
          {overview && (
            <span className="text-xs text-slate-500 bg-[#0EA5E9]/10 px-2 py-0.5 rounded-full">{overview.dataSource}</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-min text-slate-500 mb-1">52-Week High</p>
            <p className="data-label value-up">{overview ? formatCurrency(overview.high52Week) : '$5,878'}</p>
          </div>
          <div>
            <p className="text-min text-slate-500 mb-1">52-Week Low</p>
            <p className="data-label value-down">{overview ? formatCurrency(overview.low52Week) : '$4,835'}</p>
          </div>
          <div>
            <p className="text-min text-slate-500 mb-1">P/E Ratio</p>
            <p className="data-label">{overview ? overview.peRatio.toFixed(1) : '24.8'}</p>
          </div>
          <div>
            <p className="text-min text-slate-500 mb-1">Div Yield</p>
            <p className="data-label">{overview ? overview.dividendYield.toFixed(2) + '%' : '1.32%'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-min text-slate-500 mb-1">Total Market Cap</p>
            <p className="data-label">${overview?.marketCap || '48.2T'}</p>
          </div>
        </div>
      </div>

      {/* VIX */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4 text-[#0369A1] dark:text-[#F8FAFC]">VIX (Volatility Index)</h3>
        {vix ? (
          <>
            <div className="flex items-center gap-5">
              <div className="flex-1">
                <p className="text-min text-slate-500">Often called the "fear index" — measures expected S&P 500 volatility over the next 30 days</p>
                <p className="text-sm text-slate-400 mt-0.5">See <a href="/history" className="text-[#0EA5E9] underline">History page</a> for all-time VIX data since 1993</p>
              </div>
              <div className="text-center shrink-0">
                <p className="stat-mega tabular-nums">{vix.value.toFixed(2)}</p>
                <p className={`text-min tabular-nums mt-1 ${vix.change >= 0 ? 'value-up' : 'value-down'}`}>
                  {vix.change >= 0 ? '+' : ''}{vix.change.toFixed(2)} ({vix.changePercent >= 0 ? '+' : ''}{vix.changePercent.toFixed(2)}%)
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
              <p><strong className="text-slate-600 dark:text-slate-300">VIX</strong> — The CBOE Volatility Index. Below 12 is calm, 12–20 is normal, 20–30 is elevated, and above 30 signals high fear.</p>
            </div>
          </>
        ) : (
          <p className="text-min text-slate-400">VIX data unavailable</p>
        )}
      </div>
    </div>
  );
}
