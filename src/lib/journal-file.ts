export type JournalInput = {
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'company';
}

export function journalFilename(input: Pick<JournalInput, 'date' | 'company'>) {
  return `${input.date}-${slugify(input.company)}.md`;
}

export function journalRelativePath(input: JournalInput) {
  return `src/content/journal/${input.investor}/${journalFilename(input)}`;
}

export function buildJournalMarkdown(input: JournalInput) {
  const ticker = (input.ticker || slugify(input.company)).toUpperCase();
  const title = input.title.trim() || input.company;
  const confidence = Math.min(5, Math.max(1, Number(input.confidence) || 3));
  const related = slugify(input.company);

  const text = `---
investor: ${input.investor}
date: ${input.date}
title: ${JSON.stringify(title)}
company: ${JSON.stringify(input.company.trim())}
ticker: ${JSON.stringify(ticker)}
action: ${input.action}
confidence: ${confidence}
relatedResearch: ${related}
---

## My Thesis

${input.thesis.trim()}

## What Does This Company Actually Do?

${input.does.trim()}

## Why Might This Be a Good Investment?

${input.good.trim()}

## What Could Go Wrong?

${input.wrong.trim()}

## What Did I Learn While Researching It?

${input.learned.trim()}

## Future Reflection

*Come back in a few months and fill this in. Leave it blank until then.*

### What did I get right?

### What did I get wrong?

### Did my original reasoning make sense?

### What would I do differently today?
`;

  return {
    filename: journalFilename(input),
    relativePath: journalRelativePath(input),
    slug: journalFilename(input).replace(/\.md$/, ''),
    ticker,
    title,
    text,
  };
}
