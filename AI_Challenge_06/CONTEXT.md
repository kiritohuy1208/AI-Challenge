# CONTEXT.md — Policy Benefits Calculator
**Version:** 1.3  
**Last Updated:** 2026-06-12  
**Status:** Phase 4 Complete - Ready for Submission

---

## 1. Project Overview

### Objective
Build a **Policy Benefits Calculator** that accurately computes insurance coverage for medical expenses based on policy terms and member eligibility.

### Problem Statement
Insurance systems must determine coverage amounts for submitted medical expenses considering:
- Annual benefit limits
- Per-visit sub-limits
- Copay (percentage & fixed)
- Deductibles
- Waiting periods for specific benefit types
- Exclusions

Incorrect calculations lead to overpayment (insurer loss) or underpayment (poor member experience).

### Solution Approach
A **reusable, modular calculator** that:
1. Accepts a policy definition (JSON) and expense list
2. Processes medical expenses **chronologically**
3. Applies business rules in a fixed pipeline order
4. Returns per-expense coverage decisions with human-readable reasons
5. Returns an aggregate summary with remaining balances

---

## 2. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     INPUT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Policy JSON (src/data/policy.json)                         │
│  Expense List (src/data/expenses.json — 20 test cases)      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  PROCESSING LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  BenefitsCalculator.processExpenses(policy, expenses)       │
│                                                              │
│  1. VALIDATION (validator.ts)                               │
│     - Policy structure                                      │
│     - Expense list integrity                                │
│                                                              │
│  2. SORT & PREPARE (helpers.ts)                             │
│     - Clone + sort expenses by date ascending               │
│     - Initialize state: remainingAnnualLimits, deductible   │
│                                                              │
│  3. CALCULATION ENGINE (engine.ts + rules.ts)               │
│     Per expense, in order:                                  │
│     a. Exclusion check                                      │
│     b. Waiting period check                                 │
│     c. Deductible application                               │
│     d. Per-visit sub-limit cap                              │
│     e. Copay (% or fixed)                                   │
│     f. Annual limit cap                                     │
│     g. Decision + reason message                            │
│                                                              │
│  4. STATE MANAGEMENT                                        │
│     - Decrement remaining annual limit per benefit type     │
│     - Track accumulated deductible paid                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    OUTPUT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Per-Expense (CalculationResult):                           │
│  - expense_id, submitted_amount, covered_amount             │
│  - copay_amount, member_pays                                │
│  - decision (COVERED | PARTIALLY_COVERED | DENIED)          │
│  - reason, remaining_annual_limit, remaining_visit_limit    │
│                                                              │
│  Summary (FinalSummary):                                    │
│  - total_submitted/covered/member_pays                      │
│  - remaining_annual_limit_by_benefit                        │
│  - remaining_deductible_amount                              │
│                                                              │
│  Written to output/results.json + output/summary.json       │
└─────────────────────────────────────────────────────────────┘
```

### State Tracking
| State Variable | Scope | Description |
|---|---|---|
| `fundsByBenefitType` | Per `benefit_type` | Independent annual pools (OUTPATIENT 100k, INPATIENT 25k — never cross-deduct) |
| `accumulatedDeductiblePaid` | Policy-wide | Tracks deductible consumed YTD |

### Output Field Semantics
| Field | Meaning |
|---|---|
| `remaining_annual_limit` | Balance left in **this expense's** `benefit_type` pool after processing |
| `remaining_visit_limit` | Policy default `per_visit_limit` for the **next** visit (resets every visit) |
| `member_pays` | Always `submitted_amount - covered_amount` (enforced in `buildResult`) |

---

## 3. File Structure

```
AI Challenge 06 — Policy Benefits Calculator/
│
├── CONTEXT.md                          # This file — project documentation
├── AGENTS.md                           # AI agent instructions
├── package.json                        # Dependencies & scripts
├── tsconfig.json                       # TypeScript config
├── jest.config.js                      # Jest test config
│
├── src/
│   ├── types/
│   │   ├── policy.ts                  # Policy, BenefitPolicy, CopayRule
│   │   ├── expense.ts                 # Expense interface
│   │   ├── calculation.ts             # CalculationResult, FinalSummary
│   │   └── index.ts                   # Type re-exports
│   │
│   ├── calculator/
│   │   ├── index.ts                   # Public API exports
│   │   ├── engine.ts                  # BenefitsCalculator class
│   │   ├── rules.ts                   # Pure rule functions (7 rules)
│   │   └── validator.ts               # Input validation
│   │
│   ├── utils/
│   │   ├── helpers.ts                 # Date diff, sort, roundCurrency
│   │   └── formatters.ts              # Human-readable output formatting
│   │
│   ├── data/
│   │   ├── policy.json                # Policy definition (THB)
│   │   └── expenses.json              # 20 chronological test expenses
│   │
│   └── run.ts                         # Integration runner → output/
│
├── tests/
│   ├── calculator.test.ts             # 11 integration tests (BenefitsCalculator)
│   ├── rules.test.ts                  # 7 isolated rule helper tests
│   └── fixtures/
│       └── test-data.ts               # Compact policy/expense factories
│
├── output/
│   ├── results.json                   # Generated per-expense results
│   └── summary.json                   # Generated aggregate summary
│
└── context/
    ├── requirment.md                  # Original challenge requirements
    ├── prompt.md                      # Working prompt history
    └── context.md                     # Challenge context notes
