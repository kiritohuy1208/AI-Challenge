# CONTEXT.md — Claims Analytics Dashboard

**Version:** 1.4  
**Last Updated:** 2026-06-14  
**Status:** In Development — ready to deploy

---

## 1. Project Overview

### Objective
Build an **interactive claims analytics dashboard** (web UI) that gives an insurance operations team real-time visibility into claims performance — KPIs, charts, global filters, drill-down, and an exportable claims table — powered by a generated dataset of 5,000 claims.

### Problem Statement
The operations team currently exports CSVs and builds Excel reports manually. This is slow, error-prone, and does not support interactive exploration (filtering, drill-down, or synchronized views). They need a single dashboard where all visualizations respond to the same filters and where users can inspect individual claims without leaving the app.

### Solution Approach
A **client-side SPA dashboard** that:
1. Loads a pre-generated CSV of 5,000 claims with realistic distributions
2. Computes five KPI cards from the filtered dataset
3. Renders six chart types with tooltips and readable labels/legends
4. Applies global filters (date range, claim type, insurer, country, status) to all KPIs, charts, and the table simultaneously
5. Supports drill-down from a diagnosis bar chart to a filtered, sortable, paginated claims table
6. Exports the currently filtered table data as CSV
7. Loads in under 3 seconds and adapts layout for desktop and tablet

**Out of scope:** Real backend API, authentication, live data ingestion, database persistence, user accounts, mobile-native apps, real-time WebSocket updates, editing or submitting claims, CI/CD pipelines (unless added later for deployment convenience).

---

## 2. Tech Stack & Environment

| Category | Choice | Rationale |
|---|---|---|
| Language | TypeScript (strict) | Type-safe claim model, filter state, and chart props |
| Framework | React 18+ | Component model fits dashboard layout and filter-driven re-renders |
| Build tool | Vite | Fast dev server; efficient bundling for < 3s load target |
| Styling | Tailwind CSS | Responsive grid/flex layout for desktop and tablet |
| Charts | Recharts | React-native chart components; pie, line, bar, histogram, tooltips |
| Data loading | Papa Parse | Parse CSV in browser; fast for 5,000 rows |
| Table | TanStack Table v8 | Sortable columns, pagination, headless UI control |
| Date handling | date-fns | Date range filtering, week/month grouping, processing-time math |
| CSV export | Papa Parse (unparse) | Export filtered rows matching active filters |
| Dataset generation | Node.js script (`scripts/generate-claims.ts`) | Reproducible 5,000-row dataset committed to repo |
| State / filters | React `useState` + `useMemo` | Global filter context; derived KPI/chart/table data memoized |
| Testing | Manual + `npm run build` | Challenge scope; verify KPI math and filter sync manually |
| Deployment | Vercel / Netlify / GitHub Pages | Free static hosting (submission requirement) |
| Node | ≥ 18.x | Vite, dataset script, modern tooling |

**Not in scope:** Backend server, PostgreSQL/SQLite, Redux/Zustand (filter state is local/context-only), automated test suite, server-side CSV generation at runtime.

---

## 3. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INPUT LAYER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  data/claims.csv          — 5,000 pre-generated claims (committed)    │
│  scripts/generate-claims  — Node script to regenerate CSV if needed     │
│  User filter controls     — date range, claim type, insurer, country,   │
│                             status (UI selects / date pickers)          │
│  Chart click (drill-down) — diagnosis_icd10 code from bar chart         │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                    STATE / CORE LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  FilterContext (or root state):                                         │
│  - dateFrom, dateTo (submitted_date range)                              │
│  - claimTypes[], insurers[], countries[], statuses[] (multi-select)     │
│  - drillDownDiagnosis: string | null (from chart click)                   │
│  Raw claims[] — parsed once on load from CSV                            │
│  filteredClaims = applyFilters(raw, filters, drillDownDiagnosis)          │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                      PROCESSING LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  useFilteredClaims     → subset matching all active filters             │
│  computeKPIs           → count, approval rate, avg processing days,     │
│                          total approved amount, avg claim amount        │
│  aggregateForCharts    → status counts, time series, top-10 diagnoses,  │
│                          processing-time buckets, approval by insurer   │
│  tableData             → paginated/sorted slice of filteredClaims       │
│  exportCSV             → unparse filteredClaims → download              │
│  Rule: any filter change recomputes ALL KPIs, charts, and table         │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                         OUTPUT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  KPI Cards (5 metrics)                                                  │
│  Charts (6 visualizations with tooltips)                                │
│  Claims Data Table (sort, paginate, drill-down filter)                  │
│  CSV file download (filtered subset)                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### State / Schema / Contracts

