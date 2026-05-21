import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchKnowledgeArticles, fetchCuratedReading } from '../services/rss';
import { askDeepseek, summarizeArticle } from '../services/deepseek';
import { formatDate } from '../utils/formatters';
import type { KnowledgeArticle, ReadingArticle, ChatMessage } from '../types';
import { CardSkeleton } from '../components/LoadingSkeleton';

type SubTab = 'roadmap' | 'videos' | 'knowledge' | 'reading' | 'chat';

const STAGES = [
  { num: 1, title: 'What is an Index Fund?', text: 'An index fund is a type of mutual fund or ETF that tracks a market index like the S&P 500. Instead of picking individual stocks, you own a tiny piece of all 500 companies in the index — instant diversification with one purchase.', url: 'https://www.investopedia.com/terms/i/indexfund.asp' },
  { num: 2, title: 'Understanding the S&P 500', text: 'The S&P 500 tracks the 500 largest publicly traded US companies. It represents about 80% of the total US stock market value and is the benchmark most professional investors compare themselves against.', url: 'https://www.investopedia.com/terms/s/sp500.asp' },
  { num: 3, title: 'Choosing an ETF: VOO vs SPY vs IVV', text: 'VOO (expense ratio 0.03%), SPY (0.09%), and IVV (0.03%) all track the S&P 500 identically. For long-term investors, VOO and IVV are cheapest. SPY has higher trading volume and is preferred by active traders.', url: 'https://www.investopedia.com/articles/exchangetradedfunds/08/spdr-spy.asp' },
  { num: 4, title: 'Opening a Brokerage Account', text: 'You can open an account at Vanguard, Fidelity, Schwab, or apps like Robinhood in under 10 minutes. All offer commission-free trading of S&P 500 ETFs. Look for no account minimums and no maintenance fees.', url: 'https://www.investopedia.com/articles/younginvestors/08/start-investing.asp' },
  { num: 5, title: 'Starting Your DCA Journey', text: 'Dollar-cost averaging means investing a fixed amount regularly regardless of price. This removes emotion from investing, automatically buys more shares when prices are low, and is the simplest path to long-term wealth.', url: 'https://www.investopedia.com/terms/d/dollarcostaveraging.asp' },
];

const STARTER_QUESTIONS = [
  'What should I do in a bear market?',
  'How does compound interest work?',
  'Is now a good time to invest?',
  "What's the difference between VOO and SPY?",
];

const VIDEOS = [
  { id: 'HC4S2eEzLAg', title: 'How To Invest In The S&P 500 For Beginners (Full Guide)', channel: 'Investing Basics' },
  { id: 'WRx7wkWqlY8', title: 'How To Invest In The S&P 500 EASY Step-By-Step Guide for 2025', channel: 'Step-by-Step Investing' },
  { id: 'Pbl7NHAGc8o', title: 'DIY Investing: S&P 500 Index Explained', channel: 'Index Fund Deep Dive' },
  { id: '1B0CRtgk3Gw', title: 'How To Invest In The S&P 500 For Beginners In 2025', channel: 'Beginner Investing' },
];

