# AI-Challenge

A monorepo of insurance-domain coding challenges built with TypeScript. Each project is self-contained with its own dependencies, scripts, and documentation.

**Repository:** [github.com/kiritohuy1208/AI-Challenge](https://github.com/kiritohuy1208/AI-Challenge)

## Projects

| Challenge | Name | Type | Live demo |
|-----------|------|------|-----------|
| [06](./AI_Challenge_06/) | Policy Benefits Calculator | Node.js / CLI engine | — |
| [07](./AI_Challenge_07/) | Claims Intake Wizard | React SPA (Vite) | [ai-challenge-07.vercel.app](https://ai-challenge-07.vercel.app) |
| [09](./AI_Challenge_09/) | Claims Analytics Dashboard | React SPA (Vite) | [ai-challenge-09.vercel.app](https://ai-challenge-09.vercel.app) |

## Repository structure

```
AI-Challenge/
├── AI_Challenge_06/       # Policy benefits calculation engine
├── AI_Challenge_07/       # Multi-step claim submission wizard
├── AI_Challenge_09/       # Claims analytics dashboard
└── Logical_Question/      # Written logical reasoning answers
```

Each challenge folder includes:

- `README.md` — setup and usage for that project
- `CONTEXT.md` — architecture, business rules, and implementation notes
- `context/requirement.md` — original challenge requirements

## Prerequisites

- **Node.js** 18 or later
- **npm** (bundled with Node)

Install dependencies per project — there is no root-level `package.json`.

```bash
cd AI_Challenge_07   # or 06, 09
npm install
```

---

## AI Challenge 06 — Policy Benefits Calculator

A TypeScript engine that computes insurance coverage for medical expenses. Processes claims chronologically through a fixed 7-step rule pipeline: exclusions, waiting periods, deductibles, sub-limits, copays, and annual limits.

**Stack:** TypeScript, Node.js, Jest

```bash
cd AI_Challenge_06
npm install
npm test          # 18 unit tests
npm start         # run calculator → output/
npm run build     # compile TypeScript
```

See [AI_Challenge_06/README.md](./AI_Challenge_06/README.md) for API usage, policy configuration, and test scenarios.

---

## AI Challenge 07 — Claims Intake Wizard

A responsive 5-step wizard for submitting outpatient, inpatient, or dental insurance claims. Includes ICD-10 autocomplete, conditional fields by claim type, document uploads with validation, and a review step with mock submission.

**Stack:** React 19, TypeScript, Vite 8, Tailwind CSS v4, react-hook-form, Zod

```bash
cd AI_Challenge_07
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build
npm run preview   # serve dist/ locally
```

**Live demo:** [https://ai-challenge-07.vercel.app](https://ai-challenge-07.vercel.app)

See [AI_Challenge_07/README.md](./AI_Challenge_07/README.md) and [AI_Challenge_07/CONTEXT.md](./AI_Challenge_07/CONTEXT.md).

---

## AI Challenge 09 — Claims Analytics Dashboard

An interactive dashboard for insurance operations teams. Loads 5,000 claims from CSV and provides KPIs, six chart types, global filters, drill-down to a sortable table, and CSV export.

**Stack:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Recharts, TanStack Table, Papa Parse

```bash
cd AI_Challenge_09
npm install
npm run generate-data   # optional — regenerate data/claims.csv
npm run dev             # http://localhost:5173
npm run dev:fixture     # 16-row fixture for manual KPI checks
npm run build
```

**Live demo:** [https://ai-challenge-09.vercel.app](https://ai-challenge-09.vercel.app)

See [AI_Challenge_09/README.md](./AI_Challenge_09/README.md) and [AI_Challenge_09/CONTEXT.md](./AI_Challenge_09/CONTEXT.md).

---

## Logical Questions

Written answers to logical reasoning prompts (Vietnamese), covering everyday decision-making scenarios such as queue positioning, cooling drinks, and process optimization.

See [Logical_Question/Logical quesitons.md](./Logical_Question/Logical%20quesitons.md).

---

## Deployment

Challenges 07 and 09 are deployed as static SPAs on Vercel. To deploy either project:

```bash
cd AI_Challenge_07   # or AI_Challenge_09
npm run build
```

Publish the `dist/` folder. On Vercel, use the **Vite** framework preset with build command `npm run build` and output directory `dist`.

For Challenge 09, ensure `public/claims.csv` exists before building (`npm run generate-data` if missing).

---

## Documentation

| Resource | Description |
|----------|-------------|
| Per-project `README.md` | Setup, scripts, and quick start |
| Per-project `CONTEXT.md` | Architecture, business rules, progress log |
| `context/requirement.md` | Original challenge brief in each project |

When extending a project, read its `CONTEXT.md` first — it is the source of truth for design decisions and implementation status.
