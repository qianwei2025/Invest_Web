export type ReportInput = {
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'report';
}

export function reportFilename(input: Pick<ReportInput, 'date' | 'period' | 'title'>) {
  return `${input.date}-${slugify(input.period || input.title)}.md`;
}

export function reportRelativePath(input: ReportInput) {
  return `src/content/reports/${input.investor}/${reportFilename(input)}`;
}

export function buildReportMarkdown(input: ReportInput) {
  const period = input.period.trim();
  const title = input.title.trim() || period;

  const text = `---
investor: ${input.investor}
date: ${input.date}
period: ${JSON.stringify(period)}
title: ${JSON.stringify(title)}
---

## What did I learn?

${input.learned.trim()}

## What went well?

${input.wentWell.trim()}

## What would I do differently?

${input.differently.trim()}

## Companies I thought about

${input.companies.trim()}

## What I want to learn next

${input.next.trim()}
`;

  return {
    filename: reportFilename(input),
    relativePath: reportRelativePath(input),
    slug: reportFilename(input).replace(/\.md$/, ''),
    title,
    period,
    text,
  };
}
