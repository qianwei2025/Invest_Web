import type { InvestorSlug } from './investors';

function base() {
  return import.meta.env.BASE_URL;
}

export function homePath() {
  return base();
}

export function aboutPath() {
  return `${base()}about/`;
}

export function comparePath() {
  return `${base()}compare/`;
}

export function writePath() {
  return loginPath();
}

export function loginPath() {
  return `${base()}login/`;
}

export function newJournalPath(slug: InvestorSlug | string) {
  return `${base()}investors/${slug}/journal/new/`;
}

export function newHoldingPath(slug: InvestorSlug | string) {
  return `${base()}investors/${slug}/portfolio/new/`;
}

export function investorPath(slug: InvestorSlug | string) {
  return `${base()}investors/${slug}/`;
}

export function journalPath(slug: InvestorSlug | string) {
  return `${base()}investors/${slug}/journal/`;
}

export function journalEntryPath(slug: InvestorSlug | string, entrySlug: string) {
  return `${base()}investors/${slug}/journal/${entrySlug}/`;
}

export function portfolioPath(slug: InvestorSlug | string) {
  return `${base()}investors/${slug}/portfolio/`;
}

export function researchPath(slug: InvestorSlug | string) {
  return `${base()}investors/${slug}/research/`;
}

export function researchNotePath(slug: InvestorSlug | string, noteSlug: string) {
  return `${base()}investors/${slug}/research/${noteSlug}/`;
}

export function reportsPath(slug: InvestorSlug | string) {
  return `${base()}investors/${slug}/reports/`;
}

export function reportPath(slug: InvestorSlug | string, reportSlug: string) {
  return `${base()}investors/${slug}/reports/${reportSlug}/`;
}

export function newReportPath(slug: InvestorSlug | string) {
  return `${base()}investors/${slug}/reports/new/`;
}

/** @deprecated Use reportsPath — kept so old links still work. */
export function reflectionsPath(slug: InvestorSlug | string) {
  return reportsPath(slug);
}

/** @deprecated Use reportPath */
export function reflectionPath(slug: InvestorSlug | string, yearSlug: string) {
  return reportPath(slug, yearSlug);
}

export function imagePath(file: string) {
  return `${base()}images/${file}`;
}

export function splitContentId(id: string) {
  const [investor, ...rest] = id.split('/');
  return { investor, slug: rest.join('/') };
}
