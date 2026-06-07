import { useState, useMemo, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateProjection } from '../utils/calculations';
import { formatLargeNumber } from '../utils/formatters';
import { fetchUsdCnyRate } from '../services/alphaVantage';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { CalculatorInputs } from '../types';

const DEFAULTS: CalculatorInputs = { initialInvestment: 10000, monthlyContribution: 500, years: 20, annualReturn: 10 };

interface SavedScenario {
  id: string;
  name: string;
  inputs: CalculatorInputs;
}

type Currency = 'USD' | 'CNY';

function fmtCurrency(value: number, currency: Currency, rate: number): string {
  if (currency === 'CNY') return `¥${(value * rate).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtLargeCurrency(value: number, currency: Currency, rate: number): string {
  if (currency === 'CNY') {
    const cny = value * rate;
    if (cny >= 1_000_000) return `¥${(cny / 1_000_000).toFixed(1)}M`;
    if (cny >= 1_000) return `¥${(cny / 1_000).toFixed(1)}K`;
    return `¥${cny.toFixed(0)}`;
  }
  return `$${formatLargeNumber(value)}`;
}

interface FieldConfig {
  label: string;
  field: keyof CalculatorInputs;
  min: number;
  max: number;
  step: number;
  isCurrency?: boolean;
  suffix?: string;
  placeholder: string;
}

const FIELDS: FieldConfig[] = [
  { label: 'Initial Investment', field: 'initialInvestment', min: 0, max: 100000, step: 1000, isCurrency: true, placeholder: 'e.g. 10,000' },
  { label: 'Monthly Contribution', field: 'monthlyContribution', min: 0, max: 10000, step: 100, isCurrency: true, placeholder: 'e.g. 500' },
  { label: 'Investment Period', field: 'years', min: 1, max: 40, step: 1, placeholder: 'e.g. 20', suffix: ' yrs' },
  { label: 'Expected Annual Return', field: 'annualReturn', min: 1, max: 15, step: 0.5, placeholder: 'e.g. 10', suffix: '%' },
];

export default function CalculatorPage() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULTS);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [usdCnyRate, setUsdCnyRate] = useState(7.25);
  const [scenarios, setScenarios] = useLocalStorage<SavedScenario[]>('calc_scenarios', []);
  const [scenarioName, setScenarioName] = useState('');
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    fetchUsdCnyRate().then(setUsdCnyRate).catch(() => {});
  }, []);

  const projection = calculateProjection(inputs);

  const update = useCallback((field: keyof CalculatorInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }, []);

  const saveScenario = () => {
    const name = scenarioName.trim() || `Scenario ${scenarios.length + 1}`;
    setScenarios((prev) => [
      ...prev,
      { id: Date.now().toString(), name, inputs: { ...inputs } },
    ]);
    setScenarioName('');
  };

  const loadScenario = (s: SavedScenario) => setInputs({ ...s.inputs });
  const deleteScenario = (id: string) => setScenarios((prev) => prev.filter((s) => s.id !== id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="section-heading">Calculator</h2>
        <div className="flex bg-[#0EA5E9]/10 rounded-xl p-0.5 border border-[#BAE6FD] dark:border-[#2563EB]/15">
          {(['USD', 'CNY'] as Currency[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`touch-target px-3 py-1.5 rounded-lg text-base font-semibold transition-all duration-200 ${
                currency === c ? 'bg-[#0EA5E9] text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {c === 'USD' ? '$ USD' : '¥ CNY'}
            </button>
          ))}
        </div>
      </div>

      {currency === 'CNY' && (
        <p className="text-min text-slate-500">
          Exchange rate: 1 USD = {usdCnyRate.toFixed(2)} CNY{usdCnyRate === 7.25 ? ' (fallback)' : ' (live from Yahoo Finance)'}
        </p>
      )}

      <div className="card space-y-5">
        {FIELDS.map((cfg) => (
          <NumberField
            key={cfg.field}
            config={cfg}
            value={inputs[cfg.field]}
            currency={currency}
            rate={usdCnyRate}
            onChange={(v) => update(cfg.field, v)}
          />
        ))}
        <div className="border-t border-[#BAE6FD] dark:border-[#2563EB]/15 pt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Scenario name (optional)"
              className="flex-1 touch-target px-4 py-2.5 rounded-lg border border-[#BAE6FD] bg-white dark:bg-[#1E3A5F]/40 text-sm text-[#0F172A] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent placeholder:text-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && saveScenario()}
            />
            <button onClick={saveScenario} className="touch-target px-4 py-2.5 rounded-lg bg-[#0EA5E9] text-white font-semibold text-sm hover:bg-[#0284C7] transition-colors">
              Save
            </button>
            {scenarios.length > 0 && (
              <button
                onClick={() => setShowSaved(!showSaved)}
                className="touch-target px-4 py-2.5 rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9] font-semibold text-sm hover:bg-[#0EA5E9]/20 transition-colors"
              >
                {showSaved ? 'Hide' : `Saved (${scenarios.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {showSaved && scenarios.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-3 text-[#0369A1] dark:text-[#F8FAFC]">Saved Scenarios</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {scenarios.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#BAE6FD] dark:border-[#2563EB]/10 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold truncate">{s.name}</p>
                  <p className="text-sm text-slate-500">
                    {currency === 'CNY'
                      ? `¥${(s.inputs.initialInvestment * usdCnyRate).toLocaleString('en-US', { maximumFractionDigits: 0 })} + ¥${(s.inputs.monthlyContribution * usdCnyRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo · ${s.inputs.years}y · ${s.inputs.annualReturn}%`
                      : `$${s.inputs.initialInvestment.toLocaleString()} + $${s.inputs.monthlyContribution.toLocaleString()}/mo · ${s.inputs.years}y · ${s.inputs.annualReturn}%`
                    }
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 ml-3">
                  <button onClick={() => loadScenario(s)} className="touch-target px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#0EA5E9]/10 text-[#0EA5E9] hover:bg-[#0EA5E9]/20 transition-colors">
                    Load
                  </button>
                  <button onClick={() => deleteScenario(s.id)} className="touch-target px-3 py-1.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-xl font-semibold mb-4 text-[#0369A1] dark:text-[#F8FAFC]">Projection Results</h3>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <p className="text-min text-slate-500 mb-1">Annual Contribution</p>
            <p className="data-label tabular-nums">{fmtCurrency(projection.annualContribution, currency, usdCnyRate)}</p>
          </div>
          <div>
            <p className="text-min text-slate-500 mb-1">Total Invested</p>
            <p className="data-label tabular-nums">{fmtCurrency(projection.totalInvested, currency, usdCnyRate)}</p>
          </div>
        </div>
        <div className="text-center py-6 bg-[#0EA5E9]/8 rounded-xl border border-[#0EA5E9]/20">
          <p className="text-sm text-[#0369A1] dark:text-[#60A5FA] mb-1.5">Final Value</p>
          <p className="stat-mega text-[#0369A1] dark:text-[#60A5FA] tabular-nums">{fmtCurrency(projection.finalValue, currency, usdCnyRate)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-5">
          <div>
            <p className="text-min text-slate-500 mb-1">Total Gains</p>
            <p className="data-label value-up tabular-nums">{fmtCurrency(projection.totalGains, currency, usdCnyRate)}</p>
          </div>
          <div>
            <p className="text-min text-slate-500 mb-1">Return Multiple</p>
            <p className="data-label tabular-nums">{projection.returnMultiple.toFixed(1)}x</p>
          </div>
        </div>
      </div>

      <div className="card" aria-label="Investment projection chart. Blue area shows your money plus investment gains. Teal area shows the money you put in.">
        <h3 className="text-xl font-semibold mb-3 text-[#0369A1] dark:text-[#F8FAFC]">Growth Over Time</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={projection.dataPoints}>
            <XAxis dataKey="year" tick={{ fontSize: 14, fill: '#64748B' }} stroke="#BAE6FD" />
            <YAxis tick={{ fontSize: 14, fill: '#64748B' }} stroke="#BAE6FD" tickFormatter={(v) => fmtLargeCurrency(v, currency, usdCnyRate)} width={65} />
            <Tooltip content={<CustomTooltip currency={currency} rate={usdCnyRate} />} />
            <Area type="monotone" dataKey="total" stackId="1" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.2} name="Your Money + Gains" />
            <Area type="monotone" dataKey="principal" stackId="2" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.15} name="Money You Put In" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function NumberField({ config, value, currency, rate, onChange }: {
  config: FieldConfig;
  value: number;
  currency: Currency;
  rate: number;
  onChange: (v: number) => void;
}) {
  const { label, min, max, step, isCurrency, suffix, placeholder } = config;
  const [textValue, setTextValue] = useState(formatDisplay(value));
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  function formatDisplay(v: number): string {
    if (isCurrency) {
      if (currency === 'CNY') return (v * rate).toLocaleString('en-US', { maximumFractionDigits: 0 });
      return v.toLocaleString('en-US');
    }
    if (step < 1) return v.toFixed(1);
    return v.toLocaleString('en-US');
  }

  function parseDisplay(raw: string): number {
    let cleaned = raw.replace(/[^0-9.]/g, '');
    const rawNum = parseFloat(cleaned);
    if (isNaN(rawNum)) return min;

    if (isCurrency && currency === 'CNY') {
      // Clamp in CNY space before converting to USD
      const cnyMin = min * rate;
      const cnyMax = max * rate;
      const clampedCny = Math.max(cnyMin, Math.min(cnyMax, rawNum));
      return parseFloat((clampedCny / rate).toFixed(2));
    }

    return Math.max(min, Math.min(max, rawNum));
  }

  const handleTextChange = (raw: string) => {
    setTextValue(raw);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      const parsed = parseDisplay(raw);
      if (!isNaN(parsed)) onChange(parsed);
    }, 300);
    setDebounceTimer(timer);
  };

  const handleTextBlur = () => {
    const parsed = parseDisplay(textValue);
    if (!isNaN(parsed)) {
      onChange(parsed);
      setTextValue(formatDisplay(parsed));
    } else {
      setTextValue(formatDisplay(value));
    }
  };

  const handleSliderChange = (v: number) => {
    onChange(v);
    setTextValue(formatDisplay(v));
  };

  useEffect(() => {
    setTextValue(formatDisplay(value));
    return () => { if (debounceTimer) clearTimeout(debounceTimer); };
  }, [currency, rate]);

  const displayPrefix = isCurrency ? (currency === 'USD' ? '$' : '¥') : '';
  const displaySuffix = !isCurrency && suffix ? suffix : '';
  const rangeMinLabel = displayPrefix + (isCurrency ? (currency === 'USD' ? min.toLocaleString() : (min * rate).toLocaleString('en-US', { maximumFractionDigits: 0 })) : min) + (displaySuffix || '');
  const rangeMaxLabel = displayPrefix + (isCurrency ? (currency === 'USD' ? max.toLocaleString() : (max * rate).toLocaleString('en-US', { maximumFractionDigits: 0 })) : max) + (displaySuffix || '');

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-min text-slate-500">{label}</span>
        <span className="text-min font-semibold tabular-nums text-[#0F172A] dark:text-slate-200">
          {displayPrefix}{formatDisplay(value)}{displaySuffix}
        </span>
      </div>
      <input
        type="text"
        inputMode="decimal"
        value={textValue}
        onChange={(e) => handleTextChange(e.target.value)}
        onBlur={handleTextBlur}
        onFocus={(e) => {
          const raw = value.toString();
          if (isCurrency && currency === 'CNY') e.target.value = (value * rate).toFixed(0);
          else e.target.value = raw;
        }}
        placeholder={placeholder}
        className="w-full touch-target px-4 py-3 rounded-xl border border-[#BAE6FD] bg-white dark:bg-[#1E3A5F]/40 text-min text-[#0F172A] dark:text-slate-200 mb-2 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent placeholder:text-slate-400"
        aria-label={label}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
        aria-label={`${label} slider`}
      />
      <div className="flex justify-between text-sm text-slate-400 mt-1">
        <span>{rangeMinLabel}</span>
        <span>{rangeMaxLabel}</span>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, currency, rate }: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  label?: string;
  currency: Currency;
  rate: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.find((p) => p.name === 'Your Money + Gains')?.value ?? 0;
  const principal = payload.find((p) => p.name === 'Money You Put In')?.value ?? 0;
  const gains = total - principal;

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '12px 16px', fontSize: '15px', color: '#0F172A', minWidth: '200px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>Year {label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38BDF8', display: 'inline-block' }} />
          Money You Put In
        </span>
        <span style={{ fontWeight: 600 }}>{fmtCurrency(principal, currency, rate)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
          Gains
        </span>
        <span style={{ fontWeight: 600, color: '#16A34A' }}>{fmtCurrency(gains, currency, rate)}</span>
      </div>
      <div style={{ height: '1px', background: '#BAE6FD', margin: '8px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0EA5E9', display: 'inline-block' }} />
          Total
        </span>
        <span style={{ fontWeight: 700 }}>{fmtCurrency(total, currency, rate)}</span>
      </div>
    </div>
  );
}
