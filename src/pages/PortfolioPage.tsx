import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatCurrency, formatDate } from '../utils/formatters';
import { HISTORICAL_RETURNS } from '../utils/calculations';
import type { InvestmentEntry, Goal } from '../types';

const inputClass = "w-full touch-target px-4 py-3 rounded-xl border border-[#BAE6FD] bg-white dark:bg-[#1E3A5F]/40 text-min text-[#0F172A] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent placeholder:text-slate-400";

export default function PortfolioPage() {
  const [entries, setEntries] = useLocalStorage<InvestmentEntry[]>('investment_log', []);
  const [goals, setGoals] = useLocalStorage<Goal[]>('investment_goals', []);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryAmount, setEntryAmount] = useState('1000');
  const [entryNote, setEntryNote] = useState('');
  const [goalLabel, setGoalLabel] = useState('');
  const [goalAmount, setGoalAmount] = useState('100000');
  const [goalYear, setGoalYear] = useState(new Date().getFullYear() + 10);

  const totalInvested = useMemo(() => entries.reduce((sum, e) => sum + e.amount, 0), [entries]);
  const avgCost = useMemo(() => entries.length ? totalInvested / entries.length : 0, [entries, totalInvested]);

  const estimatedValue = useMemo(() => {
    if (entries.length === 0) return 0;
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstDate = new Date(sorted[0].date);
    const firstYear = firstDate.getFullYear();
    const currentYear = new Date().getFullYear();
    let cumulativeReturn = 0;
    for (const yr of HISTORICAL_RETURNS) {
      if (yr.year >= firstYear && yr.year <= currentYear) cumulativeReturn += yr.return;
    }
    const yearsElapsed = Math.max(0.5, currentYear - firstYear + (new Date().getMonth() - firstDate.getMonth()) / 12);
    const avgAnnual = yearsElapsed > 0 ? cumulativeReturn / (currentYear - firstYear + 1) : 10;
    return Math.round(totalInvested * Math.pow(1 + avgAnnual / 100, yearsElapsed));
  }, [entries, totalInvested]);

  const chartData = useMemo(() => {
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let running = 0;
    return sorted.map((e) => { running += e.amount; return { date: e.date, total: running }; });
  }, [entries]);

  const addEntry = () => {
    const amount = parseFloat(entryAmount);
    if (!amount || amount <= 0) return;
    setEntries((prev) => [...prev, { id: Date.now().toString(), date: entryDate, amount, note: entryNote }]);
    setEntryAmount('1000'); setEntryNote(''); setShowLogForm(false);
  };

  const addGoal = () => {
    const amount = parseFloat(goalAmount);
    if (!amount || !goalLabel.trim()) return;
    setGoals((prev) => [...prev, { id: Date.now().toString(), label: goalLabel, targetAmount: amount, targetYear: goalYear, createdAt: new Date().toISOString() }]);
    setGoalLabel(''); setGoalAmount('100000'); setShowGoalForm(false);
  };

  const deleteGoal = (id: string) => setGoals((prev) => prev.filter((g) => g.id !== id));

  const calcGoalProgress = (goal: Goal) => {
    const pct = Math.min(100, Math.round((estimatedValue / goal.targetAmount) * 100));
    const yearsLeft = goal.targetYear - new Date().getFullYear();
    const monthlyNeeded = yearsLeft > 0 ? Math.round((goal.targetAmount - estimatedValue) / (yearsLeft * 12)) : 0;
    return { pct, yearsLeft, monthlyNeeded };
  };

  const milestoneMessage = (pct: number) => {
    if (pct >= 100) return 'Goal reached! Congratulations!';
    if (pct >= 75) return "Almost there — you're 75% of the way!";
    if (pct >= 50) return 'Halfway to your goal! Keep it up!';
    if (pct >= 25) return "You're 25% there — great progress!";
    return 'Keep investing consistently to reach your goal.';
  };

  return (
    <div className="space-y-5">
      <h2 className="section-heading">My Portfolio</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="card"><p className="text-min text-slate-500 mb-1">Total Invested</p><p className="stat-large">{formatCurrency(totalInvested)}</p></div>
        <div className="card"><p className="text-min text-slate-500 mb-1">Est. Current Value</p><p className="stat-large value-up">{formatCurrency(estimatedValue)}</p></div>
        <div className="card"><p className="text-min text-slate-500 mb-1">Contributions</p><p className="stat-large">{entries.length}</p></div>
        <div className="card"><p className="text-min text-slate-500 mb-1">Avg Cost</p><p className="stat-large">{entries.length ? formatCurrency(avgCost) : '--'}</p></div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#0369A1] dark:text-[#F8FAFC]">Investment Log</h3>
          <button onClick={() => setShowLogForm(!showLogForm)} className="text-base font-semibold text-[#0EA5E9] hover:text-[#0369A1] dark:text-[#38BDF8] dark:hover:text-[#7DD3FC] transition-colors touch-target">
            {showLogForm ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {showLogForm && (
          <div className="mt-4 space-y-3 p-4 bg-[#F0F9FF] dark:bg-[#1E3A5F]/30 rounded-xl">
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={inputClass} />
            <input type="number" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} placeholder="Amount ($)" min="1" className={inputClass} />
            <input type="text" value={entryNote} onChange={(e) => setEntryNote(e.target.value)} placeholder="Optional note" className={inputClass} />
            <button onClick={addEntry} className="btn-primary w-full">Save Entry</button>
          </div>
        )}

        {entries.length === 0 ? (
          <p className="text-min text-slate-400 mt-4 text-center py-6">No investments logged yet. Add your first entry!</p>
        ) : (
          <div className="mt-4 space-y-1 max-h-72 overflow-y-auto">
            {[...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3 border-b border-[#BAE6FD] dark:border-[#2563EB]/10 last:border-0">
                <div>
                  <p className="text-lg font-semibold">{formatCurrency(e.amount)}</p>
                  <p className="text-min text-slate-500 mt-0.5">{formatDate(e.date)}{e.note ? ` — ${e.note}` : ''}</p>
                </div>
                <button onClick={() => setEntries((prev) => prev.filter((x) => x.id !== e.id))} className="text-min text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300 touch-target px-2 font-medium">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {chartData.length > 1 && (
        <div className="card" aria-label="Portfolio growth chart over time">
          <h3 className="text-xl font-semibold mb-3 text-[#0369A1] dark:text-[#F8FAFC]">Portfolio Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 13, fill: '#64748B' }} stroke="#BAE6FD" />
              <YAxis tick={{ fontSize: 13, fill: '#64748B' }} stroke="#BAE6FD" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={45} />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '12px', fontSize: '15px', color: '#0F172A' }} formatter={(v) => [formatCurrency(Number(v)), 'Cumulative']} />
              <Line type="monotone" dataKey="total" stroke="#0EA5E9" strokeWidth={2.5} dot={{ r: 3, fill: '#0EA5E9' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#0369A1] dark:text-[#F8FAFC]">Goal Tracker</h3>
          <button onClick={() => setShowGoalForm(!showGoalForm)} className="text-base font-semibold text-[#0EA5E9] hover:text-[#0369A1] dark:text-[#38BDF8] dark:hover:text-[#7DD3FC] transition-colors touch-target">
            {showGoalForm ? 'Cancel' : '+ Set Goal'}
          </button>
        </div>

        {showGoalForm && (
          <div className="mt-4 space-y-3 p-4 bg-[#F0F9FF] dark:bg-[#1E3A5F]/30 rounded-xl">
            <input type="text" value={goalLabel} onChange={(e) => setGoalLabel(e.target.value)} placeholder="Goal label (e.g. Retirement)" className={inputClass} />
            <input type="number" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} placeholder="Target amount ($)" min="1" className={inputClass} />
            <input type="number" value={goalYear} onChange={(e) => setGoalYear(parseInt(e.target.value, 10))} placeholder="Target year" min={new Date().getFullYear()} max={2100} className={inputClass} />
            <button onClick={addGoal} className="btn-primary w-full">Save Goal</button>
          </div>
        )}

        {goals.length === 0 ? (
          <p className="text-min text-slate-400 mt-4 text-center py-6">No goals set. Define a financial goal to track your progress!</p>
        ) : (
          <div className="mt-4 space-y-5">
            {goals.map((g) => {
              const { pct, yearsLeft, monthlyNeeded } = calcGoalProgress(g);
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold">{g.label}</span>
                    <button onClick={() => deleteGoal(g.id)} className="text-min text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300 touch-target px-2 font-medium">x</button>
                  </div>
                  <div className="flex justify-between text-min text-slate-500 mb-1.5">
                    <span>{pct}% — {formatCurrency(estimatedValue)} of {formatCurrency(g.targetAmount)}</span>
                    <span>{g.targetYear}</span>
                  </div>
                  <div className="h-6 bg-[#E0F2FE] dark:bg-[#1E3A5F]/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-[#16A34A]' : pct >= 50 ? 'bg-[#0EA5E9]' : 'bg-[#0EA5E9]/60'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                      role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
                      aria-label={`${g.label}: ${pct}% complete`}
                    />
                  </div>
                  <p className="text-min text-slate-500 mt-2">{milestoneMessage(pct)}</p>
                  {monthlyNeeded > 0 && (
                    <p className="text-min text-slate-500 mt-1">
                      To reach this goal, invest ~{formatCurrency(monthlyNeeded)}/month for {yearsLeft} more years (assuming 10% annual return).
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
