import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import { buildJournalMarkdown } from './src/lib/journal-file';
import {
  buildHolding,
  emptyPortfolio,
  portfolioRelativePath,
} from './src/lib/portfolio-file';
import { buildReportMarkdown } from './src/lib/report-file';

const base = process.env.PUBLIC_BASE || '/';

function matchesApi(url, name) {
  return (
    url === `/api/${name}` ||
    url === `/api/${name}/` ||
    url.endsWith(`/api/${name}`) ||
    url.endsWith(`/api/${name}/`)
  );
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}'));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function familySavePlugin() {
  return {
    name: 'family-save',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (req.method !== 'POST') return next();

        if (matchesApi(url, 'journal')) {
          try {
            const input = await readBody(req);
            if (input.investor !== 'sherman' && input.investor !== 'roy') {
              return sendJson(res, 400, { ok: false, error: 'Pick Sherman or Roy.' });
            }
            if (!input.company?.trim() || !input.date) {
              return sendJson(res, 400, { ok: false, error: 'Company and date are required.' });
            }
            const file = buildJournalMarkdown(input);
            const fullPath = path.join(process.cwd(), file.relativePath);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, file.text, 'utf8');
            return sendJson(res, 200, { ok: true, ...file });
          } catch {
            return sendJson(res, 400, { ok: false, error: 'Could not save the journal.' });
          }
        }

        if (matchesApi(url, 'holding')) {
          try {
            const input = await readBody(req);
            if (input.investor !== 'sherman' && input.investor !== 'roy') {
              return sendJson(res, 400, { ok: false, error: 'Pick Sherman or Roy.' });
            }
            if (!input.company?.trim() || !input.purchaseDate) {
              return sendJson(res, 400, { ok: false, error: 'Company and buy date are required.' });
            }
            if (!(Number(input.purchasePrice) > 0) || !(Number(input.shares) > 0)) {
              return sendJson(res, 400, { ok: false, error: 'Buy price and shares must be greater than zero.' });
            }
            if (!(Number(input.currentPrice) >= 0)) {
              return sendJson(res, 400, { ok: false, error: 'Current price is required.' });
            }

            const relativePath = portfolioRelativePath(input.investor);
            const fullPath = path.join(process.cwd(), relativePath);
            let portfolio = emptyPortfolio();
            if (fs.existsSync(fullPath)) {
              portfolio = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            }
            const holding = buildHolding(input);
            portfolio.holdings = [...(portfolio.holdings || []), holding];
            portfolio.priceSource = 'manual';
            portfolio.priceUpdatedAt = new Date().toISOString().slice(0, 10);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, `${JSON.stringify(portfolio, null, 2)}\n`, 'utf8');
            return sendJson(res, 200, { ok: true, relativePath, holding, portfolio });
          } catch {
            return sendJson(res, 400, { ok: false, error: 'Could not save the holding.' });
          }
        }

        if (matchesApi(url, 'report')) {
          try {
            const input = await readBody(req);
            if (input.investor !== 'sherman' && input.investor !== 'roy') {
              return sendJson(res, 400, { ok: false, error: 'Pick Sherman or Roy.' });
            }
            if (!input.period?.trim() || !input.date || !input.title?.trim()) {
              return sendJson(res, 400, { ok: false, error: 'Period, date, and title are required.' });
            }
            const file = buildReportMarkdown(input);
            const fullPath = path.join(process.cwd(), file.relativePath);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, file.text, 'utf8');
            return sendJson(res, 200, { ok: true, ...file });
          } catch {
            return sendJson(res, 400, { ok: false, error: 'Could not save the report.' });
          }
        }

        return next();
      });
    },
  };
}

export default defineConfig({
  site: 'https://qianweishen.github.io',
  base,
  output: 'static',
  trailingSlash: 'always',
  vite: {
    plugins: [familySavePlugin()],
  },
});
