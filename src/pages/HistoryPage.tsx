import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HISTORICAL_RETURNS } from '../utils/calculations';
import { fetchHistory, fetchVixHistory, type HistoryRange } from '../services/alphaVantage';
import type { DailyData } from '../types';

type Range = '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | '10Y' | '20Y' | '30Y' | 'ALL';
const ALL_RANGES: Range[] = ['1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', '10Y', '20Y', '30Y', 'ALL'];
const SHORT_RANGES: Range[] = ['1W', '1M', '3M', '6M'];
const YEAR_RANGES: Range[] = ['1Y', '3Y'];
const LONG_RANGES: Range[] = ['5Y', '10Y', '20Y', '30Y', 'ALL'];

const BEAR_MARKETS = [
  { title: '2000 Dot-Com Crash', peak: 'Mar 2000', trough: 'Oct 2002', decline: '-49%', recovery: '49 months', lesson: 'Valuations matter — even great companies can be terrible investments if you overpay.' },
  { title: '2008 Financial Crisis', peak: 'Oct 2007', trough: 'Mar 2009', decline: '-57%', recovery: '37 months', lesson: 'Diversification and staying the course matter — those who kept buying came out far ahead.' },
  { title: '2020 COVID Crash', peak: 'Feb 2020', trough: 'Mar 2020', decline: '-34%', recovery: '5 months', lesson: 'The market rewards patience — the fastest crashes often bring the fastest recoveries.' },
];