#### Application State (UI / client)

| Field | Type | Scope | Notes |
|---|---|---|---|
| `claims` | `Claim[]` | global | Loaded once from CSV on mount |
| `isLoading` | `boolean` | global | True until CSV parse completes |
| `dateFrom` | `Date \| null` | global filter | Inclusive lower bound on `submitted_date` |
| `dateTo` | `Date \| null` | global filter | Inclusive upper bound on `submitted_date` |
| `claimTypes` | `ClaimType[]` | global filter | Empty = all types selected |
| `insurers` | `string[]` | global filter | Empty = all insurers |
| `countries` | `Country[]` | global filter | Empty = all countries |
| `statuses` | `ClaimStatus[]` | global filter | Empty = all statuses |
| `drillDownDiagnosis` | `string \| null` | drill-down | Set on diagnosis bar click; clears on reset |
| `timeGrouping` | `'week' \| 'month'` | chart control | Claims-over-time line chart only |
| `tableSort` | `{ id, desc }` | table | TanStack Table sorting state |
| `tablePageIndex` | `number` | table | Current page (0-based) |
| `tablePageSize` | `number` | table | Default 25 |

#### Claim Record Schema (CSV / domain model)

| Field | Type | Notes |
|---|---|---|
| `claim_id` | `string` | Format `CLM-NNNNN` |
| `policy_id` | `string` | Format `POL-NNNNN` |
| `member_name` | `string` | Realistic names |
| `claim_type` | enum | `OUTPATIENT`, `INPATIENT`, `DENTAL`, `MATERNITY` |
| `diagnosis_icd10` | `string` | One of 20 common ICD-10 codes |
| `submitted_amount` | `number` | 500–2,000,000; skewed distribution |
| `approved_amount` | `number` | `0` if rejected; else ≤ `submitted_amount` |
| `status` | enum | `APPROVED`, `REJECTED`, `PENDING`, `IN_REVIEW` |
| `submitted_date` | `Date` | Spread across 12 months of 2024 |
| `processed_date` | `Date \| null` | 1–30 days after submitted; `null` if `PENDING` |
| `assessor` | `string` | One of 5 assessor names |
| `insurer` | `string` | One of 3 insurer names |
| `country` | `string` | `Thailand`, `Vietnam`, `Hong Kong` |

### Key Entry Points

| File / Module | Role |
|---|---|
| `src/main.tsx` | App bootstrap |
| `src/App.tsx` | Dashboard shell; filter provider wrapper |
| `src/hooks/useClaimsData.ts` | Load and parse CSV into `Claim[]` |
| `src/hooks/useFilteredClaims.ts` | Apply global filters + drill-down |
| `src/utils/kpiCalculations.ts` | KPI metric formulas |
| `src/utils/parseClaimRow.ts` | CSV row → `Claim` type coercion |
| `src/utils/filterClaims.ts` | Pure global-filter + drill-down function |
| `scripts/generate-claims.ts` | Generate `data/claims.csv` |
| `data/claims.csv` | Committed dataset (5,000 rows) |
| `public/claims.csv` | Runtime fetch target for dashboard |

---

## 4. Glossary & Core Concepts

| Term | Definition |
|---|---|
| **Claim** | A single insurance reimbursement request with submitted/approved amounts, status, dates, and metadata. |
| **KPI** | Key Performance Indicator — aggregated metric shown in top summary cards. |
| **Approval rate** | Percentage of claims with status `APPROVED` among filtered claims (see Section 6 for exact formula). |
| **Processing time** | Days between `submitted_date` and `processed_date`; undefined for `PENDING` claims. |
| **Global filter** | A filter control that simultaneously affects all KPIs, charts, and the data table. |
| **Drill-down** | Clicking a diagnosis bar chart filters the table below to claims with that ICD-10 code. |
| **ICD-10** | International Classification of Diseases, 10th revision — diagnosis code on each claim. |
| **Skewed distribution** | Dataset generation bias: most claims are small amounts; few are very large. |
| **Filtered export** | CSV download contains only rows matching current global filters (and drill-down if active). |

### Domain Reference Tables

| Claim Type | Typical Share (generation target) |
|---|---|
| OUTPATIENT | Majority (~60%+) |
| INPATIENT | Moderate |
| DENTAL | Moderate |
| MATERNITY | Minority |

