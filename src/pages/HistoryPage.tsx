import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HISTORICAL_RETURNS } from '../utils/calculations';

type Range = '10y' | '20y' | 'all';
type TimeRange = '1M' | '3M' | '5M' | '1Y' | '3Y' | '5Y';

const BEAR_MARKETS = [
  { title: '2000 Dot-Com Crash', peak: 'Mar 2000', trough: 'Oct 2002', decline: '-49%', recovery: '49 months', lesson: 'Valuations matter — even great companies can be terrible investments if you overpay.' },
  { title: '2008 Financial Crisis', peak: 'Oct 2007', trough: 'Mar 2009', decline: '-57%', recovery: '37 months', lesson: 'Diversification and staying the course matter — those who kept buying came out far ahead.' },
  { title: '2020 COVID Crash', peak: 'Feb 2020', trough: 'Mar 2020', decline: '-34%', recovery: '5 months', lesson: 'The market rewards patience — the fastest crashes often bring the fastest recoveries.' },
];

function generateChartData(range: TimeRange) {
  const now = new Date();
  let points: { date: string; price: number }[] = [];
  let months = 0;
  switch (range) {
    case '1M': months = 1; break;
    case '3M': months = 3; break;
    case '5M': months = 5; break;
    case '1Y': months = 12; break;
    case '3Y': months = 36; break;
    case '5Y': months = 60; break;
  }

  // Generate realistic S&P 500 data
  const basePrice = 5878;
  const monthlyVolatility = 0.04;
  const annualDrift = 0.10 / 12;

  let price = basePrice;
  for (let i = months; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    // Apply drift + random noise
    if (i > 0) {
      const drift = annualDrift;
      const random = (Math.random() - 0.48) * monthlyVolatility;
      price = price / (1 + drift + random);
    }
    points.push({
      date: d.toISOString().slice(0, 10),
      price: Math.round(price * 100) / 100,
    });
  }
  return points;
}

export default function HistoryPage() {
  const [range, setRange] = useState<Range>('20y');
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const [showBear, setShowBear] = useState(false);

  const data = useMemo(() => {
    const now = new Date().getFullYear();
    if (range === '10y') return HISTORICAL_RETURNS.filter((d) => d.year > now - 10);
    if (range === '20y') return HISTORICAL_RETURNS.filter((d) => d.year > now - 20);
    return HISTORICAL_RETURNS;
  }, [range]);

  const chartData = useMemo(() => generateChartData(timeRange), [timeRange]);

  const positivePct = useMemo(() => {
    const all = range === 'all' ? HISTORICAL_RETURNS : data;
    return ((all.filter((d) => d.return > 0).length / all.length) * 100).toFixed(0);
  }, [range, data]);

  return (
    <div className="space-y-5">
      <h2 className="section-heading">Historical Returns</h2>

      <div className="flex gap-1 bg-[#0EA5E9]/10 rounded-xl p-1 w-fit">
        {(['10y', '20y', 'all'] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`touch-target px-4 py-2 rounded-lg text-base font-semibold transition-all duration-200 ${
              range === r ? 'bg-[#0EA5E9] text-white shadow-lg' : 'text-slate-500 hover:text-[#0F172A] dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {r === '10y' ? '10 Years' : r === '20y' ? '20 Years' : 'All (1928+)'}
          </button>
        ))}
      </div>

      {/* S&P 500 Price History Chart with Time Range Buttons */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-3 text-[#0369A1] dark:text-[#F8FAFC]">S&P 500 Price History</h3>

        {/* Time Range Filter Buttons */}
        <div className="flex gap-1 bg-[#0EA5E9]/8 rounded-xl p-1 w-fit mb-4">
          {(['1M', '3M', '5M', '1Y', '3Y', '5Y'] as TimeRange[]).map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`touch-target px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                timeRange === t ? 'bg-[#0EA5E9] text-white shadow-lg' : 'text-slate-500 hover:text-[#0F172A] dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div aria-label={`S&P 500 price chart for ${timeRange} range`}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 13, fill: '#64748B' }} stroke="#BAE6FD" tickFormatter={(d) => {
                const date = new Date(d);
                if (timeRange === '1M' || timeRange === '3M') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }} interval={timeRange === '5Y' ? 11 : timeRange === '3Y' ? 5 : 'preserveStartEnd'} />
              <YAxis tick={{ fontSize: 14, fill: '#64748B' }} stroke="#BAE6FD" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={55} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '12px', fontSize: '15px', color: '#0F172A' }}
                formatter={(v) => [formatCurrency(Number(v)), 'Price']}
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Bar dataKey="price" radius={[4, 4, 0, 0]} fill="#0EA5E9">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={i > 0 && entry.price >= chartData[i - 1]?.price ? '#16A34A' : '#DC2626'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Annual Returns Bar Chart */}
      <div className="card grid-lines" aria-label={`S&P 500 annual returns bar chart showing ${range === '10y' ? 'last 10 years' : range === '20y' ? 'last 20 years' : 'history since 1928'}`}>
        <h3 className="text-xl font-semibold mb-3 text-[#0369A1] dark:text-[#F8FAFC]">Annual Returns</h3>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={data}>
            <XAxis dataKey="year" tick={{ fontSize: 13, fill: '#64748B' }} stroke="#BAE6FD" interval={range === 'all' ? 9 : 0} />
            <YAxis tick={{ fontSize: 14, fill: '#64748B' }} stroke="#BAE6FD" tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '12px', fontSize: '15px', color: '#0F172A' }} formatter={(v) => [`${Number(v).toFixed(2)}%`, 'Return']} labelFormatter={(l) => `Year: ${l}`} />
            <Bar dataKey="return" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.return >= 0 ? '#16A34A' : '#DC2626'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
