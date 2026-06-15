import type { Policy } from "../../src/types/policy";
import type { Expense } from "../../src/types/expense";

/** Minimal policy factory — override only what each test needs. */
export function createPolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    policy_id: "TEST-POL-001",
    effective_date: "2024-01-01",
    expiry_date: "2024-12-31",
    currency: "THB",
    benefits: {
      OUTPATIENT: {
        annual_limit: 100_000,
        sub_benefits: {
          "Doctor Visit": {
            per_visit_limit: 3_000,
            copay: { type: "PERCENTAGE", percentage: 20 },
            waiting_period_days: 0,
          },
        },
      },
    },
    deductible: { amount: 0, applies_to: [] },
    exclusions: [],
    ...overrides,
  };
}

/** Minimal expense factory. */
export function createExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    expense_id: "EXP-TEST",
    date: "2024-02-15",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Doctor Visit",
    amount: 1_000,
    diagnosis: "Routine checkup",
    provider: "Test Hospital",
    ...overrides,
  };
}

/** Policy with zero copay and deductible for simple coverage tests. */
export function noCopayNoDeductiblePolicy(): Policy {
  return createPolicy({
    benefits: {
      OUTPATIENT: {
        annual_limit: 100_000,
        sub_benefits: {
          "Doctor Visit": {
            per_visit_limit: 5_000,
            copay: { type: "FIXED", amount: 0 },
            waiting_period_days: 0,
          },
        },
      },
    },
  });
}
