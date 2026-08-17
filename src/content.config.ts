import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const investor = z.enum(['sherman', 'roy']);
const action = z.enum(['Buy', 'Hold', 'Sell', 'Watch']);

/**
 * Company / decision journal. One entry per stock research or trade idea.
 */
const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: z.object({
    investor,
    date: z.coerce.date(),
    title: z.string(),
    company: z.string(),
    ticker: z.string(),
    action,
    confidence: z.number().int().min(1).max(5),
    relatedResearch: z.string().optional(),
  }),
});

/**
 * Optional evergreen company notes. Not required for Version 1.
 */
const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: z.object({
    investor,
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    company: z.string(),
    ticker: z.string(),
    title: z.string(),
  }),
});

/**
 * Time-based learning reports. Period is free text: a week, a month, a year, a summer, etc.
 */
const reports = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reports' }),
  schema: z.object({
    investor,
    date: z.coerce.date(),
    period: z.string(),
    title: z.string(),
  }),
});

export const collections = { journal, research, reports };
