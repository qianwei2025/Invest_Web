type Env = {
  DB: D1Database;
  AUTH_EMAIL: string;
  AUTH_PASSWORD_SHA256: string;
  ALLOWED_ORIGINS: string;
  SESSION_SECRET: string;
};

type JournalBody = {
  investor: string;
  date: string;
  title: string;
  company: string;
  ticker?: string;
  action: string;
  confidence: number;
  thesis: string;
  does?: string;
  good?: string;
  wrong?: string;
  learned?: string;
};

type ReportBody = {
  investor: string;
  date: string;
  period: string;
  title: string;
  learned: string;
  wentWell?: string;
  differently?: string;
  companies?: string;
  next?: string;
};

type HoldingBody = {
  investor: string;
  company: string;
  ticker?: string;
  purchaseDate: string;
  purchasePrice: number;
  currentPrice: number;
  shares: number;
  sellPrice?: number | null;
  sellDate?: string | null;
  originalThesis?: string;
  relatedJournal?: string;
};

const ACTIONS = new Set(['Buy', 'Hold', 'Sell', 'Watch']);
const INVESTORS = new Set(['sherman', 'roy']);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(env, origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, '') || '/';

      if (request.method === 'GET' && path === '/health') {
        return json({ ok: true }, cors);
      }

      if (request.method === 'POST' && path === '/auth/login') {
        return handleLogin(request, env, cors);
      }

      if (request.method === 'GET' && path === '/journals') {
        return listJournals(url, env, cors);
      }

      if (request.method === 'GET' && path.startsWith('/journals/')) {
        return getJournal(path.slice('/journals/'.length), env, cors);
      }

      if (request.method === 'POST' && path === '/journals') {
        return createJournal(request, env, cors);
      }

      if (request.method === 'PUT' && path.startsWith('/journals/')) {
        return updateJournal(path.slice('/journals/'.length), request, env, cors);
      }

      if (request.method === 'DELETE' && path.startsWith('/journals/')) {
        return deleteJournal(path.slice('/journals/'.length), request, env, cors);
      }

      if (request.method === 'GET' && path === '/reports') {
        return listReports(url, env, cors);
      }

      if (request.method === 'GET' && path.startsWith('/reports/')) {
        return getReport(path.slice('/reports/'.length), env, cors);
      }

      if (request.method === 'POST' && path === '/reports') {
        return createReport(request, env, cors);
      }

      if (request.method === 'PUT' && path.startsWith('/reports/')) {
        return updateReport(path.slice('/reports/'.length), request, env, cors);
      }

      if (request.method === 'DELETE' && path.startsWith('/reports/')) {
        return deleteReport(path.slice('/reports/'.length), request, env, cors);
      }

      if (request.method === 'GET' && path === '/holdings') {
        return listHoldings(url, env, cors);
      }

      if (request.method === 'GET' && path.startsWith('/holdings/')) {
        return getHolding(path.slice('/holdings/'.length), env, cors);
      }

      if (request.method === 'POST' && path === '/holdings') {
        return createHolding(request, env, cors);
      }

      if (request.method === 'PUT' && path.startsWith('/holdings/')) {
        return updateHolding(path.slice('/holdings/'.length), request, env, cors);
      }

      if (request.method === 'DELETE' && path.startsWith('/holdings/')) {
        return deleteHolding(path.slice('/holdings/'.length), request, env, cors);
      }

      return json({ ok: false, error: 'Not found' }, cors, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Server error';
      return json({ ok: false, error: message }, cors, 500);
    }
  },
};