```

### Key Entry Points
| File | Role |
|---|---|
| `src/calculator/engine.ts` | `BenefitsCalculator.processExpenses()` — orchestration |
| `src/calculator/rules.ts` | Pure functions for each business rule |
| `src/run.ts` | Loads JSON data, runs calculator, writes output |

---

## 4. Business Rules

### 4.1 Policy Configuration (`src/data/policy.json`)

| Parameter | OUTPATIENT | INPATIENT |
|---|---|---|
| Annual Limit | 100,000 THB | 25,000 THB |
| Deductible | 2,000 THB (applies to both) | |
| Effective Date | 2024-01-01 | |

**Sub-benefits:**

| Sub-Benefit | Per-Visit Limit | Copay | Waiting Period |
|---|---|---|---|
| Doctor Visit | 3,000 THB | 20% | 30 days |
| Lab Test | 5,000 THB | 10% | 30 days |
| Preventive Care | 4,000 THB | Fixed 0 THB | 0 days |
| Hospitalization | 20,000 THB | 10% | 0 days |

**Exclusions:** Cosmetic Surgery, Dental

### 4.2 Processing Order (Non-Negotiable)

| Step | Rule | On Failure / Cap |
|---|---|---|
| 1 | **Exclusion** | DENIED — sub-benefit or diagnosis matches exclusion |
| 2 | **Waiting Period** | DENIED — visit before `waiting_period_days` elapsed |
| 3 | **Deductible** | Member pays portion first; insurance pays remainder |
| 4 | **Per-Visit Sub-Limit** | Reduce eligible amount to `per_visit_limit` |
| 5 | **Copay** | PERCENTAGE: `copay = eligible × %`; FIXED: `min(fixed, eligible)` |
| 6 | **Annual Limit Cap** | Reduce covered amount to remaining annual balance |
| 7 | **Decision** | COVERED / PARTIALLY_COVERED / DENIED + reason |

### 4.3 Decision Logic
- `COVERED` — `covered_amount === submitted_amount`
- `PARTIALLY_COVERED` — `0 < covered_amount < submitted_amount` (copay, sub-limit, deductible)
- `DENIED` — `covered_amount === 0` (waiting period, exclusion, annual limit exhausted)

### 4.4 Member Pays
`member_pays = submitted_amount - covered_amount` (always balances)

### 4.5 Waiting Period
Calculated from `policy.effective_date`. Eligible when `daysSinceEffective >= waiting_period_days`.
- Example: 30-day waiting → visits on or after 2024-01-31 are eligible.

---

## 5. Test Expense Scenarios (20 Cases)

Designed in `src/data/expenses.json` (Jan–Jun 2024):

| Case | Scenario | Example Expenses |
|---|---|---|
| 1 | Full coverage (post-deductible, no copay) | EXP-006, EXP-010, EXP-014 (Preventive Care) |
| 2 | Deductible applied on early claims | EXP-003 (1,500 THB), EXP-004 (500 THB remaining) |
| 3 | Copay 20% (Doctor Visit) | EXP-005, EXP-009, EXP-011 |
| 4 | DENIED — waiting period | EXP-001 (day 4), EXP-002 (day 19) |
| 5 | Sub-limit cap | EXP-007 (4,200 → 3,000 cap), EXP-015 |
| 6 | Annual limit exhausted | EXP-016→017 consume INPATIENT 25,000; EXP-018, EXP-020 DENIED |

### Sample Output (EXP-005)
```json
{
  "expense_id": "EXP-005",
  "submitted_amount": 2500,
  "covered_amount": 2000,
  "copay_amount": 500,
  "member_pays": 500,
  "decision": "PARTIALLY_COVERED",
  "reason": "20% copay applied. Covered: 2000 THB. Member copay: 500 THB."
}
```

---

## 6. Current Progress & Next Steps

### ✅ Completed
- [x] Project initialized & requirements analyzed
- [x] Architecture designed
- [x] **Phase 1 — Data Modeling**
  - [x] TypeScript interfaces split into `src/types/`
  - [x] `src/data/policy.json` with real THB parameters
  - [x] `src/data/expenses.json` — 20 chronological expenses (6 scenarios)
- [x] **Phase 2 — Core Logic Engine**
  - [x] `BenefitsCalculator` class in `src/calculator/engine.ts`
  - [x] 7 pure rule functions in `src/calculator/rules.ts`
  - [x] Input validation in `src/calculator/validator.ts`
  - [x] Utility helpers (sort, date diff, currency rounding)
  - [x] Integration runner `src/run.ts` → `output/`
  - [x] `package.json`, `tsconfig.json`, build verified
- [x] **Phase 3 — Unit Tests** (18 tests total, all passing)
  - [x] `tests/calculator.test.ts` — 11 integration scenarios
  - [x] `tests/rules.test.ts` — 7 isolated rule helper tests
  - [x] `tests/fixtures/test-data.ts` — compact factories (no large JSON)
- [x] **Phase 4 — Integration & Docs**
  - [x] README.md with comprehensive project documentation
  - [x] output/README.md with expected outputs documentation
  - [x] CONTEXT.md updated to v1.3

### 🔄 In Progress
- [ ] Nothing — All phases complete

### ⏳ To Do
- [ ] GitHub repository setup and submission

### 📊 Timeline
| Phase | Status | Estimate |
|---|---|---|
| Phase 1 (Types & Data) | ✅ Done | — |
| Phase 2 (Core Engine) | ✅ Done | — |
| Phase 3 (Testing) | ✅ Done | — |
| Phase 4 (Integration & Docs) | ✅ Done | — |

---

## 7. Key Decisions & Constraints

1. **Language:** TypeScript (strict mode)
2. **Framework:** Node.js + Jest
3. **Rule order:** Exclusion → Waiting → Deductible → Sub-limit → Copay → Annual Limit (per AGENTS.md)
4. **Chronological processing:** Expenses always sorted by date before calculation
5. **Modularity:** Pure rule functions + orchestrating engine class
6. **Decision enum:** `COVERED | PARTIALLY_COVERED | DENIED` (defined in types.ts)
7. **Deductible-only claims:** `PARTIALLY_COVERED` with `covered_amount = 0` and deductible reason

---

## 8. Notes for Future AI Sessions

1. Read this CONTEXT.md first
2. Check section 6 for current progress
3. Update this file after each major phase
4. Rule order in `src/calculator/rules.ts` must not change without explicit discussion
5. Run: `npm install && npm run build && npm start` to regenerate output
6. Tests go in `tests/` — use compact fixtures, not full JSON files

---

### Test Coverage Summary (`npm test`)

| # | Test | File |
|---|---|---|
| 1 | Normal 100% coverage | calculator.test.ts |
| 2 | Waiting period denial | calculator.test.ts |
| 3 | Deductible across 2 expenses | calculator.test.ts |
| 4 | Copay 20% | calculator.test.ts |
| 5 | Per-visit sub-limit cap | calculator.test.ts |
| 6 | Annual limit fully exhausted | calculator.test.ts |
| 7 | Post-exhaustion denial | calculator.test.ts |
| 8 | Chronological sort (shuffled input) | calculator.test.ts |
| 9 | Exclusion denial | calculator.test.ts |
| 10 | Partial annual limit cap | calculator.test.ts |
| 11 | Summary aggregation | calculator.test.ts |
| 12–18 | Isolated rule helpers | rules.test.ts |

---

**Next Step:** Project is ready for GitHub repository setup and submission.
