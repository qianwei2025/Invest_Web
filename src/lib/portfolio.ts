import shermanPortfolio from '../data/portfolio/sherman.json';
import royPortfolio from '../data/portfolio/roy.json';
import type { InvestorSlug } from './investors';
import type { HoldingRecord, PortfolioFile } from './portfolio-file';

export type Holding = HoldingRecord;

const portfolios: Record<InvestorSlug, PortfolioFile> = {
  sherman: shermanPortfolio as PortfolioFile,
  roy: royPortfolio as PortfolioFile,
};

/**
 * Version 1: return the price typed into the JSON file.
 * Later, swap the body of this function for a live quote API
 * and set priceSource to "api" in the JSON.
 */
export function getMarkPrice(holding: Holding) {
  if (holding.sellPrice !== null && holding.sellPrice !== undefined) {
    return holding.sellPrice;
  }
  return holding.currentPrice;
}

export function getPortfolio(slug: InvestorSlug) {
  return portfolios[slug];
}

export function computeHolding(holding: Holding) {
  const sold = holding.sellPrice !== null && holding.sellPrice !== undefined;
  const markPrice = getMarkPrice(holding);
  const originalInvestment = holding.purchasePrice * holding.shares;
  const currentValue = markPrice * holding.shares;
  const gain = currentValue - originalInvestment;
  const gainPct = originalInvestment === 0 ? 0 : gain / originalInvestment;

  return {
    ...holding,
    sold,
    status: sold ? 'Sold' : 'Open',
    markPrice,
    originalInvestment,
    currentValue,
    gain,
    gainPct,
  };
}

export type ComputedHolding = ReturnType<typeof computeHolding>;

export function computePortfolio(slug: InvestorSlug) {
  const file = getPortfolio(slug);
  const holdings = file.holdings.map(computeHolding);
  const invested = holdings.reduce((sum, row) => sum + row.originalInvestment, 0);
  const value = holdings.reduce((sum, row) => sum + row.currentValue, 0) + file.cash;
  const gain = holdings.reduce((sum, row) => sum + row.gain, 0);
  const openCount = holdings.filter((row) => !row.sold).length;
  const soldCount = holdings.filter((row) => row.sold).length;

  return {
    ...file,
    holdings,
    invested,
    value,
    gain,
    gainPct: invested === 0 ? 0 : gain / invested,
    openCount,
    soldCount,
  };
}