| Status | `processed_date` | `approved_amount` |
|---|---|---|
| APPROVED | Set (1–30 days after submit) | > 0, ≤ submitted |
| REJECTED | Set | 0 |
| PENDING | null | ≤ submitted (typically partial or 0) |
| IN_REVIEW | Set or per generator rules | ≤ submitted |

| Insurer (3) | Country (3) | Assessor (5) |
|---|---|---|
| Fixed name pool | Thailand, Vietnam, Hong Kong | Fixed name pool |

---

## 5. File Structure

```
AI_Challenge_09/
│
├── CONTEXT.md                          # This file — project source of truth
├── README.md                           # Setup, scripts, live URL
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
│
├── data/
│   └── claims.csv                      # Generated 5,000-row dataset (committed)
│
├── scripts/
│   └── generate-claims.ts              # Regenerate CSV with realistic distributions
│
├── src/
│   ├── main.tsx                        # React entry
│   ├── App.tsx                         # Dashboard layout + filter provider
│   ├── index.css                       # Tailwind imports
│   │
│   ├── types/
│   │   └── claim.ts                    # Claim, ClaimType, ClaimStatus, FilterState
│   │
│   ├── context/
│   │   └── FilterContext.tsx           # Global filter state + drill-down
│   │
│   ├── hooks/
│   │   ├── useClaimsData.ts            # Load/parse CSV on mount
│   │   └── useFilteredClaims.ts        # Memoized filtered claim list
│   │
│   ├── utils/
│   │   ├── kpiCalculations.ts          # KPI formulas + formatters
│   │   ├── parseClaimRow.ts            # CSV row coercion
│   │   ├── filterClaims.ts             # Pure filter function
│   │   ├── processingTime.ts           # Days between dates; exclude PENDING
│   │   ├── chartAggregations.ts        # Chart data grouping/top-N/buckets (Phase 2)
│   │   └── exportCsv.ts                # Download filtered rows as CSV (Phase 3)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── DashboardLayout.tsx     # Responsive grid shell
│   │   ├── filters/
│   │   │   └── GlobalFilters.tsx       # Date range + multi-selects
│   │   ├── kpi/
│   │   │   └── KpiCards.tsx            # Five metric cards
│   │   ├── charts/
│   │   │   ├── ClaimsByStatusChart.tsx       # Pie/donut
│   │   │   ├── ClaimsOverTimeChart.tsx       # Line (week/month toggle)
│   │   │   ├── TopDiagnosesByCountChart.tsx  # Horizontal bar (top 10)
│   │   │   ├── TopDiagnosesByCostChart.tsx   # Horizontal bar (top 10)
│   │   │   ├── ProcessingTimeChart.tsx       # Histogram
│   │   │   └── ApprovalRateByInsurerChart.tsx # Grouped bar
│   │   └── table/
│   │       └── ClaimsTable.tsx         # Sortable, paginated, export button
│   │
│   └── data/
│       └── icd10-codes.ts              # 20 common ICD-10 codes for generator reference
│
├── context/                            # Challenge requirements & AI prompts
│   ├── requirement.md
│   └── prompts/
│
└── public/                             # Static assets if needed
```

---

## 6. Business Rules & Logic

### 6.1 Order of Operations

| Order | Action | Gate / Condition |
|---|---|---|
| 1 | Generate or load `claims.csv` | 5,000 rows; schema and distributions per requirements |
| 2 | Parse CSV on app mount | Block dashboard until parse completes or show loading state |
| 3 | Initialize filters to "all" (no restriction) | Default date range = full 2024 or min/max in data |
| 4 | Compute `filteredClaims` from raw claims + active filters + drill-down | Re-run on any filter or drill-down change |
| 5 | Derive KPIs from `filteredClaims` | Same subset for all five cards |
| 6 | Aggregate chart series from `filteredClaims` | Each chart uses identical filtered set |
| 7 | Render table from `filteredClaims` | Sort + paginate client-side |
| 8 | On diagnosis bar click | Set `drillDownDiagnosis`; table filters further |
| 9 | On CSV export | Export current `filteredClaims` (includes drill-down) |

### 6.2 Dataset Generation Rules