export default function LearnPage() {
  const [subTab, setSubTab] = useState<SubTab>('roadmap');

  const subTabs: { key: SubTab; label: string; icon: string }[] = [
    { key: 'roadmap', label: 'Roadmap', icon: '🗺️' },
    { key: 'videos', label: 'Videos', icon: '🎬' },
    { key: 'knowledge', label: 'Knowledge', icon: '📖' },
    { key: 'reading', label: 'Reading', icon: '📋' },
    { key: 'chat', label: 'Q&A', icon: '💬' },
  ];

  return (
    <div className="space-y-5">
      <h2 className="section-heading">Learn</h2>

      <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-[#0EA5E9]/8 rounded-xl p-1">
        {subTabs.map((s) => (
          <button
            key={s.key}
            onClick={() => setSubTab(s.key)}
            className={`shrink-0 touch-target py-2 px-3 rounded-lg text-base font-semibold transition-all duration-200 flex items-center gap-1 ${
              subTab === s.key
                ? 'bg-[#0EA5E9] text-white shadow-lg'
                : 'text-slate-500 hover:text-[#0F172A] dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span aria-hidden>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {subTab === 'roadmap' && <Roadmap />}
      {subTab === 'videos' && <VideoResources />}
      {subTab === 'knowledge' && <KnowledgeBase />}
      {subTab === 'reading' && <CuratedReading />}
      {subTab === 'chat' && <ChatInterface />}
    </div>
  );
}

function VideoResources() {
  return (
    <div>
      <p className="text-min text-slate-500 mb-5">Curated videos to help you master index fund investing — from beginner basics to proven strategies.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {VIDEOS.map((v) => {
          const thumbUrl = `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`;
          const watchUrl = `https://www.youtube.com/watch?v=${v.id}`;
          return (
            <div key={v.id} className="card overflow-hidden group">
              <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="block">
                <div className="relative rounded-lg overflow-hidden mb-3">
                  <img
                    src={thumbUrl}
                    alt={v.title}
                    className="w-full aspect-video object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="w-14 h-14 rounded-full bg-[#0EA5E9]/95 flex items-center justify-center text-white text-2xl shadow-lg">
                      ▶
                    </span>
                  </div>
                </div>
              </a>
              <h4 className="font-semibold text-lg leading-snug mb-1.5">{v.title}</h4>
              <p className="text-min text-slate-500">{v.channel}</p>
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-base font-semibold text-[#0EA5E9] hover:text-[#0369A1] dark:text-[#38BDF8] dark:hover:text-[#7DD3FC] transition-colors touch-target"
              >
                ▶ Watch on YouTube
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Roadmap() {
  return (
    <div className="space-y-0">
      {STAGES.map((stage, i) => (
        <div key={stage.num} className="relative flex gap-3 pb-5">
          {i < STAGES.length - 1 && (
            <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-[#0EA5E9]/30" />
          )}
          <div className="shrink-0 w-9 h-9 rounded-full bg-[#0EA5E9] text-white flex items-center justify-center text-base font-bold z-10 shadow-lg shadow-[#0EA5E9]/30">
            {stage.num}
          </div>
          <div className="flex-1 card">
            <h3 className="font-semibold text-lg">{stage.title}</h3>
            <p className="text-min text-slate-500 mt-2 leading-relaxed">{stage.text}</p>
            <a
              href={stage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-base text-[#0EA5E9] font-semibold hover:underline dark:text-[#38BDF8]"
            >
              Learn more on Investopedia →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function KnowledgeBase() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<'recent' | 'popular'>('recent');

  useEffect(() => {
    fetchKnowledgeArticles().then((data) => {
      setArticles(data);
      setLoading(false);
      data.forEach(async (a, idx) => {
        if (!a.summary) {
          try {
            const summary = await summarizeArticle(a.title, a.concept);
            setArticles((prev) => prev.map((art, i) => (i === idx ? { ...art, summary } : art)));
          } catch { /* skip */ }
        }
      });
    });
  }, []);

  const sorted = sortMode === 'recent'
    ? [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    : articles;

  if (loading) return <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-min text-slate-500">{articles.length} articles</p>
        <button onClick={() => setSortMode(s => s === 'recent' ? 'popular' : 'recent')} className="text-base text-[#0EA5E9] dark:text-[#38BDF8] touch-target px-2 font-semibold">
          Sort: {sortMode === 'recent' ? 'Most Recent' : 'Most Popular'}
        </button>
      </div>
      {sorted.map((a, i) => (
        <div key={i} className="card">
          <span className="text-sm font-semibold px-2.5 py-1 rounded-full bg-[#0EA5E9]/12 text-[#0369A1] dark:text-[#60A5FA]">{a.concept}</span>
          <h4 className="text-lg font-semibold mt-2">{a.title}</h4>
          <div className="flex items-center gap-2 mt-1.5 text-min text-slate-500">
            <span>{a.source}</span><span>·</span><span>{formatDate(a.publishedAt)}</span><span>·</span><span>{a.readTime}</span>
          </div>
          {a.summary && <p className="text-min text-slate-500 mt-2 leading-relaxed">{a.summary}</p>}
          <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-base text-[#0EA5E9] dark:text-[#38BDF8] font-semibold hover:underline">
            Read full article →
          </a>
        </div>
      ))}
    </div>
  );
}

function CuratedReading() {
  const [articles, setArticles] = useState<ReadingArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCuratedReading().then((data) => { setArticles(data); setLoading(false); });
  }, []);

  if (loading) return <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>;

  return (
    <div className="space-y-3">
      <p className="text-min text-slate-500">Top content this week, filtered for long-term investors</p>
      {articles.length === 0 ? (
        <p className="text-center text-slate-500 py-10">No articles found. The RSS feeds may be unavailable right now.</p>
      ) : (
        articles.map((a, i) => (
          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="card block">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-bold text-slate-500 uppercase">{a.source}</span>
              <span className="text-sm text-slate-400">{formatDate(a.date)}</span>
            </div>
            <h4 className="text-lg font-semibold">{a.title}</h4>
            <p className="text-min text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{a.summary}</p>
          </a>
        ))
      )}
    </div>
  );
}

function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await askDeepseek(text, messages);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, timestamp: Date.now() }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your API key configuration.', timestamp: Date.now() }]);
    }
    setLoading(false);
  }, [messages, loading]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const MODEL_NAME = 'DeepSeek';

  return (
    <div className="flex flex-col" style={{ minHeight: '60vh' }}>
      <div className="flex-1 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xl text-slate-500 mb-4">Ask me anything about investing!</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTER_QUESTIONS.map((q) => (
                <button key={q} onClick={() => send(q)} className="text-base px-4 py-2.5 rounded-full bg-[#0EA5E9]/12 text-[#0369A1] hover:bg-[#0EA5E9]/20 dark:text-[#60A5FA] dark:hover:bg-[#0EA5E9]/25 transition-colors touch-target font-medium">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-min leading-relaxed ${
              m.role === 'user'
                ? 'bg-[#0EA5E9] text-white'
                : 'bg-[#F0F9FF] border border-[#BAE6FD] text-[#0F172A] dark:bg-[#1E3A5F]/60 dark:border-[#2563EB]/20 dark:text-slate-200'
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === 'assistant' && (
                <div className="mt-3 pt-2 border-t border-[#BAE6FD] dark:border-[#2563EB]/20">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                    <span>Powered by {MODEL_NAME}</span>
                    <span>Market data: Alpha Vantage | News: NewsAPI</span>
                    <span>{new Date(m.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              )}
              {m.role === 'user' && (
                <p className="text-xs mt-2 opacity-50">{new Date(m.timestamp).toLocaleTimeString()}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#F0F9FF] border border-[#BAE6FD] dark:bg-[#1E3A5F]/60 dark:border-[#2563EB]/20 rounded-2xl px-5 py-3.5">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 sticky bottom-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Ask an investing question..."
          className="flex-1 touch-target px-4 py-3 rounded-xl border border-[#BAE6FD] bg-white dark:bg-[#1E3A5F]/40 text-min text-[#0F172A] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent placeholder:text-slate-400"
          aria-label="Chat message input"
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()} className="btn-primary">
          Send
        </button>
      </div>
    </div>
  );
}
