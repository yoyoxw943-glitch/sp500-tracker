export interface Sp500Quote {
  price: number;
  change: number;
  changePercent: number;
  open: number;
  volume: number;
  high: number;
  low: number;
  previousClose: number;
  lastUpdated: string;
}

export interface DailyData {
  date: string;
  close: number;
}

export interface KeyMetrics {
  high52Week: number;
  low52Week: number;
  peRatio: number;
  dividendYield: number;
  marketCap: string;
}

export interface AnnualReturn {
  year: number;
  return: number;
}

export interface NewsArticle {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  category: 'Macro' | 'Earnings' | 'Tech' | 'Fed' | 'ETF' | 'Index';
  description?: string;
}

export interface InvestmentEntry {
  id: string;
  date: string;
  amount: number;
  currency: 'USD' | 'CNY';
  note: string;
}

export interface Goal {
  id: string;
  label: string;
  targetAmount: number;
  targetYear: number;
  createdAt: string;
}

export interface KnowledgeArticle {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  readTime: string;
  summary: string;
  concept: string;
}

export interface ReadingArticle {
  title: string;
  source: string;
  date: string;
  url: string;
  summary: string;
  sourceLogo?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: string;
}

export interface CalculatorInputs {
  initialInvestment: number;
  monthlyContribution: number;
  years: number;
  annualReturn: number;
}
