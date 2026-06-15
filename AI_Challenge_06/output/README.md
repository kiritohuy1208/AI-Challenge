# Expected Outputs

This directory contains the generated output files from running the Policy Benefits Calculator.

## Files

### results.json
Contains per-expense calculation results for all 20 test expenses. Each result includes:
- `expense_id`: Unique identifier for the expense
- `submitted_amount`: Original expense amount (THB)
- `covered_amount`: Amount covered by insurance (THB)
- `copay_amount`: Copay amount paid by member (THB)
- `member_pays`: Total amount member pays (THB)
- `decision`: One of "COVERED", "PARTIALLY_COVERED", or "DENIED"
- `reason`: Human-readable explanation of the decision
- `remaining_annual_limit`: Remaining annual limit for the benefit type (THB)
- `remaining_visit_limit`: Remaining per-visit limit (THB)

### summary.json
Contains aggregate summary after processing all expenses:
- `total_submitted_amount`: Sum of all submitted amounts (THB)
- `total_covered_amount`: Sum of all covered amounts (THB)
- `total_member_pays`: Sum of all member payments (THB)
- `remaining_annual_limit_by_benefit`: Remaining annual limit per benefit type
- `remaining_deductible_amount`: Remaining deductible amount (THB)

## Regenerating Outputs

To regenerate these files, run:

```bash
npm start
```

This will:
1. Load policy from `src/data/policy.json`
2. Load expenses from `src/data/expenses.json`
3. Process all expenses chronologically
4. Write results to `output/results.json`
5. Write summary to `output/summary.json`

## Test Scenario Coverage

The 20 expenses in results.json demonstrate:

| Cases | Scenario | Expense IDs |
|-------|----------|-------------|
| 1 | Full coverage (post-deductible, no copay) | EXP-006, EXP-010, EXP-014 |
| 2 | Deductible applied on early claims | EXP-003, EXP-004 |
| 3 | Copay 20% (Doctor Visit) | EXP-005, EXP-009, EXP-011, EXP-013, EXP-015, EXP-019 |
| 4 | DENIED - waiting period | EXP-001, EXP-002 |
| 5 | Sub-limit cap | EXP-007, EXP-008, EXP-015 |
| 6 | Annual limit exhausted | EXP-016, EXP-017, EXP-018, EXP-020 |
| 7 | Copay 10% (Lab Test/Hospitalization) | EXP-008, EXP-012, EXP-016, EXP-017, EXP-018, EXP-020 |

## Summary Statistics

From the current run (20 expenses, Jan-Jun 2024):
- **Total Submitted**: 92,100 THB
- **Total Covered**: 58,480 THB (63.5%)
- **Total Member Pays**: 33,620 THB (36.5%)
- **OUTPATIENT Remaining**: 66,520 THB
- **INPATIENT Remaining**: 0 THB (exhausted)
- **Deductible Remaining**: 0 THB (fully consumed)
