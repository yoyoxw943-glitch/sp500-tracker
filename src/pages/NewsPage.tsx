import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchNews } from '../services/newsApi';
import { timeAgo } from '../utils/formatters';
import type { NewsArticle } from '../types';
import { CardSkeleton } from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';

const FILTERS = ['All', 'Macro', 'Earnings', 'Fed', 'ETF'] as const;

const categoryStyles: Record<string, string> = {
  Fed: 'bg-purple-500/15 text-purple-600 dark:text-purple-300',
  Earnings: 'bg-green-500/15 text-green-700 dark:text-green-300',
  Tech: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  ETF: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  Index: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
  Macro: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
};

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('All');

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      setArticles(await fetchNews());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => filter === 'All' ? articles : articles.filter((a) => a.category === filter), [articles, filter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="section-heading">Market News</h2>
        <button onClick={load} className="btn-primary text-base">Refresh</button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 touch-target px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 ${
              filter === f ? 'bg-[#0EA5E9] text-white shadow-lg' : 'bg-[#0EA5E9]/10 text-slate-500 hover:text-[#0F172A] hover:bg-[#0EA5E9]/20 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-[#0EA5E9]/20'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-12">No news articles found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="card block group">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold flex-1 line-clamp-2 leading-snug group-hover:text-[#0EA5E9] dark:group-hover:text-[#60A5FA] transition-colors">{a.title}</h3>
                <span className={`shrink-0 text-sm font-semibold px-2.5 py-1 rounded-full ${categoryStyles[a.category] || categoryStyles.Macro}`}>{a.category}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                <span className="font-semibold">{a.source}</span><span>·</span><span>{timeAgo(a.publishedAt)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
