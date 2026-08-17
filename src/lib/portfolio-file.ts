export type HoldingInput = {
  investor: 'sherman' | 'roy';
  company: string;
  ticker: string;
  purchaseDate: string;
  purchasePrice: number;
  currentPrice: number;
  shares: number;
  sellPrice?: number | null;
  sellDate?: string | null;
  originalThesis?: string;
  relatedJournal?: string;
};

export type HoldingRecord = {
  company: string;
  ticker: string;
  purchaseDate: string;
  purchasePrice: number;
  currentPrice: number;
  shares: number;
  sellPrice: number | null;
  sellDate: string | null;
  originalThesis: string;
  relatedJournal: string[];
};

export type PortfolioFile = {
  priceSource: 'manual' | 'api';
  priceUpdatedAt: string;
  cash: number;
  holdings: HoldingRecord[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'TICKER';
}

export function portfolioRelativePath(investor: string) {
  return `src/data/portfolio/${investor}.json`;
}

export function buildHolding(input: HoldingInput): HoldingRecord {
  const ticker = (input.ticker || slugify(input.company)).toUpperCase();
  const sellPrice =
    input.sellPrice === undefined || input.sellPrice === null || Number.isNaN(Number(input.sellPrice))
      ? null
      : Number(input.sellPrice);
  const sellDate = input.sellDate?.trim() ? input.sellDate.trim() : null;

  return {
    company: input.company.trim(),
    ticker,
    purchaseDate: input.purchaseDate,
    purchasePrice: Number(input.purchasePrice),
    currentPrice: Number(input.currentPrice),
    shares: Number(input.shares),
    sellPrice,
    sellDate: sellPrice === null ? null : sellDate,
    originalThesis: (input.originalThesis || '').trim(),
    relatedJournal: input.relatedJournal?.trim() ? [input.relatedJournal.trim()] : [],
  };
}

export function emptyPortfolio(): PortfolioFile {
  return {
    priceSource: 'manual',
    priceUpdatedAt: '',
    cash: 0,
    holdings: [],
  };
}