function corsHeaders(env: Env, origin: string): HeadersInit {
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const match = allowed.includes(origin) ? origin : allowed[0] || '*';
  return {
    'Access-Control-Allow-Origin': match,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data: unknown, cors: HeadersInit, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function b64url(bytes: ArrayBuffer | Uint8Array | string) {
  const raw =
    typeof bytes === 'string'
      ? btoa(bytes)
      : btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromB64url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  return atob(padded);
}

function b64urlToBytes(value: string) {
  const bin = fromB64url(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function signToken(env: Env, email: string) {
  const payload = b64url(JSON.stringify({ email, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  return `${payload}.${sig}`;
}

async function verifyToken(env: Env, token: string | null) {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    b64urlToBytes(sig),
    new TextEncoder().encode(payload),
  );
  if (!ok) return false;
  try {
    const data = JSON.parse(fromB64url(payload)) as { email?: string; exp?: number };
    if (!data.email || data.email !== env.AUTH_EMAIL) return false;
    if (!data.exp || data.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

async function requireAuth(request: Request, env: Env, cors: HeadersInit) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!(await verifyToken(env, token))) {
    return json({ ok: false, error: 'Unauthorized' }, cors, 401);
  }
  return null;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
}

function uuid() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

async function handleLogin(request: Request, env: Env, cors: HeadersInit) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const hash = await sha256Hex(password);
  if (email !== env.AUTH_EMAIL.toLowerCase() || hash !== env.AUTH_PASSWORD_SHA256) {
    return json({ ok: false, error: 'Invalid login' }, cors, 401);
  }
  if (!env.SESSION_SECRET) {
    return json({ ok: false, error: 'Server missing SESSION_SECRET' }, cors, 500);
  }
  const token = await signToken(env, email);
  return json({ ok: true, token }, cors);
}

async function listJournals(url: URL, env: Env, cors: HeadersInit) {
  const investor = url.searchParams.get('investor');
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 50)));
  let rows;
  if (investor) {
    if (!INVESTORS.has(investor)) return json({ ok: false, error: 'Bad investor' }, cors, 400);
    rows = await env.DB.prepare(
      `SELECT * FROM journals WHERE investor = ? ORDER BY date DESC, created_at DESC LIMIT ?`,
    )
      .bind(investor, limit)
      .all();
  } else {
    rows = await env.DB.prepare(
      `SELECT * FROM journals ORDER BY date DESC, created_at DESC LIMIT ?`,
    )
      .bind(limit)
      .all();
  }
  return json({ ok: true, items: (rows.results || []).map(mapJournal) }, cors);
}

async function getJournal(id: string, env: Env, cors: HeadersInit) {
  const row = await env.DB.prepare(`SELECT * FROM journals WHERE id = ?`).bind(id).first();
  if (!row) return json({ ok: false, error: 'Not found' }, cors, 404);
  return json({ ok: true, item: mapJournal(row) }, cors);
}

async function createJournal(request: Request, env: Env, cors: HeadersInit) {
  const denied = await requireAuth(request, env, cors);
  if (denied) return denied;
  const body = (await request.json()) as JournalBody;
  if (!INVESTORS.has(body.investor)) return json({ ok: false, error: 'Bad investor' }, cors, 400);
  if (!ACTIONS.has(body.action)) return json({ ok: false, error: 'Bad action' }, cors, 400);
  if (!body.date || !body.company?.trim() || !body.title?.trim() || !body.thesis?.trim()) {
    return json({ ok: false, error: 'Missing required fields' }, cors, 400);
  }
  const id = uuid();
  const stamp = nowIso();
  const ticker = (body.ticker || slugify(body.company)).toUpperCase();
  const confidence = Math.min(5, Math.max(1, Number(body.confidence) || 3));
  await env.DB.prepare(
    `INSERT INTO journals (
      id, investor, date, title, company, ticker, action, confidence,
      thesis, does_text, good, wrong, learned, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      body.investor,
      body.date,
      body.title.trim(),
      body.company.trim(),
      ticker,
      body.action,
      confidence,
      body.thesis.trim(),
      (body.does || '').trim(),
      (body.good || '').trim(),
      (body.wrong || '').trim(),
      (body.learned || '').trim(),
      stamp,
      stamp,
    )
    .run();
  const item = await env.DB.prepare(`SELECT * FROM journals WHERE id = ?`).bind(id).first();
  return json({ ok: true, item: mapJournal(item) }, cors, 201);
}

async function updateJournal(id: string, request: Request, env: Env, cors: HeadersInit) {
  const denied = await requireAuth(request, env, cors);
  if (denied) return denied;
  const existing = await env.DB.prepare(`SELECT id FROM journals WHERE id = ?`).bind(id).first();
  if (!existing) return json({ ok: false, error: 'Not found' }, cors, 404);
  const body = (await request.json()) as JournalBody;
  if (!INVESTORS.has(body.investor)) return json({ ok: false, error: 'Bad investor' }, cors, 400);
  if (!ACTIONS.has(body.action)) return json({ ok: false, error: 'Bad action' }, cors, 400);
  if (!body.date || !body.company?.trim() || !body.title?.trim() || !body.thesis?.trim()) {
    return json({ ok: false, error: 'Missing required fields' }, cors, 400);
  }
  const ticker = (body.ticker || slugify(body.company)).toUpperCase();
  const confidence = Math.min(5, Math.max(1, Number(body.confidence) || 3));
  await env.DB.prepare(
    `UPDATE journals SET
      investor = ?, date = ?, title = ?, company = ?, ticker = ?, action = ?, confidence = ?,
      thesis = ?, does_text = ?, good = ?, wrong = ?, learned = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      body.investor,
      body.date,
      body.title.trim(),
      body.company.trim(),
      ticker,
      body.action,
      confidence,
      body.thesis.trim(),
      (body.does || '').trim(),
      (body.good || '').trim(),
      (body.wrong || '').trim(),
      (body.learned || '').trim(),
      nowIso(),
      id,
    )
    .run();
  const item = await env.DB.prepare(`SELECT * FROM journals WHERE id = ?`).bind(id).first();
  return json({ ok: true, item: mapJournal(item) }, cors);
}

async function deleteJournal(id: string, request: Request, env: Env, cors: HeadersInit) {
  const denied = await requireAuth(request, env, cors);
  if (denied) return denied;
  const existing = await env.DB.prepare(`SELECT id FROM journals WHERE id = ?`).bind(id).first();
  if (!existing) return json({ ok: false, error: 'Not found' }, cors, 404);
  await env.DB.prepare(`DELETE FROM journals WHERE id = ?`).bind(id).run();
  return json({ ok: true }, cors);
}

async function listReports(url: URL, env: Env, cors: HeadersInit) {
  const investor = url.searchParams.get('investor');
  if (!investor || !INVESTORS.has(investor)) {
    return json({ ok: false, error: 'Bad investor' }, cors, 400);
  }
  const rows = await env.DB.prepare(
    `SELECT * FROM reports WHERE investor = ? ORDER BY date DESC, created_at DESC`,
  )
    .bind(investor)
    .all();
  return json({ ok: true, items: (rows.results || []).map(mapReport) }, cors);
}

async function getReport(id: string, env: Env, cors: HeadersInit) {
  const row = await env.DB.prepare(`SELECT * FROM reports WHERE id = ?`).bind(id).first();
  if (!row) return json({ ok: false, error: 'Not found' }, cors, 404);
  return json({ ok: true, item: mapReport(row) }, cors);
}

async function createReport(request: Request, env: Env, cors: HeadersInit) {
  const denied = await requireAuth(request, env, cors);
  if (denied) return denied;
  const body = (await request.json()) as ReportBody;
  if (!INVESTORS.has(body.investor)) return json({ ok: false, error: 'Bad investor' }, cors, 400);
  if (!body.date || !body.period?.trim() || !body.title?.trim() || !body.learned?.trim()) {
    return json({ ok: false, error: 'Missing required fields' }, cors, 400);
  }
  const id = uuid();
  const stamp = nowIso();
  await env.DB.prepare(
    `INSERT INTO reports (
      id, investor, date, period, title, learned, went_well, differently, companies, next_text, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      body.investor,
      body.date,
      body.period.trim(),
      body.title.trim(),
      body.learned.trim(),
      (body.wentWell || '').trim(),
      (body.differently || '').trim(),
      (body.companies || '').trim(),
      (body.next || '').trim(),
      stamp,
      stamp,
    )
    .run();
  const item = await env.DB.prepare(`SELECT * FROM reports WHERE id = ?`).bind(id).first();
  return json({ ok: true, item: mapReport(item) }, cors, 201);
}

async function updateReport(id: string, request: Request, env: Env, cors: HeadersInit) {
  const denied = await requireAuth(request, env, cors);
  if (denied) return denied;
  const existing = await env.DB.prepare(`SELECT id FROM reports WHERE id = ?`).bind(id).first();
  if (!existing) return json({ ok: false, error: 'Not found' }, cors, 404);
  const body = (await request.json()) as ReportBody;
  if (!INVESTORS.has(body.investor)) return json({ ok: false, error: 'Bad investor' }, cors, 400);
  if (!body.date || !body.period?.trim() || !body.title?.trim() || !body.learned?.trim()) {
    return json({ ok: false, error: 'Missing required fields' }, cors, 400);
  }
  await env.DB.prepare(
    `UPDATE reports SET
      investor = ?, date = ?, period = ?, title = ?, learned = ?, went_well = ?,
      differently = ?, companies = ?, next_text = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      body.investor,
      body.date,
      body.period.trim(),
      body.title.trim(),
      body.learned.trim(),
      (body.wentWell || '').trim(),
      (body.differently || '').trim(),
      (body.companies || '').trim(),
      (body.next || '').trim(),
      nowIso(),
      id,
    )
    .run();
  const item = await env.DB.prepare(`SELECT * FROM reports WHERE id = ?`).bind(id).first();
  return json({ ok: true, item: mapReport(item) }, cors);
}

async function deleteReport(id: string, request: Request, env: Env, cors: HeadersInit) {
  const denied = await requireAuth(request, env, cors);
  if (denied) return denied;
  const existing = await env.DB.prepare(`SELECT id FROM reports WHERE id = ?`).bind(id).first();
  if (!existing) return json({ ok: false, error: 'Not found' }, cors, 404);
  await env.DB.prepare(`DELETE FROM reports WHERE id = ?`).bind(id).run();
  return json({ ok: true }, cors);
}

async function listHoldings(url: URL, env: Env, cors: HeadersInit) {
  const investor = url.searchParams.get('investor');
  if (!investor || !INVESTORS.has(investor)) {
    return json({ ok: false, error: 'Bad investor' }, cors, 400);
  }
  const rows = await env.DB.prepare(
    `SELECT * FROM holdings WHERE investor = ? ORDER BY purchase_date DESC, created_at DESC`,
  )
    .bind(investor)
    .all();
  return json({ ok: true, items: (rows.results || []).map(mapHolding) }, cors);
}

async function createHolding(request: Request, env: Env, cors: HeadersInit) {
  const denied = await requireAuth(request, env, cors);
  if (denied) return denied;
  const body = (await request.json()) as HoldingBody;
  if (!INVESTORS.has(body.investor)) return json({ ok: false, error: 'Bad investor' }, cors, 400);
  if (!body.company?.trim() || !body.purchaseDate) {
    return json({ ok: false, error: 'Missing required fields' }, cors, 400);
  }
  const id = uuid();
  const stamp = nowIso();
  const ticker = (body.ticker || slugify(body.company)).toUpperCase();
  const sellPrice =
    body.sellPrice === undefined || body.sellPrice === null || Number.isNaN(Number(body.sellPrice))
      ? null
      : Number(body.sellPrice);
  const sellDate = sellPrice === null ? null : body.sellDate?.trim() || null;
  await env.DB.prepare(
    `INSERT INTO holdings (
      id, investor, company, ticker, purchase_date, purchase_price, current_price, shares,
      sell_price, sell_date, original_thesis, related_journal, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      body.investor,
      body.company.trim(),
      ticker,
      body.purchaseDate,
      Number(body.purchasePrice),
      Number(body.currentPrice),
      Number(body.shares),
      sellPrice,
      sellDate,
      (body.originalThesis || '').trim(),
      (body.relatedJournal || '').trim(),
      stamp,
      stamp,
    )
    .run();
  const item = await env.DB.prepare(`SELECT * FROM holdings WHERE id = ?`).bind(id).first();
  return json({ ok: true, item: mapHolding(item) }, cors, 201);
}

function parseHoldingFields(body: HoldingBody) {
  const ticker = (body.ticker || slugify(body.company)).toUpperCase();
  const sellPrice =
    body.sellPrice === undefined || body.sellPrice === null || Number.isNaN(Number(body.sellPrice))
      ? null
      : Number(body.sellPrice);
  const sellDate = sellPrice === null ? null : body.sellDate?.trim() || null;
  return {
    ticker,
    sellPrice,
    sellDate,
    company: body.company.trim(),
    purchaseDate: body.purchaseDate,
    purchasePrice: Number(body.purchasePrice),
    currentPrice: Number(body.currentPrice),
    shares: Number(body.shares),
    originalThesis: (body.originalThesis || '').trim(),
    relatedJournal: (body.relatedJournal || '').trim(),
  };
}

async function getHolding(id: string, env: Env, cors: HeadersInit) {
  const row = await env.DB.prepare(`SELECT * FROM holdings WHERE id = ?`).bind(id).first();
  if (!row) return json({ ok: false, error: 'Not found' }, cors, 404);
  return json({ ok: true, item: mapHolding(row) }, cors);
}

async function updateHolding(id: string, request: Request, env: Env, cors: HeadersInit) {
  const denied = await requireAuth(request, env, cors);
  if (denied) return denied;
  const existing = await env.DB.prepare(`SELECT id FROM holdings WHERE id = ?`).bind(id).first();
  if (!existing) return json({ ok: false, error: 'Not found' }, cors, 404);
  const body = (await request.json()) as HoldingBody;
  if (!INVESTORS.has(body.investor)) return json({ ok: false, error: 'Bad investor' }, cors, 400);
  if (!body.company?.trim() || !body.purchaseDate) {
    return json({ ok: false, error: 'Missing required fields' }, cors, 400);
  }
  const fields = parseHoldingFields(body);
  await env.DB.prepare(
    `UPDATE holdings SET
      investor = ?, company = ?, ticker = ?, purchase_date = ?, purchase_price = ?,
      current_price = ?, shares = ?, sell_price = ?, sell_date = ?, original_thesis = ?,
      related_journal = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      body.investor,
      fields.company,
      fields.ticker,
      fields.purchaseDate,
      fields.purchasePrice,
      fields.currentPrice,
      fields.shares,
      fields.sellPrice,
      fields.sellDate,
      fields.originalThesis,
      fields.relatedJournal,
      nowIso(),
      id,
    )
    .run();
  const item = await env.DB.prepare(`SELECT * FROM holdings WHERE id = ?`).bind(id).first();
  return json({ ok: true, item: mapHolding(item) }, cors);
}

async function deleteHolding(id: string, request: Request, env: Env, cors: HeadersInit) {
  const denied = await requireAuth(request, env, cors);
  if (denied) return denied;
  const existing = await env.DB.prepare(`SELECT id FROM holdings WHERE id = ?`).bind(id).first();
  if (!existing) return json({ ok: false, error: 'Not found' }, cors, 404);
  await env.DB.prepare(`DELETE FROM holdings WHERE id = ?`).bind(id).run();
  return json({ ok: true }, cors);
}

function mapJournal(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: row.id,
    investor: row.investor,
    date: row.date,
    title: row.title,
    company: row.company,
    ticker: row.ticker,
    action: row.action,
    confidence: row.confidence,
    thesis: row.thesis,
    does: row.does_text,
    good: row.good,
    wrong: row.wrong,
    learned: row.learned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReport(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: row.id,
    investor: row.investor,
    date: row.date,
    period: row.period,
    title: row.title,
    learned: row.learned,
    wentWell: row.went_well,
    differently: row.differently,
    companies: row.companies,
    next: row.next_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapHolding(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: row.id,
    investor: row.investor,
    company: row.company,
    ticker: row.ticker,
    purchaseDate: row.purchase_date,
    purchasePrice: row.purchase_price,
    currentPrice: row.current_price,
    shares: row.shares,
    sellPrice: row.sell_price,
    sellDate: row.sell_date,
    originalThesis: row.original_thesis,
    relatedJournal: row.related_journal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
