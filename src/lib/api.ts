import { API_BASE, API_TOKEN_KEY } from './api-config';
import type { JournalInput } from './journal-file';
import type { HoldingInput } from './portfolio-file';
import type { ReportInput } from './report-file';

export type JournalRecord = {
  id: string;
  investor: 'sherman' | 'roy';
  date: string;
  title: string;
  company: string;
  ticker: string;
  action: 'Buy' | 'Hold' | 'Sell' | 'Watch';
  confidence: number;
  thesis: string;
  does: string;
  good: string;
  wrong: string;
  learned: string;
};

export type ReportRecord = {
  id: string;
  investor: 'sherman' | 'roy';
  date: string;
  period: string;
  title: string;
  learned: string;
  wentWell: string;
  differently: string;
  companies: string;
  next: string;
};

export type HoldingRecordLive = {
  id: string;
  investor: 'sherman' | 'roy';
  company: string;
  ticker: string;
  purchaseDate: string;
  purchasePrice: number;
  currentPrice: number;
  shares: number;
  sellPrice: number | null;
  sellDate: string | null;
  originalThesis: string;
  relatedJournal: string;
};

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function authHeaders(): HeadersInit {
  const token = sessionStorage.getItem(API_TOKEN_KEY);
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parse(res);
  sessionStorage.setItem(API_TOKEN_KEY, data.token);
  return data.token as string;
}

export function clearApiToken() {
  sessionStorage.removeItem(API_TOKEN_KEY);
}

export function hasApiToken() {
  return Boolean(sessionStorage.getItem(API_TOKEN_KEY));
}

export async function fetchJournals(investor?: string, limit = 50) {
  const url = new URL(`${API_BASE}/journals`);
  if (investor) url.searchParams.set('investor', investor);
  url.searchParams.set('limit', String(limit));
  const data = await parse(await fetch(url));
  return (data.items || []) as JournalRecord[];
}

export async function fetchJournal(id: string) {
  const data = await parse(await fetch(`${API_BASE}/journals/${id}`));
  return data.item as JournalRecord;
}

export async function createJournal(input: JournalInput) {
  const data = await parse(
    await fetch(`${API_BASE}/journals`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    }),
  );
  return data.item as JournalRecord;
}

export async function fetchReports(investor: string) {
  const url = new URL(`${API_BASE}/reports`);
  url.searchParams.set('investor', investor);
  const data = await parse(await fetch(url));
  return (data.items || []) as ReportRecord[];
}

export async function fetchReport(id: string) {
  const data = await parse(await fetch(`${API_BASE}/reports/${id}`));
  return data.item as ReportRecord;
}

export async function createReport(input: ReportInput) {
  const data = await parse(
    await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    }),
  );
  return data.item as ReportRecord;
}

export async function fetchHoldings(investor: string) {
  const url = new URL(`${API_BASE}/holdings`);
  url.searchParams.set('investor', investor);
  const data = await parse(await fetch(url));
  return (data.items || []) as HoldingRecordLive[];
}

export async function createHolding(input: HoldingInput) {
  const data = await parse(
    await fetch(`${API_BASE}/holdings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    }),
  );
  return data.item as HoldingRecordLive;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatShortDate(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function money(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function percent(n: number) {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}
