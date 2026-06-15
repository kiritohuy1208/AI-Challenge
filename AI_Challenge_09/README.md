# Claims Analytics Dashboard

Interactive insurance claims analytics dashboard built for AI Challenge 09. Loads 5,000 claims from CSV and provides KPIs, charts, global filters, drill-down, and CSV export.

**Live demo:** [https://ai-challenge-09.vercel.app](https://ai-challenge-09.vercel.app)

## Setup

```bash
npm install
npm run generate-data   # optional — regenerates data/claims.csv and copy to public/
npm run dev
```

Open `http://localhost:5173`.

### Manual testing (16-row fixture)

For easier KPI verification, use the small fixture with documented expected values:

```bash
npm run dev:fixture
```

Uses `.env.fixture` to load `/claims2.csv` (works on Windows, macOS, and Linux).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run generate-data` | Generate 5,000-row claims CSV |

## Deploy

Build static assets and deploy the `dist/` folder to Vercel, Netlify, or GitHub Pages.

```bash
npm run build
```

**Vercel:** import repo, framework preset Vite, deploy.

**Netlify:** build command `npm run build`, publish directory `dist`.

Ensure `public/claims.csv` is present before build (run `npm run generate-data` if missing).

## Live URL

| Link | URL |
|---|---|
| Demo (alias) | [https://ai-challenge-09.vercel.app](https://ai-challenge-09.vercel.app) |
| Production | [https://ai-challenge-09-bc9u9pt74-tohuykiri-4652s-projects.vercel.app](https://ai-challenge-09-bc9u9pt74-tohuykiri-4652s-projects.vercel.app) |

Hosted on [Vercel](https://vercel.com).