| Rule | Detail |
|---|---|
| Row count | Exactly 5,000 claims |
| `claim_id` format | `CLM-` + zero-padded numeric (e.g. `CLM-00001`) |
| `policy_id` format | `POL-` + zero-padded numeric |
| `claim_type` | Random from 4 enums; **most claims outpatient** |
| `diagnosis_icd10` | Random from pool of **20 common ICD-10 codes** |
| `submitted_amount` | Range 500–2,000,000; **skewed** — majority small, few large |
| `status` | Random with **~15% rejection rate** (`REJECTED`) |
| `approved_amount` | `0` if `REJECTED`; otherwise ≤ `submitted_amount` |
| `submitted_date` | Uniform spread across **12 months of 2024** |
| `processed_date` | If not `PENDING`: 1–30 days after `submitted_date`; **avg ~7 days**; `null` if `PENDING` |
| `assessor` | Random from **5 names** |
| `insurer` | Random from **3 names** |
| `country` | Random from Thailand, Vietnam, Hong Kong |

### 6.3 KPI Calculations

| KPI | Formula | Notes |
|---|---|---|
| Total claims count | `filteredClaims.length` | Integer |
| Approval rate (%) | `(count status === APPROVED) / (count status !== PENDING) * 100` | Exclude `PENDING` from denominator; display 1 decimal |
| Average processing time (days) | Mean of `(processed_date - submitted_date)` in days | **Exclude** claims where `processed_date` is null |
| Total approved amount | Sum of `approved_amount` for all filtered claims | Currency formatting |
| Average claim amount | Mean of `submitted_amount` over filtered claims | Currency formatting |

### 6.4 Validation Rules

| Field / Input | Rule | Error behavior |
|---|---|---|
| CSV parse | All required columns present; types coercible | Show error banner; empty dashboard |
| Date range filter | `dateFrom` ≤ `dateTo` when both set | Swap or clamp invalid range |
| Multi-select filters | Empty selection = no filter (show all) | Do not treat empty as "match nothing" |
| Table page | Page index resets when filters change | Avoid empty page after filter shrink |
| Export | At least 0 rows allowed | Download headers-only or disable button with message |

### 6.5 Conditional Logic

| Condition | When true | When false |
|---|---|---|
| `drillDownDiagnosis` set | Table shows only claims with that ICD-10 code (within global filters) | Table shows all globally filtered claims |
| `status === PENDING` | Exclude from processing-time averages and histogram | Include in count/status charts |
| `status === REJECTED` | `approved_amount === 0` | N/A |
| `timeGrouping === 'week'` | Group claims-over-time by ISO week of `submitted_date` | Group by calendar month |
| Filter change | Clear drill-down **optional** — prefer **keep drill-down** unless diagnosis no longer in filtered set; then clear |

### 6.6 Chart Specifications

| Chart | Data source | Interaction |
|---|---|---|
| Claims by status | Count by `status` | Tooltip: count + % of filtered total |
| Claims over time | Count by week or month of `submitted_date` | Tooltip: period label + count; toggle week/month |
| Top 10 diagnoses (frequency) | Count by `diagnosis_icd10`, take top 10 | **Click bar → drill-down table**; tooltip: code + count |
| Top 10 diagnoses (cost) | Sum `submitted_amount` by diagnosis, top 10 | Tooltip: code + total cost; click optional for drill-down |
| Processing time distribution | Histogram buckets (e.g. 0–3, 4–7, 8–14, 15–30 days) | Exclude null `processed_date`; tooltip: bucket + count |
| Approval rate by insurer | Per insurer: approved / (approved + rejected + in_review) × 100 | Tooltip: insurer + rate + counts |

### 6.7 UX & Accessibility

| Requirement | Implementation |
|---|---|
| Responsive layout | CSS grid: KPI row → filters → 2-column charts on desktop; single column on tablet |
| Chart readability | Axis labels, legends, sufficient contrast; format large numbers (K/M) |
| Tooltips | Recharts `Tooltip` on all chart elements |
| Table | Column headers clickable for sort; pagination controls |
| Keyboard | Filter controls and table navigable via Tab |
| Loading | Skeleton or spinner until CSV parsed; target **< 3 seconds** total load |
| Drill-down affordance | Visual highlight on selected diagnosis bar; "Clear drill-down" control |

### 6.8 Edge Cases

| Scenario | Expected Behavior |
|---|---|
| All filters exclude every claim | KPIs show 0; charts empty state; table "No claims"; export empty/minimal |
| Only PENDING claims in filter | Approval rate N/A or 0%; processing time KPI shows "—" or 0 with note |
| Drill-down diagnosis not in filtered set | Auto-clear drill-down or show empty table with message |
| Single insurer selected | Approval-by-insurer chart shows one bar |
| Date range outside 2024 | Valid if user selects; may yield zero rows |
| Very large amounts in data | Format with locale separators; axis abbreviations |
| Rapid filter changes | Memoization prevents unnecessary full re-parse; only re-filter |
| CSV regeneration | Running script overwrites `data/claims.csv`; commit updated file |

