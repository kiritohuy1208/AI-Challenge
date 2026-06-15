# Manual test fixture — `claims2.csv`

16 hand-picked claims covering every enum, edge case, and KPI scenario. Use this instead of the 5,000-row `claims.csv` when verifying calculations in the UI.

## Switch dataset in the app

```bash
npm run dev:fixture
```

Or create `.env.local`:

```
VITE_CLAIMS_CSV=/claims2.csv
```

Default `npm run dev` still loads `/claims.csv` (5,000 rows).

Uses Vite mode `fixture` (see `.env.fixture`) — works on Windows and Unix.

---

## Row coverage (16 claims)

| Case | Rows |
|---|---|
| **Statuses** | APPROVED ×6, REJECTED ×3, PENDING ×3, IN_REVIEW ×4 |
| **Claim types** | OUTPATIENT ×7, INPATIENT ×4, DENTAL ×4, MATERNITY ×2 |
| **Countries** | Thailand ×6, Vietnam ×6, Hong Kong ×4 |
| **Insurers** | Pacific Shield ×6, Meridian ×5, EastAsia ×5 |
| **REJECTED → approved = 0** | CLM-00003, CLM-00007, CLM-00015 |
| **PENDING → empty processed_date** | CLM-00004, CLM-00008, CLM-00012 |
| **Drill-down (J06.9)** | CLM-00001, CLM-00006, CLM-00011 (3 claims) |
| **Processing buckets** | 0–3d: 3 rows; 4–7d: 4; 8–14d: 3; 15–30d: 3 |

---

## Expected KPIs (no filters)

| KPI | Expected |
|---|---|
| **Total claims** | 16 |
| **Approval rate** | **46.2%** — 6 APPROVED ÷ 13 decided (excludes 3 PENDING) |
| **Avg processing time** | **9.6 days** — mean of 13 processed claims (125 ÷ 13) |
| **Total approved amount** | **$23,275** |
| **Average claim amount** | **$1,972** — 31,550 ÷ 16 (UI may round) |

### Processing days per claim (for avg check)

| Claim ID | Days |
|---|---|
| CLM-00001 | 5 |
| CLM-00002 | 3 |
| CLM-00003 | 7 |
| CLM-00005 | 10 |
| CLM-00006 | 14 |
| CLM-00007 | 20 |
| CLM-00009 | 6 |
| CLM-00010 | 2 |
| CLM-00011 | 30 |
| CLM-00013 | 8 |
| CLM-00014 | 4 |
| CLM-00015 | 15 |
| CLM-00016 | 1 |
| **Sum** | **125** |

---

## Quick filter checks

| Action | Expected result |
|---|---|
| Filter status = **PENDING** only | 3 claims; approval rate **—**; processing time **—** |
| Filter country = **Hong Kong** | 4 claims (CLM-00003, 00006, 00010, 00013) |
| Filter date From **2024-06-01** | 8 claims (June–September rows) |
| Click **J06.9** on diagnosis chart | Table shows 3 claims; KPIs recalc for those 3 only |
| Export CSV with no filters | 16 rows in download |

---

## Approval rate by insurer (no filters)

| Insurer | Approved | Decided | Rate |
|---|---|---|---|
| Pacific Shield Insurance | 2 | 5 | **40.0%** |
| Meridian Health Assurance | 3 | 4 | **75.0%** |
| EastAsia Mutual | 1 | 4 | **25.0%** |

(PENDING excluded from decided count.)

---

## Top diagnoses by frequency

| ICD-10 | Count |
|---|---|
| J06.9 | 3 |
| I10 | 2 |
| K02.9 | 2 |
| Others | 1 each (6 codes) |
