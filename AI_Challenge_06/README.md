# Policy Benefits Calculator

A TypeScript-based insurance coverage computation engine that accurately calculates medical expense coverage based on policy terms, including annual limits, sub-limits, copays, deductibles, waiting periods, and exclusions.

## Overview

This calculator processes medical expenses chronologically and applies business rules in a fixed pipeline order to determine coverage amounts. It provides per-expense decisions with human-readable explanations and aggregate summaries with remaining balances.

## Features

- **Chronological Processing**: Expenses are always processed by date ascending, regardless of input order
- **State Management**: Tracks remaining annual limits, deductible consumption, and per-benefit trackers across expenses
- **7-Step Rule Pipeline**: Applies business rules in a non-negotiable order
- **Human-Readable Output**: Clear explanations for every decision (COVERED, PARTIALLY_COVERED, DENIED)
- **Modular Architecture**: Pure rule functions with an orchestrating engine class
- **Comprehensive Testing**: 18 unit tests covering all scenarios

## Business Rules

Rules are applied in this exact sequence for each expense:

1. **Exclusion** - DENIED if sub-benefit or diagnosis matches exclusion list
2. **Waiting Period** - DENIED if visit occurs before waiting period days elapsed
3. **Deductible** - Member pays deductible portion first; insurance pays remainder
4. **Per-Visit Sub-Limit** - Reduce eligible amount to per-visit limit cap
5. **Copay** - Apply percentage or fixed copay to eligible amount
6. **Annual Limit Cap** - Reduce covered amount to remaining annual balance
7. **Decision** - Final decision (COVERED/PARTIALLY_COVERED/DENIED) with reason

## Installation

```bash
npm install
```

## Usage

### Run the Calculator

```bash
npm start
```

This loads the policy and expense data from `src/data/`, processes all expenses, and writes results to `output/`.

### Run Tests

```bash
npm test
```

### Build

```bash
npm run build
```

## Project Structure

```
AI Challenge 06 — Policy Benefits Calculator/
├── src/
│   ├── calculator/
│   │   ├── engine.ts          # BenefitsCalculator class (orchestration)
│   │   ├── rules.ts           # Pure rule functions (7 rules)
│   │   ├── validator.ts       # Input validation
│   │   └── index.ts           # Public API exports
│   ├── types/
│   │   ├── policy.ts          # Policy, BenefitPolicy, CopayRule interfaces
│   │   ├── expense.ts         # Expense interface
│   │   ├── calculation.ts     # CalculationResult, FinalSummary interfaces
│   │   └── index.ts           # Type re-exports
│   ├── utils/
│   │   ├── helpers.ts         # Date diff, sort, roundCurrency
│   │   └── formatters.ts      # Human-readable output formatting
│   ├── data/
│   │   ├── policy.json        # Policy definition (THB)
│   │   └── expenses.json      # 20 chronological test expenses
│   └── run.ts                 # Integration runner → output/
├── tests/
│   ├── calculator.test.ts     # 11 integration tests
│   ├── rules.test.ts          # 7 isolated rule helper tests
│   └── fixtures/
│       └── test-data.ts       # Compact policy/expense factories
├── output/
│   ├── results.json           # Generated per-expense results
│   └── summary.json           # Generated aggregate summary
├── CONTEXT.md                 # Project documentation
├── AGENTS.md                  # AI agent instructions
└── package.json
```

## Policy Configuration

The sample policy (`src/data/policy.json`) includes:

| Benefit Type | Annual Limit | Deductible |
|--------------|--------------|------------|
| OUTPATIENT   | 100,000 THB  | 2,000 THB  |
| INPATIENT    | 25,000 THB   | -          |

**Sub-Benefits:**

| Sub-Benefit | Per-Visit Limit | Copay | Waiting Period |
|-------------|-----------------|-------|----------------|
| Doctor Visit | 3,000 THB | 20% | 30 days |
| Lab Test | 5,000 THB | 10% | 30 days |
| Preventive Care | 4,000 THB | Fixed 0 THB | 0 days |
| Hospitalization | 20,000 THB | 10% | 0 days |

**Exclusions:** Cosmetic Surgery, Dental

**Effective Date:** 2024-01-01

## Test Scenarios

The 20 test expenses in `src/data/expenses.json` cover:

- **Case 1**: Full coverage (post-deductible, no copay) - Preventive Care
- **Case 2**: Deductible applied on early claims
- **Case 3**: Copay 20% (Doctor Visit)
- **Case 4**: DENIED - waiting period (visits before 2024-01-31)
- **Case 5**: Sub-limit cap (expenses exceed per-visit limits)
- **Case 6**: Annual limit exhausted (INPATIENT limit consumed)

## Output Format

### Per-Expense Result

```json
{
  "expense_id": "EXP-005",
  "submitted_amount": 2500,
  "covered_amount": 2000,
  "copay_amount": 500,
  "member_pays": 500,
  "decision": "PARTIALLY_COVERED",
  "reason": "20% copay applied. Covered: 2000 THB. Member copay: 500 THB.",
  "remaining_annual_limit": 97040,
  "remaining_visit_limit": 500
}
```

### Summary

```json
{
  "total_submitted_amount": 92100,
  "total_covered_amount": 58480,
  "total_member_pays": 33620,
  "remaining_annual_limit_by_benefit": {
    "OUTPATIENT": 66520,
    "INPATIENT": 0
  },
  "remaining_deductible_amount": 0
}
```

## API Usage

```typescript
import { BenefitsCalculator } from './src/calculator';
import { Policy, Expense } from './src/types';

const calculator = new BenefitsCalculator();
const results = calculator.processExpenses(policy, expenses);
const summary = calculator.getSummary();
```

## Test Coverage

| # | Test | File |
|---|------|------|
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

## Technical Stack

- **Language**: TypeScript 5.7 (strict mode)
- **Runtime**: Node.js
- **Testing**: Jest 29.7
- **Build**: tsc (TypeScript compiler)

## Key Design Decisions

1. **Rule Order**: Fixed sequence (Exclusion → Waiting → Deductible → Sub-limit → Copay → Annual Limit) - changing this order changes behavior
2. **Chronological Processing**: Expenses always sorted by date before calculation to ensure correct state tracking
3. **Modularity**: Pure rule functions in `rules.ts` + orchestrating engine class in `engine.ts`
4. **Decision Enum**: `COVERED | PARTIALLY_COVERED | DENIED` for type safety
5. **Deductible-Only Claims**: Marked as `PARTIALLY_COVERED` with `covered_amount = 0` and deductible reason

## Development

When modifying the calculator:

1. Read `CONTEXT.md` and `AGENTS.md` first
2. Maintain the 7-step rule order in `src/calculator/rules.ts`
3. Add tests for new scenarios in `tests/`
4. Update `CONTEXT.md` after each major phase
5. Run `npm test` to verify all tests pass
6. Run `npm start` to regenerate output files

## License

This project is part of AI Challenge 06 — Policy Benefits Calculator.