---

## 7. Current Progress & Next Steps

### Completed
- [x] Project initiation
  - [x] Requirements captured in `context/requirement.md`
  - [x] `CONTEXT.md` generated
- [x] **Phase 0 — Scaffold & dataset**
  - [x] Vite + React + TypeScript scaffold
  - [x] Added Recharts, Papa Parse, TanStack Table, date-fns, lucide-react, tsx
  - [x] `scripts/generate-claims.ts` + `data/claims.csv` (5,000 rows)
  - [x] `public/claims.csv` copy for runtime fetch
  - [x] `src/data/icd10-codes.ts` — 20 ICD-10 codes
  - Chose native `fs` for CSV output; `tsx` to run generator without compile step
- [x] **Phase 1 — Core dashboard (partial)**
  - [x] `src/types/claim.ts` — Claim, enums, FilterState, KpiMetrics
  - [x] `src/hooks/useClaimsData.ts` — PapaParse fetch `/claims.csv`, loading/error state
  - [x] `src/utils/parseClaimRow.ts` — string → Date/number coercion
  - [x] `src/context/FilterContext.tsx` — global filter state + drill-down setter
  - [x] `src/hooks/useFilteredClaims.ts` — memoized `filterClaims` wrapper
  - [x] `src/utils/filterClaims.ts`, `processingTime.ts`, `kpiCalculations.ts`
  - [x] `src/components/kpi/KpiCards.tsx` — 5 KPIs with currency/percent formatting
  - [x] `src/App.tsx` — FilterProvider + loading state + KPI shell
  - Pure filter/KPI utils kept outside components for reuse by charts and table in later phases
- [x] **Phase 2 — Charts**
  - [x] `src/utils/chartAggregations.ts` — all six chart aggregations + status colors
  - [x] `src/components/charts/DashboardCharts.tsx` — donut, line, 2× horizontal bar, histogram, insurer bar
  - [x] Week/month toggle on claims-over-time via `FilterContext.timeGrouping`
  - [x] Diagnosis frequency bar `onClick` → `setDrillDownDiagnosis`; highlight + clear banner
  - [x] Custom `<Tooltip />` on every chart; responsive 2-column CSS grid
  - Aggregations memoized in component; drill-down auto-clears when diagnosis leaves filtered set
- [x] **Phase 3 — Table & export**
  - [x] `src/components/table/ClaimsTable.tsx` — TanStack Table v8, 11 columns, sortable headers
  - [x] Pagination 25 rows/page; `tablePageIndex` in `FilterContext` resets on filter/drill-down change
  - [x] Drill-down banner above table with Clear button; chart banner removed (table owns drill-down UX)
  - [x] `src/utils/exportCsv.ts` — `Papa.unparse` exports full **filtered** dataset (not current page only)
  - Controlled pagination + clamp effect when filtered row count shrinks
- [x] **Phase 1 — Global filters** (completed in Phase 4 assembly)
  - [x] `src/components/filters/GlobalFilters.tsx` — date range + checkbox groups; empty selection = all
- [x] **Phase 4 — Polish & deploy**
  - [x] `src/components/layout/DashboardLayout.tsx` — KPI → filters → charts → table
  - [x] `src/components/layout/LoadingSkeleton.tsx` — blocks dashboard until CSV parsed
  - [x] `src/App.tsx` — `FilterProvider` → `DashboardShell` (loading/error/layout)
  - [x] Responsive CSS grid/flex; `overflow-x: hidden` on body; table scroll contained
  - [x] Filter inputs keyboard-accessible (`tabIndex`, labels, focus styles)
  - [x] `README.md` — setup, scripts, deploy instructions
  - Build ~5.7s; production bundle loads CSV client-side in < 3s target on dev

### In Progress
- [ ] Deploy to Vercel/Netlify and add live URL to README

### To Do

**Submission**
- [ ] Push to GitHub
- [ ] Deploy and record live URL in README
- [ ] Manual QA pass: KPI math, filter sync, drill-down, export

### Timeline Estimate