export default function HistoryPage() {
  const [range, setRange] = useState<Range>('20Y');
  const [showBear, setShowBear] = useState(false);
  const [chartData, setChartData] = useState<{ date: string; price: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [vixHistory, setVixHistory] = useState<DailyData[]>([]);

  const vixAnnual = useMemo(() => {
    if (vixHistory.length === 0) return [];
    const byYear: Record<number, { sum: number; count: number }> = {};
    for (const d of vixHistory) {
      const year = new Date(d.date).getFullYear();
      if (!byYear[year]) byYear[year] = { sum: 0, count: 0 };
      byYear[year].sum += d.close;
      byYear[year].count++;
    }
    return Object.entries(byYear)
      .map(([year, { sum, count }]) => ({ year: Number(year), value: Math.round(sum / count * 100) / 100 }))
      .sort((a, b) => a.year - b.year);
  }, [vixHistory]);

  const annualData = useMemo(() => {
    const now = new Date().getFullYear();
    if (range === '1Y') return HISTORICAL_RETURNS.filter((d) => d.year >= now - 1);
    if (range === '3Y') return HISTORICAL_RETURNS.filter((d) => d.year >= now - 3);
    if (range === '5Y') return HISTORICAL_RETURNS.filter((d) => d.year >= now - 5);
    if (range === '10Y') return HISTORICAL_RETURNS.filter((d) => d.year >= now - 10);
    if (range === '20Y') return HISTORICAL_RETURNS.filter((d) => d.year >= now - 20);
    if (range === '30Y') return HISTORICAL_RETURNS.filter((d) => d.year >= now - 30);
    if (range === 'ALL') return HISTORICAL_RETURNS;
    return HISTORICAL_RETURNS.filter((d) => d.year >= now - 3);
  }, [range]);

  const trailingReturn = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].price;
    const last = chartData[chartData.length - 1].price;
    return ((last - first) / first) * 100;
  }, [chartData]);

  useEffect(() => {
    let cancelled = false;
    setChartLoading(true);
    fetchHistory(range as HistoryRange)
      .then((result) => {
        if (!cancelled) {
          setChartData(result.map(d => ({ date: d.date, price: d.close })));
          setChartLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setChartLoading(false);
      });
    return () => { cancelled = true; };
  }, [range]);

  useEffect(() => {
    fetchVixHistory()
      .then(setVixHistory)
      .catch(() => {});
  }, []);

  const isShortRange = SHORT_RANGES.includes(range);
  const isYearRange = YEAR_RANGES.includes(range);

  const positivePct = useMemo(() => {
    // For short/year ranges there are too few data points — use full history
    const dataset = isShortRange || isYearRange ? HISTORICAL_RETURNS : annualData;
    return ((dataset.filter((d) => d.return > 0).length / dataset.length) * 100).toFixed(0);
  }, [range, annualData, isShortRange, isYearRange]);

  const rangeLabel = range === 'ALL' ? 'All (1928+)' : range === '1W' ? '1 Week' : range === '1M' ? '1 Month' : range === '3M' ? '3 Months' : range === '6M' ? '6 Months' : range === '1Y' ? '1 Year' : range === '3Y' ? '3 Years' : range === '5Y' ? '5 Years' : range === '10Y' ? '10 Years' : range === '20Y' ? '20 Years' : range === '30Y' ? '30 Years' : range;

  return (
    <div className="space-y-5">
      <h2 className="section-heading">Historical Returns</h2>

      {/* Unified Time Frame Selector */}
      <div className="flex gap-1 bg-[#0EA5E9]/10 rounded-xl p-1 w-fit flex-wrap">
        {ALL_RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`touch-target px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              range === r ? 'bg-[#0EA5E9] text-white shadow-lg' : 'text-slate-500 hover:text-[#0F172A] dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Returns Display */}
      {isShortRange ? (
        <div className="card">
          <h3 className="text-xl font-semibold mb-3 text-[#0369A1] dark:text-[#F8FAFC]">Trailing Return — {rangeLabel}</h3>
          {chartLoading ? (
            <div className="text-center py-10 text-slate-400">Loading...</div>
          ) : trailingReturn != null ? (
            <div className="text-center py-6">
              <p className={`stat-mega ${trailingReturn >= 0 ? 'value-up' : 'value-down'}`}>
                {trailingReturn >= 0 ? '+' : ''}{trailingReturn.toFixed(2)}%
              </p>
              <p className="text-min text-slate-500 mt-2">
                {chartData.length > 0 && (
                  <>From {chartData[0].date} to {chartData[chartData.length - 1].date}</>
                )}
              </p>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">No data available</div>
          )}
        </div>
      ) : (
        <div className="card grid-lines">
          <h3 className="text-xl font-semibold mb-1 text-[#0369A1] dark:text-[#F8FAFC]">Annual Returns — {rangeLabel}</h3>
          <p className="text-sm text-slate-400 mb-3">S&P 500 index returns (SPY tracks this index)</p>
          {annualData.length > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={annualData}>
                <XAxis dataKey="year" tick={{ fontSize: 13, fill: '#64748B' }} stroke="#BAE6FD" interval={range === 'ALL' ? 9 : range === '30Y' ? 2 : 0} />
                <YAxis tick={{ fontSize: 14, fill: '#64748B' }} stroke="#BAE6FD" tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '12px', fontSize: '15px', color: '#0F172A' }} formatter={(v) => [`${Number(v).toFixed(2)}%`, 'Return']} labelFormatter={(l) => `Year: ${l}`} />
                <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                  {annualData.map((entry, i) => (
                    <Cell key={i} fill={entry.return >= 0 ? '#16A34A' : '#DC2626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-slate-400">No data for this range</div>
          )}
        </div>
      )}

      {/* VIX All-Time History */}
      {vixAnnual.length > 1 && (
        <div className="card grid-lines">
          <h3 className="text-xl font-semibold mb-1 text-[#0369A1] dark:text-[#F8FAFC]">VIX Annual Average — Since 1993</h3>
          <p className="text-sm text-slate-400 mb-3">CBOE Volatility Index yearly average close</p>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={vixAnnual}>
              <XAxis dataKey="year" tick={{ fontSize: 13, fill: '#64748B' }} stroke="#BAE6FD" interval={1} />
              <YAxis tick={{ fontSize: 14, fill: '#64748B' }} stroke="#BAE6FD" width={35} />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '12px', fontSize: '15px', color: '#0F172A' }} formatter={(v: any) => [Number(v).toFixed(2), 'VIX']} labelFormatter={(l: any) => `Year: ${l}`} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {vixAnnual.map((entry, i) => (
                  <Cell key={i} fill={entry.value >= 25 ? '#DC2626' : entry.value >= 20 ? '#f59e0b' : '#16A34A'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* S&P 500 Price History Chart */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-3 text-[#0369A1] dark:text-[#F8FAFC]">SPY Price History — {rangeLabel}</h3>

        <div aria-label={`S&P 500 price chart for ${range} range`}>
          {chartLoading && <div className="text-center py-10 text-slate-400">Loading market data...</div>}
          {!chartLoading && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 13, fill: '#64748B' }} stroke="#BAE6FD" tickFormatter={(d) => {
                const date = new Date(d);
                if (range === '1W' || range === '1M' || range === '3M' || range === '6M') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }} interval={range === '30Y' || range === 'ALL' ? 23 : range === '20Y' ? 17 : range === '10Y' ? 11 : range === '5Y' ? 5 : range === '3Y' ? 5 : range === '6M' || range === '1Y' ? 9 : 'preserveStartEnd'} />
              <YAxis tick={{ fontSize: 14, fill: '#64748B' }} stroke="#BAE6FD" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={55} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '12px', fontSize: '15px', color: '#0F172A' }}
                formatter={(v) => [formatCurrency(Number(v)), 'Price']}
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Area type="monotone" dataKey="price" fill="url(#lineGradient)" stroke="none" />
              <Line type="monotone" dataKey="price" stroke="#0EA5E9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-semibold mb-4 text-[#0369A1] dark:text-[#F8FAFC]">Summary Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-min text-slate-500 mb-1">30-Year Avg Return</p><p className="data-label value-up">10.5%</p></div>
          <div><p className="text-min text-slate-500 mb-1">50-Year Avg Return</p><p className="data-label value-up">10.7%</p></div>
          <div><p className="text-min text-slate-500 mb-1">Inflation-Adjusted Avg</p><p className="data-label value-up">7.2%</p></div>
          <div><p className="text-min text-slate-500 mb-1">Positive Years</p><p className="data-label value-up">{positivePct}%</p></div>
        </div>
      </div>

      <div>
        <button onClick={() => setShowBear(!showBear)} className="touch-target w-full text-left card flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#0369A1] dark:text-[#F8FAFC]">Bear Market Timeline</h3>
          <span className="text-slate-400 text-lg transition-transform duration-200" style={{ transform: showBear ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>
        {showBear && (
          <div className="mt-4 space-y-3">
            {BEAR_MARKETS.map((b) => (
              <div key={b.title} className="card">
                <h4 className="font-semibold text-lg">{b.title}</h4>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><p className="text-min text-slate-500">Peak-to-Trough</p><p className="text-lg font-bold value-down">{b.decline}</p></div>
                  <div><p className="text-min text-slate-500">Recovery Time</p><p className="text-lg font-bold">{b.recovery}</p></div>
                  <div className="col-span-2"><p className="text-min text-slate-500">Peak</p><p className="text-base font-semibold">{b.peak}</p></div>
                  <div className="col-span-2"><p className="text-min text-slate-500">Trough</p><p className="text-base font-semibold">{b.trough}</p></div>
                </div>
                <p className="mt-4 text-min text-slate-500 italic leading-relaxed">"{b.lesson}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(v: number): string {
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
