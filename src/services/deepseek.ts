import type { ChatMessage } from '../types';

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const BASE = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

async function chat(messages: { role: string; content: string }[]): Promise<string> {
  if (!API_KEY || API_KEY === 'your_deepseek_key_here') {
    return 'DeepSeek API key is not configured. Please add your key to the .env file.';
  }
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: 600 }),
  });
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? 'No response from DeepSeek.';
}

const EDUCATOR_PROMPT =
  'You are a patient investment educator helping a beginner learn about long-term index fund investing. Answer in English only. Base your answers on well-established sources like Investopedia, Vanguard, and Morningstar. Keep answers clear, encouraging, and jargon-free. Use at most 3-4 paragraphs.';

export async function askDeepseek(
  question: string,
  history: ChatMessage[] = []
): Promise<string> {
  const messages = [
    { role: 'system', content: EDUCATOR_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ];
  return chat(messages);
}

export async function askDeepseekScenario(lumpSum: number, year: number): Promise<string> {
  const prompt = `A user asks: "What if I invested $${lumpSum.toLocaleString()} in the S&P 500 in ${year}?"

Calculate and explain the result conversationally. Use the average S&P 500 annual return of ~10% from ${year} to 2026 (or actual historical returns if you know them). Be encouraging and educational. Show the approximate value today and the key lesson for long-term investors. Keep it under 4 paragraphs.`;
  return chat([
    { role: 'system', content: EDUCATOR_PROMPT },
    { role: 'user', content: prompt },
  ]);
}

export async function summarizeArticle(title: string, description: string): Promise<string> {
  const prompt = `Summarize this investment article in exactly 2-3 plain-English sentences for a beginner. Keep it jargon-free:\n\nTitle: ${title}\nDescription: ${description}`;
  return chat([
    { role: 'system', content: 'You are a financial educator. Summarize in 2-3 short, clear sentences.' },
    { role: 'user', content: prompt },
  ]);
}

export async function filterRelevant(title: string, description: string): Promise<boolean> {
  const prompt = `Is this article relevant to index funds, ETFs, S&P 500, long-term investing, DCA, or passive investing? Answer ONLY "yes" or "no".\n\nTitle: ${title}\nDescription: ${description}`;
  try {
    const result = await chat([
      { role: 'system', content: 'Answer only "yes" or "no".' },
      { role: 'user', content: prompt },
    ]);
    return result.trim().toLowerCase().startsWith('yes');
  } catch {
    return false;
  }
}