| Phase | Status | Estimate |
|---|---|---|
| Phase 0 — Scaffold & dataset | Done | 45–60 min |
| Phase 1 — Core dashboard | Done | 60–75 min |
| Phase 2 — Charts | Done | 90–120 min |
| Phase 3 — Table & export | Done | 45–60 min |
| Phase 4 — Polish & deploy | Done | 30–45 min |
| **Total** | — | **3–5 hours** (matches challenge estimate) |

---

## 8. Key Decisions & Constraints

1. **Client-side only architecture** — No backend; CSV is loaded and parsed in the browser. Keeps deployment free and meets the static hosting requirement.

2. **Pre-generated committed CSV** — Dataset is generated via a Node script and committed to the repo rather than generated at runtime, ensuring reproducible evaluation and faster first paint.

3. **Empty multi-select = all** — When no claim types (or other multi-selects) are chosen, treat as "no restriction" rather than "match nothing," avoiding confusing empty dashboards on first load.

4. **Approval rate excludes PENDING** — Pending claims are not yet decided; including them would deflate the rate. Denominator is decided claims only (`APPROVED`, `REJECTED`, `IN_REVIEW`).

5. **Processing time excludes PENDING** — Claims without `processed_date` cannot compute duration; excluded from average and histogram per domain logic.

6. **Recharts for visualization** — Chosen for React integration, tooltip support, and coverage of pie, line, bar, and histogram patterns required by the challenge.

7. **TanStack Table for data grid** — Headless sorting and pagination without heavy UI dependencies; pairs well with Tailwind styling.

8. **Drill-down from frequency chart only (required)** — Requirement explicitly specifies click on diagnosis bar → table; cost chart drill-down is optional enhancement.

9. **KPI and chart sync is mandatory** — Any filter change must recompute all derived views from the same `filteredClaims` array; no chart may use stale or partial filter state.

10. **Performance budget** — Full dashboard interactive load < 3 seconds on typical hardware; use single CSV parse, memoized aggregations, and avoid re-parsing on filter changes.

11. **Pure filter/KPI modules** — `filterClaims.ts` and `kpiCalculations.ts` are shared by KPI cards, charts, and table; components receive `filteredClaims` or call utils — no duplicated business logic.

12. **CSV served from `public/claims.csv`** — Vite static asset path `/claims.csv`; `data/claims.csv` remains source-of-truth copy regenerated by script.

13. **KPI null states** — When no decided claims exist, approval rate shows `—`; when no processed dates exist, avg processing time shows `—` (Section 6.8 edge case).

14. **Chart aggregations centralized** — All six chart transforms live in `chartAggregations.ts`; `DashboardCharts` only memoizes and renders — keeps Phase 3 table/export aligned with same filter input.

15. **Drill-down toggle on bar click** — Clicking the same diagnosis bar again clears drill-down; banner provides explicit clear control ahead of Phase 3 table.

16. **Export uses full filtered set** — CSV download includes all rows matching active filters + drill-down, not just the current table page.

17. **Table pagination in FilterContext** — Page index resets to 0 on any filter/drill-down change; `ClaimsTable` clamps page when row count shrinks below current page.

18. **DashboardLayout assembly** — Single flex column: header → KPI → GlobalFilters → charts (2-col grid) → table; loading skeleton mirrors structure and prevents undefined data access.

19. **No main-window horizontal scroll** — `overflow-x: hidden` on body/`#root`; wide table scrolls inside `.table-scroll` only.

---

## 9. Notes for Future AI Sessions

1. **Read this file first** — Source of truth for business rules, KPI formulas, and file structure.

2. **Check Section 6 before writing logic** — KPI calculations, filter semantics, dataset generation rules, and edge cases are authoritative.

3. **Check Section 7 for current state** — Do not redo completed work; continue from the listed next step.

4. **Update Sections 7 & 8 after each milestone** — Record what changed, new files/deps, rationale, and immediate next step.

5. **Single filtered source** — All KPIs, charts, and table must derive from one `filteredClaims` computation; never duplicate filter logic in individual components.

6. **Do not invent features** — No auth, backend API, or live data feeds unless requirements change.

7. **Include dataset in repo** — `data/claims.csv` must be committed; document regeneration via `npm run generate-data` (or equivalent) in README.

8. **Verify KPI math manually** — Spot-check approval rate and processing time against a small filtered subset before marking Phase 1 complete.

9. **Run locally:** `npm install && npm run dev` (after scaffold); `npm run generate-data` to regenerate CSV.

10. **Bump version and date** in the header when making substantive updates to this document.

---

**Next Step:** Push to GitHub, deploy to Vercel/Netlify, and add the live URL to `README.md`.
