# Shen Journal

A long-term investment **learning** website for Sherman Shen and Roy Shen. It is a research notebook, not a scoreboard.

The goal is not to beat the market. The goal is to learn how to think.

This README is the Version 1 architecture. The site is already implemented from it.

## Recommended tech stack

| Choice | Why |
| --- | --- |
| **Astro** | Static HTML. Easy to read. Markdown in, website out. Kids can add a `.md` file without touching a database. |
| **Markdown** | Journals and reports stay human-readable for 10+ years. |
| **JSON** | Portfolio holdings are structured, still editable in a text editor. |
| **Plain CSS** | No design framework to learn first. Colors and type live in `src/styles/global.css`. |
| **GitHub Pages** | Free hosting, no AWS, no server to patch. |

Later, without a rewrite:

- Live prices: change `getCurrentPrice()` in `src/lib/portfolio.ts`
- Extra pages: add a file under `src/pages/`
- Interactive widgets: Astro can include a small island of JavaScript when the boys are ready

## Folder structure

```text
Invest_Web/
├── public/images/              # photos and illustrations
├── src/
│   ├── content/
│   │   ├── journal/sherman/    # one .md file per company journal
│   │   ├── journal/roy/
│   │   ├── reports/sherman/    # learning reports for any period
│   │   ├── reports/roy/
│   │   └── research/           # optional; not in main nav
│   ├── data/portfolio/         # holdings JSON
│   ├── lib/                    # small helpers (dates, money, paths)
│   ├── components/             # header, cards, table
│   ├── layouts/                # shared page shell
│   ├── pages/                  # each file becomes a URL
│   └── styles/global.css
├── .github/workflows/deploy.yml
└── astro.config.mjs
```

## Data structure

### Journal (`src/content/journal/{sherman|roy}/YYYY-MM-DD-company.md`)

One company at a time. Use this when researching a stock.

```yaml
---
investor: sherman          # sherman | roy
date: 2026-02-20
title: Microsoft is bigger than Minecraft
company: Microsoft
ticker: MSFT
action: Watch              # Buy | Hold | Sell | Watch
confidence: 3              # 1–5
relatedResearch: microsoft
---
```

The body uses the same headings every time:

- My Thesis
- What Does This Company Actually Do?
- Why Might This Be a Good Investment?
- What Could Go Wrong?
- What Did I Learn While Researching It?
- Future Reflection (fill in months later)

Future reflections stay **in the original file**. That is how growth stays attached to the first idea.

### Report (`src/content/reports/{sherman|roy}/YYYY-MM-DD-period.md`)

Summarize learning for **any** period — a week, a month, a year, a summer, or “after three trades.” No fixed cadence.

```yaml
---
investor: roy
date: 2026-08-16
period: "August 2026"
title: What I learned this month
---
```

Add from the site: **Reports → Add a report**.

### Portfolio holding (`src/data/portfolio/{sherman|roy}.json`)

Kids can add holdings in the browser after family log in:

**Portfolio → Add a holding**

Fields: company, ticker, buy date, buy price, shares, current price, sell price (if sold), sell date (optional), thesis.

The site calculates:

- return for each stock: `(exit price − buy price) × shares`
- exit price = sell price if sold, otherwise current price
- total invested, total value, and total return across all holdings

```json
{
  "priceSource": "manual",
  "priceUpdatedAt": "2026-08-16",
  "cash": 0,
  "holdings": [
    {
      "company": "Costco Wholesale",
      "ticker": "COST",
      "purchaseDate": "2026-01-20",
      "purchasePrice": 920.0,
      "currentPrice": 948.5,
      "shares": 1,
      "sellPrice": null,
      "sellDate": null,
      "originalThesis": "People keep going back...",
      "relatedJournal": ["2026-01-12-costco"]
    }
  ]
}
```

Original investment, current value, and gain/loss are calculated in code. Do not type those in.

## Custom domain (sr-investing.com)

Yes — you can keep GitHub Pages hosting and use a real `.com`.

1. Buy **sr-investing.com** at [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/).
2. In Cloudflare DNS for that domain, add (Proxy status: **DNS only**):

| Type | Name | Content |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `qianwei2025.github.io` |

3. On GitHub: **Settings → Pages → Custom domain** → enter `sr-investing.com` → Save → wait for DNS check → turn on **Enforce HTTPS**.
4. Also set Pages source to **GitHub Actions** if it is not already.

This repo already includes `public/CNAME` with `sr-investing.com`.

Temporary URL until the domain works: `https://qianwei2025.github.io/Invest_Web/` (only after Pages is enabled).

## Deployment

1. Create a GitHub repository named `Invest_Web` (or change `PUBLIC_BASE` in `.github/workflows/deploy.yml`).
2. Push this project to the `main` branch.
3. In GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The workflow builds the static site and publishes it.

Local preview:

```bash
npm install
npm run dev
```

Then open [http://localhost:4321](http://localhost:4321).

If the GitHub repo name is not `Invest_Web`, edit `PUBLIC_BASE` in the workflow (for a user site like `username.github.io`, use `PUBLIC_BASE: /`).

## Estimated ongoing cost

**$0 / year** for Version 1.

GitHub Pages, GitHub Actions (for this size of site), and Markdown files in git are free. Images live in the repo. There is no database and no cloud bill.

Optional later costs, only if you choose them: a custom domain (~$10–20/year) or a paid stock-quote API.

## Who can see what

- **Public:** homepage, profiles, journals, reports, portfolios, compare.
- **Family:** adding journals, reports, and holdings after log in.

Anyone can read the public pages. To add writing on **https://sr-investing.com**:

1. Click **Family log in**.
2. Use the family email and password.
3. Pick Sherman or Roy.
4. Click **Add a journal**, **Add a report**, or **Add a holding**, then **Save**.

Entries are stored in a Cloudflare D1 database via `api.sr-investing.com`. They show up on the live site right away (no git push required for writing).

Simple rule: new company idea → **Journal**. End of a learning stretch → **Report**.

The login is only a simple gate. It is **not** brokerage security. Never reuse the family password on email or financial accounts.

## API (Cloudflare Worker + D1)

The save/read API lives in `worker/`. Deploy steps (one-time):

```bash
npx wrangler login
npx wrangler d1 create sr-investing
# put the database_id into worker/wrangler.toml
npm run api:db
npx wrangler secret put SESSION_SECRET --config worker/wrangler.toml
npm run api:deploy
```

Then in Cloudflare DNS for `sr-investing.com`, either:

- Use the Worker URL directly (already configured): `https://sr-investing-api.srinvesting.workers.dev`
- Or attach custom domain `api.sr-investing.com` in **Workers → sr-investing-api → Triggers → Custom Domains**

If you add a manual `api` DNS record, it must be **Proxied (orange cloud)**. A grey-cloud/DNS-only record will point at GitHub Pages and login will fail.


## Starting empty

The archive starts with no journals, no reports, and no holdings. Sherman and Roy add the first real pages themselves.

## Privacy

Do not add:

- brokerage screenshots
- account numbers
- statement balances
- school names, addresses, or other private family details

Holdings on this site are a learning ledger with hand-typed prices.
