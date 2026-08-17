CREATE TABLE IF NOT EXISTS journals (
  id TEXT PRIMARY KEY,
  investor TEXT NOT NULL,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  ticker TEXT NOT NULL,
  action TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  thesis TEXT NOT NULL,
  does_text TEXT NOT NULL DEFAULT '',
  good TEXT NOT NULL DEFAULT '',
  wrong TEXT NOT NULL DEFAULT '',
  learned TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_journals_investor_date ON journals (investor, date DESC);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  investor TEXT NOT NULL,
  date TEXT NOT NULL,
  period TEXT NOT NULL,
  title TEXT NOT NULL,
  learned TEXT NOT NULL DEFAULT '',
  went_well TEXT NOT NULL DEFAULT '',
  differently TEXT NOT NULL DEFAULT '',
  companies TEXT NOT NULL DEFAULT '',
  next_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_investor_date ON reports (investor, date DESC);

CREATE TABLE IF NOT EXISTS holdings (
  id TEXT PRIMARY KEY,
  investor TEXT NOT NULL,
  company TEXT NOT NULL,
  ticker TEXT NOT NULL,
  purchase_date TEXT NOT NULL,
  purchase_price REAL NOT NULL,
  current_price REAL NOT NULL,
  shares REAL NOT NULL,
  sell_price REAL,
  sell_date TEXT,
  original_thesis TEXT NOT NULL DEFAULT '',
  related_journal TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_holdings_investor ON holdings (investor, purchase_date DESC);
